<?php

namespace Notoria\Models;

use Notoria\Database;
use PDO;
use PDOException;

class Note {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    public function create(array $data): array {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO notes (title, content, tags, ownerId, isPublic, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, NOW(), NOW())
            ");
            $stmt->execute([
                $data['title'],
                $data['content'] ?? '',
                json_encode($data['tags'] ?? []),
                $data['ownerId'],
                $data['isPublic'] ?? false
            ]);

            $noteId = $this->db->lastInsertId();
            return $this->findById($noteId);
        } catch (PDOException $e) {
            throw new PDOException('Failed to create note: ' . $e->getMessage());
        }
    }

    public function findById(int $id): ?array {
        $stmt = $this->db->prepare("
            SELECT n.*, u.username as owner_username, u.email as owner_email
            FROM notes n
            LEFT JOIN users u ON n.ownerId = u.id
            WHERE n.id = ?
        ");
        $stmt->execute([$id]);
        $note = $stmt->fetch();
        if ($note) {
            $note['tags'] = json_decode($note['tags'], true);
            $note['owner'] = [
                'id' => $note['ownerId'],
                'username' => $note['owner_username'],
                'email' => $note['owner_email']
            ];
            unset($note['owner_username'], $note['owner_email']);
        }
        return $note ?: null;
    }

    public function findByOwnerId(int $ownerId): array {
        $stmt = $this->db->prepare("
            SELECT n.*, u.username as owner_username, u.email as owner_email
            FROM notes n
            LEFT JOIN users u ON n.ownerId = u.id
            WHERE n.ownerId = ?
            ORDER BY n.updatedAt DESC
        ");
        $stmt->execute([$ownerId]);
        $notes = $stmt->fetchAll();
        foreach ($notes as &$note) {
            $note['tags'] = json_decode($note['tags'], true);
            $note['owner'] = [
                'id' => $note['ownerId'],
                'username' => $note['owner_username'],
                'email' => $note['owner_email']
            ];
            unset($note['owner_username'], $note['owner_email']);
        }
        return $notes;
    }

    public function findPublic(): array {
        $stmt = $this->db->query("
            SELECT n.*, u.username as owner_username, u.email as owner_email
            FROM notes n
            LEFT JOIN users u ON n.ownerId = u.id
            WHERE n.isPublic = 1
            ORDER BY n.updatedAt DESC
        ");
        $notes = $stmt->fetchAll();
        foreach ($notes as &$note) {
            $note['tags'] = json_decode($note['tags'], true);
            $note['owner'] = [
                'id' => $note['ownerId'],
                'username' => $note['owner_username'],
                'email' => $note['owner_email']
            ];
            unset($note['owner_username'], $note['owner_email']);
        }
        return $notes;
    }

    public function update(int $id, array $data): ?array {
        try {
            $fields = [];
            $values = [];

            if (isset($data['title'])) {
                $fields[] = 'title = ?';
                $values[] = $data['title'];
            }
            if (isset($data['content'])) {
                $fields[] = 'content = ?';
                $values[] = $data['content'];
            }
            if (isset($data['tags'])) {
                $fields[] = 'tags = ?';
                $values[] = json_encode($data['tags']);
            }
            if (isset($data['isPublic'])) {
                $fields[] = 'isPublic = ?';
                $values[] = $data['isPublic'];
            }

            if (empty($fields)) {
                return $this->findById($id);
            }

            $fields[] = 'updatedAt = NOW()';
            $values[] = $id;

            $stmt = $this->db->prepare("
                UPDATE notes SET " . implode(', ', $fields) . " WHERE id = ?
            ");
            $stmt->execute($values);

            return $this->findById($id);
        } catch (PDOException $e) {
            throw new PDOException('Failed to update note: ' . $e->getMessage());
        }
    }

    public function delete(int $id): bool {
        $stmt = $this->db->prepare("DELETE FROM notes WHERE id = ?");
        return $stmt->execute([$id]);
    }

    public function getCollaborators(int $noteId): array {
        $stmt = $this->db->prepare("
            SELECT c.*, u.username, u.email
            FROM collaborations c
            LEFT JOIN users u ON c.userId = u.id
            WHERE c.noteId = ?
            ORDER BY c.createdAt DESC
        ");
        $stmt->execute([$noteId]);
        return $stmt->fetchAll();
    }
}
