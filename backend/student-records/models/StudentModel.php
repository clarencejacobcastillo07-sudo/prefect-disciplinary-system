<?php
require_once __DIR__ . '/../../config/database.php';

class StudentModel {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    public function getAll(array $filters = []): array {
        $sql = "
            SELECT s.*, p.guardian_name, p.contact_number as guardian_phone, p.email as guardian_email, p.relationship 
            FROM students s 
            LEFT JOIN parents p ON s.id = p.student_id 
            WHERE 1=1
        ";
        $params = [];

        if (!empty($filters['search'])) {
            $search = trim($filters['search']);
            $sql .= " AND (s.lrn LIKE :search OR s.first_name LIKE :search OR s.last_name LIKE :search OR (s.first_name || ' ' || s.last_name) LIKE :search OR s.section LIKE :search OR s.grade_level LIKE :search)";
            $params[':search'] = '%' . $search . '%';
        }
        if (!empty($filters['grade_level'])) {
            $sql .= " AND s.grade_level = :grade_level";
            $params[':grade_level'] = $filters['grade_level'];
        }
        if (!empty($filters['clearance_status'])) {
            $sql .= " AND s.clearance_status = :clearance_status";
            $params[':clearance_status'] = $filters['clearance_status'];
        }

        $sql .= " ORDER BY s.grade_level ASC, s.last_name ASC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function getById(int $id): ?array {
        $stmt = $this->db->prepare("
            SELECT s.*, p.id as parent_id, p.guardian_name, p.contact_number as guardian_phone, p.email as guardian_email, p.relationship, p.address 
            FROM students s 
            LEFT JOIN parents p ON s.id = p.student_id 
            WHERE s.id = :id
        ");
        $stmt->execute([':id' => $id]);
        $student = $stmt->fetch();
        return $student ?: null;
    }

    public function create(array $studentData, array $parentData): int {
        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare("
                INSERT INTO students (lrn, first_name, last_name, middle_name, grade_level, section, track_strand, gender, conduct_points, status, clearance_status) 
                VALUES (:lrn, :first_name, :last_name, :middle_name, :grade_level, :section, :track_strand, :gender, :conduct_points, :status, :clearance_status)
            ");
            $stmt->execute([
                ':lrn' => $studentData['lrn'],
                ':first_name' => $studentData['first_name'],
                ':last_name' => $studentData['last_name'],
                ':middle_name' => $studentData['middle_name'] ?? null,
                ':grade_level' => $studentData['grade_level'],
                ':section' => $studentData['section'],
                ':track_strand' => $studentData['track_strand'] ?? 'General',
                ':gender' => $studentData['gender'] ?? 'Other',
                ':conduct_points' => $studentData['conduct_points'] ?? 100,
                ':status' => $studentData['status'] ?? 'Good Standing',
                ':clearance_status' => $studentData['clearance_status'] ?? 'Cleared'
            ]);
            $studentId = (int)$this->db->lastInsertId();

            if (!empty($parentData['guardian_name'])) {
                $pStmt = $this->db->prepare("
                    INSERT INTO parents (student_id, guardian_name, relationship, contact_number, email, address) 
                    VALUES (:student_id, :guardian_name, :relationship, :contact_number, :email, :address)
                ");
                $pStmt->execute([
                    ':student_id' => $studentId,
                    ':guardian_name' => $parentData['guardian_name'],
                    ':relationship' => $parentData['relationship'] ?? 'Parent',
                    ':contact_number' => $parentData['contact_number'] ?? '',
                    ':email' => $parentData['email'] ?? null,
                    ':address' => $parentData['address'] ?? null
                ]);
            }

            $this->db->commit();
            return $studentId;
        } catch (\Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function updateConductPoints(int $studentId, int $pointsDelta): bool {
        $stmt = $this->db->prepare("
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
        return $stmt->execute([':pointsDelta' => $pointsDelta, ':id' => $studentId]);
    }
}
