<?php
require_once __DIR__ . '/SemaphoreSMSService.php';
require_once __DIR__ . '/../models/NotificationModel.php';
require_once __DIR__ . '/../../helpers/AuditLogger.php';

class NotificationService {
    private SMSGatewayInterface $smsGateway;
    private NotificationModel $model;

    public function __construct(?SMSGatewayInterface $gateway = null) {
        $this->smsGateway = $gateway ?? new SemaphoreSMSService();
        $this->model = new NotificationModel();
    }

    public function sendSMS(int $studentId, string $phone, string $message, ?int $userId = null): array {
        $result = $this->smsGateway->send($phone, $message);
        $status = $result['status'] ?? 'Sent';
        $payload = is_array($result['response'] ?? null) ? json_encode($result['response']) : ($result['response'] ?? '');

        $this->model->logSMS($studentId, $phone, $message, $status, $payload, $userId);
        AuditLogger::log('SEND_SMS_ALERT', 'Notification Service', "Sent SMS parent alert to {$phone} for Student ID {$studentId}", $userId);

        return $result;
    }

    public function getLogs(): array {
        return $this->model->getLogs();
    }
}
