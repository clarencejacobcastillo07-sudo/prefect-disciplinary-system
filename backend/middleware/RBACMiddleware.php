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

class RBACMiddleware {
    public static function checkRole(array $currentUser, array $allowedRoleNames): void {
        $userRole = $currentUser['role_name'] ?? '';

        if (in_array('Administrator', $allowedRoleNames) && $userRole === 'Administrator') {
            return;
        }

        if (!in_array($userRole, $allowedRoleNames) && $userRole !== 'Administrator') {
            ResponseHelper::error("Forbidden. Your role ({$userRole}) does not have permission for this module action.", 403);
            exit();
        }
    }
}
