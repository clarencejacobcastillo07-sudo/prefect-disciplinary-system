<?php
require_once __DIR__ . '/../models/UserModel.php';
require_once __DIR__ . '/../../config/supabase.php';
require_once __DIR__ . '/../../helpers/AuditLogger.php';

class AuthService {
    private UserModel $userModel;

    public function __construct() {
        $this->userModel = new UserModel();
    }

    public function login(string $email, string $password): array {
        // Authenticate strictly with Supabase Auth API — no local password check
        $supabaseSession = SupabaseConfig::signInWithPassword($email, $password);
        if (!$supabaseSession || empty($supabaseSession['access_token']) || empty($supabaseSession['user']['id'])) {
            throw new Exception('Invalid email or password.');
        }

        $supabaseUid = $supabaseSession['user']['id'];
        $accessToken = $supabaseSession['access_token'];

        // Map Supabase Auth user to local application profile for RBAC
        $user = $this->userModel->findBySupabaseUid($supabaseUid) ?? $this->userModel->findByEmail($email);
        if (!$user) {
            throw new Exception('User profile not found in application database. Contact an administrator.');
        }

        if (empty($user['is_active'])) {
            throw new Exception('Account is inactive. Contact an administrator.');
        }

        // Back-fill supabase_uid if the record was found by email only
        if (empty($user['supabase_uid'])) {
            $this->userModel->updateSupabaseUid($user['id'], $supabaseUid);
        }

        AuditLogger::log('USER_LOGIN', 'Authentication', "User {$user['full_name']} logged in successfully via Supabase Auth", $user['id'], $user['full_name']);

        return [
            'token' => $accessToken,
            'user'  => [
                'id'           => $user['id'],
                'supabase_uid' => $supabaseUid,
                'full_name'    => $user['full_name'],
                'email'        => $user['email'],
                'role_id'      => $user['role_id'],
                'role_name'    => $user['role_name'],
            ],
        ];
    }

    /**
     * Logout is stateless — the client drops the JWT.
     * PHP sessions are NOT used for authentication; this method only logs the event.
     *
     * @param int|null    $userId   Resolved from the validated Bearer token, not from $_SESSION.
     * @param string|null $userName Resolved from the validated Bearer token, not from $_SESSION.
     */
    public function logout(?int $userId = null, ?string $userName = null): bool {
        AuditLogger::log('USER_LOGOUT', 'Authentication', 'User logged out', $userId, $userName ?? 'Unknown');
        return true;
    }
}
