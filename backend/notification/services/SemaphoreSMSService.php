<?php
require_once __DIR__ . '/SMSGatewayInterface.php';

/**
 * Semaphore SMS Service Implementation
 * Integrates directly with the official Semaphore SMS API (v4) for Philippine telecom dispatch.
 * 
 * Endpoints:
 * - Send Messages:    POST https://api.semaphore.co/api/v4/messages
 * - Delivery Status:  GET  https://api.semaphore.co/api/v4/messages/{id}
 * - Account Info:     GET  https://api.semaphore.co/api/v4/account
 */
class SemaphoreSMSService implements SMSGatewayInterface {
    private string $apiKey;
    private string $senderName;
    private string $apiBaseUrl;
    private string $appEnv;

    public function __construct(?string $apiKey = null, ?string $senderName = null) {
        $this->apiKey     = $apiKey ?? ($_ENV['SEMAPHORE_API_KEY'] ?? getenv('SEMAPHORE_API_KEY') ?: '');
        $this->senderName = $senderName ?? ($_ENV['SEMAPHORE_SENDER_NAME'] ?? getenv('SEMAPHORE_SENDER_NAME') ?: 'STAGNES');
        $this->apiBaseUrl = 'https://api.semaphore.co/api/v4';
        $this->appEnv     = strtolower($_ENV['APP_ENV'] ?? getenv('APP_ENV') ?: 'development');
    }

    /**
     * Normalize & validate Philippine mobile numbers.
     * Accepted inputs: 09171234567, +639171234567, 639171234567, 9171234567.
     * Returns sanitized 11-digit string (09XXXXXXXXX) or null if invalid.
     */
    public static function normalizePhoneNumber(string|int $phone): ?string {
        $clean = preg_replace('/[^0-9]/', '', (string)$phone);
        if (str_starts_with($clean, '639') && strlen($clean) === 12) {
            $clean = '0' . substr($clean, 2);
        } elseif (str_starts_with($clean, '9') && strlen($clean) === 10) {
            $clean = '0' . $clean;
        }

        if (preg_match('/^09[0-9]{9}$/', $clean)) {
            return $clean;
        }

        return null;
    }

    /**
     * Dispatch SMS message via Semaphore Gateway.
     */
    public function send(string $recipientPhone, string $message): array {
        $normalizedPhone = self::normalizePhoneNumber($recipientPhone);
        if (!$normalizedPhone) {
            return [
                'status'              => 'Failed',
                'provider_message_id' => null,
                'message_id'          => null,
                'recipient'           => (string)$recipientPhone,
                'network'             => 'Unknown',
                'error'               => 'Invalid Philippine mobile phone number format.',
                'response'            => ['error' => 'Invalid mobile number format. Expected 09XXXXXXXXX.']
            ];
        }

        $sanitizedMessage = trim($message);
        if (empty($sanitizedMessage)) {
            return [
                'status'              => 'Failed',
                'provider_message_id' => null,
                'message_id'          => null,
                'recipient'           => $normalizedPhone,
                'network'             => 'Unknown',
                'error'               => 'Message content cannot be empty.',
                'response'            => ['error' => 'Empty message content.']
            ];
        }

        // Production Mode Check: Simulation is strictly prohibited in production.
        if ($this->appEnv === 'production' && (empty($this->apiKey) || $this->apiKey === 'SEMAPHORE_DEMO_API_KEY')) {
            error_log('[PDS SemaphoreSMSService] Production configuration error: SEMAPHORE_API_KEY is not set.');
            return [
                'status'              => 'Failed',
                'provider_message_id' => null,
                'message_id'          => null,
                'recipient'           => $normalizedPhone,
                'network'             => 'Unknown',
                'error'               => 'SMS gateway service configuration error in production.',
                'response'            => ['error' => 'SEMAPHORE_API_KEY environment variable is not configured.']
            ];
        }

        // Development Sandbox Simulation fallback
        if ($this->isDemoMode()) {
            $simulatedMsgId = 'SIM-' . time() . '-' . rand(1000, 9999);
            return [
                'status'              => 'Simulated',
                'provider_message_id' => $simulatedMsgId,
                'message_id'          => $simulatedMsgId,
                'recipient'           => $normalizedPhone,
                'network'             => 'Globe/Smart/DITO (Sandbox)',
                'segments'            => ceil(mb_strlen($sanitizedMessage) / 160),
                'response'            => [
                    'message' => 'SMS queued in sandbox mode via Semaphore abstraction layer.',
                    'mode'    => 'sandbox_simulation'
                ]
            ];
        }

        // Live Semaphore v4 API POST execution
        $endpoint = $this->apiBaseUrl . '/messages';
        $params = [
            'apikey'     => $this->apiKey,
            'number'     => $normalizedPhone,
            'message'    => $sanitizedMessage,
            'sendername' => $this->senderName
        ];

        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL            => $endpoint,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => http_build_query($params),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 12,
            CURLOPT_CONNECTTIMEOUT => 6,
            CURLOPT_HTTPHEADER     => [
                'User-Agent: PrefectDisciplinarySystem/2.0',
                'Accept: application/json'
            ]
        ]);

        $output = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlErr = curl_error($ch);
        curl_close($ch);

        if ($curlErr) {
            error_log("[PDS SemaphoreSMSService] cURL error during SMS send: {$curlErr}");
            return [
                'status'              => 'Failed',
                'provider_message_id' => null,
                'message_id'          => null,
                'recipient'           => $normalizedPhone,
                'error'               => 'Failed to connect to SMS gateway provider.',
                'response'            => ['curl_error' => $curlErr]
            ];
        }

        $decoded = json_decode($output, true);
        $isSuccess = ($httpCode >= 200 && $httpCode < 300);

        // Semaphore returns an array of message objects on success: [ { "message_id": 12345, "status": "Pending", ... } ]
        $firstItem = is_array($decoded) && isset($decoded[0]) ? $decoded[0] : (is_array($decoded) ? $decoded : []);
        $gatewayMsgId = $firstItem['message_id'] ?? ($firstItem['id'] ?? null);
        $network = $firstItem['network'] ?? 'Philippine Carrier';

        $status = 'Failed';
        if ($isSuccess) {
            $rawStatus = strtolower($firstItem['status'] ?? '');
            if ($rawStatus === 'delivered') {
                $status = 'Delivered';
            } elseif ($rawStatus === 'queued' || $rawStatus === 'pending') {
                $status = 'Queued';
            } else {
                $status = 'Sent';
            }
        }

        return [
            'status'              => $status,
            'provider_message_id' => $gatewayMsgId ? (string)$gatewayMsgId : null,
            'message_id'          => $gatewayMsgId ? (string)$gatewayMsgId : null,
            'recipient'           => $normalizedPhone,
            'network'             => $network,
            'response'            => $decoded ?? $output
        ];
    }

    /**
     * Query delivery status of a previously dispatched message using Semaphore message ID.
     */
    public function checkStatus(string $messageId): array {
        if ($this->isDemoMode() || str_starts_with($messageId, 'SIM-')) {
            return [
                'status'              => 'Delivered',
                'provider_message_id' => $messageId,
                'message_id'          => $messageId,
                'recipient'           => 'Simulated Recipient',
                'network'             => 'Simulated Carrier',
                'updated_at'          => date('Y-m-d H:i:s'),
                'response'            => ['mode' => 'sandbox_simulation', 'delivery' => 'Delivered']
            ];
        }

        if (empty($messageId)) {
            return [
                'status' => 'Unknown',
                'error'  => 'Missing provider message ID.'
            ];
        }

        $endpoint = $this->apiBaseUrl . '/messages/' . urlencode($messageId) . '?apikey=' . urlencode($this->apiKey);
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL            => $endpoint,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 10,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_HTTPHEADER     => [
                'User-Agent: PrefectDisciplinarySystem/2.0',
                'Accept: application/json'
            ]
        ]);

        $output = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $decoded = json_decode($output, true);
        if ($httpCode >= 200 && $httpCode < 300 && is_array($decoded)) {
            $msgObj = isset($decoded[0]) ? $decoded[0] : $decoded;
            $rawStatus = strtolower($msgObj['status'] ?? 'delivered');
            
            $formattedStatus = 'Sent';
            if ($rawStatus === 'delivered' || $rawStatus === 'success') {
                $formattedStatus = 'Delivered';
            } elseif ($rawStatus === 'failed' || $rawStatus === 'error') {
                $formattedStatus = 'Failed';
            } elseif ($rawStatus === 'queued' || $rawStatus === 'pending') {
                $formattedStatus = 'Queued';
            }

            return [
                'status'              => $formattedStatus,
                'provider_message_id' => $messageId,
                'message_id'          => $messageId,
                'recipient'           => $msgObj['recipient'] ?? ($msgObj['number'] ?? ''),
                'network'             => $msgObj['network'] ?? 'Unknown',
                'updated_at'          => $msgObj['updated_at'] ?? date('Y-m-d H:i:s'),
                'response'            => $decoded
            ];
        }

        return [
            'status'              => 'Unknown',
            'provider_message_id' => $messageId,
            'message_id'          => $messageId,
            'error'               => 'Failed to query Semaphore status endpoint.',
            'response'            => $decoded ?? $output
        ];
    }

    /**
     * Retrieve gateway account balance and credit info from Semaphore.
     */
    public function getAccountBalance(): array {
        if ($this->isDemoMode()) {
            return [
                'balance'     => 500,
                'status'      => 'Active (Sandbox Simulation)',
                'sender_name' => $this->senderName,
                'account_id'  => 'SIM-ACCT-001',
                'mode'        => 'sandbox'
            ];
        }

        $endpoint = $this->apiBaseUrl . '/account?apikey=' . urlencode($this->apiKey);
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL            => $endpoint,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 10,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_HTTPHEADER     => [
                'User-Agent: PrefectDisciplinarySystem/2.0',
                'Accept: application/json'
            ]
        ]);

        $output = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $decoded = json_decode($output, true);
        if ($httpCode >= 200 && $httpCode < 300 && is_array($decoded)) {
            return [
                'balance'     => (int)($decoded['credit_balance'] ?? 0),
                'status'      => $decoded['status'] ?? 'Active',
                'sender_name' => $decoded['sender_name'] ?? $this->senderName,
                'account_id'  => (string)($decoded['account_id'] ?? ''),
                'mode'        => 'production'
            ];
        }

        return [
            'balance'     => 0,
            'status'      => 'Unavailable',
            'sender_name' => $this->senderName,
            'account_id'  => '',
            'mode'        => 'error',
            'error'       => 'Unable to connect to Semaphore account endpoint.'
        ];
    }

    private function isDemoMode(): bool {
        if ($this->appEnv === 'production') {
            return false;
        }
        return empty($this->apiKey) || $this->apiKey === 'SEMAPHORE_DEMO_API_KEY';
    }
}
