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
            throw new Exception("LRN, First Name, and Last Name are required.");
        }
        $studentId = $this->studentModel->create($data, $data['parent'] ?? []);
        AuditLogger::log('CREATE_STUDENT', 'Student Records', "Created student record for LRN {$data['lrn']} ({$data['first_name']} {$data['last_name']})", $user['user_id'], $user['full_name']);
        return $this->getStudentProfile($studentId);
    }
}
