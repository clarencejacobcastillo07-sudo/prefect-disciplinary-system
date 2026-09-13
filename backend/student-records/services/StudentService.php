<?php
require_once __DIR__ . '/../models/StudentModel.php';
require_once __DIR__ . '/../../helpers/AuditLogger.php';

class StudentService {
    private StudentModel $studentModel;

    // Permitted columns for create/update — prevents mass assignment
    private const STUDENT_ALLOWED = [
        'lrn', 'first_name', 'last_name', 'middle_name',
        'grade_level', 'section', 'track_strand', 'gender',
        'conduct_points', 'status', 'clearance_status'
    ];

    private const PARENT_ALLOWED = [
        'guardian_name', 'relationship', 'contact_number', 'email', 'address'
    ];

    public function __construct() {
        $this->studentModel = new StudentModel();
    }

    public function listStudents(array $filters = []): array {
        // Whitelist accepted filter keys to prevent SQL column injection through filter names
        $safe = [];
        foreach (['search', 'grade_level', 'clearance_status'] as $key) {
            if (isset($filters[$key])) {
                $safe[$key] = $filters[$key];
            }
        }
        return $this->studentModel->getAll($safe);
    }

    public function getStudentProfile(int $id): array {
        $student = $this->studentModel->getById($id);
        if (!$student) {
            throw new \InvalidArgumentException("Student record not found.");
        }
        return $student;
    }

    public function createStudent(array $data, array $user): array {
        if (empty($data['lrn']) || empty($data['first_name']) || empty($data['last_name'])) {
            throw new \InvalidArgumentException("LRN / Student ID, First Name, and Last Name are required.");
        }

        // Whitelist student fields
        $studentData = array_intersect_key($data, array_flip(self::STUDENT_ALLOWED));

        // Resolve parent data from nested or flat input then whitelist
        $rawParent = $data['parent'] ?? [];
        $flatParent = [
            'guardian_name'  => $data['guardian_name']  ?? ($rawParent['guardian_name']  ?? ''),
            'relationship'   => $data['relationship']   ?? ($rawParent['relationship']   ?? 'Parent'),
            'contact_number' => $data['contact_number'] ?? ($data['guardian_phone']      ?? ($rawParent['contact_number'] ?? '')),
            'email'          => $data['guardian_email'] ?? ($rawParent['email']           ?? null),
            'address'        => $data['guardian_address'] ?? ($data['address']           ?? ($rawParent['address'] ?? null)),
        ];
        $parentData = array_intersect_key($flatParent, array_flip(self::PARENT_ALLOWED));

        $studentId = $this->studentModel->create($studentData, $parentData);
        AuditLogger::log(
            'CREATE_STUDENT',
            'Student Records',
            "Created student record for LRN/ID {$data['lrn']} ({$data['first_name']} {$data['last_name']})",
            $user['user_id'],
            $user['full_name']
        );
        return $this->getStudentProfile($studentId);
    }

    public function updateStudent(int $id, array $data, array $user): array {
        if (empty($data['lrn']) || empty($data['first_name']) || empty($data['last_name'])) {
            throw new \InvalidArgumentException("LRN / Student ID, First Name, and Last Name are required.");
        }

        // Whitelist student fields
        $studentData = array_intersect_key($data, array_flip(self::STUDENT_ALLOWED));

        // Resolve parent data then whitelist
        $rawParent = $data['parent'] ?? [];
        $flatParent = [
            'guardian_name'  => $data['guardian_name']  ?? ($rawParent['guardian_name']  ?? ''),
            'relationship'   => $data['relationship']   ?? ($rawParent['relationship']   ?? 'Parent'),
            'contact_number' => $data['contact_number'] ?? ($data['guardian_phone']      ?? ($rawParent['contact_number'] ?? '')),
            'email'          => $data['guardian_email'] ?? ($rawParent['email']           ?? null),
            'address'        => $data['guardian_address'] ?? ($data['address']           ?? ($rawParent['address'] ?? null)),
        ];
        $parentData = array_intersect_key($flatParent, array_flip(self::PARENT_ALLOWED));

        $this->studentModel->update($id, $studentData, $parentData);
        AuditLogger::log(
            'UPDATE_STUDENT',
            'Student Records',
            "Updated student record for ID {$id} ({$data['first_name']} {$data['last_name']})",
            $user['user_id'],
            $user['full_name']
        );
        return $this->getStudentProfile($id);
    }

    public function deleteStudent(int $id, array $user): bool {
        $student = $this->studentModel->getById($id);
        $res = $this->studentModel->delete($id);
        if ($res && $student) {
            AuditLogger::log(
                'DELETE_STUDENT',
                'Student Records',
                "Deleted student record for ID {$id} ({$student['first_name']} {$student['last_name']})",
                $user['user_id'],
                $user['full_name']
            );
        }
        return $res;
    }
}
