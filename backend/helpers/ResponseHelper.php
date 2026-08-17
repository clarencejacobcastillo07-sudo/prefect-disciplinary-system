<?php
/**
 * Standardized JSON API Response Helper
 */

class ResponseHelper {
    public static function json(mixed $data, int $statusCode = 200, string $message = 'Success'): void {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        // CORS headers are set once at the api.php entrypoint — do not duplicate here.

        echo json_encode([
            'status' => $statusCode >= 200 && $statusCode < 300 ? 'success' : 'error',
            'code' => $statusCode,
            'message' => $message,
            'data' => $data,
            'timestamp' => date('c')
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit();
    }

    public static function success(mixed $data = null, string $message = 'Operation successful', int $statusCode = 200): void {
        self::json($data, $statusCode, $message);
    }

    public static function error(string $message = 'An error occurred', int $statusCode = 400, mixed $errors = null): void {
        self::json(['errors' => $errors], $statusCode, $message);
    }
}
