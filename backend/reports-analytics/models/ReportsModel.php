<?php
require_once __DIR__ . '/../../config/database.php';

class ReportsModel {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    public function getDashboardMetrics(): array {
        $totalStudents = (int)$this->db->query("SELECT COUNT(*) FROM students")->fetchColumn();
        $totalIncidents = (int)$this->db->query("SELECT COUNT(*) FROM incident_reports")->fetchColumn();
        $activeClearanceHolds = (int)$this->db->query("SELECT COUNT(*) FROM clearance_holds WHERE is_active = TRUE")->fetchColumn();
        $pendingHearings = (int)$this->db->query("SELECT COUNT(*) FROM hearings WHERE status = 'Scheduled'")->fetchColumn();
        $activeReformations = (int)$this->db->query("SELECT COUNT(*) FROM reformation_programs WHERE status = 'In Progress'")->fetchColumn();

        // High risk students (< 75 points)
        $atRiskCount = (int)$this->db->query("SELECT COUNT(*) FROM students WHERE conduct_points < 75")->fetchColumn();

        // Violation Category Breakdown
        $categoryBreakdown = $this->db->query("
            SELECT v.category, COUNT(i.id) as count 
            FROM violations v 
            LEFT JOIN incident_reports i ON v.id = i.violation_id 
            GROUP BY v.category
        ")->fetchAll();

        // Monthly Incident Trends (PostgreSQL & SQLite Compatible)
        $driver = strtolower((string)$this->db->getAttribute(PDO::ATTR_DRIVER_NAME));
        if ($driver === 'pgsql') {
            $monthlyTrends = $this->db->query("
                SELECT 
                    TO_CHAR(incident_date, 'Mon') as month_name,
                    COUNT(*) as incident_count
                FROM incident_reports 
                GROUP BY TO_CHAR(incident_date, 'Mon'), EXTRACT(MONTH FROM incident_date)
                ORDER BY EXTRACT(MONTH FROM incident_date) ASC
            ")->fetchAll();
        } else {
            // SQLite Fallback
            $monthlyTrends = $this->db->query("
                SELECT 
                    CASE 
                        WHEN strftime('%m', incident_date) = '01' THEN 'Jan'
                        WHEN strftime('%m', incident_date) = '02' THEN 'Feb'
                        WHEN strftime('%m', incident_date) = '03' THEN 'Mar'
                        WHEN strftime('%m', incident_date) = '04' THEN 'Apr'
                        WHEN strftime('%m', incident_date) = '05' THEN 'May'
                        WHEN strftime('%m', incident_date) = '06' THEN 'Jun'
                        WHEN strftime('%m', incident_date) = '07' THEN 'Jul'
                        WHEN strftime('%m', incident_date) = '08' THEN 'Aug'
                        WHEN strftime('%m', incident_date) = '09' THEN 'Sep'
                        WHEN strftime('%m', incident_date) = '10' THEN 'Oct'
                        WHEN strftime('%m', incident_date) = '11' THEN 'Nov'
                        ELSE 'Dec'
                    END as month_name,
                    COUNT(*) as incident_count
                FROM incident_reports 
                GROUP BY strftime('%m', incident_date)
                ORDER BY strftime('%m', incident_date) ASC
            ")->fetchAll();
        }

        // Recent Incidents Feed
        $recentIncidents = $this->db->query("
            SELECT i.incident_number, i.incident_date, i.status, s.first_name, s.last_name, v.title as violation_title, v.category
            FROM incident_reports i
            JOIN students s ON i.student_id = s.id
            JOIN violations v ON i.violation_id = v.id
            ORDER BY i.created_at DESC LIMIT 5
        ")->fetchAll();

        return [
            'total_students' => $totalStudents,
            'total_incidents' => $totalIncidents,
            'active_holds' => $activeClearanceHolds,
            'pending_hearings' => $pendingHearings,
            'active_reformations' => $activeReformations,
            'at_risk_students' => $atRiskCount,
            'category_breakdown' => $categoryBreakdown,
            'monthly_trends' => $monthlyTrends,
            'recent_incidents' => $recentIncidents
        ];
    }

    public function getFilteredReport(array $filters): array {
        $sql = "
            SELECT i.incident_number, i.incident_date, i.location, i.status,
                   s.lrn, s.first_name, s.last_name, s.grade_level, s.section, s.conduct_points,
                   v.code as violation_code, v.title as violation_title, v.category as violation_category, v.demerit_points,
                   u.full_name as reported_by
            FROM incident_reports i
            JOIN students s ON i.student_id = s.id
            JOIN violations v ON i.violation_id = v.id
            JOIN users u ON i.reported_by = u.id
            WHERE 1=1
        ";
        $params = [];

        if (!empty($filters['start_date'])) {
            $sql .= " AND i.incident_date >= :start_date";
            $params[':start_date'] = $filters['start_date'] . ' 00:00:00';
        }
        if (!empty($filters['end_date'])) {
            $sql .= " AND i.incident_date <= :end_date";
            $params[':end_date'] = $filters['end_date'] . ' 23:59:59';
        }
        if (!empty($filters['category'])) {
            $sql .= " AND v.category = :category";
            $params[':category'] = $filters['category'];
        }
        if (!empty($filters['grade_level'])) {
            $sql .= " AND s.grade_level = :grade_level";
            $params[':grade_level'] = $filters['grade_level'];
        }

        $sql .= " ORDER BY i.incident_date DESC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function getAuditLogs(): array {
        $stmt = $this->db->query("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100");
        return $stmt->fetchAll();
    }

    public function getSettings(): array {
        $defaults = [
            'school_name'             => 'St. Agnes Academy of Caloocan Inc.',
            'school_address'          => 'Camarin Road, Barangay 180, Caloocan City',
            'academic_year'           => 'S.Y. 2026 - 2027',
            'semester'                => '1st Semester',
            'conduct_points_baseline' => 100,
            'low_risk_threshold'      => 90,
            'moderate_risk_threshold' => 75,
            'minor_demerit_default'   => 3,
            'major_demerit_default'   => 5,
            'severe_demerit_default'  => 8,
            'semaphore_sender_name'   => 'STAGNES',
            'email_notifications'     => true,
            'sms_notifications'       => true,
            'auto_clearance_flag'     => true,
            'auto_points_deduction'   => true
        ];

        try {
            $stmt = $this->db->query("SELECT setting_key, setting_value FROM system_settings");
            $rows = $stmt->fetchAll();
            foreach ($rows as $row) {
                $k = $row['setting_key'];
                $v = $row['setting_value'];
                if ($v === 'true') $defaults[$k] = true;
                elseif ($v === 'false') $defaults[$k] = false;
                elseif (is_numeric($v)) $defaults[$k] = (int)$v;
                else $defaults[$k] = $v;
            }
        } catch (\Throwable $t) {
            // Table may not exist yet in local development; return defaults
        }

        return $defaults;
    }

    public function saveSettings(array $settings): bool {
        // Disallowed sensitive keys — credentials must remain in server-side .env
        $sensitiveKeys = ['supabase_service_role_key', 'supabase_db_password', 'db_pass', 'db_password', 'service_role_key'];

        $this->ensureSettingsTable();

        $stmt = $this->db->prepare("
            INSERT INTO system_settings (setting_key, setting_value, updated_at) 
            VALUES (:key, :val, CURRENT_TIMESTAMP)
            ON CONFLICT (setting_key) DO UPDATE 
            SET setting_value = EXCLUDED.setting_value, updated_at = CURRENT_TIMESTAMP
        ");

        foreach ($settings as $key => $val) {
            $keyClean = strtolower(trim($key));
            if (in_array($keyClean, $sensitiveKeys, true)) continue;

            $valStr = is_bool($val) ? ($val ? 'true' : 'false') : (string)$val;
            $stmt->execute([':key' => $keyClean, ':val' => $valStr]);
        }

        return true;
    }

    private function ensureSettingsTable(): void {
        try {
            $driver = strtolower((string)$this->db->getAttribute(PDO::ATTR_DRIVER_NAME));
            $sql = $driver === 'pgsql'
                ? "CREATE TABLE IF NOT EXISTS system_settings (setting_key VARCHAR(64) PRIMARY KEY, setting_value TEXT, description VARCHAR(255), updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP)"
                : "CREATE TABLE IF NOT EXISTS system_settings (setting_key VARCHAR(64) PRIMARY KEY, setting_value TEXT, description VARCHAR(255), updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)";
            $this->db->exec($sql);
        } catch (\Throwable $e) {
            // Table already exists or creation ignored
        }
    }
}

