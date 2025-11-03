<?php

namespace Notoria\Models;

use Notoria\Database;
use PDO;
use PDOException;

class Task {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    public function create(array $data): array {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO tasks (title, description, status, dueDate, ownerId, priority, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
            ");
            $stmt->execute([
                $data['title'],
                $data['description'] ?? '',
                $data['status'] ?? 'todo',
                $data['dueDate'] ?? null,
                $data['ownerId'],
                $data['priority'] ?? 'medium'
            ]);

            $taskId = $this->db->lastInsertId();
            return $this->findById($taskId);
        } catch (PDOException $e) {
            throw new PDOException('Failed to create task: ' . $e->getMessage());
        }
    }

    public function findById(int $id): ?array {
        $stmt = $this->db->prepare("
            SELECT t.*, u.username as owner_username, u.email as owner_email
            FROM tasks t
            LEFT JOIN users u ON t.ownerId = u.id
            WHERE t.id = ?
        ");
        $stmt->execute([$id]);
        $task = $stmt->fetch();
        if ($task) {
            $task['owner'] = [
                'id' => $task['ownerId'],
                'username' => $task['owner_username'],
                'email' => $task['owner_email']
            ];
            unset($task['owner_username'], $task['owner_email']);
        }
        return $task ?: null;
    }

    public function findByOwnerId(int $ownerId): array {
        $stmt = $this->db->prepare("
            SELECT t.*, u.username as owner_username, u.email as owner_email
            FROM tasks t
            LEFT JOIN users u ON t.ownerId = u.id
            WHERE t.ownerId = ?
            ORDER BY t.dueDate ASC, t.createdAt DESC
        ");
        $stmt->execute([$ownerId]);
        $tasks = $stmt->fetchAll();
        foreach ($tasks as &$task) {
            $task['owner'] = [
                'id' => $task['ownerId'],
                'username' => $task['owner_username'],
                'email' => $task['owner_email']
            ];
            unset($task['owner_username'], $task['owner_email']);
        }
        return $tasks;
    }

    public function update(int $id, array $data): ?array {
        try {
            $fields = [];
            $values = [];

            if (isset($data['title'])) {
                $fields[] = 'title = ?';
                $values[] = $data['title'];
            }
            if (isset($data['description'])) {
                $fields[] = 'description = ?';
                $values[] = $data['description'];
            }
            if (isset($data['status'])) {
                $fields[] = 'status = ?';
                $values[] = $data['status'];
            }
            if (isset($data['dueDate'])) {
                $fields[] = 'dueDate = ?';
                $values[] = $data['dueDate'];
            }
            if (isset($data['priority'])) {
                $fields[] = 'priority = ?';
                $values[] = $data['priority'];
            }

            if (empty($fields)) {
                return $this->findById($id);
            }

            $fields[] = 'updatedAt = NOW()';
            $values[] = $id;

            $stmt = $this->db->prepare("
                UPDATE tasks SET " . implode(', ', $fields) . " WHERE id = ?
            ");
            $stmt->execute($values);

            return $this->findById($id);
        } catch (PDOException $e) {
            throw new PDOException('Failed to update task: ' . $e->getMessage());
        }
    }

    public function delete(int $id): bool {
        $stmt = $this->db->prepare("DELETE FROM tasks WHERE id = ?");
        return $stmt->execute([$id]);
    }

    public function getAll(): array {
        $stmt = $this->db->query("
            SELECT t.*, u.username as owner_username, u.email as owner_email
            FROM tasks t
            LEFT JOIN users u ON t.ownerId = u.id
            ORDER BY t.dueDate ASC, t.createdAt DESC
        ");
        $tasks = $stmt->fetchAll();
        foreach ($tasks as &$task) {
            $task['owner'] = [
                'id' => $task['ownerId'],
                'username' => $task['owner_username'],
                'email' => $task['owner_email']
            ];
            unset($task['owner_username'], $task['owner_email']);
        }
        return $tasks;
    }

    public function getStats(): array {
        $stmt = $this->db->query("
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN status = 'todo' THEN 1 ELSE 0 END) as todo,
                SUM(CASE WHEN status = 'in-progress' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
            FROM tasks
        ");
        return $stmt->fetch();
    }
}
