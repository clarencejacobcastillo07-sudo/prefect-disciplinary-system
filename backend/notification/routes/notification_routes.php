<?php
require_once __DIR__ . '/../controllers/NotificationController.php';

function handleNotificationRoutes(string $method, string $action): void {
    $controller = new NotificationController();

    if ($action === 'logs' && $method === 'GET') {
        $controller->logs();
    } elseif (($action === 'send' || empty($action)) && $method === 'POST') {
        $controller->send();
    } else {
        ResponseHelper::error('Invalid notification endpoint', 404);
    }
}
