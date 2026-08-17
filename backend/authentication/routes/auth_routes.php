<?php
require_once __DIR__ . '/../controllers/AuthController.php';

function handleAuthRoutes(string $method, string $action): void {
    $controller = new AuthController();

    if ($method === 'POST' && $action === 'login') {
        $controller->login();
    } elseif ($method === 'POST' && $action === 'logout') {
        $controller->logout();
    } else {
        ResponseHelper::error('Invalid authentication endpoint', 404);
    }
}
