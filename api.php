<?php
/**
 * Master RESTful API Entrypoint & Router
 * System: Prefect Disciplinary Action System
 * Client: St. Agnes Academy of Caloocan Inc.
 */

// ---------------------------------------------------------------------------
// CORS — Origin whitelist from environment.
// ALLOWED_ORIGINS in .env: comma-separated list of allowed origins.
// Example: http://localhost,https://app.yourdomain.com
// ---------------------------------------------------------------------------
if (!function_exists('loadEnvForCors')) {
    function loadEnvForCors(): void {
        $envFile = __DIR__ . '/.env';
        if (!is_file($envFile)) return;
        foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
            if (str_starts_with(trim($line), '#')) continue;
            if (!str_contains($line, '=')) continue;
            [$key, $val] = explode('=', $line, 2);
            $key = trim($key);
            $val = trim($val);
            if (!isset($_ENV[$key]) && !getenv($key)) {
                $_ENV[$key] = $val;
                putenv("$key=$val");
            }
        }
    }
}
loadEnvForCors();

$allowedOrigins = array_filter(array_map('trim', explode(',', $_ENV['ALLOWED_ORIGINS'] ?? getenv('ALLOWED_ORIGINS') ?: '')));
$requestOrigin  = $_SERVER['HTTP_ORIGIN'] ?? '';

if (!empty($allowedOrigins) && in_array($requestOrigin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $requestOrigin);
    header('Vary: Origin');
} elseif (empty($allowedOrigins)) {
    // ALLOWED_ORIGINS not configured — restrict to same-origin only (no header emitted)
    // Set this variable in .env to enable cross-origin access.
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: false');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit(0);
}


require_once __DIR__ . '/backend/helpers/ResponseHelper.php';
require_once __DIR__ . '/backend/authentication/routes/auth_routes.php';
require_once __DIR__ . '/backend/student-records/routes/student_routes.php';
require_once __DIR__ . '/backend/incident-management/routes/incident_routes.php';
require_once __DIR__ . '/backend/disciplinary-proceedings/routes/proceedings_routes.php';
require_once __DIR__ . '/backend/notification/routes/notification_routes.php';
require_once __DIR__ . '/backend/reports-analytics/routes/reports_routes.php';

$service = $_GET['service'] ?? '';
$action  = $_GET['action'] ?? '';
$id      = isset($_GET['id']) ? (int)$_GET['id'] : null;
$method  = $_SERVER['REQUEST_METHOD'];

try {
    switch ($service) {
        case 'auth':
            handleAuthRoutes($method, $action, $id);
            break;

        case 'students':
            handleStudentRoutes($method, $action, $id);
            break;
        case 'incidents':
            handleIncidentRoutes($method, $action, $id);
            break;
        case 'proceedings':
            handleProceedingsRoutes($method, $action, $id);
            break;
        case 'notifications':
            handleNotificationRoutes($method, $action);
            break;
        case 'reports':
            handleReportsRoutes($method, $action);
            break;
        default:
            ResponseHelper::error('Microservice endpoint not found.', 404);
    }
} catch (\Throwable $e) {
    error_log("[PDS API Exception] " . $e->getMessage() . " in " . $e->getFile() . ":" . $e->getLine());
    ResponseHelper::error('An unexpected server error occurred.', 500);
}
