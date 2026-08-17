<?php
require_once __DIR__ . '/../controllers/ProceedingsController.php';

function handleProceedingsRoutes(string $method, string $action): void {
    $controller = new ProceedingsController();

    switch ($action) {
        case 'hearings':
            if ($method === 'GET') $controller->hearings();
            elseif ($method === 'POST') $controller->scheduleHearing();
            break;
        case 'sanctions':
            if ($method === 'GET') $controller->sanctions();
            elseif ($method === 'POST') $controller->createSanction();
            break;
        case 'clearance':
            if ($method === 'GET') $controller->clearance();
            elseif ($method === 'POST') $controller->toggleClearance();
            break;
        case 'reformation':
            if ($method === 'GET') $controller->reformation();
            elseif ($method === 'POST') $controller->assignReformation();
            break;
        case 'points':
            if ($method === 'GET') $controller->pointsHistory();
            break;
        default:
            ResponseHelper::error('Invalid proceedings endpoint', 404);
    }
}
