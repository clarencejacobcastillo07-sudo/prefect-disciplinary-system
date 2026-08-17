<?php
/**
 * System Audit Logger Service
 */
require_once __DIR__ . '/../config/database.php';

class AuditLogger {
    public static function log(string $action, string $module, string $description, ?int $userId = null, ?string $userName = null): void {
        try {
            $db = Database::getConnection();
            $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';

            $stmt = $db->prepare("INSERT INTO audit_logs (user_id, user_name, action, module, description, ip_address) VALUES (:user_id, :user_name, :action, :module, :description, :ip_address)");
            $stmt->execute([
                ':user_id' => $userId,
                ':user_name' => $userName ?? 'System Guest',
                ':action' => $action,
                ':module' => $module,
                ':description' => $description,
                ':ip_address' => $ip
            ]);
        } catch (\Throwable $e) {
            // Silently swallow audit log failure to prevent breaking main business process
        }
    }
}
