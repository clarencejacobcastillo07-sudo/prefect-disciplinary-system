<?php
require_once __DIR__ . '/../../config/database.php';

class ProceedingsModel {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    // Hearings
    public function getAllHearings(array $filters = []): array {
        $sql = "
            SELECT h.*, i.incident_number, i.description as incident_description,
                   s.id as student_id, s.first_name, s.last_name, s.lrn, s.grade_level, s.section,
                   v.title as violation_title, v.category as violation_category
            FROM hearings h
            JOIN incident_reports i ON h.incident_id = i.id
            JOIN students s ON i.student_id = s.id
            JOIN violations v ON i.violation_id = v.id
            WHERE 1=1
        ";
        $params = [];
        if (!empty($filters['student_id'])) {
            $sql .= " AND s.id = :student_id";
            $params[':student_id'] = $filters['student_id'];
        }
        if (!empty($filters['status'])) {
            $sql .= " AND h.status = :status";
            $params[':status'] = $filters['status'];
        }
        $sql .= " ORDER BY h.hearing_date ASC, h.hearing_time ASC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function getHearingById(int $id): ?array {
        $stmt = $this->db->prepare("
            SELECT h.*, i.incident_number, i.description as incident_description,
                   s.id as student_id, s.first_name, s.last_name, s.lrn, s.grade_level, s.section,
                   v.title as violation_title, v.category as violation_category
            FROM hearings h
            JOIN incident_reports i ON h.incident_id = i.id
            JOIN students s ON i.student_id = s.id
            JOIN violations v ON i.violation_id = v.id
            WHERE h.id = :id
        ");
        $stmt->execute([':id' => $id]);
        $h = $stmt->fetch();
        return $h ?: null;
    }

    public function scheduleHearing(array $data): int {
        $stmt = $this->db->prepare("
            INSERT INTO hearings (incident_id, hearing_date, hearing_time, venue, committee_members, status, decision_notes, presided_by) 
            VALUES (:incident_id, :hearing_date, :hearing_time, :venue, :committee_members, 'Scheduled', :decision_notes, :presided_by)
        ");
        $stmt->execute([
            ':incident_id' => $data['incident_id'],
            ':hearing_date' => $data['hearing_date'],
            ':hearing_time' => $data['hearing_time'],
            ':venue' => $data['venue'] ?? 'Prefect Board Room',
            ':committee_members' => $data['committee_members'] ?? null,
            ':decision_notes' => $data['decision_notes'] ?? null,
            ':presided_by' => $data['presided_by'] ?? null
        ]);

        // Update incident status to Hearing Scheduled
        $this->db->prepare("UPDATE incident_reports SET status = 'Hearing Scheduled' WHERE id = :id")->execute([':id' => $data['incident_id']]);

        return (int)$this->db->lastInsertId();
    }

    public function updateHearing(int $id, array $data): bool {
        $stmt = $this->db->prepare("
            UPDATE hearings 
            SET hearing_date = :hearing_date,
                hearing_time = :hearing_time,
                venue = :venue,
                committee_members = :committee_members,
                status = :status,
                decision_notes = :decision_notes,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :id
        ");
        return $stmt->execute([
            ':hearing_date' => $data['hearing_date'],
            ':hearing_time' => $data['hearing_time'],
            ':venue' => $data['venue'] ?? 'Prefect Board Room',
            ':committee_members' => $data['committee_members'] ?? null,
            ':status' => $data['status'] ?? 'Scheduled',
            ':decision_notes' => $data['decision_notes'] ?? null,
            ':id' => $id
        ]);
    }

    // Sanctions
    public function getAllSanctions(array $filters = []): array {
        $sql = "
            SELECT sn.*, s.first_name, s.last_name, s.lrn, s.grade_level, s.section,
                   i.incident_number, v.title as violation_title, u.full_name as issued_by_name
            FROM sanctions sn
            JOIN students s ON sn.student_id = s.id
            JOIN incident_reports i ON sn.incident_id = i.id
            JOIN violations v ON i.violation_id = v.id
            JOIN users u ON sn.issued_by = u.id
            WHERE 1=1
        ";
        $params = [];
        if (!empty($filters['student_id'])) {
            $sql .= " AND s.id = :student_id";
            $params[':student_id'] = $filters['student_id'];
        }
        $sql .= " ORDER BY sn.created_at DESC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function createSanction(array $data): int {
        $stmt = $this->db->prepare("
            INSERT INTO sanctions (incident_id, student_id, sanction_type, start_date, end_date, status, remarks, issued_by) 
            VALUES (:incident_id, :student_id, :sanction_type, :start_date, :end_date, :status, :remarks, :issued_by)
        ");
        $stmt->execute([
            ':incident_id' => $data['incident_id'],
            ':student_id' => $data['student_id'],
            ':sanction_type' => $data['sanction_type'],
            ':start_date' => $data['start_date'],
            ':end_date' => $data['end_date'] ?? null,
            ':status' => $data['status'] ?? 'Ongoing',
            ':remarks' => $data['remarks'] ?? '',
            ':issued_by' => $data['issued_by']
        ]);

        // Update incident status to Sanctioned
        $this->db->prepare("UPDATE incident_reports SET status = 'Sanctioned' WHERE id = :id")->execute([':id' => $data['incident_id']]);

        return (int)$this->db->lastInsertId();
    }

    public function updateSanction(int $id, array $data): bool {
        $stmt = $this->db->prepare("
            UPDATE sanctions 
            SET status = :status,
                end_date = :end_date,
                remarks = :remarks
            WHERE id = :id
        ");
        return $stmt->execute([
            ':status' => $data['status'] ?? 'Ongoing',
            ':end_date' => $data['end_date'] ?? null,
            ':remarks' => $data['remarks'] ?? '',
            ':id' => $id
        ]);
    }

    // Clearance Holds
    public function getAllClearanceHolds(array $filters = []): array {
        $sql = "
            SELECT ch.*, s.first_name, s.last_name, s.lrn, s.grade_level, s.section, s.clearance_status,
                   u1.full_name as flagged_by_name, u2.full_name as resolved_by_name
            FROM clearance_holds ch
            JOIN students s ON ch.student_id = s.id
            JOIN users u1 ON ch.flagged_by = u1.id
            LEFT JOIN users u2 ON ch.resolved_by = u2.id
            WHERE 1=1
        ";
        $params = [];
        if (isset($filters['is_active']) && $filters['is_active'] !== '') {
            $sql .= " AND ch.is_active = :is_active";
            $params[':is_active'] = $filters['is_active'];
        }
        $sql .= " ORDER BY ch.is_active DESC, ch.created_at DESC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function toggleClearanceHold(int $studentId, bool $hold, string $reason, int $userId): bool {
        if ($hold) {
            $stmt = $this->db->prepare("INSERT INTO clearance_holds (student_id, hold_reason, is_active, flagged_by) VALUES (:student_id, :reason, 1, :flagged_by)");
            $stmt->execute([':student_id' => $studentId, ':reason' => $reason, ':flagged_by' => $userId]);
            $this->db->prepare("UPDATE students SET clearance_status = 'Hold' WHERE id = :id")->execute([':id' => $studentId]);
        } else {
            $stmt = $this->db->prepare("UPDATE clearance_holds SET is_active = 0, resolved_by = :userId, resolved_at = CURRENT_TIMESTAMP WHERE student_id = :student_id AND (is_active = 1 OR is_active = TRUE)");
            $stmt->execute([':userId' => $userId, ':student_id' => $studentId]);
            $this->db->prepare("UPDATE students SET clearance_status = 'Cleared' WHERE id = :id")->execute([':id' => $studentId]);
        }
        return true;
    }

    // Reformation Programs
    public function getAllReformationPrograms(array $filters = []): array {
        $sql = "
            SELECT rp.*, s.first_name, s.last_name, s.lrn, s.grade_level, s.section,
                   u.full_name as supervisor_name
            FROM reformation_programs rp
            JOIN students s ON rp.student_id = s.id
            LEFT JOIN users u ON rp.assigned_supervisor = u.id
            WHERE 1=1
        ";
        $params = [];
        if (!empty($filters['student_id'])) {
            $sql .= " AND s.id = :student_id";
            $params[':student_id'] = $filters['student_id'];
        }
        $sql .= " ORDER BY rp.created_at DESC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function assignReformationProgram(array $data): int {
        $stmt = $this->db->prepare("
            INSERT INTO reformation_programs (student_id, incident_id, program_title, description, assigned_supervisor, total_hours, completed_hours, status) 
            VALUES (:student_id, :incident_id, :program_title, :description, :assigned_supervisor, :total_hours, 0, 'In Progress')
        ");
        $stmt->execute([
            ':student_id' => $data['student_id'],
            ':incident_id' => $data['incident_id'] ?? null,
            ':program_title' => $data['program_title'],
            ':description' => $data['description'] ?? '',
            ':assigned_supervisor' => $data['assigned_supervisor'] ?? null,
            ':total_hours' => (int)($data['total_hours'] ?? 10)
        ]);
        return (int)$this->db->lastInsertId();
    }

    public function updateReformationProgram(int $id, array $data): bool {
        $stmt = $this->db->prepare("
            UPDATE reformation_programs 
            SET completed_hours = :completed_hours,
                status = :status,
                completion_date = :completion_date,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :id
        ");
        return $stmt->execute([
            ':completed_hours' => (int)$data['completed_hours'],
            ':status' => $data['status'],
            ':completion_date' => $data['completion_date'] ?? null,
            ':id' => $id
        ]);
    }

    // Behavior Points
    public function getBehaviorPointsHistory(): array {
        $stmt = $this->db->query("
            SELECT bp.*, s.first_name, s.last_name, s.lrn, s.conduct_points, u.full_name as created_by_name
            FROM behavior_points bp
            JOIN students s ON bp.student_id = s.id
            JOIN users u ON bp.created_by = u.id
            ORDER BY bp.created_at DESC
        ");
        return $stmt->fetchAll();
    }

    public function addManualBehaviorPoints(array $data): int {
        $stmt = $this->db->prepare("
            INSERT INTO behavior_points (student_id, incident_id, points_change, point_type, reason, created_by) 
            VALUES (:student_id, :incident_id, :points_change, :point_type, :reason, :created_by)
        ");
        $stmt->execute([
            ':student_id' => $data['student_id'],
            ':incident_id' => $data['incident_id'] ?? null,
            ':points_change' => (int)$data['points_change'],
            ':point_type' => $data['point_type'],
            ':reason' => $data['reason'],
            ':created_by' => $data['created_by']
        ]);
        $id = (int)$this->db->lastInsertId();

        // Update student conduct score
        $updateStmt = $this->db->prepare("
            UPDATE students 
            SET conduct_points = conduct_points + :pointsDelta,
                status = CASE 
                    WHEN (conduct_points + :pointsDelta) < 65 THEN 'Suspended' 
                    WHEN (conduct_points + :pointsDelta) < 75 THEN 'Probation' 
                    WHEN (conduct_points + :pointsDelta) < 90 THEN 'Under Warning' 
                    ELSE 'Good Standing' 
                END,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :id
        ");
        $updateStmt->execute([
            ':pointsDelta' => (int)$data['points_change'],
            ':id' => $data['student_id']
        ]);

        return $id;
    }
}
