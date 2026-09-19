<?php
/**
 * Rate Limiting Middleware
 * System: Prefect Disciplinary Action System
 * Protects endpoints against brute-force attacks, DDoS, and excessive SMS dispatch.
 */
require_once __DIR__ . '/../helpers/ResponseHelper.php';

class RateLimitMiddleware {
    private const WINDOW_SECONDS = 60;

    // Route-specific limits (max requests per WINDOW_SECONDS)
    private const ROUTE_LIMITS = [
        'notifications:send' => 20,  // Max 20 SMS requests per minute per IP
        'auth:login'         => 15,  // Max 15 auth requests per minute per IP
        'default'            => 150  // Max 150 general API requests per minute per IP
    ];

    /**
     * Enforce rate limit for given IP and route.
     */
    public static function enforce(string $ip, string $service, string $action): void {
        $routeKey = strtolower("{$service}:{$action}");
        $limit = self::ROUTE_LIMITS[$routeKey] ?? self::ROUTE_LIMITS['default'];

        $key = 'pds_rl_' . md5($ip . '_' . $routeKey);
        $storageDir = sys_get_temp_dir() . '/pds_ratelimit';

        if (!is_dir($storageDir)) {
            @mkdir($storageDir, 0700, true);
        }

        $filePath = $storageDir . '/' . $key . '.json';
        $now = time();
        $records = [];

        if (is_file($filePath)) {
            $data = @json_decode((string)@file_get_contents($filePath), true);
            if (is_array($data)) {
                // Keep only timestamps within the rolling window
                $records = array_values(array_filter($data, fn($ts) => is_numeric($ts) && ($now - (int)$ts) < self::WINDOW_SECONDS));
            }
        }

        if (count($records) >= $limit) {
            $oldest = reset($records) ?: $now;
            $retryAfter = max(1, self::WINDOW_SECONDS - ($now - $oldest));

            header('X-RateLimit-Limit: ' . $limit);
            header('X-RateLimit-Remaining: 0');
            header('Retry-After: ' . $retryAfter);

            ResponseHelper::error("Rate limit exceeded. Please wait {$retryAfter} seconds before retrying.", 429);
            exit();
        }

        $records[] = $now;
        @file_put_contents($filePath, json_encode($records), LOCK_EX);

        $remaining = max(0, $limit - count($records));
        header('X-RateLimit-Limit: ' . $limit);
        header('X-RateLimit-Remaining: ' . $remaining);
    }
}
