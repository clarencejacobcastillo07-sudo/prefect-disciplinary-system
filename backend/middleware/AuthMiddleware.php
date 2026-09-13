<?php
/**
 * Authentication Middleware
 * System: Prefect Disciplinary Action System
 * Client: St. Agnes Academy of Caloocan Inc.
 */
require_once __DIR__ . '/../helpers/ResponseHelper.php';
require_once __DIR__ . '/../config/supabase.php';
require_once __DIR__ . '/../authentication/models/UserModel.php';

if (!function_exists('getallheaders')) {
    function getallheaders(): array {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (str_starts_with($name, 'HTTP_')) {
                $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
            }
        }
        return $headers;
    }
}

class AuthMiddleware {
    public static function authenticate(): array {
        // Extract Authorization Bearer header
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';

        if (!empty($authHeader) && str_starts_with($authHeader, 'Bearer ')) {
            $token = trim(substr($authHeader, 7));
            if (empty($token)) {
                ResponseHelper::error('Unauthorized access. Bearer token is empty.', 401);
                exit();
            }

            $verified = null;
            try {
                $verified = SupabaseConfig::verifyJwtToken($token);
            } catch (\Throwable $t) {
                error_log('[PDS AuthMiddleware] JWT verification error: ' . $t->getMessage());
                ResponseHelper::error('Unauthorized access. Authentication service verification failed.', 401);
                exit();
            }

            // Supabase Auth verification must succeed with valid user object
            if (!$verified || (empty($verified['id']) && empty($verified['sub']))) {
                ResponseHelper::error('Unauthorized access. Invalid or expired token.', 401);
                exit();
            }

            $supabaseUid = $verified['id'] ?? $verified['sub'];
            $email = $verified['email'] ?? '';

            // Validate UUID format strictly
            if (!is_string($supabaseUid) || !preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i', $supabaseUid)) {
                ResponseHelper::error('Unauthorized access. Invalid authentication identity format.', 401);
                exit();
            }

            $userModel = new UserModel();
            $user = null;

            // 1. Primary: map by verified Supabase UUID
            $user = $userModel->findBySupabaseUid($supabaseUid);

            // 2. Secondary: initial account linking by verified email if supabase_uid is not yet set
            if (!$user && !empty($email)) {
                $candidate = $userModel->findByEmail($email);
                if ($candidate && empty($candidate['supabase_uid'])) {
                    $userModel->updateSupabaseUid((int)$candidate['id'], $supabaseUid);
                    $user = $userModel->findBySupabaseUid($supabaseUid);
                }
            }

            // If no active local profile exists, reject request — never guess role or auto-create user
            if (!$user) {
                ResponseHelper::error('Forbidden. Authenticated user does not have a local application profile.', 403);
                exit();
            }

            if (empty($user['is_active'])) {
                ResponseHelper::error('Forbidden. Your user account is inactive. Contact the administrator.', 403);
                exit();
            }

            return [
                'user_id'      => (int)$user['id'],
                'supabase_uid' => $supabaseUid,
                'full_name'    => $user['full_name'],
                'email'        => $user['email'],
                'role_id'      => (int)$user['role_id'],
                'role_name'    => $user['role_name']
            ];
        }

        ResponseHelper::error('Unauthorized access. Valid Bearer token required.', 401);
        exit();
    }
}

