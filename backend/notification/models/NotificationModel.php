<?php
require_once __DIR__ . '/../../config/database.php';

class NotificationModel {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    public function getLogs(): array {
        $stmt = $this->db->query("
            SELECT sl.*, s.first_name, s.last_name, s.lrn, u.full_name as sent_by_name 
            FROM sms_logs sl
            JOIN students s ON sl.student_id = s.id
            LEFT JOIN users u ON sl.sent_by = u.id
            ORDER BY sl.created_at DESC
        ");
        return $stmt->fetchAll();
    }

    public function logSMS(int $studentId, string $phone, string $message, string $status, ?string $responsePayload = null, ?int $sentBy = null): int {
        $stmt = $this->db->prepare("
            INSERT INTO sms_logs (student_id, phone_number, message_content, provider, status, response_payload, sent_by) 
            VALUES (:student_id, :phone, :message, 'Semaphore', :status, :response_payload, :sent_by)
        ");
        $stmt->execute([
            ':student_id' => $studentId,
            ':phone' => $phone,
            ':message' => $message,
            ':status' => $status,
            ':response_payload' => $responsePayload,
            ':sent_by' => $sentBy
        ]);
        return (int)$this->db->lastInsertId();
    }
}
