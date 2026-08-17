<?php
// Authentication is handled exclusively by Supabase Auth.
// This model only manages application profile and RBAC data — no passwords.
require_once __DIR__ . '/../../config/database.php';

class UserModel {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    public function findByEmail(string $email): ?array {
        $stmt = $this->db->prepare("
            SELECT u.*, r.name as role_name 
            FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE LOWER(u.email) = LOWER(:email) AND u.is_active = TRUE
        ");
        $stmt->execute([':email' => $email]);
        $user = $stmt->fetch();
        return $user ?: null;
    }

    public function findBySupabaseUid(string $uid): ?array {
        $stmt = $this->db->prepare("
            SELECT u.*, r.name as role_name 
            FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE u.supabase_uid = :uid AND u.is_active = TRUE
        ");
        $stmt->execute([':uid' => $uid]);
        $user = $stmt->fetch();
        return $user ?: null;
    }

    public function updateSupabaseUid(int $userId, string $supabaseUid): bool {
        $stmt = $this->db->prepare("UPDATE users SET supabase_uid = :uid WHERE id = :id");
        return $stmt->execute([':uid' => $supabaseUid, ':id' => $userId]);
    }

    public function getAllUsers(): array {
        $stmt = $this->db->query("
            SELECT u.id, u.full_name, u.email, u.is_active, u.created_at, r.name as role_name, r.id as role_id 
            FROM users u 
            JOIN roles r ON u.role_id = r.id 
            ORDER BY u.id ASC
        ");
        return $stmt->fetchAll();
    }

    /**
     * Create a local application profile record.
     * The caller MUST have already created the Supabase Auth user and obtained
     * the supabase_uid before calling this method.
     *
     * @param array $data Keys: supabase_uid (required), role_id, full_name, email
     */
    public function createUser(array $data): int {
        if (empty($data['supabase_uid'])) {
            throw new InvalidArgumentException('supabase_uid is required when creating a user profile.');
        }
        $stmt = $this->db->prepare("
            INSERT INTO users (supabase_uid, role_id, full_name, email) 
            VALUES (:supabase_uid, :role_id, :full_name, :email)
        ");
        $stmt->execute([
            ':supabase_uid' => $data['supabase_uid'],
            ':role_id'      => $data['role_id'],
            ':full_name'    => $data['full_name'],
            ':email'        => $data['email'],
        ]);
        return (int)$this->db->lastInsertId();
    }

    /**
     * Update profile fields for an existing user.
     * Passwords are managed by Supabase Auth — do NOT pass password here.
     *
     * @param int   $id
     * @param array $data Keys: full_name, role_id, is_active
     */
    public function updateUser(int $id, array $data): bool {
        $fields = [];
        $params = [':id' => $id];

        if (array_key_exists('full_name', $data) && $data['full_name'] !== '') {
            $fields[] = 'full_name = :full_name';
            $params[':full_name'] = $data['full_name'];
        }
        if (array_key_exists('role_id', $data) && $data['role_id'] !== '') {
            $fields[] = 'role_id = :role_id';
            $params[':role_id'] = $data['role_id'];
        }
        if (array_key_exists('is_active', $data)) {
            $fields[] = 'is_active = :is_active';
            $params[':is_active'] = (bool)$data['is_active'];
        }

        if (empty($fields)) return false;

        $fields[] = 'updated_at = CURRENT_TIMESTAMP';
        $sql = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute($params);
    }
}
