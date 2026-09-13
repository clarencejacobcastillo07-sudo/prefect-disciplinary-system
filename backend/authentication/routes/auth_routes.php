<?php
require_once __DIR__ . '/../controllers/AuthController.php';

function handleAuthRoutes(string $method, string $action, ?int $id = null): void {
    $controller = new AuthController();

    if ($method === 'POST' && $action === 'login') {
        $controller->login();
    } elseif ($method === 'POST' && $action === 'logout') {
        $controller->logout();
    } elseif ($action === 'users' && $method === 'GET') {
        $controller->listUsers();
    } elseif ($action === 'users' && $method === 'POST') {
        if ($id) {
            $controller->updateUser($id);
        } else {
            $controller->createUser();
        }
    } elseif (($action === 'update-user' || $action === 'update') && ($method === 'POST' || $method === 'PUT') && $id) {
        $controller->updateUser($id);
    } elseif (($action === 'toggle-user' || $action === 'toggle-status') && ($method === 'POST' || $method === 'PUT') && $id) {
        $controller->toggleUserStatus($id);
    } else {
        ResponseHelper::error('Invalid authentication or user management endpoint', 404);
    }
}

