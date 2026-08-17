<?php
require_once __DIR__ . '/../../config/database.php';

class IncidentModel {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    public function getAllIncidents(array $filters = []): array {
        $sql = "
            SELECT i.*, 
                   s.first_name, s.last_name, s.lrn, s.grade_level, s.section,
                   v.title as violation_title, v.category as violation_category, v.code as violation_code, v.demerit_points,
                   u.full_name as reported_by_name
            FROM incident_reports i 
            JOIN students s ON i.student_id = s.id 
            JOIN violations v ON i.violation_id = v.id 
            JOIN users u ON i.reported_by = u.id 
            WHERE 1=1
        ";
        $params = [];

        if (!empty($filters['status'])) {
            $sql .= " AND i.status = :status";
            $params[':status'] = $filters['status'];
        }
        if (!empty($filters['category'])) {
            $sql .= " AND v.category = :category";
            $params[':category'] = $filters['category'];
        }
        if (!empty($filters['student_id'])) {
            $sql .= " AND i.student_id = :student_id";
            $params[':student_id'] = $filters['student_id'];
        }
        if (!empty($filters['search'])) {
            $search = trim($filters['search']);
            $sql .= " AND (i.incident_number LIKE :search OR s.lrn LIKE :search OR s.first_name LIKE :search OR s.last_name LIKE :search OR (s.first_name || ' ' || s.last_name) LIKE :search OR v.title LIKE :search OR i.description LIKE :search)";
            $params[':search'] = '%' . $search . '%';
        }

        $sql .= " ORDER BY i.created_at DESC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function getById(int $id): ?array {
        $stmt = $this->db->prepare("
            SELECT i.*, 
                   s.first_name, s.last_name, s.lrn, s.grade_level, s.section, s.conduct_points,
                   v.title as violation_title, v.category as violation_category, v.code as violation_code, v.demerit_points, v.recommended_sanction,
                   u.full_name as reported_by_name,
                   p.guardian_name, p.contact_number as parent_phone
            FROM incident_reports i 
            JOIN students s ON i.student_id = s.id 
            JOIN violations v ON i.violation_id = v.id 
            JOIN users u ON i.reported_by = u.id 
            LEFT JOIN parents p ON s.id = p.student_id 
            WHERE i.id = :id
        ");
        $stmt->execute([':id' => $id]);
        $inc = $stmt->fetch();
        return $inc ?: null;
    }

    public function createIncident(array $data): int {
        $incidentNumber = 'INC-' . date('Y') . '-' . str_pad((string)rand(1, 9999), 4, '0', STR_PAD_LEFT);
        $stmt = $this->db->prepare("
            INSERT INTO incident_reports (incident_number, student_id, violation_id, reported_by, incident_date, location, description, witnesses, evidence_url, status) 
            VALUES (:incident_number, :student_id, :violation_id, :reported_by, :incident_date, :location, :description, :witnesses, :evidence_url, :status)
        ");
        $stmt->execute([
            ':incident_number' => $incidentNumber,
            ':student_id' => $data['student_id'],
            ':violation_id' => $data['violation_id'],
            ':reported_by' => $data['reported_by'],
            ':incident_date' => $data['incident_date'] ?? date('Y-m-d H:i:s'),
            ':location' => $data['location'],
            ':description' => $data['description'],
            ':witnesses' => $data['witnesses'] ?? null,
            ':evidence_url' => $data['evidence_url'] ?? null,
            ':status' => $data['status'] ?? 'Pending Review'
        ]);
        return (int)$this->db->lastInsertId();
    }

    public function updateStatus(int $id, string $status): bool {
        $stmt = $this->db->prepare("UPDATE incident_reports SET status = :status, updated_at = CURRENT_TIMESTAMP WHERE id = :id");
        return $stmt->execute([':status' => $status, ':id' => $id]);
    }

    public function getAllViolations(): array {
        $stmt = $this->db->query("SELECT * FROM violations WHERE is_active = TRUE ORDER BY category ASC, code ASC");
        return $stmt->fetchAll();
    }

    public function createViolation(array $data): int {
        $stmt = $this->db->prepare("
            INSERT INTO violations (code, title, description, category, demerit_points, recommended_sanction) 
            VALUES (:code, :title, :description, :category, :demerit_points, :recommended_sanction)
        ");
        $stmt->execute([
            ':code' => $data['code'],
            ':title' => $data['title'],
            ':description' => $data['description'] ?? '',
            ':category' => $data['category'],
            ':demerit_points' => $data['demerit_points'],
            ':recommended_sanction' => $data['recommended_sanction'] ?? ''
        ]);
        return (int)$this->db->lastInsertId();
    }
}
