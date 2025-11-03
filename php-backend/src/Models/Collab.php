<?php

namespace Notoria\Models;

use Notoria\Database;
use PDO;
use PDOException;

class Collab {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    public function create(array $data): array {
        try {
            // Check if collaboration already exists
            $stmt = $this->db->prepare("SELECT id FROM collaborations WHERE noteId = ? AND userId = ?");
            $stmt->execute([$data['noteId'], $data['userId']]);
            if ($stmt->fetch()) {
                throw new PDOException('Collaboration already exists');
            }

            $stmt = $this->db->prepare("
                INSERT INTO collaborations (noteId, userId, role, invitedById, status, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, NOW(), NOW())
            ");
            $stmt->execute([
                $data['noteId'],
                $data['userId'],
                $data['role'] ?? 'editor',
                $data['invitedById'] ?? null,
                $data['status'] ?? 'pending'
            ]);

            $collabId = $this->db->lastInsertId();
            return $this->findById($collabId);
        } catch (PDOException $e) {
            throw new PDOException('Failed to create collaboration: ' . $e->getMessage());
        }
    }

    public function findById(int $id): ?array {
        $stmt = $this->db->prepare("
            SELECT c.*, n.title as note_title, u.username as user_username, u.email as user_email,
                   ib.username as invited_by_username
            FROM collaborations c
            LEFT JOIN notes n ON c.noteId = n.id
            LEFT JOIN users u ON c.userId = u.id
            LEFT JOIN users ib ON c.invitedById = ib.id
            WHERE c.id = ?
        ");
        $stmt->execute([$id]);
        $collab = $stmt->fetch();
        if ($collab) {
            $collab['note'] = [
                'id' => $collab['noteId'],
                'title' => $collab['note_title']
            ];
            $collab['user'] = [
                'id' => $collab['userId'],
                'username' => $collab['user_username'],
                'email' => $collab['user_email']
            ];
            $collab['invitedBy'] = $collab['invitedById'] ? [
                'id' => $collab['invitedById'],
                'username' => $collab['invited_by_username']
            ] : null;
            unset($collab['note_title'], $collab['user_username'], $collab['user_email'], $collab['invited_by_username']);
        }
        return $collab ?: null;
    }

    public function findByNoteId(int $noteId): array {
        $stmt = $this->db->prepare("
            SELECT c.*, n.title as note_title, u.username as user_username, u.email as user_email,
                   ib.username as invited_by_username
            FROM collaborations c
            LEFT JOIN notes n ON c.noteId = n.id
            LEFT JOIN users u ON c.userId = u.id
            LEFT JOIN users ib ON c.invitedById = ib.id
            WHERE c.noteId = ?
            ORDER BY c.createdAt DESC
        ");
        $stmt->execute([$noteId]);
        $collabs = $stmt->fetchAll();
        foreach ($collabs as &$collab) {
            $collab['note'] = [
                'id' => $collab['noteId'],
                'title' => $collab['note_title']
            ];
            $collab['user'] = [
                'id' => $collab['userId'],
                'username' => $collab['user_username'],
                'email' => $collab['user_email']
            ];
            $collab['invitedBy'] = $collab['invitedById'] ? [
                'id' => $collab['invitedById'],
                'username' => $collab['invited_by_username']
            ] : null;
            unset($collab['note_title'], $collab['user_username'], $collab['user_email'], $collab['invited_by_username']);
        }
        return $collabs;
    }

    public function findByUserId(int $userId): array {
        $stmt = $this->db->prepare("
            SELECT c.*, n.title as note_title, u.username as user_username, u.email as user_email,
                   ib.username as invited_by_username
            FROM collaborations c
            LEFT JOIN notes n ON c.noteId = n.id
            LEFT JOIN users u ON c.userId = u.id
            LEFT JOIN users ib ON c.invitedById = ib.id
            WHERE c.userId = ?
            ORDER BY c.createdAt DESC
        ");
        $stmt->execute([$userId]);
        $collabs = $stmt->fetchAll();
        foreach ($collabs as &$collab) {
            $collab['note'] = [
                'id' => $collab['noteId'],
                'title' => $collab['note_title']
            ];
            $collab['user'] = [
                'id' => $collab['userId'],
                'username' => $collab['user_username'],
                'email' => $collab['user_email']
            ];
            $collab['invitedBy'] = $collab['invitedById'] ? [
                'id' => $collab['invitedById'],
                'username' => $collab['invited_by_username']
            ] : null;
            unset($collab['note_title'], $collab['user_username'], $collab['user_email'], $collab['invited_by_username']);
        }
        return $collabs;
    }

    public function updateStatus(int $id, string $status): ?array {
        $stmt = $this->db->prepare("
            UPDATE collaborations SET status = ?, updatedAt = NOW() WHERE id = ?
        ");
        $stmt->execute([$status, $id]);
        return $this->findById($id);
    }

    public function delete(int $id): bool {
        $stmt = $this->db->prepare("DELETE FROM collaborations WHERE id = ?");
        return $stmt->execute([$id]);
    }

    public function deleteByNoteAndUser(int $noteId, int $userId): bool {
        $stmt = $this->db->prepare("DELETE FROM collaborations WHERE noteId = ? AND userId = ?");
        return $stmt->execute([$noteId, $userId]);
    }

    public function getPendingByUserId(int $userId): array {
        $stmt = $this->db->prepare("
            SELECT c.*, n.title as note_title, ib.username as invited_by_username
            FROM collaborations c
            LEFT JOIN notes n ON c.noteId = n.id
            LEFT JOIN users ib ON c.invitedById = ib.id
            WHERE c.userId = ? AND c.status = 'pending'
            ORDER BY c.createdAt DESC
        ");
        $stmt->execute([$userId]);
        $collabs = $stmt->fetchAll();
        foreach ($collabs as &$collab) {
            $collab['note'] = [
                'id' => $collab['noteId'],
                'title' => $collab['note_title']
            ];
            $collab['invitedBy'] = $collab['invitedById'] ? [
                'id' => $collab['invitedById'],
                'username' => $collab['invited_by_username']
            ] : null;
            unset($collab['note_title'], $collab['invited_by_username']);
        }
        return $collabs;
    }
}
