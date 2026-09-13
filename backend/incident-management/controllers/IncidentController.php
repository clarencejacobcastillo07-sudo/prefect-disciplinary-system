<?php
require_once __DIR__ . '/../services/IncidentService.php';
require_once __DIR__ . '/../../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../../middleware/RBACMiddleware.php';
require_once __DIR__ . '/../../helpers/ResponseHelper.php';

class IncidentController {
    private IncidentService $service;

    public function __construct() {
        $this->service = new IncidentService();
    }

    public function index(): void {
        $user = AuthMiddleware::authenticate();
        RBACMiddleware::checkRole($user, ['Administrator', 'Prefect Officer', 'Guidance Counselor', 'Principal']);

        $filters = [
            'status'     => $_GET['status']     ?? '',
            'category'   => $_GET['category']   ?? '',
            'student_id' => $_GET['student_id'] ?? '',
            'search'     => $_GET['search']      ?? '',
        ];
        $incidents = $this->service->listIncidents($filters);
        ResponseHelper::success($incidents, 'Incident reports retrieved');
    }

    public function show(int $id): void {
        $user = AuthMiddleware::authenticate();
        RBACMiddleware::checkRole($user, ['Administrator', 'Prefect Officer', 'Guidance Counselor', 'Principal']);

        try {
            $incident = $this->service->getIncidentDetails($id);
            ResponseHelper::success($incident, 'Incident details retrieved');
        } catch (\InvalidArgumentException $e) {
            ResponseHelper::error($e->getMessage(), 404);
        } catch (\Throwable $e) {
            error_log('[PDS IncidentController] Show error: ' . $e->getMessage());
            ResponseHelper::error('Failed to retrieve incident.', 500);
        }
    }

    public function store(): void {
        $user = AuthMiddleware::authenticate();
        RBACMiddleware::checkRole($user, ['Administrator', 'Prefect Officer']);

        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        try {
            $incident = $this->service->logIncident($input, $user);
            ResponseHelper::success($incident, 'Incident report logged successfully', 201);
        } catch (\InvalidArgumentException $e) {
            ResponseHelper::error($e->getMessage(), 400);
        } catch (\Throwable $e) {
            error_log('[PDS IncidentController] Store error: ' . $e->getMessage());
            ResponseHelper::error('Failed to log incident report.', 500);
        }
    }

    public function violations(): void {
        $user = AuthMiddleware::authenticate();
        RBACMiddleware::checkRole($user, ['Administrator', 'Prefect Officer', 'Guidance Counselor', 'Principal']);

        $includeInactive = isset($_GET['all']) && ($_GET['all'] === '1' || $_GET['all'] === 'true');
        $violations = $this->service->listViolations($includeInactive);
        ResponseHelper::success($violations, 'Violations taxonomy retrieved');
    }

    public function showViolation(int $id): void {
        $user = AuthMiddleware::authenticate();
        RBACMiddleware::checkRole($user, ['Administrator', 'Prefect Officer', 'Guidance Counselor', 'Principal']);

        try {
            $violation = $this->service->getViolation($id);
            ResponseHelper::success($violation, 'Violation retrieved');
        } catch (\InvalidArgumentException $e) {
            ResponseHelper::error($e->getMessage(), 404);
        } catch (\Throwable $e) {
            error_log('[PDS IncidentController] ShowViolation error: ' . $e->getMessage());
            ResponseHelper::error('Failed to retrieve violation.', 500);
        }
    }

    public function createViolation(): void {
        $user = AuthMiddleware::authenticate();
        RBACMiddleware::checkRole($user, ['Administrator', 'Prefect Officer']);

        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        try {
            $id = $this->service->createViolation($input, $user);
            ResponseHelper::success(['id' => $id], 'Violation category created', 201);
        } catch (\InvalidArgumentException $e) {
            ResponseHelper::error($e->getMessage(), 400);
        } catch (\Throwable $e) {
            error_log('[PDS IncidentController] CreateViolation error: ' . $e->getMessage());
            ResponseHelper::error('Failed to create violation category.', 500);
        }
    }

    public function updateViolation(int $id): void {
        $user = AuthMiddleware::authenticate();
        RBACMiddleware::checkRole($user, ['Administrator', 'Prefect Officer']);

        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        try {
            $this->service->updateViolation($id, $input, $user);
            ResponseHelper::success(null, 'Violation category updated successfully');
        } catch (\InvalidArgumentException $e) {
            ResponseHelper::error($e->getMessage(), 400);
        } catch (\Throwable $e) {
            error_log('[PDS IncidentController] UpdateViolation error: ' . $e->getMessage());
            ResponseHelper::error('Failed to update violation category.', 500);
        }
    }

    public function toggleViolationActive(int $id): void {
        $user = AuthMiddleware::authenticate();
        RBACMiddleware::checkRole($user, ['Administrator', 'Prefect Officer']);

        $input    = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        $isActive = !empty($input['is_active']);
        try {
            $this->service->toggleViolationActive($id, $isActive, $user);
            ResponseHelper::success(null, 'Violation status updated');
        } catch (\InvalidArgumentException $e) {
            ResponseHelper::error($e->getMessage(), 400);
        } catch (\Throwable $e) {
            error_log('[PDS IncidentController] ToggleViolation error: ' . $e->getMessage());
            ResponseHelper::error('Failed to update violation status.', 500);
        }
    }
}
