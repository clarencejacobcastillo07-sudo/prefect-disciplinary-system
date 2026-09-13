<?php
/**
 * Database Configuration & PDO Connection Handler
 * Application Database: Supabase PostgreSQL
 */

class Database {
    private static ?PDO $instance = null;

    private static function loadEnv(): void {
        $envFile = __DIR__ . '/../../.env';
        if (file_exists($envFile)) {
            $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                $line = trim($line);
                if (empty($line) || str_starts_with($line, '#')) continue;
                if (str_contains($line, '=')) {
                    [$key, $val] = explode('=', $line, 2);
                    $key = trim($key);
                    $val = trim($val, " \t\n\r\0\x0B\"'");
                    if (!array_key_exists($key, $_ENV)) {
                        $_ENV[$key] = $val;
                        putenv("{$key}={$val}");
                    }
                }
            }
        }
    }

    public static function getConnection(): PDO {
        if (self::$instance === null) {
            self::loadEnv();

            $appEnv   = strtolower($_ENV['APP_ENV'] ?? getenv('APP_ENV') ?: 'production');
            $dbDriver = strtolower($_ENV['DB_DRIVER'] ?? getenv('DB_DRIVER') ?: 'pgsql');

            // SQLite is ONLY permitted in development mode when explicitly configured
            if ($appEnv === 'development' && $dbDriver === 'sqlite') {
                try {
                    $dbDir = __DIR__ . '/../../database';
                    if (!is_dir($dbDir)) {
                        mkdir($dbDir, 0755, true);
                    }
                    $dbFile = $dbDir . '/database.sqlite';
                    $needsSetup = !file_exists($dbFile) || filesize($dbFile) === 0;

                    $pdo = new PDO("sqlite:{$dbFile}");
                    $pdo->setAttribute(PDO::ATTR_ERRMODE,            PDO::ERRMODE_EXCEPTION);
                    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

                    if ($needsSetup) {
                        self::setupLocalSqliteDatabase($pdo);
                    } else {
                        // Ensure system_settings table exists
                        $pdo->exec("CREATE TABLE IF NOT EXISTS system_settings (
                            setting_key   TEXT PRIMARY KEY,
                            setting_value TEXT,
                            description   TEXT,
                            updated_at    TEXT DEFAULT CURRENT_TIMESTAMP
                        )");
                    }

                    self::$instance = $pdo;
                    return self::$instance;
                } catch (PDOException $e) {
                    error_log("[PDS Database] Local development SQLite connection failed: " . $e->getMessage());
                    http_response_code(503);
                    header('Content-Type: application/json');
                    echo json_encode([
                        'status'  => 'error',
                        'code'    => 503,
                        'message' => 'Development database service unavailable.'
                    ]);
                    exit();
                }
            }

            // Production & Default: Supabase PostgreSQL (Fail-closed on error)
            $pgHost = $_ENV['SUPABASE_DB_HOST'] ?? getenv('SUPABASE_DB_HOST') ?: ($_ENV['DB_HOST'] ?? getenv('DB_HOST') ?: null);
            $pgPort = $_ENV['SUPABASE_DB_PORT'] ?? getenv('SUPABASE_DB_PORT') ?: ($_ENV['DB_PORT'] ?? getenv('DB_PORT') ?: '5432');
            $pgName = $_ENV['SUPABASE_DB_NAME'] ?? getenv('SUPABASE_DB_NAME') ?: ($_ENV['DB_NAME'] ?? getenv('DB_NAME') ?: 'postgres');
            $pgUser = $_ENV['SUPABASE_DB_USER'] ?? getenv('SUPABASE_DB_USER') ?: ($_ENV['DB_USER'] ?? getenv('DB_USER') ?: null);
            $pgPass = $_ENV['SUPABASE_DB_PASSWORD'] ?? getenv('SUPABASE_DB_PASSWORD') ?: ($_ENV['DB_PASS'] ?? getenv('DB_PASS') ?: null);

            if ($pgHost && $pgUser) {
                try {
                    $dsn = "pgsql:host={$pgHost};port={$pgPort};dbname={$pgName};sslmode=require";
                    $pdo = new PDO($dsn, $pgUser, $pgPass, [
                        PDO::ATTR_TIMEOUT => 5,
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                        PDO::ATTR_EMULATE_PREPARES => false
                    ]);

                    self::$instance = $pdo;
                    return self::$instance;
                } catch (PDOException $e) {
                    error_log("[PDS Database] PostgreSQL connection error: Connection failed to database host.");
                }
            } else {
                error_log("[PDS Database] Missing database connection credentials.");
            }

            // Fail-closed: Never switch silently to SQLite in production
            http_response_code(503);
            header('Content-Type: application/json');
            echo json_encode([
                'status'  => 'error',
                'code'    => 503,
                'message' => 'Database service unavailable. Please contact system administrator.'
            ]);
            exit();
        }
        return self::$instance;
    }

    private static function setupLocalSqliteDatabase(PDO $pdo): void {
        $schemaFile  = __DIR__ . '/../../database/schema.sql';
        $seederFile  = __DIR__ . '/../../database/seeders.sql';

        if (file_exists($schemaFile)) {
            $schema = file_get_contents($schemaFile);
            $schemaSql = str_replace(
                ['SERIAL PRIMARY KEY', 'SERIAL', 'TIMESTAMPTZ'],
                ['INTEGER PRIMARY KEY AUTOINCREMENT', 'INTEGER', 'TEXT'],
                $schema
            );
            $lines = explode("\n", $schemaSql);
            $cleanSchema = implode("\n", array_filter($lines, fn($l) => !str_starts_with(trim($l), '--')));
            try {
                $pdo->exec($cleanSchema);
            } catch (\Throwable $e) {
                error_log("[PDS SQLite Setup] Schema error: " . $e->getMessage());
            }
        }

        if (file_exists($seederFile)) {
            $seeders = file_get_contents($seederFile);
            $seedersClean = str_replace('ON CONFLICT (id) DO NOTHING', 'ON CONFLICT DO NOTHING', $seeders);
            $seedLines = explode("\n", $seedersClean);
            $cleanSeeders = implode("\n", array_filter($seedLines, fn($l) => !str_starts_with(trim($l), '--') && !str_contains($l, 'setval')));
            try {
                $pdo->exec($cleanSeeders);
            } catch (\Throwable $e) {
                error_log("[PDS SQLite Setup] Seeder error: " . $e->getMessage());
            }
        }
    }


    /**
     * Run the schema + seeders once to bootstrap a fresh database.
     * Call this via: php backend/config/database.php  OR import the SQL files
     * directly in phpMyAdmin for a one-time setup.
     */
    public static function runMigrations(): void {
        $pdo = self::getConnection();

        $schemaFile  = __DIR__ . '/../../database/schema.sql';
        $seederFile  = __DIR__ . '/../../database/seeders.sql';

        foreach ([$schemaFile, $seederFile] as $file) {
            if (!file_exists($file)) {
                error_log("[PDS] SQL file not found: {$file}");
                continue;
            }
            $sql = file_get_contents($file);
            // Execute each statement individually to avoid PDO::exec multi-statement issues
            foreach (self::splitSqlStatements($sql) as $statement) {
                $statement = trim($statement);
                if ($statement === '') continue;
                try {
                    $pdo->exec($statement);
                } catch (\PDOException $e) {
                    error_log("[PDS Migration] Error in statement: " . substr($statement, 0, 80)
                            . " | " . $e->getMessage());
                }
            }
        }
    }

    /**
     * Split a multi-statement SQL file into individual statements,
     * respecting string literals and comment blocks.
     */
    private static function splitSqlStatements(string $sql): array {
        $statements = [];
        $current    = '';
        $inString   = false;
        $stringChar = '';
        $len        = strlen($sql);

        for ($i = 0; $i < $len; $i++) {
            $char = $sql[$i];

            // Toggle string context
            if (!$inString && ($char === "'" || $char === '"')) {
                $inString   = true;
                $stringChar = $char;
                $current   .= $char;
                continue;
            }
            if ($inString && $char === $stringChar && ($i === 0 || $sql[$i - 1] !== '\\')) {
                $inString = false;
                $current .= $char;
                continue;
            }

            if ($inString) {
                $current .= $char;
                continue;
            }

            // Skip single-line comments
            if ($char === '-' && isset($sql[$i + 1]) && $sql[$i + 1] === '-') {
                while ($i < $len && $sql[$i] !== "\n") $i++;
                continue;
            }

            // Statement delimiter
            if ($char === ';') {
                $current    .= $char;
                $statements[] = $current;
                $current    = '';
                continue;
            }

            $current .= $char;
        }

        if (trim($current) !== '') {
            $statements[] = $current;
        }

        return $statements;
    }
}
