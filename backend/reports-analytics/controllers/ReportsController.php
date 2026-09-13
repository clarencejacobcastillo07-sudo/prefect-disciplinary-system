<?php
require_once __DIR__ . '/../services/ReportsService.php';
require_once __DIR__ . '/../../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../../middleware/RBACMiddleware.php';
require_once __DIR__ . '/../../helpers/ResponseHelper.php';
require_once __DIR__ . '/../../helpers/AuditLogger.php';

class ReportsController {
    private ReportsService $service;

    // Permitted query-string filter keys — prevents unintended filter injection
    private const REPORT_FILTERS = ['start_date', 'end_date', 'category', 'grade_level'];

    public function __construct() {
        $this->service = new ReportsService();
    }

    public function dashboard(): void {
        $user = AuthMiddleware::authenticate();
        RBACMiddleware::checkRole($user, ['Administrator', 'Prefect Officer', 'Guidance Counselor', 'Principal']);

        try {
            $metrics = $this->service->getDashboardMetrics();
            ResponseHelper::success($metrics, 'Dashboard analytics data retrieved');
        } catch (\Throwable $e) {
            error_log('[PDS ReportsController] Dashboard error: ' . $e->getMessage());
            ResponseHelper::error('Failed to retrieve dashboard metrics.', 500);
        }
    }

    public function generate(): void {
        $user = AuthMiddleware::authenticate();
        RBACMiddleware::checkRole($user, ['Administrator', 'Prefect Officer', 'Guidance Counselor', 'Principal']);

        // Whitelist filter keys before passing to the service
        $rawFilters = [
            'start_date'  => $_GET['start_date']  ?? '',
            'end_date'    => $_GET['end_date']    ?? '',
            'category'    => $_GET['category']    ?? '',
            'grade_level' => $_GET['grade_level'] ?? '',
        ];
        $filters = array_intersect_key($rawFilters, array_flip(self::REPORT_FILTERS));

        try {
            $data = $this->service->generateReport($filters);
            ResponseHelper::success($data, 'Custom report data generated');
        } catch (\Throwable $e) {
            error_log('[PDS ReportsController] Generate error: ' . $e->getMessage());
            ResponseHelper::error('Failed to generate report.', 500);
        }
    }

    public function audit(): void {
        $user = AuthMiddleware::authenticate();
        RBACMiddleware::checkRole($user, ['Administrator']);

        try {
            $logs = $this->service->getAuditLogs();
            ResponseHelper::success($logs, 'System audit logs retrieved');
        } catch (\Throwable $e) {
            error_log('[PDS ReportsController] Audit error: ' . $e->getMessage());
            ResponseHelper::error('Failed to retrieve audit logs.', 500);
        }
    }

    public function getSettings(): void {
        $user = AuthMiddleware::authenticate();
        RBACMiddleware::checkRole($user, ['Administrator']);

        try {
            $settings = $this->service->getSettings();
            ResponseHelper::success($settings, 'System settings retrieved');
        } catch (\Throwable $e) {
            error_log('[PDS ReportsController] GetSettings error: ' . $e->getMessage());
            ResponseHelper::error('Failed to retrieve system settings.', 500);
        }
    }

    public function saveSettings(): void {
        $user = AuthMiddleware::authenticate();
        RBACMiddleware::checkRole($user, ['Administrator']);

        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        if (empty($input) || !is_array($input)) {
            ResponseHelper::error('Settings payload is required.', 400);
        }

        try {
            $this->service->saveSettings($input);
            AuditLogger::log('UPDATE_SETTINGS', 'System Settings', 'Updated system configuration parameters', $user['user_id'], $user['full_name']);
            ResponseHelper::success($this->service->getSettings(), 'System settings updated successfully');
        } catch (\Throwable $e) {
            error_log('[PDS ReportsController] SaveSettings error: ' . $e->getMessage());
            ResponseHelper::error('Failed to save settings.', 500);
        }
    }
}
