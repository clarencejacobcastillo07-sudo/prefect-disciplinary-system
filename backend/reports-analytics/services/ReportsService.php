<?php
require_once __DIR__ . '/../models/ReportsModel.php';

class ReportsService {
    private ReportsModel $model;

    public function __construct() {
        $this->model = new ReportsModel();
    }

    public function getDashboardMetrics(): array {
        return $this->model->getDashboardMetrics();
    }

    public function generateReport(array $filters): array {
        return $this->model->getFilteredReport($filters);
    }

    public function getAuditLogs(): array {
        return $this->model->getAuditLogs();
    }
}
