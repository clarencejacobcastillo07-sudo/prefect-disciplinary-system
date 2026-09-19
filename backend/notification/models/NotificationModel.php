<?php
require_once __DIR__ . '/../../config/database.php';

/**
 * Notification Data Model
 * Handles database operations for SMS alert dispatch records and delivery tracking.
 */
class NotificationModel {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
        $this->ensureSchema();
    }

    /**
     * Ensure provider_message_id column exists for zero-downtime database compatibility.
     */
    private function ensureSchema(): void {
        try {
            $this->db->exec("ALTER TABLE sms_logs ADD COLUMN IF NOT EXISTS provider_message_id VARCHAR(100)");
        } catch (\Throwable $e) {
            try {
                $this->db->exec("ALTER TABLE sms_logs ADD COLUMN provider_message_id VARCHAR(100)");
            } catch (\Throwable $ignored) {}
        }
    }

    /**
     * Retrieve SMS notification logs with optional filtering.
     */
    public function getLogs(array $filters = []): array {
        $sql = "
            SELECT sl.*, 
                   s.first_name, s.last_name, s.lrn, s.grade_level, s.section,
                   p.guardian_name, p.relationship,
                   u.full_name as sent_by_name 
            FROM sms_logs sl
            JOIN students s ON sl.student_id = s.id
            LEFT JOIN parents p ON sl.parent_id = p.id OR s.id = p.student_id
            LEFT JOIN users u ON sl.sent_by = u.id
            WHERE 1=1
        ";
        $params = [];

        if (!empty($filters['status'])) {
            $sql .= " AND sl.status = :status";
            $params[':status'] = $filters['status'];
        }

        if (!empty($filters['student_id'])) {
            $sql .= " AND sl.student_id = :student_id";
            $params[':student_id'] = (int)$filters['student_id'];
        }

        if (!empty($filters['search'])) {
            $search = trim($filters['search']);
            $sql .= " AND (s.lrn ILIKE :search OR s.first_name ILIKE :search OR s.last_name ILIKE :search OR sl.phone_number ILIKE :search OR sl.message_content ILIKE :search)";
            $params[':search'] = '%' . $search . '%';
        }

        $sql .= " ORDER BY sl.created_at DESC";

        if (!empty($filters['limit'])) {
            $sql .= " LIMIT " . (int)$filters['limit'];
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    /**
     * Retrieve single SMS log by ID.
     */
    public function getLogById(int $id): ?array {
        $stmt = $this->db->prepare("
            SELECT sl.*, s.first_name, s.last_name, s.lrn, u.full_name as sent_by_name 
            FROM sms_logs sl
            JOIN students s ON sl.student_id = s.id
            LEFT JOIN users u ON sl.sent_by = u.id
            WHERE sl.id = :id
        ");
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    /**
     * Insert a new SMS dispatch record with Semaphore provider_message_id.
     */
    public function logSMS(
        int $studentId, 
        string $phone, 
        string $message, 
        string $status, 
        ?string $responsePayload = null, 
        ?int $sentBy = null,
        ?int $parentId = null,
        ?string $providerMessageId = null
    ): int {
        // If parent_id not passed, resolve parent_id from student if present
        if (!$parentId) {
            $pStmt = $this->db->prepare("SELECT id FROM parents WHERE student_id = :student_id LIMIT 1");
            $pStmt->execute([':student_id' => $studentId]);
            $pRow = $pStmt->fetch();
            if ($pRow) {
                $parentId = (int)$pRow['id'];
            }
        }

        $stmt = $this->db->prepare("
            INSERT INTO sms_logs (parent_id, student_id, phone_number, message_content, provider, provider_message_id, status, response_payload, sent_by) 
            VALUES (:parent_id, :student_id, :phone, :message, 'Semaphore', :provider_msg_id, :status, :response_payload, :sent_by)
        ");
        $stmt->execute([
            ':parent_id'        => $parentId,
            ':student_id'       => $studentId,
            ':phone'            => $phone,
            ':message'          => $message,
            ':provider_msg_id'  => $providerMessageId,
            ':status'           => $status,
            ':response_payload' => $responsePayload,
            ':sent_by'          => $sentBy
        ]);
        return (int)$this->db->lastInsertId();
    }

    /**
     * Update status and payload of an existing SMS log.
     */
    public function updateStatus(int $id, string $status, ?string $responsePayload = null): bool {
        $sql = "UPDATE sms_logs SET status = :status";
        $params = [':id' => $id, ':status' => $status];

        if ($responsePayload !== null) {
            $sql .= ", response_payload = :payload";
            $params[':payload'] = $responsePayload;
        }

        $sql .= " WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute($params);
    }

    /**
     * Retrieve pending/queued logs that have a valid Semaphore provider_message_id for delivery sync.
     */
    public function getPendingLogs(int $limit = 50): array {
        $stmt = $this->db->prepare("
            SELECT id, student_id, phone_number, provider_message_id, status, response_payload, created_at
            FROM sms_logs
            WHERE status IN ('Queued', 'Sent') AND provider_message_id IS NOT NULL AND provider_message_id != ''
            ORDER BY created_at DESC
            LIMIT :limit
        ");
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    /**
     * Aggregate delivery tracking statistics.
     */
    public function getDeliveryStats(): array {
        $stmt = $this->db->query("
            SELECT 
                COUNT(*) as total_dispatched,
                COUNT(CASE WHEN status IN ('Delivered', 'Sent', 'Simulated') THEN 1 END) as total_successful,
                COUNT(CASE WHEN status = 'Delivered' THEN 1 END) as total_delivered,
                COUNT(CASE WHEN status = 'Simulated' THEN 1 END) as total_simulated,
                COUNT(CASE WHEN status = 'Queued' THEN 1 END) as total_queued,
                COUNT(CASE WHEN status = 'Failed' THEN 1 END) as total_failed
            FROM sms_logs
        ");
        $stats = $stmt->fetch() ?: [
            'total_dispatched' => 0,
            'total_successful' => 0,
            'total_delivered'  => 0,
            'total_simulated'  => 0,
            'total_queued'     => 0,
            'total_failed'     => 0
        ];

        $total = (int)$stats['total_dispatched'];
        $success = (int)$stats['total_successful'];
        $successRate = $total > 0 ? round(($success / $total) * 100, 1) : 100.0;

        $stats['success_rate'] = $successRate;
        return $stats;
    }
}
