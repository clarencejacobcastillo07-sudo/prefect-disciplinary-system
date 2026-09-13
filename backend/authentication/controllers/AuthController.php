<?php
require_once __DIR__ . '/../services/AuthService.php';
require_once __DIR__ . '/../models/UserModel.php';
require_once __DIR__ . '/../../helpers/ResponseHelper.php';
require_once __DIR__ . '/../../helpers/AuditLogger.php';
require_once __DIR__ . '/../../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../../middleware/RBACMiddleware.php';

class AuthController {
    private AuthService $authService;
    private UserModel $userModel;

    public function __construct() {
        $this->authService = new AuthService();
        $this->userModel = new UserModel();
    }

    public function login(): void {
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        $email = trim($input['email'] ?? '');
        $password = trim($input['password'] ?? '');

        if (empty($email) || empty($password)) {
            ResponseHelper::error('Email and password are required.', 400);
        }

        try {
            $result = $this->authService->login($email, $password);
            ResponseHelper::success($result, 'Login successful');
        } catch (Exception $e) {
            AuditLogger::log('LOGIN_FAILED', 'Authentication', "Failed login attempt for email: {$email}");
            ResponseHelper::error($e->getMessage(), 401);
        }
    }

    public function logout(): void {
        // Resolve identity from the Bearer token
        $authUser = AuthMiddleware::authenticate();
        $this->authService->logout($authUser['user_id'] ?? null, $authUser['full_name'] ?? null);
        ResponseHelper::success(null, 'Logout successful');
    }

    public function listUsers(): void {
        $authUser = AuthMiddleware::authenticate();
        RBACMiddleware::checkRole($authUser, ['Administrator']);

        $users = $this->userModel->getAllUsers();
        ResponseHelper::success($users, 'User accounts retrieved successfully');
    }

    public function createUser(): void {
        $authUser = AuthMiddleware::authenticate();
        RBACMiddleware::checkRole($authUser, ['Administrator']);

        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        $fullName = trim($input['full_name'] ?? '');
        $email = trim(strtolower($input['email'] ?? ''));
        $roleId = (int)($input['role_id'] ?? 0);

        if (empty($fullName) || empty($email) || empty($roleId)) {
            ResponseHelper::error('Full Name, Email, and Role are required.', 400);
            return;
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            ResponseHelper::error('Invalid email address format.', 400);
            return;
        }

        // Validate role ID against allowed roles (1 to 4)
        if ($roleId < 1 || $roleId > 4) {
            ResponseHelper::error('Invalid role selected.', 400);
            return;
        }

        // Check if email already exists
        $existing = $this->userModel->findByEmail($email);
        if ($existing) {
            ResponseHelper::error('A user with this email address already exists.', 400);
            return;
        }

        $supabaseUid = null;
        if (!empty($input['supabase_uid'])) {
            $candidateUid = trim((string)$input['supabase_uid']);
            if (preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i', $candidateUid)) {
                $supabaseUid = $candidateUid;
            }
        }

        try {
            $userId = $this->userModel->createUser([
                'full_name'    => $fullName,
                'email'        => $email,
                'role_id'      => $roleId,
                'supabase_uid' => $supabaseUid,
                'is_active'    => isset($input['is_active']) ? (bool)$input['is_active'] : true
            ]);

            AuditLogger::log(
                'CREATE_USER',
                'User Management',
                "Created user account #{$userId} ({$fullName}, {$email}) with role_id {$roleId}",
                $authUser['user_id'],
                $authUser['full_name']
            );

            $createdUser = $this->userModel->getById($userId);
            ResponseHelper::success($createdUser, 'User account created successfully', 201);
        } catch (\InvalidArgumentException $e) {
            ResponseHelper::error($e->getMessage(), 400);
        } catch (\Throwable $e) {
            error_log('[PDS AuthController] Create user failed: ' . $e->getMessage());
            ResponseHelper::error('Failed to create user account.', 400);
        }
    }

    public function updateUser(int $id): void {
        $authUser = AuthMiddleware::authenticate();
        RBACMiddleware::checkRole($authUser, ['Administrator']);

        $user = $this->userModel->getById($id);
        if (!$user) {
            ResponseHelper::error('User not found.', 404);
            return;
        }

        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        $cleanData = [];

        if (isset($input['full_name']) && trim((string)$input['full_name']) !== '') {
            $cleanData['full_name'] = trim((string)$input['full_name']);
        }

        if (isset($input['email']) && trim((string)$input['email']) !== '') {
            $newEmail = trim(strtolower((string)$input['email']));
            if (!filter_var($newEmail, FILTER_VALIDATE_EMAIL)) {
                ResponseHelper::error('Invalid email address format.', 400);
                return;
            }
            if ($newEmail !== strtolower($user['email'])) {
                $existing = $this->userModel->findByEmail($newEmail);
                if ($existing && (int)$existing['id'] !== $id) {
                    ResponseHelper::error('A user with this email address already exists.', 400);
                    return;
                }
            }
            $cleanData['email'] = $newEmail;
        }

        if (isset($input['role_id'])) {
            $newRoleId = (int)$input['role_id'];
            if ($newRoleId < 1 || $newRoleId > 4) {
                ResponseHelper::error('Invalid role selected.', 400);
                return;
            }
            // Prevent self-demotion / self-role change
            if ($id === (int)$authUser['user_id'] && $newRoleId !== (int)$authUser['role_id']) {
                ResponseHelper::error('Cannot modify your own administrator role.', 400);
                return;
            }
            $cleanData['role_id'] = $newRoleId;
        }

        if (isset($input['is_active'])) {
            $newActive = (bool)$input['is_active'];
            // Prevent self-deactivation
            if ($id === (int)$authUser['user_id'] && !$newActive) {
                ResponseHelper::error('Cannot deactivate your own administrator account.', 400);
                return;
            }
            $cleanData['is_active'] = $newActive;
        }

        if (empty($cleanData)) {
            ResponseHelper::error('No valid update fields provided.', 400);
            return;
        }

        try {
            $this->userModel->updateUser($id, $cleanData);

            AuditLogger::log(
                'UPDATE_USER',
                'User Management',
                "Updated user profile for ID #{$id} ({$user['full_name']})",
                $authUser['user_id'],
                $authUser['full_name']
            );

            $updatedUser = $this->userModel->getById($id);
            ResponseHelper::success($updatedUser, 'User account updated successfully');
        } catch (\Throwable $e) {
            error_log('[PDS AuthController] Update user failed: ' . $e->getMessage());
            ResponseHelper::error('Failed to update user account.', 400);
        }
    }

    public function toggleUserStatus(int $id): void {
        $authUser = AuthMiddleware::authenticate();
        RBACMiddleware::checkRole($authUser, ['Administrator']);

        // Prevent self-deactivation
        if ($id === 1 || $id === (int)$authUser['user_id']) {
            ResponseHelper::error('Cannot deactivate your own administrator account.', 400);
            return;
        }

        $user = $this->userModel->getById($id);
        if (!$user) {
            ResponseHelper::error('User not found.', 404);
            return;
        }

        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        $newStatus = isset($input['is_active']) ? (bool)$input['is_active'] : !($user['is_active']);

        $this->userModel->toggleStatus($id, $newStatus);

        $actionText = $newStatus ? 'Activated' : 'Deactivated';
        AuditLogger::log(
            'TOGGLE_USER_STATUS',
            'User Management',
            "{$actionText} user account #{$id} ({$user['full_name']})",
            $authUser['user_id'],
            $authUser['full_name']
        );

        ResponseHelper::success(['is_active' => $newStatus], "User account {$actionText} successfully");
    }
}

