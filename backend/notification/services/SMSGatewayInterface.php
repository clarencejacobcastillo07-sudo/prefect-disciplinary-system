<?php
/**
 * SMS Gateway Abstraction Interface
 * Enables plug-and-play provider switching (e.g. Semaphore SMS API, Twilio, Mock Provider).
 */

interface SMSGatewayInterface {
    public function send(string $recipientPhone, string $message): array;
}
