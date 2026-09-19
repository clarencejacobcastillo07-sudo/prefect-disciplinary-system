<?php
require_once __DIR__ . '/../services/NotificationService.php';
require_once __DIR__ . '/../../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../../middleware/RBACMiddleware.php';
require_once __DIR__ . '/../../helpers/ResponseHelper.php';

/**
 * Notification Controller
 * Exposes RESTful endpoints for Parent SMS alerts, templates, delivery statistics, and sync.
 */
class NotificationController {
    private NotificationService $service;

    public function __construct() {
        $this->service = new NotificationService();
    }

    /**
     * GET /api.php?service=notifications&action=logs
     */
    public function logs(): void {
        $user = AuthMiddleware::authenticate();
        RBACMiddleware::checkRole($user, ['Administrator', 'Prefect Officer', 'Guidance Counselor']);

        $filters = [];
        if (!empty($_GET['status'])) {
            $filters['status'] = trim($_GET['status']);
        }
        if (!empty($_GET['student_id'])) {
            $filters['student_id'] = (int)$_GET['student_id'];
        }
        if (!empty($_GET['search'])) {
            $filters['search'] = trim($_GET['search']);
        }
        if (!empty($_GET['limit'])) {
            $filters['limit'] = (int)$_GET['limit'];
        }

        try {
            $logs = $this->service->getLogs($filters);
            ResponseHelper::success($logs, 'SMS alert logs retrieved successfully.');
        } catch (\Throwable $e) {
            error_log('[PDS NotificationController] logs error: ' . $e->getMessage());
            ResponseHelper::error('Failed to retrieve SMS alert logs.', 500);
        }
    }

    /**
     * POST /api.php?service=notifications&action=send
     * Resolves registered parent/guardian mobile contact securely from the database.
     */
    public function send(): void {
        $user = AuthMiddleware::authenticate();
        RBACMiddleware::checkRole($user, ['Administrator', 'Prefect Officer', 'Guidance Counselor']);

        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        $studentId = (int)($input['student_id'] ?? 0);
        $message   = trim($input['message'] ?? '');

        if (!$studentId || empty($message)) {
            ResponseHelper::error('Student ID and message content are required.', 400);
            return;
        }

        try {
            // Parent phone number is resolved directly and securely from student's database record
            $res = $this->service->sendParentSMS($studentId, $message, $user['user_id'], 'MANUAL_DISPATCH');
            ResponseHelper::success($res, 'SMS notification dispatched / queued via Semaphore abstraction layer.');
        } catch (\InvalidArgumentException $ie) {
            ResponseHelper::error($ie->getMessage(), 422);
        } catch (\Throwable $e) {
            error_log('[PDS NotificationController] Send error: ' . $e->getMessage());
            ResponseHelper::error('Failed to send SMS notification.', 500);
        }
    }

    /**
     * GET /api.php?service=notifications&action=stats
     */
    public function stats(): void {
        $user = AuthMiddleware::authenticate();
        RBACMiddleware::checkRole($user, ['Administrator', 'Prefect Officer', 'Guidance Counselor']);

        try {
            $stats = $this->service->getDeliveryStats();
            ResponseHelper::success($stats, 'SMS delivery analytics retrieved.');
        } catch (\Throwable $e) {
            error_log('[PDS NotificationController] stats error: ' . $e->getMessage());
            ResponseHelper::error('Failed to retrieve SMS delivery analytics.', 500);
        }
    }

    /**
     * POST /api.php?service=notifications&action=sync
     */
    public function sync(): void {
        $user = AuthMiddleware::authenticate();
        RBACMiddleware::checkRole($user, ['Administrator', 'Prefect Officer']);

        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        $logId = isset($input['log_id']) ? (int)$input['log_id'] : null;

        try {
            $res = $this->service->syncDeliveryStatus($logId);
            ResponseHelper::success($res, 'SMS delivery statuses synchronized with gateway.');
        } catch (\Throwable $e) {
            error_log('[PDS NotificationController] sync error: ' . $e->getMessage());
            ResponseHelper::error('Failed to synchronize delivery status.', 500);
        }
    }

    /**
     * GET /api.php?service=notifications&action=balance
     */
    public function balance(): void {
        $user = AuthMiddleware::authenticate();
        RBACMiddleware::checkRole($user, ['Administrator', 'Prefect Officer']);

        try {
            $info = $this->service->getAccountInfo();
            ResponseHelper::success($info, 'Gateway account status retrieved.');
        } catch (\Throwable $e) {
            error_log('[PDS NotificationController] balance error: ' . $e->getMessage());
            ResponseHelper::error('Failed to retrieve gateway balance.', 500);
        }
    }

    /**
     * GET /api.php?service=notifications&action=templates
     */
    public function templates(): void {
        $user = AuthMiddleware::authenticate();
        RBACMiddleware::checkRole($user, ['Administrator', 'Prefect Officer', 'Guidance Counselor', 'Teacher']);

        try {
            $templates = $this->service->getTemplates();
            ResponseHelper::success($templates, 'SMS templates retrieved.');
        } catch (\Throwable $e) {
            error_log('[PDS NotificationController] templates error: ' . $e->getMessage());
            ResponseHelper::error('Failed to retrieve SMS templates.', 500);
        }
    }
}
