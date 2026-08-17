<?php
require_once __DIR__ . '/../controllers/IncidentController.php';

function handleIncidentRoutes(string $method, string $action, ?int $id = null): void {
    $controller = new IncidentController();

    if ($action === 'violations') {
        if ($method === 'GET') {
            $controller->violations();
        } elseif ($method === 'POST') {
            $controller->createViolation();
        } else {
            ResponseHelper::error('Method not allowed for violations', 405);
        }
        return;
    }

    if ($method === 'GET') {
        if ($id) {
            $controller->show($id);
        } else {
            $controller->index();
        }
    } elseif ($method === 'POST') {
        $controller->store();
    } else {
        ResponseHelper::error('Invalid incident endpoint', 404);
    }
}
