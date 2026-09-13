<?php
require_once __DIR__ . '/../controllers/ReportsController.php';

function handleReportsRoutes(string $method, string $action): void {
    $controller = new ReportsController();

    if ($action === 'dashboard' && $method === 'GET') {
        $controller->dashboard();
    } elseif ($action === 'generate' && $method === 'GET') {
        $controller->generate();
    } elseif ($action === 'audit' && $method === 'GET') {
        $controller->audit();
    } elseif ($action === 'settings' && $method === 'GET') {
        $controller->getSettings();
    } elseif ($action === 'settings' && ($method === 'POST' || $method === 'PUT')) {
        $controller->saveSettings();
    } else {
        ResponseHelper::error('Invalid reports endpoint', 404);
    }
}

