<?php
/**
 * Role-Based Access Control (RBAC) Middleware
 * Validates permitted actions based on user roles:
 * - Administrator (role_id: 1)
 * - Prefect Officer (role_id: 2)
 * - Guidance Counselor (role_id: 3)
 * - Principal (role_id: 4)
 */
require_once __DIR__ . '/../helpers/ResponseHelper.php';
require_once __DIR__ . '/../helpers/AuditLogger.php';

class RBACMiddleware {
    public static function checkRole(array $currentUser, array $allowedRoleNames): void {
        $userRole = trim($currentUser['role_name'] ?? '');

        if (empty($userRole)) {
            ResponseHelper::error('Forbidden. User profile has no assigned role.', 403);
            exit();
        }

        // Administrator has administrative authority across standard school operations
        if ($userRole === 'Administrator') {
            return;
        }

        if (!in_array($userRole, $allowedRoleNames, true)) {
            // Log forbidden RBAC attempt to audit trail
            AuditLogger::log(
                'FORBIDDEN_RBAC_ATTEMPT',
                'RBAC',
                "Unauthorized access attempt by role '{$userRole}' for action requiring [" . implode(', ', $allowedRoleNames) . "]",
                $currentUser['user_id'] ?? null,
                $currentUser['full_name'] ?? 'Unknown'
            );

            ResponseHelper::error("Forbidden. Your role ({$userRole}) does not have permission for this action.", 403);
            exit();
        }
    }

    public static function hasPermission(array $currentUser, array $allowedRoleNames): bool {
        $userRole = trim($currentUser['role_name'] ?? '');
        if (empty($userRole)) {
            return false;
        }
        if ($userRole === 'Administrator') {
            return true;
        }
        return in_array($userRole, $allowedRoleNames, true);
    }
}



