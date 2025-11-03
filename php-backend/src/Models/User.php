<?php

namespace Notoria\Models;

use Notoria\Database;
use PDO;
use PDOException;

class User {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    public function create(array $data): array {
        try {
            // Check if user exists
            $stmt = $this->db->prepare("SELECT id FROM users WHERE email = ? OR username = ?");
            $stmt->execute([$data['email'], $data['username']]);
            if ($stmt->fetch()) {
                throw new PDOException('User already exists');
            }

            // Hash password
            $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);

            // Insert user
            $stmt = $this->db->prepare("
                INSERT INTO users (username, email, password, isAdmin, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, NOW(), NOW())
            ");
            $stmt->execute([
                $data['username'],
                $data['email'],
                $hashedPassword,
                $data['isAdmin'] ?? false
            ]);

            $userId = $this->db->lastInsertId();

            return $this->findById($userId);
        } catch (PDOException $e) {
            throw new PDOException('Failed to create user: ' . $e->getMessage());
        }
    }

    public function findById(int $id): ?array {
        $stmt = $this->db->prepare("
            SELECT id, username, email, isAdmin, createdAt, updatedAt
            FROM users WHERE id = ?
        ");
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }

    public function findByEmail(string $email): ?array {
        $stmt = $this->db->prepare("
            SELECT id, username, email, password, isAdmin, refreshToken, createdAt, updatedAt
            FROM users WHERE email = ?
        ");
        $stmt->execute([$email]);
        return $stmt->fetch() ?: null;
    }

    public function findByUsername(string $username): ?array {
        $stmt = $this->db->prepare("
            SELECT id, username, email, isAdmin, createdAt, updatedAt
            FROM users WHERE username = ?
        ");
        $stmt->execute([$username]);
        return $stmt->fetch() ?: null;
    }

    public function updateRefreshToken(int $userId, ?string $token): bool {
        $stmt = $this->db->prepare("UPDATE users SET refreshToken = ? WHERE id = ?");
        return $stmt->execute([$token, $userId]);
    }

    public function verifyPassword(string $password, string $hash): bool {
        return password_verify($password, $hash);
    }

    public function getAll(): array {
        $stmt = $this->db->query("
            SELECT id, username, email, isAdmin, createdAt, updatedAt
            FROM users ORDER BY createdAt DESC
        ");
        return $stmt->fetchAll();
    }

    public function delete(int $userId): bool {
        $stmt = $this->db->prepare("DELETE FROM users WHERE id = ?");
        return $stmt->execute([$userId]);
    }
}
