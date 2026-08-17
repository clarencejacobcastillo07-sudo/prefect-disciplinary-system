<?php
require_once __DIR__ . '/../services/ReportsService.php';
require_once __DIR__ . '/../../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../../helpers/ResponseHelper.php';

class ReportsController {
    private ReportsService $service;

    public function __construct() {
        $this->service = new ReportsService();
    }

    public function dashboard(): void {
        AuthMiddleware::authenticate();
        $metrics = $this->service->getDashboardMetrics();
        ResponseHelper::success($metrics, 'Dashboard analytics data retrieved');
    }

    public function generate(): void {
        AuthMiddleware::authenticate();
        $filters = [
            'start_date' => $_GET['start_date'] ?? '',
            'end_date' => $_GET['end_date'] ?? '',
            'category' => $_GET['category'] ?? '',
            'grade_level' => $_GET['grade_level'] ?? ''
        ];
        $data = $this->service->generateReport($filters);
        ResponseHelper::success($data, 'Custom report data generated');
    }

    public function audit(): void {
        AuthMiddleware::authenticate();
        $logs = $this->service->getAuditLogs();
        ResponseHelper::success($logs, 'System audit logs retrieved');
    }
}
