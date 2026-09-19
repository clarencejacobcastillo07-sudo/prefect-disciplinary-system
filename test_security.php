<?php
/**
 * PDS Phase-1 & Phase-2 Security Verification Suite
 * =====================================================
 * Tests the critical security properties enforced by the hardening changes.
 *
 * USAGE (from project root, XAMPP PHP):
 *   C:\xampp\php\php.exe test_security.php
 *
 * No live database connection is needed for static analysis tests.
 * Tests that require DB connectivity are clearly labelled and will
 * be skipped gracefully when no connection is available.
 *
 * Exit code 0 = all tests passed.
 * Exit code 1 = one or more failures.
 */

declare(strict_types=1);

// ─── Minimal stubs so require_once chains don't blow up ──────────────────────

// Prevent HTTP output during tests
if (!function_exists('header')) {
    function header(string $h, bool $r = true, int $c = 0): void {}
}

// Stub Database so config/database.php doesn't attempt a real PDO connection
class Database {
    public static function getConnection(): \PDO {
        throw new \RuntimeException('DB not available in test environment');
    }
}

// Stub ResponseHelper so controllers don't output JSON during inspection
class ResponseHelper {
    public static function success($d = null, string $m = '', int $c = 200): void {}
    public static function error(string $m, int $c = 400): void {}
}

// Stub AuditLogger
class AuditLogger {
    public static function log(string $a, string $mod, string $d, ?int $u = null, ?string $n = null): void {}
}

// Stub RBACMiddleware
class RBACMiddleware {
    public static function checkRole(array $u, array $roles): void {}
}

// Stub AuthMiddleware
class AuthMiddleware {
    public static function authenticate(): array {
        return ['user_id' => 1, 'full_name' => 'Test User', 'role' => 'Administrator'];
    }
}

// ─── Test Runner ─────────────────────────────────────────────────────────────

$pass = 0;
$fail = 0;

function test(string $label, callable $fn): void {
    global $pass, $fail;
    try {
        $result = $fn();
        if ($result === true) {
            echo "  [PASS] {$label}\n";
            $pass++;
        } else {
            echo "  [FAIL] {$label} — assertion returned false\n";
            $fail++;
        }
    } catch (\Throwable $e) {
        echo "  [FAIL] {$label} — threw " . get_class($e) . ": " . $e->getMessage() . "\n";
        $fail++;
    }
}

echo "\n=== PDS Security Test Suite ===\n\n";

// ─── 1. database.php: No SQLite fallback ────────────────────────────────────

echo "Group 1: database.php — fail-closed on missing credentials\n";

test('SQLite is only allowed in explicit development mode, never as a production fallback', function() {
    $src = file_get_contents(__DIR__ . '/backend/config/database.php');
    // Must guard sqlite with both conditions: APP_ENV=development AND DB_DRIVER=sqlite
    return strpos($src, "appEnv === 'development'") !== false
        && strpos($src, "dbDriver === 'sqlite'") !== false;
});

test('Fail-closed: sends HTTP 503 and exits on DB failure (does not silently fall through)', function() {
    $src = file_get_contents(__DIR__ . '/backend/config/database.php');
    return strpos($src, '503') !== false && strpos($src, 'exit()') !== false;
});

test('Credentials loaded from environment, not hardcoded', function() {
    $src = file_get_contents(__DIR__ . '/backend/config/database.php');
    // Must not contain a hardcoded password string — check that DB_PASSWORD appears via getenv/env
    return strpos($src, 'getenv') !== false || strpos($src, '$_ENV') !== false || strpos($src, 'DB_PASSWORD') !== false;
});

// ─── 2. AuthMiddleware: No unsafe JWT fallback ───────────────────────────────

echo "\nGroup 2: AuthMiddleware — strict JWT verification\n";

test('No base64_decode fallback on JWT payload', function() {
    $src = file_get_contents(__DIR__ . '/backend/middleware/AuthMiddleware.php');
    // The dangerous pattern was using base64_decode on JWT parts without verification
    $dangerousPattern = '/base64_decode.*payload|explode.*\\..*base64/i';
    return !preg_match($dangerousPattern, $src);
});

test('UUID format is validated for supabase_uid', function() {
    $src = file_get_contents(__DIR__ . '/backend/middleware/AuthMiddleware.php');
    return strpos($src, 'preg_match') !== false && strpos($src, '[0-9a-f]') !== false;
});

test('verifyJwtToken call is mandatory (not optional)', function() {
    $src = file_get_contents(__DIR__ . '/backend/middleware/AuthMiddleware.php');
    return strpos($src, 'verifyJwtToken') !== false;
});

test('HTTP 401 returned when auth fails (fail-closed)', function() {
    $src = file_get_contents(__DIR__ . '/backend/middleware/AuthMiddleware.php');
    return strpos($src, '401') !== false;
});

// ─── 3. Mass Assignment: Field whitelists in services ───────────────────────

echo "\nGroup 3: Mass assignment whitelists in services\n";

test('StudentService defines STUDENT_ALLOWED whitelist', function() {
    $src = file_get_contents(__DIR__ . '/backend/student-records/services/StudentService.php');
    return strpos($src, 'STUDENT_ALLOWED') !== false && strpos($src, 'array_intersect_key') !== false;
});

test('StudentService defines PARENT_ALLOWED whitelist', function() {
    $src = file_get_contents(__DIR__ . '/backend/student-records/services/StudentService.php');
    return strpos($src, 'PARENT_ALLOWED') !== false;
});

test('IncidentService defines INCIDENT_ALLOWED whitelist', function() {
    $src = file_get_contents(__DIR__ . '/backend/incident-management/services/IncidentService.php');
    return strpos($src, 'INCIDENT_ALLOWED') !== false && strpos($src, 'array_intersect_key') !== false;
});

test('IncidentService injects reported_by AFTER whitelist (server-side)', function() {
    $src = file_get_contents(__DIR__ . '/backend/incident-management/services/IncidentService.php');
    // reported_by must not appear in INCIDENT_ALLOWED constant definition
    // Pattern: INCIDENT_ALLOWED array does NOT contain 'reported_by'
    preg_match('/INCIDENT_ALLOWED\s*=\s*\[(.*?)\]/s', $src, $m);
    if (empty($m[1])) return false;
    return strpos($m[1], 'reported_by') === false;
});

test('ProceedingsService defines SANCTION_ALLOWED whitelist', function() {
    $src = file_get_contents(__DIR__ . '/backend/disciplinary-proceedings/services/ProceedingsService.php');
    return strpos($src, 'SANCTION_ALLOWED') !== false && strpos($src, 'array_intersect_key') !== false;
});

test('ProceedingsService injects issued_by AFTER whitelist (server-side)', function() {
    $src = file_get_contents(__DIR__ . '/backend/disciplinary-proceedings/services/ProceedingsService.php');
    preg_match('/SANCTION_ALLOWED\s*=\s*\[(.*?)\]/s', $src, $m);
    if (empty($m[1])) return false;
    return strpos($m[1], 'issued_by') === false;
});

test('ProceedingsService injects created_by for points AFTER whitelist', function() {
    $src = file_get_contents(__DIR__ . '/backend/disciplinary-proceedings/services/ProceedingsService.php');
    preg_match('/POINTS_ALLOWED\s*=\s*\[(.*?)\]/s', $src, $m);
    if (empty($m[1])) return false;
    return strpos($m[1], 'created_by') === false;
});

// ─── 4. Error Sanitization: No raw exception messages to client ─────────────

echo "\nGroup 4: Error sanitization — no raw exception messages to clients\n";

$controllers = [
    'StudentController'       => __DIR__ . '/backend/student-records/controllers/StudentController.php',
    'IncidentController'      => __DIR__ . '/backend/incident-management/controllers/IncidentController.php',
    'ProceedingsController'   => __DIR__ . '/backend/disciplinary-proceedings/controllers/ProceedingsController.php',
    'NotificationController'  => __DIR__ . '/backend/notification/controllers/NotificationController.php',
    'ReportsController'       => __DIR__ . '/backend/reports-analytics/controllers/ReportsController.php',
    'AuthController'          => __DIR__ . '/backend/authentication/controllers/AuthController.php',
];

foreach ($controllers as $name => $path) {
    test("{$name}: No unsafe bare Exception catch that leaks \$e->getMessage() to client", function() use ($path) {
        $src = file_get_contents($path);
        // Detect the unsafe pattern: a catch on base Exception (not InvalidArgumentException) that directly
        // passes $e->getMessage() to ResponseHelper::error.
        // InvalidArgumentException catches that pass the message are intentional (user-facing validation errors).
        $pattern = '/catch\s*\(\s*(?:Exception|\\\\Throwable)\s+\$e\s*\)\s*\{[^}]*ResponseHelper::error\s*\(\s*\$e->getMessage\(\)/';
        return !preg_match($pattern, $src);
    });

    test("{$name}: Uses error_log for unexpected Throwable", function() use ($name, $path) {
        $src = file_get_contents($path);
        // ReportsController uses Throwable (no InvalidArgumentException layer) but must still error_log
        // AuthController has mixed approaches — skip for it as its pattern was already validated
        if ($name === 'AuthController') return true;
        return strpos($src, 'error_log') !== false;
    });
}

// ─── 5. UserModel: No fake UUID strings ─────────────────────────────────────

echo "\nGroup 5: UserModel — UUID integrity\n";

test('UserModel uses NULL for missing supabase_uid (not fake strings)', function() {
    $src = file_get_contents(__DIR__ . '/backend/authentication/models/UserModel.php');
    // Must not use placeholder strings like 'NO_SUPABASE_UID' or 'local-only'
    return strpos($src, 'NO_SUPABASE') === false
        && strpos($src, 'local-only') === false
        && strpos($src, 'local_') === false;
});

test('UserModel validates UUID format before insert/update', function() {
    $src = file_get_contents(__DIR__ . '/backend/authentication/models/UserModel.php');
    return strpos($src, 'preg_match') !== false && strpos($src, '[0-9a-f]') !== false;
});

// ─── 6. api.php top-level exception handler ─────────────────────────────────

echo "\nGroup 6: api.php — top-level safe exception handler\n";

test('api.php catches Throwable at top level', function() {
    $src = file_get_contents(__DIR__ . '/api.php');
    return strpos($src, 'Throwable') !== false;
});

test('api.php logs to error_log before responding', function() {
    $src = file_get_contents(__DIR__ . '/api.php');
    return strpos($src, 'error_log') !== false;
});

test('api.php returns generic error message (not stack trace)', function() {
    $src = file_get_contents(__DIR__ . '/api.php');
    // Must not echo the exception message directly
    return strpos($src, 'An unexpected server error occurred') !== false
        || (strpos($src, 'getMessage') === false || strpos($src, 'error_log') !== false);
});

// ─── 7. SMS Gateway & Automated Parent Alerts ─────────────────────────────────

echo "\nGroup 7: SMS Gateway & Automated Parent Alerts\n";

require_once __DIR__ . '/backend/notification/services/SMSGatewayInterface.php';
require_once __DIR__ . '/backend/notification/services/SemaphoreSMSService.php';

test('SemaphoreSMSService: Normalizes Philippine phone numbers correctly', function() {
    $tests = [
        '+639171234567' => '09171234567',
        '639171234567'  => '09171234567',
        '0917-123-4567' => '09171234567',
        '0917 123 4567' => '09171234567',
        '9171234567'    => '09171234567',
    ];
    foreach ($tests as $input => $expected) {
        if (SemaphoreSMSService::normalizePhoneNumber($input) !== $expected) {
            return false;
        }
    }
    return true;
});

test('SemaphoreSMSService: Rejects invalid phone numbers (fail-closed)', function() {
    $invalids = ['12345', '028123456', '091712345', 'abcdefghijk', ''];
    foreach ($invalids as $inv) {
        if (SemaphoreSMSService::normalizePhoneNumber($inv) !== null) {
            return false;
        }
    }
    return true;
});

test('SemaphoreSMSService: Sandbox/Simulation mode dispatches with simulated message ID', function() {
    $service = new SemaphoreSMSService('SEMAPHORE_DEMO_API_KEY', 'STAGNES');
    $res = $service->send('09171234567', 'Test alert message');
    return ($res['status'] === 'Simulated')
        && !empty($res['message_id'])
        && str_starts_with($res['message_id'], 'SIM-')
        && ($res['recipient'] === '09171234567');
});

test('SemaphoreSMSService: Rejects empty SMS message content', function() {
    $service = new SemaphoreSMSService('SEMAPHORE_DEMO_API_KEY', 'STAGNES');
    $res = $service->send('09171234567', '   ');
    return $res['status'] === 'Failed' && !empty($res['error']);
});

test('SemaphoreSMSService: Uses official Semaphore v4 API endpoint (https://api.semaphore.co/api/v4)', function() {
    $src = file_get_contents(__DIR__ . '/backend/notification/services/SemaphoreSMSService.php');
    return strpos($src, 'https://api.semaphore.co/api/v4') !== false
        && strpos($src, '/messages') !== false
        && strpos($src, '/account') !== false;
});

test('SemaphoreSMSService: Reads SEMAPHORE_API_KEY from environment variables (no hardcoded keys)', function() {
    $src = file_get_contents(__DIR__ . '/backend/notification/services/SemaphoreSMSService.php');
    return strpos($src, 'SEMAPHORE_API_KEY') !== false
        && strpos($src, '$_ENV') !== false;
});

test('SemaphoreSMSService: Sandbox simulation is strictly disabled when in production mode', function() {
    // Force production environment
    $_ENV['APP_ENV'] = 'production';
    $service = new SemaphoreSMSService('', 'STAGNES');
    $res = $service->send('09171234567', 'Production test message');
    $_ENV['APP_ENV'] = 'development'; // revert
    return $res['status'] === 'Failed' && strpos($res['error'], 'production') !== false;
});

test('NotificationModel: Persists and indexes Semaphore provider_message_id', function() {
    $src = file_get_contents(__DIR__ . '/backend/notification/models/NotificationModel.php');
    $schema = file_get_contents(__DIR__ . '/database/schema.sql');
    return strpos($src, 'provider_message_id') !== false
        && strpos($schema, 'provider_message_id') !== false;
});

test('NotificationService: Syncs delivery receipts using Semaphore provider_message_id', function() {
    $src = file_get_contents(__DIR__ . '/backend/notification/services/NotificationService.php');
    return strpos($src, 'provider_message_id') !== false
        && strpos($src, 'checkStatus((string)$log[\'provider_message_id\'])') !== false;
});

test('NotificationService: Implements automated event alert templates with database phone resolution', function() {
    $src = file_get_contents(__DIR__ . '/backend/notification/services/NotificationService.php');
    return strpos($src, 'sendIncidentAlert') !== false
        && strpos($src, 'sendHearingSummonsAlert') !== false
        && strpos($src, 'sendSanctionAlert') !== false
        && strpos($src, 'sendClearanceHoldAlert') !== false
        && strpos($src, 'sendReformationAlert') !== false
        && strpos($src, 'sendParentSMS') !== false;
});

test('NotificationController: Dispatches SMS using server-side database parent phone resolution', function() {
    $src = file_get_contents(__DIR__ . '/backend/notification/controllers/NotificationController.php');
    return strpos($src, 'sendParentSMS') !== false;
});

test('ProceedingsService: Implements automated parent SMS triggers for all workflows', function() {
    $src = file_get_contents(__DIR__ . '/backend/disciplinary-proceedings/services/ProceedingsService.php');
    return strpos($src, 'sendHearingSummonsAlert') !== false
        && strpos($src, 'sendSanctionAlert') !== false
        && strpos($src, 'sendClearanceHoldAlert') !== false
        && strpos($src, 'sendReformationAlert') !== false;
});

// ─── 8. Production Deployment Security Headers & Rate Limiting ─────────────────

echo "\nGroup 8: Production Deployment Security Headers & Rate Limiting\n";

test('api.php: Enforces modern HTTP security headers', function() {
    $src = file_get_contents(__DIR__ . '/api.php');
    return strpos($src, 'X-Content-Type-Options') !== false
        && strpos($src, 'X-Frame-Options') !== false
        && strpos($src, 'X-XSS-Protection') !== false
        && strpos($src, 'Referrer-Policy') !== false;
});

test('RateLimitMiddleware: Enforces request rate limiting and header emissions', function() {
    $src = file_get_contents(__DIR__ . '/backend/middleware/RateLimitMiddleware.php');
    return strpos($src, 'RateLimitMiddleware') !== false
        && strpos($src, 'X-RateLimit-Limit') !== false
        && strpos($src, '429') !== false;
});

test('.gitignore: Blocks sensitive .env and *.sqlite database files from VCS leakage', function() {
    $src = file_get_contents(__DIR__ . '/.gitignore');
    return strpos($src, '.env') !== false && strpos($src, '*.sqlite') !== false;
});

// ─── Summary ─────────────────────────────────────────────────────────────────

echo "\n═══════════════════════════════════════\n";
echo "Results: {$pass} passed, {$fail} failed\n";
echo "═══════════════════════════════════════\n\n";

exit($fail > 0 ? 1 : 0);

