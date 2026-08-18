<?php
require_once __DIR__ . '/../controllers/StudentController.php';

function handleStudentRoutes(string $method, string $action, ?int $id = null): void {
    $controller = new StudentController();

    if ($method === 'GET') {
        if ($id) {
            $controller->show($id);
        } else {
            $controller->index();
        }
    } elseif ($method === 'POST') {
        if ($action === 'update' && $id) {
            $controller->update($id);
        } elseif ($action === 'delete' && $id) {
            $controller->destroy($id);
        } else {
            $controller->store();
        }
    } elseif ($method === 'PUT') {
        if ($id) {
            $controller->update($id);
        } else {
            ResponseHelper::error('Student ID required for update', 400);
        }
    } elseif ($method === 'DELETE') {
        if ($id) {
            $controller->destroy($id);
        } else {
            ResponseHelper::error('Student ID required for delete', 400);
        }
    } else {
        ResponseHelper::error('Invalid student records endpoint', 404);
    }
}
