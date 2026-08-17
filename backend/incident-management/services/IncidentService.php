<?php
require_once __DIR__ . '/../models/IncidentModel.php';
require_once __DIR__ . '/../../student-records/models/StudentModel.php';
require_once __DIR__ . '/../../notification/services/NotificationService.php';
require_once __DIR__ . '/../../helpers/AuditLogger.php';

class IncidentService {
    private IncidentModel $incidentModel;
    private StudentModel $studentModel;
    private NotificationService $notificationService;

    public function __construct() {
        $this->incidentModel = new IncidentModel();
        $this->studentModel = new StudentModel();
        $this->notificationService = new NotificationService();
    }

    public function listIncidents(array $filters = []): array {
        return $this->incidentModel->getAllIncidents($filters);
    }

    public function getIncidentDetails(int $id): array {
        $incident = $this->incidentModel->getById($id);
        if (!$incident) {
            throw new Exception("Incident report not found.");
        }
        return $incident;
    }

    public function logIncident(array $data, array $user): array {
        if (empty($data['student_id']) || empty($data['violation_id']) || empty($data['location']) || empty($data['description'])) {
            throw new Exception("Student ID, Violation Category, Location, and Incident Description are required.");
        }

        $data['reported_by'] = $user['user_id'];
        $incidentId = $this->incidentModel->createIncident($data);
        $incident = $this->incidentModel->getById($incidentId);

        // Deduct demerit points from student conduct balance
        if ($incident && isset($incident['demerit_points'])) {
            $demerit = (int)$incident['demerit_points'];
            $this->studentModel->updateConductPoints((int)$data['student_id'], -$demerit);

            // Record behavior points transaction
            $db = Database::getConnection();
            $stmt = $db->prepare("INSERT INTO behavior_points (student_id, incident_id, points_change, point_type, reason, created_by) VALUES (:student_id, :incident_id, :points_change, 'Demerit', :reason, :created_by)");
            $stmt->execute([
                ':student_id' => $data['student_id'],
                ':incident_id' => $incidentId,
                ':points_change' => -$demerit,
                ':reason' => "Deduction for offense {$incident['violation_code']}: {$incident['violation_title']} (Incident {$incident['incident_number']})",
                ':created_by' => $user['user_id']
            ]);

            // Flag Clearance Hold automatically if Major or Severe violation
            if (in_array($incident['violation_category'], ['Major', 'Severe'])) {
                $hStmt = $db->prepare("INSERT INTO clearance_holds (student_id, incident_id, hold_reason, flagged_by) VALUES (:student_id, :incident_id, :hold_reason, :flagged_by)");
                $hStmt->execute([
                    ':student_id' => $data['student_id'],
                    ':incident_id' => $incidentId,
                    ':hold_reason' => "Automatic Clearance Hold due to {$incident['violation_category']} Infraction: {$incident['violation_title']} ({$incident['incident_number']})",
                    ':flagged_by' => $user['user_id']
                ]);
                $db->prepare("UPDATE students SET clearance_status = 'Hold' WHERE id = :id")->execute([':id' => $data['student_id']]);
            }

            // Trigger SMS notification draft/alert to Parent
            if (!empty($incident['parent_phone'])) {
                $smsMsg = "ST. AGNES ACADEMY NOTICE: An incident ({$incident['violation_title']}) involving {$incident['first_name']} {$incident['last_name']} was recorded on {$incident['incident_date']}. Please contact the Prefect Office.";
                $this->notificationService->sendSMS((int)$data['student_id'], $incident['parent_phone'], $smsMsg, $user['user_id']);
            }
        }

        AuditLogger::log('LOG_INCIDENT', 'Incident Management', "Logged incident {$incident['incident_number']} for student ID {$data['student_id']}", $user['user_id'], $user['full_name']);

        return $incident;
    }

    public function listViolations(): array {
        return $this->incidentModel->getAllViolations();
    }

    public function createViolation(array $data, array $user): int {
        if (empty($data['code']) || empty($data['title']) || empty($data['category']) || !isset($data['demerit_points'])) {
            throw new Exception("Violation Code, Title, Category, and Demerit Points are required.");
        }
        $id = $this->incidentModel->createViolation($data);
        AuditLogger::log('CREATE_VIOLATION', 'Violation Setup', "Created violation category {$data['code']} - {$data['title']}", $user['user_id'], $user['full_name']);
        return $id;
    }
}
