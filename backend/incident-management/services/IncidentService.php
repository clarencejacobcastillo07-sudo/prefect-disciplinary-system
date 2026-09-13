<?php
require_once __DIR__ . '/../models/IncidentModel.php';
require_once __DIR__ . '/../../student-records/models/StudentModel.php';
require_once __DIR__ . '/../../notification/services/NotificationService.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/AuditLogger.php';

class IncidentService {
    private IncidentModel $incidentModel;
    private StudentModel $studentModel;
    private NotificationService $notificationService;

    // Permitted incident fields — prevents mass assignment
    private const INCIDENT_ALLOWED = [
        'student_id', 'violation_id', 'incident_date',
        'location', 'description', 'witnesses', 'evidence_url'
    ];

    // Permitted violation fields — prevents mass assignment
    private const VIOLATION_ALLOWED = [
        'code', 'title', 'description', 'category',
        'demerit_points', 'recommended_sanction', 'is_active'
    ];

    // Permitted incident-list filter keys
    private const FILTER_ALLOWED = ['status', 'category', 'student_id', 'search'];

    public function __construct() {
        $this->incidentModel = new IncidentModel();
        $this->studentModel  = new StudentModel();
        $this->notificationService = new NotificationService();
    }

    public function listIncidents(array $filters = []): array {
        $safe = array_intersect_key($filters, array_flip(self::FILTER_ALLOWED));
        return $this->incidentModel->getAllIncidents($safe);
    }

    public function getIncidentDetails(int $id): array {
        $incident = $this->incidentModel->getById($id);
        if (!$incident) {
            throw new \InvalidArgumentException("Incident report not found.");
        }
        return $incident;
    }

    public function logIncident(array $data, array $user): array {
        if (empty($data['student_id']) || empty($data['violation_id']) || empty($data['location']) || empty($data['description'])) {
            throw new \InvalidArgumentException("Student ID, Violation Category, Location, and Incident Description are required.");
        }

        // Whitelist client-supplied incident fields then inject server-side identity
        $safe = array_intersect_key($data, array_flip(self::INCIDENT_ALLOWED));
        $safe['reported_by'] = $user['user_id']; // always from verified session

        $incidentId = $this->incidentModel->createIncident($safe);
        $incident   = $this->incidentModel->getById($incidentId);

        // Deduct demerit points from student conduct balance
        if ($incident && isset($incident['demerit_points'])) {
            $demerit    = (int)$incident['demerit_points'];
            $studentId  = (int)$safe['student_id'];

            $this->studentModel->updateConductPoints($studentId, -$demerit);

            // Record behavior points transaction
            $db   = Database::getConnection();
            $stmt = $db->prepare(
                "INSERT INTO behavior_points (student_id, incident_id, points_change, point_type, reason, created_by) " .
                "VALUES (:student_id, :incident_id, :points_change, 'Demerit', :reason, :created_by)"
            );
            $stmt->execute([
                ':student_id'    => $studentId,
                ':incident_id'   => $incidentId,
                ':points_change' => -$demerit,
                ':reason'        => "Deduction for offense {$incident['violation_code']}: {$incident['violation_title']} (Incident {$incident['incident_number']})",
                ':created_by'    => $user['user_id'],
            ]);

            // Auto-flag Clearance Hold for Major / Severe violations
            if (in_array($incident['violation_category'], ['Major', 'Severe'], true)) {
                $hStmt = $db->prepare(
                    "INSERT INTO clearance_holds (student_id, incident_id, hold_reason, flagged_by) " .
                    "VALUES (:student_id, :incident_id, :hold_reason, :flagged_by)"
                );
                $hStmt->execute([
                    ':student_id'  => $studentId,
                    ':incident_id' => $incidentId,
                    ':hold_reason' => "Automatic Clearance Hold due to {$incident['violation_category']} Infraction: {$incident['violation_title']} ({$incident['incident_number']})",
                    ':flagged_by'  => $user['user_id'],
                ]);
                $db->prepare("UPDATE students SET clearance_status = 'Hold' WHERE id = :id")->execute([':id' => $studentId]);
            }

            // Trigger SMS notification to parent
            if (!empty($incident['parent_phone'])) {
                $smsMsg = "ST. AGNES ACADEMY NOTICE: An incident ({$incident['violation_title']}) involving {$incident['first_name']} {$incident['last_name']} was recorded on {$incident['incident_date']}. Please contact the Prefect Office.";
                $this->notificationService->sendSMS($studentId, $incident['parent_phone'], $smsMsg, $user['user_id']);
            }
        }

        AuditLogger::log(
            'LOG_INCIDENT',
            'Incident Management',
            "Logged incident {$incident['incident_number']} for student ID {$safe['student_id']}",
            $user['user_id'],
            $user['full_name']
        );

        return $incident;
    }

    public function listViolations(bool $includeInactive = false): array {
        return $this->incidentModel->getAllViolations($includeInactive);
    }

    public function getViolation(int $id): array {
        $v = $this->incidentModel->getViolationById($id);
        if (!$v) {
            throw new \InvalidArgumentException("Violation category not found.");
        }
        return $v;
    }

    public function createViolation(array $data, array $user): int {
        if (empty($data['code']) || empty($data['title']) || empty($data['category']) || !isset($data['demerit_points'])) {
            throw new \InvalidArgumentException("Violation Code, Title, Category, and Demerit Points are required.");
        }
        // Whitelist violation fields
        $safe = array_intersect_key($data, array_flip(self::VIOLATION_ALLOWED));
        $id   = $this->incidentModel->createViolation($safe);
        AuditLogger::log('CREATE_VIOLATION', 'Violation Setup', "Created violation category {$data['code']} - {$data['title']}", $user['user_id'], $user['full_name']);
        return $id;
    }

    public function updateViolation(int $id, array $data, array $user): bool {
        if (empty($data['code']) || empty($data['title']) || empty($data['category']) || !isset($data['demerit_points'])) {
            throw new \InvalidArgumentException("Violation Code, Title, Category, and Demerit Points are required.");
        }
        // Whitelist violation fields
        $safe = array_intersect_key($data, array_flip(self::VIOLATION_ALLOWED));
        $res  = $this->incidentModel->updateViolation($id, $safe);
        AuditLogger::log('UPDATE_VIOLATION', 'Violation Setup', "Updated violation category {$data['code']} - {$data['title']}", $user['user_id'], $user['full_name']);
        return $res;
    }

    public function toggleViolationActive(int $id, bool $isActive, array $user): bool {
        $res = $this->incidentModel->toggleViolationActive($id, $isActive);
        AuditLogger::log(
            'TOGGLE_VIOLATION',
            'Violation Setup',
            ($isActive ? "Activated" : "Deactivated") . " violation category ID {$id}",
            $user['user_id'],
            $user['full_name']
        );
        return $res;
    }
}
