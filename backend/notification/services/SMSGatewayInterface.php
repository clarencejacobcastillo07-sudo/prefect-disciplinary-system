<?php
/**
 * SMS Gateway Abstraction Interface
 * Enables plug-and-play provider switching (e.g. Semaphore SMS API, Twilio, Mock Provider).
 */

interface SMSGatewayInterface {
    /**
     * Send an SMS message to a recipient.
     * Returns array with keys: status, message_id, recipient, network, response
     */
    public function send(string $recipientPhone, string $message): array;

    /**
     * Query delivery status of a previously dispatched message.
     * Returns array with keys: status, message_id, recipient, network, updated_at
     */
    public function checkStatus(string $messageId): array;

    /**
     * Query gateway account balance and credit status.
     * Returns array with keys: balance, status, sender_name, account_id
     */
    public function getAccountBalance(): array;
}

