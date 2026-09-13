<?php
require_once __DIR__ . '/../services/NotificationService.php';
require_once __DIR__ . '/../../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../../middleware/RBACMiddleware.php';
require_once __DIR__ . '/../../helpers/ResponseHelper.php';

class NotificationController {
    private NotificationService $service;

    public function __construct() {
        $this->service = new NotificationService();
    }

    public function logs(): void {
        $user = AuthMiddleware::authenticate();
        RBACMiddleware::checkRole($user, ['Administrator', 'Prefect Officer', 'Guidance Counselor']);
        $logs = $this->service->getLogs();
        ResponseHelper::success($logs, 'SMS alert logs retrieved');
    }


    public function send(): void {
        $user = AuthMiddleware::authenticate();
        RBACMiddleware::checkRole($user, ['Administrator', 'Prefect Officer', 'Guidance Counselor']);

        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        $studentId = (int)($input['student_id'] ?? 0);
        $phone = trim($input['phone'] ?? '');
        $message = trim($input['message'] ?? '');

        if (!$studentId || empty($phone) || empty($message)) {
            ResponseHelper::error('Student ID, phone number, and message content are required.', 400);
        }

        try {
            $res = $this->service->sendSMS($studentId, $phone, $message, $user['user_id']);
            ResponseHelper::success($res, 'SMS notification sent / queued via Semaphore abstraction layer.');
        } catch (\Throwable $e) {
            error_log('[PDS NotificationController] Send error: ' . $e->getMessage());
            ResponseHelper::error('Failed to send SMS notification.', 500);
        }
    }
}
