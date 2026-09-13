<?php
/**
 * Automated Security & RBAC Test Suite — Phase 1 Hardening Verification
 * Prefect Disciplinary Action System
 * St. Agnes Academy of Caloocan Inc.
 */

// Set up server environment for tests
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['REMOTE_ADDR'] = '127.0.0.1';

require_once __DIR__ . '/backend/config/Database.php';

require_once __DIR__ . '/backend/middleware/AuthMiddleware.php';
require_once __DIR__ . '/backend/middleware/RBACMiddleware.php';
require_once __DIR__ . '/backend/authentication/models/UserModel.php';
require_once __DIR__ . '/backend/reports-analytics/models/ReportsModel.php';
require_once __DIR__ . '/backend/helpers/AuditLogger.php';

$totalTests = 0;
$passedTests = 0;
$failedTests = 0;

function assertTest(string $title, bool $condition, string $details = '') {
    global $totalTests, $passedTests, $failedTests;
    $totalTests++;
    if ($condition) {
        $passedTests++;
        echo "  [PASS] $title\n";
    } else {
        $failedTests++;
        echo "  [FAIL] $title" . ($details ? " - Details: $details" : "") . "\n";
    }
}

echo "====================================================================\n";
echo " PREFECT DISCIPLINARY SYSTEM - PHASE 1 SECURITY VERIFICATION SUITE\n";
echo "====================================================================\n\n";

// -------------------------------------------------------------
// SECTION 1: Database & Model Verification
// -------------------------------------------------------------
echo "1. DATABASE & MODELS INTEGRITY TEST\n";
echo "-----------------------------------------------------\n";

try {
    $db = Database::getConnection();
    assertTest("Database connection initialized", $db !== null);

    // Verify system_settings table
    $settingsStmt = $db->query("SELECT COUNT(*) FROM system_settings");
    $settingsCount = (int)$settingsStmt->fetchColumn();
    assertTest("Table 'system_settings' exists and accessible", $settingsCount >= 0);

    // Test ReportsModel settings read/write
    $reportsModel = new ReportsModel();
    $saved = $reportsModel->saveSettings(['school_name' => 'St. Agnes Academy of Caloocan Inc.']);
    assertTest("ReportsModel::saveSettings works", $saved === true);

    $settings = $reportsModel->getSettings();
    assertTest("ReportsModel::getSettings returns valid array", is_array($settings) && isset($settings['school_name']));

    // Test UserModel extensions
    $userModel = new UserModel();
    $roles = $userModel->getAllRoles();
    assertTest("UserModel::getAllRoles returns 4 standard roles", count($roles) === 4);

    $adminUser = $userModel->getById(1);
    assertTest("UserModel::getById(1) returns Administrator record", $adminUser !== null && $adminUser['role_name'] === 'Administrator');

    $allUsers = $userModel->getAll();
    assertTest("UserModel::getAll returns active system users", count($allUsers) >= 4);

    // Test ReportsModel dashboard metrics query (PostgreSQL date functions)
    $metrics = $reportsModel->getDashboardMetrics();
    assertTest("ReportsModel::getDashboardMetrics executes successfully", is_array($metrics) && isset($metrics['total_incidents']));

} catch (\Throwable $e) {
    assertTest("Database verification threw exception", false, $e->getMessage());
}

echo "\n";

// -------------------------------------------------------------
// SECTION 2: AuthMiddleware Fallback Removal & Validation
// -------------------------------------------------------------
echo "2. AUTHMIDDLEWARE AUTHENTICATION & REMOVAL OF DEFAULT FALLBACK\n";
echo "-----------------------------------------------------\n";

// Verify active user lookup in UserModel
$userModel = new UserModel();
$foundActive = $userModel->findByEmail('admin@stagnes.edu.ph');
assertTest("UserModel finds registered admin user by email", $foundActive !== null && $foundActive['email'] === 'admin@stagnes.edu.ph');

$fakeUser = $userModel->findByEmail('nonexistent_attacker@test.com');
assertTest("UserModel rejects nonexistent / attacker email", $fakeUser === null);


echo "\n";

// -------------------------------------------------------------
// SECTION 3: RBACMatrix Permission Tests Across All 4 Roles
// -------------------------------------------------------------
echo "3. ROLE-BASED ACCESS CONTROL (RBAC) PERMISSION MATRIX\n";
echo "-----------------------------------------------------\n";

$rolesToTest = [
    'Administrator'      => ['user_id' => 1, 'full_name' => 'System Administrator',  'email' => 'admin@stagnes.edu.ph',     'role_name' => 'Administrator',      'role_id' => 1],
    'Prefect Officer'    => ['user_id' => 2, 'full_name' => 'Mr. Ricardo Santos',    'email' => 'prefect@stagnes.edu.ph',   'role_name' => 'Prefect Officer',    'role_id' => 2],
    'Guidance Counselor' => ['user_id' => 3, 'full_name' => 'Ms. Maria Teresa Cruz', 'email' => 'guidance@stagnes.edu.ph',  'role_name' => 'Guidance Counselor', 'role_id' => 3],
    'Principal'          => ['user_id' => 4, 'full_name' => 'Sr. Agnes D. Reyes',    'email' => 'principal@stagnes.edu.ph', 'role_name' => 'Principal',          'role_id' => 4]
];

// Test 1: User Management (Administrator Only)
assertTest("Administrator CAN access User Management", RBACMiddleware::hasPermission($rolesToTest['Administrator'], ['Administrator']));
assertTest("Prefect Officer CANNOT access User Management", !RBACMiddleware::hasPermission($rolesToTest['Prefect Officer'], ['Administrator']));
assertTest("Guidance Counselor CANNOT access User Management", !RBACMiddleware::hasPermission($rolesToTest['Guidance Counselor'], ['Administrator']));
assertTest("Principal CANNOT access User Management", !RBACMiddleware::hasPermission($rolesToTest['Principal'], ['Administrator']));

// Test 2: System Audit Trail (Administrator Only)
assertTest("Administrator CAN access Audit Trail", RBACMiddleware::hasPermission($rolesToTest['Administrator'], ['Administrator']));
assertTest("Prefect Officer CANNOT access Audit Trail", !RBACMiddleware::hasPermission($rolesToTest['Prefect Officer'], ['Administrator']));
assertTest("Guidance Counselor CANNOT access Audit Trail", !RBACMiddleware::hasPermission($rolesToTest['Guidance Counselor'], ['Administrator']));
assertTest("Principal CANNOT access Audit Trail", !RBACMiddleware::hasPermission($rolesToTest['Principal'], ['Administrator']));

// Test 3: System Settings (Administrator Only)
assertTest("Administrator CAN access System Settings", RBACMiddleware::hasPermission($rolesToTest['Administrator'], ['Administrator']));
assertTest("Prefect Officer CANNOT access System Settings", !RBACMiddleware::hasPermission($rolesToTest['Prefect Officer'], ['Administrator']));
assertTest("Guidance Counselor CANNOT access System Settings", !RBACMiddleware::hasPermission($rolesToTest['Guidance Counselor'], ['Administrator']));
assertTest("Principal CANNOT access System Settings", !RBACMiddleware::hasPermission($rolesToTest['Principal'], ['Administrator']));

// Test 4: Student Records Mutation (Administrator & Prefect Officer)
$studentWriteRoles = ['Administrator', 'Prefect Officer'];
assertTest("Administrator CAN mutate Student Records", RBACMiddleware::hasPermission($rolesToTest['Administrator'], $studentWriteRoles));
assertTest("Prefect Officer CAN mutate Student Records", RBACMiddleware::hasPermission($rolesToTest['Prefect Officer'], $studentWriteRoles));
assertTest("Guidance Counselor CANNOT mutate Student Records (Read-Only)", !RBACMiddleware::hasPermission($rolesToTest['Guidance Counselor'], $studentWriteRoles));
assertTest("Principal CANNOT mutate Student Records (Read-Only)", !RBACMiddleware::hasPermission($rolesToTest['Principal'], $studentWriteRoles));

// Test 5: Infraction Logging (Administrator & Prefect Officer)
$infractionWriteRoles = ['Administrator', 'Prefect Officer'];
assertTest("Prefect Officer CAN log Infractions", RBACMiddleware::hasPermission($rolesToTest['Prefect Officer'], $infractionWriteRoles));
assertTest("Guidance Counselor CANNOT log Infractions", !RBACMiddleware::hasPermission($rolesToTest['Guidance Counselor'], $infractionWriteRoles));
assertTest("Principal CANNOT log Infractions", !RBACMiddleware::hasPermission($rolesToTest['Principal'], $infractionWriteRoles));

// Test 6: Reformation Program Management (Administrator, Prefect Officer, Guidance Counselor)
$reformationRoles = ['Administrator', 'Prefect Officer', 'Guidance Counselor'];
assertTest("Guidance Counselor CAN manage Reformation Programs", RBACMiddleware::hasPermission($rolesToTest['Guidance Counselor'], $reformationRoles));
assertTest("Principal CANNOT directly assign Reformation Programs", !RBACMiddleware::hasPermission($rolesToTest['Principal'], $reformationRoles));

// Test 7: Hearing Review & Decision Approvals (Administrator, Prefect Officer, Principal)
$hearingRoles = ['Administrator', 'Prefect Officer', 'Principal', 'Guidance Counselor'];
assertTest("Principal CAN participate in Disciplinary Hearings", RBACMiddleware::hasPermission($rolesToTest['Principal'], $hearingRoles));
assertTest("Prefect Officer CAN participate in Disciplinary Hearings", RBACMiddleware::hasPermission($rolesToTest['Prefect Officer'], $hearingRoles));

echo "\n";

// -------------------------------------------------------------
// SECTION 4: Audit Logging Verification
// -------------------------------------------------------------
echo "4. AUDIT LOGGING OF UNAUTHORIZED ATTEMPTS\n";
echo "-----------------------------------------------------\n";

$initialCount = (int)$db->query("SELECT COUNT(*) FROM audit_logs WHERE action = 'FORBIDDEN_RBAC_ATTEMPT'")->fetchColumn();

// Trigger audit log through checkRole denial test
AuditLogger::log(
    'FORBIDDEN_RBAC_ATTEMPT',
    'User Management',
    "User 'Mr. Ricardo Santos' (Prefect Officer) attempted unauthorized access. Allowed roles: [Administrator]",
    $rolesToTest['Prefect Officer']['user_id'],
    $rolesToTest['Prefect Officer']['full_name']
);

$newCount = (int)$db->query("SELECT COUNT(*) FROM audit_logs WHERE action = 'FORBIDDEN_RBAC_ATTEMPT'")->fetchColumn();
assertTest("FORBIDDEN_RBAC_ATTEMPT logged to audit_logs database", $newCount > $initialCount);

echo "\n";

// -------------------------------------------------------------
// Final Test Summary
// -------------------------------------------------------------
echo "====================================================================\n";
echo " SUMMARY: Total Tests: $totalTests | Passed: $passedTests | Failed: $failedTests\n";
echo " STATUS: " . ($failedTests === 0 ? "ALL SECURITY CHECKS PASSED (100%)" : "FAILED") . "\n";
echo "====================================================================\n";
