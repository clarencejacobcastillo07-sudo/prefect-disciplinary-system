<?php
/**
 * Supabase Integration & Configuration Helper
 * Client: St. Agnes Academy of Caloocan Inc.
 */

class SupabaseConfig {
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

    /**
     * Validate that mandatory Supabase keys are present.
     * Throws RuntimeException so the error surfaces as a 500 rather than a
     * silent empty-string request to the Supabase API.
     */
    private static function assertConfig(): void {
        self::loadEnv();
        $missing = [];
        if (empty($_ENV['SUPABASE_URL'] ?? getenv('SUPABASE_URL') ?: ''))              $missing[] = 'SUPABASE_URL';
        if (empty($_ENV['SUPABASE_ANON_KEY'] ?? getenv('SUPABASE_ANON_KEY') ?: ''))   $missing[] = 'SUPABASE_ANON_KEY';
        if (!empty($missing)) {
            throw new \RuntimeException('Supabase configuration is incomplete. Missing: ' . implode(', ', $missing));
        }
    }

    public static function getUrl(): string {
        self::assertConfig();
        return $_ENV['SUPABASE_URL'] ?? getenv('SUPABASE_URL') ?: '';
    }

    public static function getAnonKey(): string {
        self::assertConfig();
        return $_ENV['SUPABASE_ANON_KEY'] ?? getenv('SUPABASE_ANON_KEY') ?: '';
    }

    public static function getServiceRoleKey(): string {
        self::loadEnv();
        $key = $_ENV['SUPABASE_SERVICE_ROLE_KEY'] ?? getenv('SUPABASE_SERVICE_ROLE_KEY') ?: '';
        if (empty($key)) {
            throw new \RuntimeException('SUPABASE_SERVICE_ROLE_KEY is not configured.');
        }
        return $key;
    }


    /**
     * Authenticate email/password against Supabase Auth API
     */
    public static function signInWithPassword(string $email, string $password): ?array {
        $url = rtrim(self::getUrl(), '/') . '/auth/v1/token?grant_type=password';
        $headers = [
            'Content-Type: application/json',
            'apikey: ' . self::getAnonKey()
        ];
        $payload = json_encode(['email' => $email, 'password' => $password]);

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_TIMEOUT, 5);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode >= 200 && $httpCode < 300 && $response) {
            return json_decode($response, true);
        }

        return null;
    }

    /**
     * Verify JWT Access Token via Supabase Auth API (/auth/v1/user)
     */
    public static function verifyJwtToken(string $token): ?array {
        if (empty($token)) return null;

        $url = rtrim(self::getUrl(), '/') . '/auth/v1/user';
        $headers = [
            'Authorization: Bearer ' . $token,
            'apikey: ' . self::getAnonKey()
        ];

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_TIMEOUT, 5);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode >= 200 && $httpCode < 300 && $response) {
            return json_decode($response, true);
        }

        return null;
    }
}