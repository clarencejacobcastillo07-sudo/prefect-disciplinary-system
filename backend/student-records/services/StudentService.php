<?php
require_once __DIR__ . '/../models/StudentModel.php';
require_once __DIR__ . '/../../helpers/AuditLogger.php';

class StudentService {
    private StudentModel $studentModel;

    public function __construct() {
        $this->studentModel = new StudentModel();
    }

    public function listStudents(array $filters = []): array {
        return $this->studentModel->getAll($filters);
    }

    public function getStudentProfile(int $id): array {
        $student = $this->studentModel->getById($id);
        if (!$student) {
            throw new Exception("Student record not found.");
        }
        return $student;
    }

    public function createStudent(array $data, array $user): array {
        if (empty($data['lrn']) || empty($data['first_name']) || empty($data['last_name'])) {
            throw new Exception("LRN / Student ID, First Name, and Last Name are required.");
        }
        $parentData = [
            'guardian_name'  => $data['guardian_name'] ?? ($data['parent']['guardian_name'] ?? ''),
            'relationship'   => $data['relationship'] ?? ($data['parent']['relationship'] ?? 'Parent'),
            'contact_number' => $data['contact_number'] ?? ($data['guardian_phone'] ?? ($data['parent']['contact_number'] ?? '')),
            'email'          => $data['guardian_email'] ?? ($data['parent']['email'] ?? null),
            'address'        => $data['guardian_address'] ?? ($data['address'] ?? ($data['parent']['address'] ?? null))
        ];
        $studentId = $this->studentModel->create($data, $parentData);
        AuditLogger::log('CREATE_STUDENT', 'Student Records', "Created student record for LRN/ID {$data['lrn']} ({$data['first_name']} {$data['last_name']})", $user['user_id'], $user['full_name']);
        return $this->getStudentProfile($studentId);
    }

    public function updateStudent(int $id, array $data, array $user): array {
        if (empty($data['lrn']) || empty($data['first_name']) || empty($data['last_name'])) {
            throw new Exception("LRN / Student ID, First Name, and Last Name are required.");
        }
        $parentData = [
            'guardian_name'  => $data['guardian_name'] ?? ($data['parent']['guardian_name'] ?? ''),
            'relationship'   => $data['relationship'] ?? ($data['parent']['relationship'] ?? 'Parent'),
            'contact_number' => $data['contact_number'] ?? ($data['guardian_phone'] ?? ($data['parent']['contact_number'] ?? '')),
            'email'          => $data['guardian_email'] ?? ($data['parent']['email'] ?? null),
            'address'        => $data['guardian_address'] ?? ($data['address'] ?? ($data['parent']['address'] ?? null))
        ];
        $this->studentModel->update($id, $data, $parentData);
        AuditLogger::log('UPDATE_STUDENT', 'Student Records', "Updated student record for ID {$id} ({$data['first_name']} {$data['last_name']})", $user['user_id'], $user['full_name']);
        return $this->getStudentProfile($id);
    }

    public function deleteStudent(int $id, array $user): bool {
        $student = $this->studentModel->getById($id);
        $res = $this->studentModel->delete($id);
        if ($res && $student) {
            AuditLogger::log('DELETE_STUDENT', 'Student Records', "Deleted student record for ID {$id} ({$student['first_name']} {$student['last_name']})", $user['user_id'], $user['full_name']);
        }
        return $res;
    }
}
