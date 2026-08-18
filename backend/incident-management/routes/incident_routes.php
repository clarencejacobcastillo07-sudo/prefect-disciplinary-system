<?php
require_once __DIR__ . '/../controllers/IncidentController.php';

function handleIncidentRoutes(string $method, string $action, ?int $id = null): void {
    $controller = new IncidentController();

    if ($action === 'violations') {
        if ($method === 'GET') {
            if ($id) {
                $controller->showViolation($id);
            } else {
                $controller->violations();
            }
        } elseif ($method === 'POST') {
            if ($id) {
                $controller->updateViolation($id);
            } else {
                $controller->createViolation();
            }
        } elseif ($method === 'PUT' && $id) {
            $controller->updateViolation($id);
        } else {
            ResponseHelper::error('Method not allowed for violations', 405);
        }
        return;
    }

    if ($action === 'toggle-violation' && $id && ($method === 'POST' || $method === 'PUT')) {
        $controller->toggleViolationActive($id);
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
