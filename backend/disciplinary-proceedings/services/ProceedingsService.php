<?php
require_once __DIR__ . '/../models/ProceedingsModel.php';
require_once __DIR__ . '/../../helpers/AuditLogger.php';

class ProceedingsService {
    private ProceedingsModel $model;

    // Field whitelists — prevents mass assignment at the service layer
    private const HEARING_ALLOWED   = ['incident_id', 'hearing_date', 'hearing_time', 'venue', 'committee_members', 'decision_notes', 'status'];
    private const SANCTION_ALLOWED  = ['incident_id', 'student_id', 'sanction_type', 'start_date', 'end_date', 'status', 'remarks'];
    private const REFORM_ALLOWED    = ['student_id', 'incident_id', 'program_title', 'description', 'assigned_supervisor', 'total_hours'];
    private const REFORM_UPD_ALLOWED = ['completed_hours', 'status', 'completion_date'];
    private const POINTS_ALLOWED    = ['student_id', 'incident_id', 'points_change', 'point_type', 'reason'];

    // Filter key whitelists
    private const HEARING_FILTERS   = ['student_id', 'status'];
    private const SANCTION_FILTERS  = ['student_id'];
    private const REFORM_FILTERS    = ['student_id'];
    private const CLEARANCE_FILTERS = ['is_active'];

    public function __construct() {
        $this->model = new ProceedingsModel();
    }

    // ─── Hearings ──────────────────────────────────────────────────────────

    public function getHearings(array $filters = []): array {
        $safe = array_intersect_key($filters, array_flip(self::HEARING_FILTERS));
        return $this->model->getAllHearings($safe);
    }

    public function scheduleHearing(array $data, array $user): int {
        if (empty($data['incident_id']) || empty($data['hearing_date']) || empty($data['hearing_time'])) {
            throw new \InvalidArgumentException("Incident ID, Hearing Date, and Hearing Time are required.");
        }
        $safe = array_intersect_key($data, array_flip(self::HEARING_ALLOWED));
        $safe['presided_by'] = $user['user_id']; // always from verified session

        $id = $this->model->scheduleHearing($safe);
        AuditLogger::log(
            'SCHEDULE_HEARING',
            'Disciplinary Hearing',
            "Scheduled hearing for Incident ID {$data['incident_id']} on {$data['hearing_date']}",
            $user['user_id'],
            $user['full_name']
        );
        return $id;
    }

    public function updateHearing(int $id, array $data, array $user): bool {
        if (empty($data['hearing_date']) || empty($data['hearing_time'])) {
            throw new \InvalidArgumentException("Hearing Date and Hearing Time are required.");
        }
        $safe = array_intersect_key($data, array_flip(self::HEARING_ALLOWED));
        $res  = $this->model->updateHearing($id, $safe);
        AuditLogger::log(
            'UPDATE_HEARING',
            'Disciplinary Hearing',
            "Updated hearing ID {$id} (Status: " . ($safe['status'] ?? 'N/A') . ")",
            $user['user_id'],
            $user['full_name']
        );
        return $res;
    }

    // ─── Sanctions ─────────────────────────────────────────────────────────

    public function getSanctions(array $filters = []): array {
        $safe = array_intersect_key($filters, array_flip(self::SANCTION_FILTERS));
        return $this->model->getAllSanctions($safe);
    }

    public function createSanction(array $data, array $user): int {
        if (empty($data['incident_id']) || empty($data['student_id']) || empty($data['sanction_type']) || empty($data['start_date'])) {
            throw new \InvalidArgumentException("Incident ID, Student ID, Sanction Type, and Start Date are required.");
        }
        $safe = array_intersect_key($data, array_flip(self::SANCTION_ALLOWED));
        $safe['issued_by'] = $user['user_id']; // always from verified session

        $id = $this->model->createSanction($safe);
        AuditLogger::log(
            'ISSUE_SANCTION',
            'Sanction Management',
            "Issued sanction {$data['sanction_type']} for Student ID {$data['student_id']}",
            $user['user_id'],
            $user['full_name']
        );
        return $id;
    }

    public function updateSanction(int $id, array $data, array $user): bool {
        // Only allow updating status, end_date, remarks
        $safe = array_intersect_key($data, array_flip(['status', 'end_date', 'remarks']));
        $res  = $this->model->updateSanction($id, $safe);
        AuditLogger::log(
            'UPDATE_SANCTION',
            'Sanction Management',
            "Updated sanction ID {$id} (Status: " . ($safe['status'] ?? 'N/A') . ")",
            $user['user_id'],
            $user['full_name']
        );
        return $res;
    }

    // ─── Clearance Holds ───────────────────────────────────────────────────

    public function getClearanceHolds(array $filters = []): array {
        $safe = array_intersect_key($filters, array_flip(self::CLEARANCE_FILTERS));
        return $this->model->getAllClearanceHolds($safe);
    }

    public function setClearanceHold(array $data, array $user): bool {
        if (empty($data['student_id'])) {
            throw new \InvalidArgumentException("Student ID is required.");
        }
        $hold   = !empty($data['hold']);
        $reason = isset($data['reason']) ? trim((string)$data['reason']) : '';
        if ($reason === '') {
            $reason = $hold ? 'Manual clearance hold set by prefect' : 'Cleared';
        }
        $this->model->toggleClearanceHold((int)$data['student_id'], $hold, $reason, (int)$user['user_id']);
        AuditLogger::log(
            $hold ? 'FLAG_CLEARANCE_HOLD' : 'RELEASE_CLEARANCE_HOLD',
            'Clearance Hold',
            ($hold ? "Flagged clearance hold" : "Released clearance hold") . " for Student ID {$data['student_id']}",
            $user['user_id'],
            $user['full_name']
        );
        return true;
    }

    // ─── Reformation Programs ──────────────────────────────────────────────

    public function getReformationPrograms(array $filters = []): array {
        $safe = array_intersect_key($filters, array_flip(self::REFORM_FILTERS));
        return $this->model->getAllReformationPrograms($safe);
    }

    public function assignReformation(array $data, array $user): int {
        if (empty($data['student_id']) || empty($data['program_title'])) {
            throw new \InvalidArgumentException("Student ID and Program Title are required.");
        }
        $safe = array_intersect_key($data, array_flip(self::REFORM_ALLOWED));
        // Default supervisor to the logged-in user if not explicitly set
        if (empty($safe['assigned_supervisor'])) {
            $safe['assigned_supervisor'] = $user['user_id'];
        }
        $id = $this->model->assignReformationProgram($safe);
        AuditLogger::log(
            'ASSIGN_REFORMATION',
            'Reformation Program',
            "Assigned program {$data['program_title']} to Student ID {$data['student_id']}",
            $user['user_id'],
            $user['full_name']
        );
        return $id;
    }

    public function updateReformation(int $id, array $data, array $user): bool {
        $safe = array_intersect_key($data, array_flip(self::REFORM_UPD_ALLOWED));
        $res  = $this->model->updateReformationProgram($id, $safe);
        AuditLogger::log(
            'UPDATE_REFORMATION',
            'Reformation Program',
            "Updated reformation program ID {$id} (Status: " . ($safe['status'] ?? 'N/A') . ")",
            $user['user_id'],
            $user['full_name']
        );
        return $res;
    }

    // ─── Behavior Points ───────────────────────────────────────────────────

    public function getPointsHistory(): array {
        return $this->model->getBehaviorPointsHistory();
    }

    public function addPoints(array $data, array $user): int {
        if (empty($data['student_id']) || !isset($data['points_change']) || empty($data['point_type']) || empty($data['reason'])) {
            throw new \InvalidArgumentException("Student ID, Points Amount, Point Type, and Reason are required.");
        }
        $safe = array_intersect_key($data, array_flip(self::POINTS_ALLOWED));
        $safe['created_by'] = $user['user_id']; // always from verified session

        $id = $this->model->addManualBehaviorPoints($safe);
        AuditLogger::log(
            'ADJUST_POINTS',
            'Behavior Points',
            "Adjusted points ({$data['points_change']} pts, {$data['point_type']}) for Student ID {$data['student_id']}",
            $user['user_id'],
            $user['full_name']
        );
        return $id;
    }
}
