<?php
require_once __DIR__ . '/../controllers/ProceedingsController.php';

function handleProceedingsRoutes(string $method, string $action, ?int $id = null): void {
    $controller = new ProceedingsController();

    switch ($action) {
        case 'hearings':
            if ($method === 'GET') {
                $controller->hearings();
            } elseif ($method === 'POST') {
                if ($id) {
                    $controller->updateHearing($id);
                } else {
                    $controller->scheduleHearing();
                }
            } elseif ($method === 'PUT' && $id) {
                $controller->updateHearing($id);
            }
            break;
        case 'sanctions':
            if ($method === 'GET') {
                $controller->sanctions();
            } elseif ($method === 'POST') {
                if ($id) {
                    $controller->updateSanction($id);
                } else {
                    $controller->createSanction();
                }
            } elseif ($method === 'PUT' && $id) {
                $controller->updateSanction($id);
            }
            break;
        case 'clearance':
            if ($method === 'GET') {
                $controller->clearance();
            } elseif ($method === 'POST') {
                $controller->toggleClearance();
            }
            break;
        case 'reformation':
            if ($method === 'GET') {
                $controller->reformation();
            } elseif ($method === 'POST') {
                if ($id) {
                    $controller->updateReformation($id);
                } else {
                    $controller->assignReformation();
                }
            } elseif ($method === 'PUT' && $id) {
                $controller->updateReformation($id);
            }
            break;
        case 'points':
            if ($method === 'GET') {
                $controller->pointsHistory();
            } elseif ($method === 'POST') {
                $controller->addPoints();
            }
            break;
        default:
            ResponseHelper::error('Invalid proceedings endpoint', 404);
    }
}
