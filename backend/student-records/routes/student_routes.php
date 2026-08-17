<?php
require_once __DIR__ . '/../controllers/StudentController.php';

function handleStudentRoutes(string $method, string $action, ?int $id = null): void {
    $controller = new StudentController();

    if ($method === 'GET' && ($action === 'list' || empty($action))) {
        if ($id) {
            $controller->show($id);
        } else {
            $controller->index();
        }
    } elseif ($method === 'POST' && ($action === 'create' || empty($action))) {
        $controller->store();
    } else {
        ResponseHelper::error('Invalid student records endpoint', 404);
    }
}
