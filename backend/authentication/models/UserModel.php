<?php
// Authentication is handled exclusively by Supabase Auth.
// This model only manages application profile and RBAC data — no passwords.
require_once __DIR__ . '/../../config/database.php';

class UserModel {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    public function getById(int $id): ?array {
        $stmt = $this->db->prepare("
            SELECT u.*, r.name as role_name 
            FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE u.id = :id
        ");
        $stmt->execute([':id' => $id]);
        $user = $stmt->fetch();
        return $user ?: null;
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
        if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i', $uid)) {
            return null;
        }

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
        if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i', $supabaseUid)) {
            throw new \InvalidArgumentException('Invalid Supabase UUID format.');
        }

        $stmt = $this->db->prepare("UPDATE users SET supabase_uid = :uid, updated_at = CURRENT_TIMESTAMP WHERE id = :id");
        return $stmt->execute([':uid' => $supabaseUid, ':id' => $userId]);
    }

    public function getAllUsers(): array {
        $stmt = $this->db->query("
            SELECT u.id, u.supabase_uid, u.full_name, u.email, u.is_active, u.created_at, r.name as role_name, r.id as role_id 
            FROM users u 
            JOIN roles r ON u.role_id = r.id 
            ORDER BY u.id ASC
        ");
        return $stmt->fetchAll();
    }

    public function getAll(): array {
        return $this->getAllUsers();
    }

    public function getAllRoles(): array {
        $stmt = $this->db->query("SELECT id, name, description FROM roles ORDER BY id ASC");
        return $stmt->fetchAll();
    }

    /**
     * Create a local application profile record.
     * Passwords are owned strictly by Supabase Auth — never stored in public.users.
     *
     * @param array $data Keys: role_id, full_name, email, supabase_uid (optional), is_active (optional)
     */
    public function createUser(array $data): int {
        $supabaseUid = null;
        if (!empty($data['supabase_uid'])) {
            $candidateUid = trim((string)$data['supabase_uid']);
            if (preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i', $candidateUid)) {
                $supabaseUid = $candidateUid;
            } else {
                throw new \InvalidArgumentException('Provided supabase_uid is not a valid UUID.');
            }
        }

        $isActive = isset($data['is_active']) ? (bool)$data['is_active'] : true;

        $stmt = $this->db->prepare("
            INSERT INTO users (supabase_uid, role_id, full_name, email, is_active) 
            VALUES (:supabase_uid, :role_id, :full_name, :email, :is_active)
        ");
        $stmt->execute([
            ':supabase_uid' => $supabaseUid,
            ':role_id'      => (int)$data['role_id'],
            ':full_name'    => trim($data['full_name']),
            ':email'        => trim(strtolower($data['email'])),
            ':is_active'    => $isActive ? 1 : 0
        ]);
        return (int)$this->db->lastInsertId();
    }

    /**
     * Update profile fields for an existing user.
     * Passwords are managed by Supabase Auth — do NOT pass password here.
     *
     * @param int   $id
     * @param array $data Keys: full_name, role_id, email, is_active
     */
    public function updateUser(int $id, array $data): bool {
        $fields = [];
        $params = [':id' => $id];

        if (array_key_exists('full_name', $data) && $data['full_name'] !== '') {
            $fields[] = 'full_name = :full_name';
            $params[':full_name'] = trim($data['full_name']);
        }
        if (array_key_exists('email', $data) && $data['email'] !== '') {
            $fields[] = 'email = :email';
            $params[':email'] = trim(strtolower($data['email']));
        }
        if (array_key_exists('role_id', $data) && $data['role_id'] !== '') {
            $fields[] = 'role_id = :role_id';
            $params[':role_id'] = (int)$data['role_id'];
        }
        if (array_key_exists('is_active', $data)) {
            $fields[] = 'is_active = :is_active';
            $params[':is_active'] = (bool)$data['is_active'] ? 1 : 0;
        }

        if (empty($fields)) return false;

        $fields[] = 'updated_at = CURRENT_TIMESTAMP';
        $sql = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute($params);
    }

    public function toggleStatus(int $id, bool $isActive): bool {
        $stmt = $this->db->prepare("UPDATE users SET is_active = :is_active, updated_at = CURRENT_TIMESTAMP WHERE id = :id");
        return $stmt->execute([':is_active' => $isActive ? 1 : 0, ':id' => $id]);
    }
}

