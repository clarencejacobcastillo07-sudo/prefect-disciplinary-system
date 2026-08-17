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
        AuthMiddleware::authenticate();
        $filters = [
            'status' => $_GET['status'] ?? '',
            'category' => $_GET['category'] ?? '',
            'student_id' => $_GET['student_id'] ?? '',
            'search' => $_GET['search'] ?? ''
        ];
        $incidents = $this->service->listIncidents($filters);
        ResponseHelper::success($incidents, 'Incident reports retrieved');
    }

    public function show(int $id): void {
        AuthMiddleware::authenticate();
        try {
            $incident = $this->service->getIncidentDetails($id);
            ResponseHelper::success($incident, 'Incident details retrieved');
        } catch (Exception $e) {
            ResponseHelper::error($e->getMessage(), 404);
        }
    }

    public function store(): void {
        $user = AuthMiddleware::authenticate();
        RBACMiddleware::checkRole($user, ['Administrator', 'Prefect Officer']);

        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        try {
            $incident = $this->service->logIncident($input, $user);
            ResponseHelper::success($incident, 'Incident report logged successfully', 201);
        } catch (Exception $e) {
            ResponseHelper::error($e->getMessage(), 400);
        }
    }

    public function violations(): void {
        AuthMiddleware::authenticate();
        $violations = $this->service->listViolations();
        ResponseHelper::success($violations, 'Violations taxonomy retrieved');
    }

    public function createViolation(): void {
        $user = AuthMiddleware::authenticate();
        RBACMiddleware::checkRole($user, ['Administrator', 'Prefect Officer']);

        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        try {
            $id = $this->service->createViolation($input, $user);
            ResponseHelper::success(['id' => $id], 'Violation category created', 201);
        } catch (Exception $e) {
            ResponseHelper::error($e->getMessage(), 400);
        }
    }
}
