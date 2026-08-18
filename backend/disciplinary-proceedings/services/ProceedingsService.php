<?php
require_once __DIR__ . '/../models/ProceedingsModel.php';
require_once __DIR__ . '/../../helpers/AuditLogger.php';

class ProceedingsService {
    private ProceedingsModel $model;

    public function __construct() {
        $this->model = new ProceedingsModel();
    }

    public function getHearings(array $filters = []): array {
        return $this->model->getAllHearings($filters);
    }

    public function scheduleHearing(array $data, array $user): int {
        if (empty($data['incident_id']) || empty($data['hearing_date']) || empty($data['hearing_time'])) {
            throw new Exception("Incident ID, Hearing Date, and Hearing Time are required.");
        }
        $data['presided_by'] = $user['user_id'];
        $id = $this->model->scheduleHearing($data);
        AuditLogger::log('SCHEDULE_HEARING', 'Disciplinary Hearing', "Scheduled hearing for Incident ID {$data['incident_id']} on {$data['hearing_date']}", $user['user_id'], $user['full_name']);
        return $id;
    }

    public function updateHearing(int $id, array $data, array $user): bool {
        if (empty($data['hearing_date']) || empty($data['hearing_time'])) {
            throw new Exception("Hearing Date and Hearing Time are required.");
        }
        $res = $this->model->updateHearing($id, $data);
        AuditLogger::log('UPDATE_HEARING', 'Disciplinary Hearing', "Updated hearing ID {$id} (Status: {$data['status']})", $user['user_id'], $user['full_name']);
        return $res;
    }

    public function getSanctions(array $filters = []): array {
        return $this->model->getAllSanctions($filters);
    }

    public function createSanction(array $data, array $user): int {
        if (empty($data['incident_id']) || empty($data['student_id']) || empty($data['sanction_type']) || empty($data['start_date'])) {
            throw new Exception("Incident ID, Student ID, Sanction Type, and Start Date are required.");
        }
        $data['issued_by'] = $user['user_id'];
        $id = $this->model->createSanction($data);
        AuditLogger::log('ISSUE_SANCTION', 'Sanction Management', "Issued sanction {$data['sanction_type']} for Student ID {$data['student_id']}", $user['user_id'], $user['full_name']);
        return $id;
    }

    public function updateSanction(int $id, array $data, array $user): bool {
        $res = $this->model->updateSanction($id, $data);
        AuditLogger::log('UPDATE_SANCTION', 'Sanction Management', "Updated sanction ID {$id} (Status: {$data['status']})", $user['user_id'], $user['full_name']);
        return $res;
    }

    public function getClearanceHolds(array $filters = []): array {
        return $this->model->getAllClearanceHolds($filters);
    }

    public function setClearanceHold(array $data, array $user): bool {
        if (empty($data['student_id'])) {
            throw new Exception("Student ID is required.");
        }
        $hold = !empty($data['hold']);
        $reason = $data['reason'] ?? ($hold ? 'Manual clearance hold set by prefect' : 'Cleared');
        $this->model->toggleClearanceHold((int)$data['student_id'], $hold, $reason, (int)$user['user_id']);
        AuditLogger::log($hold ? 'FLAG_CLEARANCE_HOLD' : 'RELEASE_CLEARANCE_HOLD', 'Clearance Hold', ($hold ? "Flagged clearance hold" : "Released clearance hold") . " for Student ID {$data['student_id']}", $user['user_id'], $user['full_name']);
        return true;
    }

    public function getReformationPrograms(array $filters = []): array {
        return $this->model->getAllReformationPrograms($filters);
    }

    public function assignReformation(array $data, array $user): int {
        if (empty($data['student_id']) || empty($data['program_title'])) {
            throw new Exception("Student ID and Program Title are required.");
        }
        $data['assigned_supervisor'] = $data['assigned_supervisor'] ?? $user['user_id'];
        $id = $this->model->assignReformationProgram($data);
        AuditLogger::log('ASSIGN_REFORMATION', 'Reformation Program', "Assigned program {$data['program_title']} to Student ID {$data['student_id']}", $user['user_id'], $user['full_name']);
        return $id;
    }

    public function updateReformation(int $id, array $data, array $user): bool {
        $res = $this->model->updateReformationProgram($id, $data);
        AuditLogger::log('UPDATE_REFORMATION', 'Reformation Program', "Updated reformation program ID {$id} (Status: {$data['status']})", $user['user_id'], $user['full_name']);
        return $res;
    }

    public function getPointsHistory(): array {
        return $this->model->getBehaviorPointsHistory();
    }

    public function addPoints(array $data, array $user): int {
        if (empty($data['student_id']) || !isset($data['points_change']) || empty($data['point_type']) || empty($data['reason'])) {
            throw new Exception("Student ID, Points Amount, Point Type, and Reason are required.");
        }
        $data['created_by'] = $user['user_id'];
        $id = $this->model->addManualBehaviorPoints($data);
        AuditLogger::log('ADJUST_POINTS', 'Behavior Points', "Adjusted points ({$data['points_change']} pts, {$data['point_type']}) for Student ID {$data['student_id']}", $user['user_id'], $user['full_name']);
        return $id;
    }
}
