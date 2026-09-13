<?php
require_once __DIR__ . '/../services/ProceedingsService.php';
require_once __DIR__ . '/../../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../../middleware/RBACMiddleware.php';
require_once __DIR__ . '/../../helpers/ResponseHelper.php';

class ProceedingsController {
    private ProceedingsService $service;

    public function __construct() {
        $this->service = new ProceedingsService();
    }

    // ─── Hearings ─────────────────────────────────────────────────────────

    public function hearings(): void {
        $user = AuthMiddleware::authenticate();
        RBACMiddleware::checkRole($user, ['Administrator', 'Prefect Officer', 'Guidance Counselor', 'Principal']);

        $filters = [
            'student_id' => $_GET['student_id'] ?? '',
            'status'     => $_GET['status']     ?? '',
        ];
        $hearings = $this->service->getHearings($filters);
        ResponseHelper::success($hearings, 'Hearings retrieved');
    }

    public function scheduleHearing(): void {
        $user  = AuthMiddleware::authenticate();
        RBACMiddleware::checkRole($user, ['Administrator', 'Prefect Officer']);
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        try {
            $id = $this->service->scheduleHearing($input, $user);
            ResponseHelper::success(['id' => $id], 'Hearing scheduled successfully', 201);
        } catch (\InvalidArgumentException $e) {
            ResponseHelper::error($e->getMessage(), 400);
        } catch (\Throwable $e) {
            error_log('[PDS ProceedingsController] ScheduleHearing error: ' . $e->getMessage());
            ResponseHelper::error('Failed to schedule hearing.', 500);
        }
    }

    public function updateHearing(int $id): void {
        $user  = AuthMiddleware::authenticate();
        RBACMiddleware::checkRole($user, ['Administrator', 'Prefect Officer', 'Principal']);
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        try {
            $this->service->updateHearing($id, $input, $user);
            ResponseHelper::success(null, 'Hearing updated successfully');
        } catch (\InvalidArgumentException $e) {
            ResponseHelper::error($e->getMessage(), 400);
        } catch (\Throwable $e) {
            error_log('[PDS ProceedingsController] UpdateHearing error: ' . $e->getMessage());
            ResponseHelper::error('Failed to update hearing.', 500);
        }
    }

    // ─── Sanctions ────────────────────────────────────────────────────────

    public function sanctions(): void {
        $user = AuthMiddleware::authenticate();
        RBACMiddleware::checkRole($user, ['Administrator', 'Prefect Officer', 'Guidance Counselor', 'Principal']);

        $filters = ['student_id' => $_GET['student_id'] ?? ''];
        $sanctions = $this->service->getSanctions($filters);
        ResponseHelper::success($sanctions, 'Sanctions retrieved');
    }

    public function createSanction(): void {
        $user  = AuthMiddleware::authenticate();
        RBACMiddleware::checkRole($user, ['Administrator', 'Prefect Officer', 'Principal']);
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        try {
            $id = $this->service->createSanction($input, $user);
            ResponseHelper::success(['id' => $id], 'Sanction issued successfully', 201);
        } catch (\InvalidArgumentException $e) {
            ResponseHelper::error($e->getMessage(), 400);
        } catch (\Throwable $e) {
            error_log('[PDS ProceedingsController] CreateSanction error: ' . $e->getMessage());
            ResponseHelper::error('Failed to issue sanction.', 500);
        }
    }

    public function updateSanction(int $id): void {
        $user  = AuthMiddleware::authenticate();
        RBACMiddleware::checkRole($user, ['Administrator', 'Prefect Officer', 'Principal']);
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        try {
            $this->service->updateSanction($id, $input, $user);
            ResponseHelper::success(null, 'Sanction updated successfully');
        } catch (\InvalidArgumentException $e) {
            ResponseHelper::error($e->getMessage(), 400);
        } catch (\Throwable $e) {
            error_log('[PDS ProceedingsController] UpdateSanction error: ' . $e->getMessage());
            ResponseHelper::error('Failed to update sanction.', 500);
        }
    }

    // ─── Clearance Holds ──────────────────────────────────────────────────

    public function clearance(): void {
        $user = AuthMiddleware::authenticate();
        RBACMiddleware::checkRole($user, ['Administrator', 'Prefect Officer', 'Guidance Counselor', 'Principal']);

        $filters = ['is_active' => $_GET['is_active'] ?? ''];
        $holds   = $this->service->getClearanceHolds($filters);
        ResponseHelper::success($holds, 'Clearance holds retrieved');
    }

    public function toggleClearance(): void {
        $user  = AuthMiddleware::authenticate();
        RBACMiddleware::checkRole($user, ['Administrator', 'Prefect Officer']);
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        try {
            $this->service->setClearanceHold($input, $user);
            ResponseHelper::success(null, 'Clearance status updated successfully');
        } catch (\InvalidArgumentException $e) {
            ResponseHelper::error($e->getMessage(), 400);
        } catch (\Throwable $e) {
            error_log('[PDS ProceedingsController] ToggleClearance error: ' . $e->getMessage());
            ResponseHelper::error('Failed to update clearance status.', 500);
        }
    }

    // ─── Reformation Programs ─────────────────────────────────────────────

    public function reformation(): void {
        $user = AuthMiddleware::authenticate();
        RBACMiddleware::checkRole($user, ['Administrator', 'Prefect Officer', 'Guidance Counselor', 'Principal']);

        $filters  = ['student_id' => $_GET['student_id'] ?? ''];
        $programs = $this->service->getReformationPrograms($filters);
        ResponseHelper::success($programs, 'Reformation programs retrieved');
    }

    public function assignReformation(): void {
        $user  = AuthMiddleware::authenticate();
        RBACMiddleware::checkRole($user, ['Administrator', 'Prefect Officer', 'Guidance Counselor']);
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        try {
            $id = $this->service->assignReformation($input, $user);
            ResponseHelper::success(['id' => $id], 'Reformation program assigned', 201);
        } catch (\InvalidArgumentException $e) {
            ResponseHelper::error($e->getMessage(), 400);
        } catch (\Throwable $e) {
            error_log('[PDS ProceedingsController] AssignReformation error: ' . $e->getMessage());
            ResponseHelper::error('Failed to assign reformation program.', 500);
        }
    }

    public function updateReformation(int $id): void {
        $user  = AuthMiddleware::authenticate();
        RBACMiddleware::checkRole($user, ['Administrator', 'Prefect Officer', 'Guidance Counselor']);
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        try {
            $this->service->updateReformation($id, $input, $user);
            ResponseHelper::success(null, 'Reformation program updated');
        } catch (\InvalidArgumentException $e) {
            ResponseHelper::error($e->getMessage(), 400);
        } catch (\Throwable $e) {
            error_log('[PDS ProceedingsController] UpdateReformation error: ' . $e->getMessage());
            ResponseHelper::error('Failed to update reformation program.', 500);
        }
    }

    // ─── Behavior Points ──────────────────────────────────────────────────

    public function pointsHistory(): void {
        $user = AuthMiddleware::authenticate();
        RBACMiddleware::checkRole($user, ['Administrator', 'Prefect Officer', 'Guidance Counselor', 'Principal']);

        $history = $this->service->getPointsHistory();
        ResponseHelper::success($history, 'Behavior points ledger retrieved');
    }

    public function addPoints(): void {
        $user  = AuthMiddleware::authenticate();
        RBACMiddleware::checkRole($user, ['Administrator', 'Prefect Officer', 'Guidance Counselor']);
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        try {
            $id = $this->service->addPoints($input, $user);
            ResponseHelper::success(['id' => $id], 'Conduct points updated successfully', 201);
        } catch (\InvalidArgumentException $e) {
            ResponseHelper::error($e->getMessage(), 400);
        } catch (\Throwable $e) {
            error_log('[PDS ProceedingsController] AddPoints error: ' . $e->getMessage());
            ResponseHelper::error('Failed to update conduct points.', 500);
        }
    }
}
