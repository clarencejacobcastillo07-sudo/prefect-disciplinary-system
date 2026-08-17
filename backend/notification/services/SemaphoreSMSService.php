<?php
require_once __DIR__ . '/SMSGatewayInterface.php';

class SemaphoreSMSService implements SMSGatewayInterface {
    private string $apiKey;
    private string $senderName;
    private string $apiEndpoint;

    public function __construct() {
        $this->apiKey = $_ENV['SEMAPHORE_API_KEY'] ?? 'SEMAPHORE_DEMO_API_KEY';
        $this->senderName = $_ENV['SEMAPHORE_SENDER_NAME'] ?? 'STAGNES';
        $this->apiEndpoint = 'https://api.semaphore.co/api/v4/messages';
    }

    public function send(string $recipientPhone, string $message): array {
        // Sanitize Philippine phone number format (0917... or +63917...)
        $phone = preg_replace('/[^0-9]/', '', $recipientPhone);
        if (str_starts_with($phone, '63')) {
            $phone = '0' . substr($phone, 2);
        }

        // If API key is demo/placeholder, return a clean simulated success response
        if ($this->apiKey === 'SEMAPHORE_DEMO_API_KEY' || empty($this->apiKey)) {
            return [
                'status' => 'Simulated',
                'message_id' => 'SIM-' . time() . '-' . rand(100, 999),
                'recipient' => $phone,
                'network' => 'Globe/Smart (Simulated)',
                'response' => 'SMS queued successfully via Semaphore abstraction layer.'
            ];
        }

        // Real Semaphore API cURL execution
        $ch = curl_init();
        $parameters = [
            'apikey' => $this->apiKey,
            'number' => $phone,
            'message' => $message,
            'sendername' => $this->senderName
        ];

        curl_setopt($ch, CURLOPT_URL, $this->apiEndpoint);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($parameters));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);

        $output = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $decoded = json_decode($output, true);

        return [
            'status' => ($httpCode >= 200 && $httpCode < 300) ? 'Sent' : 'Failed',
            'message_id' => $decoded[0]['message_id'] ?? null,
            'recipient' => $phone,
            'response' => $decoded ?? $output
        ];
    }
}
