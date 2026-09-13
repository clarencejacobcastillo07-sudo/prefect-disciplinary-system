<?php
require_once __DIR__ . '/../services/StudentService.php';
require_once __DIR__ . '/../../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../../middleware/RBACMiddleware.php';
require_once __DIR__ . '/../../helpers/ResponseHelper.php';

class StudentController {
    private StudentService $service;

    public function __construct() {
        $this->service = new StudentService();
    }

    public function index(): void {
        $user = AuthMiddleware::authenticate();
        RBACMiddleware::checkRole($user, ['Administrator', 'Prefect Officer', 'Guidance Counselor', 'Principal']);

        $filters = [
            'search' => $_GET['search'] ?? '',
            'grade_level' => $_GET['grade_level'] ?? '',
            'clearance_status' => $_GET['clearance_status'] ?? ''
        ];
        $students = $this->service->listStudents($filters);
        ResponseHelper::success($students, 'Students retrieved successfully');
    }

    public function show(int $id): void {
        $user = AuthMiddleware::authenticate();
        RBACMiddleware::checkRole($user, ['Administrator', 'Prefect Officer', 'Guidance Counselor', 'Principal']);

        try {
            $student = $this->service->getStudentProfile($id);
            ResponseHelper::success($student, 'Student profile retrieved');
        } catch (\InvalidArgumentException $e) {
            ResponseHelper::error($e->getMessage(), 404);
        } catch (\Throwable $e) {
            error_log('[PDS StudentController] Show error: ' . $e->getMessage());
            ResponseHelper::error('Failed to retrieve student profile.', 500);
        }
    }

    public function store(): void {
        $user = AuthMiddleware::authenticate();
        RBACMiddleware::checkRole($user, ['Administrator', 'Prefect Officer']);

        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        try {
            $student = $this->service->createStudent($input, $user);
            ResponseHelper::success($student, 'Student record created successfully', 201);
        } catch (\InvalidArgumentException $e) {
            ResponseHelper::error($e->getMessage(), 400);
        } catch (\Throwable $e) {
            error_log('[PDS StudentController] Create error: ' . $e->getMessage());
            ResponseHelper::error('Create failed: ' . $e->getMessage(), 400);
        }
    }

    public function update(int $id): void {
        $user = AuthMiddleware::authenticate();
        RBACMiddleware::checkRole($user, ['Administrator', 'Prefect Officer']);

        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        try {
            $student = $this->service->updateStudent($id, $input, $user);
            ResponseHelper::success($student, 'Student record updated successfully');
        } catch (\InvalidArgumentException $e) {
            ResponseHelper::error($e->getMessage(), 400);
        } catch (\Throwable $e) {
            error_log('[PDS StudentController] Update error: ' . $e->getMessage());
            ResponseHelper::error('Failed to update student record.', 400);
        }
    }

    public function destroy(int $id): void {
        $user = AuthMiddleware::authenticate();
        RBACMiddleware::checkRole($user, ['Administrator', 'Prefect Officer']);

        try {
            $this->service->deleteStudent($id, $user);
            ResponseHelper::success(null, 'Student record deleted successfully');
        } catch (\InvalidArgumentException $e) {
            ResponseHelper::error($e->getMessage(), 400);
        } catch (\Throwable $e) {
            error_log('[PDS StudentController] Delete error: ' . $e->getMessage());
            ResponseHelper::error('Failed to delete student record.', 400);
        }
    }
}

