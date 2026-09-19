<?php
require_once __DIR__ . '/../controllers/NotificationController.php';

/**
 * Notification Microservice Router
 */
function handleNotificationRoutes(string $method, string $action): void {
    $controller = new NotificationController();

    if ($action === 'logs' && $method === 'GET') {
        $controller->logs();
    } elseif (($action === 'send' || empty($action)) && $method === 'POST') {
        $controller->send();
    } elseif ($action === 'stats' && $method === 'GET') {
        $controller->stats();
    } elseif ($action === 'sync' && $method === 'POST') {
        $controller->sync();
    } elseif ($action === 'balance' && $method === 'GET') {
        $controller->balance();
    } elseif ($action === 'templates' && $method === 'GET') {
        $controller->templates();
    } else {
        ResponseHelper::error('Invalid notification endpoint or method.', 404);
    }
}
