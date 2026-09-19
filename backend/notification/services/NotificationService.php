<?php
require_once __DIR__ . '/SemaphoreSMSService.php';
require_once __DIR__ . '/../models/NotificationModel.php';
require_once __DIR__ . '/../../student-records/models/StudentModel.php';
require_once __DIR__ . '/../../helpers/AuditLogger.php';

/**
 * Notification Service Layer
 * Coordinates SMS dispatch, parent notification event triggers, template generation, and delivery status tracking.
 */
class NotificationService {
    private SMSGatewayInterface $smsGateway;
    private NotificationModel $model;
    private StudentModel $studentModel;

    public function __construct(?SMSGatewayInterface $gateway = null) {
        $this->smsGateway   = $gateway ?? new SemaphoreSMSService();
        $this->model        = new NotificationModel();
        $this->studentModel = new StudentModel();
    }

    /**
     * Dispatch SMS to a student's verified parent/guardian using database-resolved contact information.
     */
    public function sendParentSMS(
        int $studentId, 
        string $message, 
        ?int $userId = null, 
        string $alertType = 'MANUAL_DISPATCH'
    ): array {
        $student = $this->studentModel->getById($studentId);
        if (!$student) {
            throw new \InvalidArgumentException("Student record (ID: {$studentId}) not found.");
        }

        if (empty($student['guardian_phone'])) {
            $studentName = trim("{$student['first_name']} {$student['last_name']}");
            throw new \InvalidArgumentException("Student {$studentName} (LRN: {$student['lrn']}) has no registered parent/guardian mobile number in the database.");
        }

        $cleanPhone = SemaphoreSMSService::normalizePhoneNumber($student['guardian_phone']);
        if (!$cleanPhone) {
            $studentName = trim("{$student['first_name']} {$student['last_name']}");
            throw new \InvalidArgumentException("The registered parent contact ({$student['guardian_phone']}) for {$studentName} is not a valid Philippine mobile number.");
        }

        $parentId = isset($student['parent_id']) && !empty($student['parent_id']) ? (int)$student['parent_id'] : null;

        return $this->sendSMS($studentId, $cleanPhone, $message, $userId, $parentId, $alertType);
    }

    /**
     * Core SMS Dispatcher: Normalizes, validates, invokes SMS gateway, and records audit trail.
     */
    public function sendSMS(
        int $studentId, 
        string $phone, 
        string $message, 
        ?int $userId = null, 
        ?int $parentId = null,
        string $alertType = 'CUSTOM'
    ): array {
        $cleanPhone = SemaphoreSMSService::normalizePhoneNumber($phone);
        if (!$cleanPhone) {
            throw new \InvalidArgumentException("Invalid Philippine mobile number ({$phone}). Expected format: 09XXXXXXXXX or +639XXXXXXXXX.");
        }

        $trimmedMessage = trim($message);
        if (empty($trimmedMessage)) {
            throw new \InvalidArgumentException("SMS message content cannot be empty.");
        }

        // Invoke SMS gateway
        $result = $this->smsGateway->send($cleanPhone, $trimmedMessage);
        $status = $result['status'] ?? 'Sent';
        $providerMsgId = $result['provider_message_id'] ?? ($result['message_id'] ?? null);
        $payload = is_array($result['response'] ?? null) ? json_encode($result['response']) : ($result['response'] ?? '');

        // Persist to sms_logs table with provider_message_id
        $logId = $this->model->logSMS(
            $studentId, 
            $cleanPhone, 
            $trimmedMessage, 
            $status, 
            $payload, 
            $userId, 
            $parentId, 
            $providerMsgId ? (string)$providerMsgId : null
        );

        $result['log_id'] = $logId;
        $result['provider_message_id'] = $providerMsgId ? (string)$providerMsgId : null;

        AuditLogger::log(
            'SEND_SMS_ALERT', 
            'Notification Service', 
            "Dispatched SMS parent alert [{$alertType}] to {$cleanPhone} for Student ID {$studentId} (Status: {$status}, Provider Msg ID: " . ($providerMsgId ?: 'N/A') . ")", 
            $userId
        );

        return $result;
    }

    /**
     * Event-Driven Alert: Log Incident / Infraction Notice.
     */
    public function sendIncidentAlert(int $studentId, array $incidentData, ?int $userId = null): ?array {
        $student = $this->studentModel->getById($studentId);
        if (!$student || empty($student['guardian_phone'])) {
            return null;
        }

        $studentName = trim("{$student['first_name']} {$student['last_name']}");
        $violationTitle = $incidentData['violation_title'] ?? ($incidentData['title'] ?? 'School Policy Infraction');
        $date = $incidentData['incident_date'] ?? date('Y-m-d');

        $msg = "ST. AGNES ACADEMY NOTICE: An incident ({$violationTitle}) involving {$studentName} was recorded on {$date}. Please contact the Prefect Office.";

        return $this->sendParentSMS($studentId, $msg, $userId, 'INCIDENT_NOTICE');
    }

    /**
     * Event-Driven Alert: Disciplinary Hearing Summons.
     */
    public function sendHearingSummonsAlert(int $studentId, array $hearingData, ?int $userId = null): ?array {
        $student = $this->studentModel->getById($studentId);
        if (!$student || empty($student['guardian_phone'])) {
            return null;
        }

        $studentName = trim("{$student['first_name']} {$student['last_name']}");
        $date  = $hearingData['hearing_date'] ?? 'TBD';
        $time  = $hearingData['hearing_time'] ?? 'TBD';
        $venue = !empty($hearingData['venue']) ? $hearingData['venue'] : 'Prefect Office';

        $msg = "ST. AGNES ACADEMY SUMMONS: Disciplinary hearing for {$studentName} is scheduled on {$date} at {$time} ({$venue}). Guardian presence is required.";

        return $this->sendParentSMS($studentId, $msg, $userId, 'HEARING_SUMMONS');
    }

    /**
     * Event-Driven Alert: Formal Disciplinary Sanction Notice.
     */
    public function sendSanctionAlert(int $studentId, array $sanctionData, ?int $userId = null): ?array {
        $student = $this->studentModel->getById($studentId);
        if (!$student || empty($student['guardian_phone'])) {
            return null;
        }

        $studentName = trim("{$student['first_name']} {$student['last_name']}");
        $type  = $sanctionData['sanction_type'] ?? 'Disciplinary Sanction';
        $start = $sanctionData['start_date'] ?? date('Y-m-d');
        $end   = !empty($sanctionData['end_date']) ? " until {$sanctionData['end_date']}" : "";

        $msg = "ST. AGNES ACADEMY NOTICE: Sanction issued for {$studentName}: {$type} effective {$start}{$end}. Please coordinate with the Prefect Office.";

        return $this->sendParentSMS($studentId, $msg, $userId, 'SANCTION_NOTICE');
    }

    /**
     * Event-Driven Alert: Clearance Hold Notification.
     */
    public function sendClearanceHoldAlert(int $studentId, string $holdReason, ?int $userId = null): ?array {
        $student = $this->studentModel->getById($studentId);
        if (!$student || empty($student['guardian_phone'])) {
            return null;
        }

        $studentName = trim("{$student['first_name']} {$student['last_name']}");
        $msg = "ST. AGNES ACADEMY ALERT: {$studentName} has an active Clearance Hold ({$holdReason}). Please resolve pending obligations at the Prefect Office.";

        return $this->sendParentSMS($studentId, $msg, $userId, 'CLEARANCE_HOLD');
    }

    /**
     * Event-Driven Alert: Reformation Program Assignment.
     */
    public function sendReformationAlert(int $studentId, array $programData, ?int $userId = null): ?array {
        $student = $this->studentModel->getById($studentId);
        if (!$student || empty($student['guardian_phone'])) {
            return null;
        }

        $studentName = trim("{$student['first_name']} {$student['last_name']}");
        $title = $programData['program_title'] ?? 'Corrective Program';
        $hours = $programData['total_hours'] ?? '10';

        $msg = "ST. AGNES ACADEMY NOTICE: {$studentName} has been enrolled in {$title} ({$hours} hrs). Please report to Guidance/Prefect Office.";

        return $this->sendParentSMS($studentId, $msg, $userId, 'REFORMATION_ASSIGNED');
    }

    /**
     * Fetch all logs with optional filters.
     */
    public function getLogs(array $filters = []): array {
        return $this->model->getLogs($filters);
    }

    /**
     * Get system-wide SMS delivery analytics and gateway credit stats.
     */
    public function getDeliveryStats(): array {
        $stats = $this->model->getDeliveryStats();
        $accountInfo = $this->smsGateway->getAccountBalance();

        return [
            'metrics' => $stats,
            'gateway' => $accountInfo
        ];
    }

    /**
     * Sync delivery status of SMS logs from Semaphore gateway using the actual provider_message_id.
     */
    public function syncDeliveryStatus(?int $logId = null): array {
        $updatedCount = 0;

        if ($logId) {
            $log = $this->model->getLogById($logId);
            if ($log && !empty($log['provider_message_id'])) {
                $statusRes = $this->smsGateway->checkStatus((string)$log['provider_message_id']);
                $newStatus = $statusRes['status'] ?? 'Delivered';
                $this->model->updateStatus($logId, $newStatus, json_encode($statusRes));
                $updatedCount = 1;
            }
        } else {
            $pending = $this->model->getPendingLogs(30);
            foreach ($pending as $log) {
                if (!empty($log['provider_message_id'])) {
                    $statusRes = $this->smsGateway->checkStatus((string)$log['provider_message_id']);
                    $newStatus = $statusRes['status'] ?? 'Delivered';
                    $this->model->updateStatus((int)$log['id'], $newStatus, json_encode($statusRes));
                    $updatedCount++;
                }
            }
        }

        return [
            'updated_count' => $updatedCount,
            'timestamp'     => date('Y-m-d H:i:s')
        ];
    }

    /**
     * Get gateway account information.
     */
    public function getAccountInfo(): array {
        return $this->smsGateway->getAccountBalance();
    }

    /**
     * Standard template library.
     */
    public function getTemplates(): array {
        return [
            [
                'id' => 'infraction',
                'title' => 'Infraction Notice',
                'description' => 'Notifies guardian of a recorded disciplinary infraction.',
                'template' => 'ST. AGNES ACADEMY NOTICE: An incident report was recorded for {student_name}. Please visit the Prefect Office for a conference.'
            ],
            [
                'id' => 'hearing',
                'title' => 'Hearing Summons',
                'description' => 'Formal summons for a disciplinary board hearing.',
                'template' => 'ST. AGNES ACADEMY SUMMONS: Disciplinary hearing for {student_name} is scheduled on {hearing_date} at {hearing_time} ({venue}). Guardian presence required.'
            ],
            [
                'id' => 'sanction',
                'title' => 'Sanction Notice',
                'description' => 'Official notice of sanction implementation (Suspension, Detention, etc.).',
                'template' => 'ST. AGNES ACADEMY NOTICE: Sanction issued for {student_name}: {sanction_type} effective {start_date}. Please coordinate with Prefect Office.'
            ],
            [
                'id' => 'clearance',
                'title' => 'Clearance Hold Alert',
                'description' => 'Urgent notice regarding blocked school clearance.',
                'template' => 'ST. AGNES ACADEMY ALERT: {student_name} has an active clearance hold due to pending disciplinary requirements. Please settle at Prefect Office.'
            ],
            [
                'id' => 'reformation',
                'title' => 'Reformation Program',
                'description' => 'Notice of community service or guidance counseling program assignment.',
                'template' => 'ST. AGNES ACADEMY NOTICE: {student_name} has been enrolled in {program_title} ({total_hours} hrs). Please report to Guidance/Prefect Office.'
            ],
            [
                'id' => 'merit',
                'title' => 'Merit & Conduct Commendation',
                'description' => 'Positive behavioral recognition notice.',
                'template' => 'ST. AGNES ACADEMY COMMENDATION: We are pleased to recognize {student_name} for exemplary conduct and positive behavior points.'
            ]
        ];
    }
}
