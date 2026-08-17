<?php
require_once __DIR__ . '/../services/AuthService.php';
require_once __DIR__ . '/../../helpers/ResponseHelper.php';
require_once __DIR__ . '/../../middleware/AuthMiddleware.php';

class AuthController {
    private AuthService $authService;

    public function __construct() {
        $this->authService = new AuthService();
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
            ResponseHelper::error($e->getMessage(), 401);
        }
    }

    public function logout(): void {
        // Resolve identity from the Bearer token — do NOT read from $_SESSION
        $authUser = AuthMiddleware::authenticate();
        $this->authService->logout($authUser['user_id'] ?? null, $authUser['full_name'] ?? null);
        ResponseHelper::success(null, 'Logout successful');
    }
}
