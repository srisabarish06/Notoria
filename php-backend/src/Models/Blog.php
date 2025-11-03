<?php

namespace Notoria\Models;

use Notoria\Database;
use PDO;
use PDOException;

class Blog {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    public function create(array $data): array {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO blogs (title, content, authorId, isPublic, tags, views, likes, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ");
            $stmt->execute([
                $data['title'],
                $data['content'],
                $data['authorId'],
                $data['isPublic'] ?? false,
                json_encode($data['tags'] ?? []),
                $data['views'] ?? 0,
                json_encode($data['likes'] ?? [])
            ]);

            $blogId = $this->db->lastInsertId();
            return $this->findById($blogId);
        } catch (PDOException $e) {
            throw new PDOException('Failed to create blog: ' . $e->getMessage());
        }
    }

    public function findById(int $id): ?array {
        $stmt = $this->db->prepare("
            SELECT b.*, u.username as author_username, u.email as author_email
            FROM blogs b
            LEFT JOIN users u ON b.authorId = u.id
            WHERE b.id = ?
        ");
        $stmt->execute([$id]);
        $blog = $stmt->fetch();
        if ($blog) {
            $blog['tags'] = json_decode($blog['tags'], true);
            $blog['likes'] = json_decode($blog['likes'], true);
            $blog['author'] = [
                'id' => $blog['authorId'],
                'username' => $blog['author_username'],
                'email' => $blog['author_email']
            ];
            unset($blog['author_username'], $blog['author_email']);
        }
        return $blog ?: null;
    }

    public function findByAuthorId(int $authorId): array {
        $stmt = $this->db->prepare("
            SELECT b.*, u.username as author_username, u.email as author_email
            FROM blogs b
            LEFT JOIN users u ON b.authorId = u.id
            WHERE b.authorId = ?
            ORDER BY b.updatedAt DESC
        ");
        $stmt->execute([$authorId]);
        $blogs = $stmt->fetchAll();
        foreach ($blogs as &$blog) {
            $blog['tags'] = json_decode($blog['tags'], true);
            $blog['likes'] = json_decode($blog['likes'], true);
            $blog['author'] = [
                'id' => $blog['authorId'],
                'username' => $blog['author_username'],
                'email' => $blog['author_email']
            ];
            unset($blog['author_username'], $blog['author_email']);
        }
        return $blogs;
    }

    public function findPublic(): array {
        $stmt = $this->db->query("
            SELECT b.*, u.username as author_username, u.email as author_email
            FROM blogs b
            LEFT JOIN users u ON b.authorId = u.id
            WHERE b.isPublic = 1
            ORDER BY b.updatedAt DESC
        ");
        $blogs = $stmt->fetchAll();
        foreach ($blogs as &$blog) {
            $blog['tags'] = json_decode($blog['tags'], true);
            $blog['likes'] = json_decode($blog['likes'], true);
            $blog['author'] = [
                'id' => $blog['authorId'],
                'username' => $blog['author_username'],
                'email' => $blog['author_email']
            ];
            unset($blog['author_username'], $blog['author_email']);
        }
        return $blogs;
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
            if (isset($data['isPublic'])) {
                $fields[] = 'isPublic = ?';
                $values[] = $data['isPublic'];
            }
            if (isset($data['tags'])) {
                $fields[] = 'tags = ?';
                $values[] = json_encode($data['tags']);
            }
            if (isset($data['views'])) {
                $fields[] = 'views = ?';
                $values[] = $data['views'];
            }
            if (isset($data['likes'])) {
                $fields[] = 'likes = ?';
                $values[] = json_encode($data['likes']);
            }

            if (empty($fields)) {
                return $this->findById($id);
            }

            $fields[] = 'updatedAt = NOW()';
            $values[] = $id;

            $stmt = $this->db->prepare("
                UPDATE blogs SET " . implode(', ', $fields) . " WHERE id = ?
            ");
            $stmt->execute($values);

            return $this->findById($id);
        } catch (PDOException $e) {
            throw new PDOException('Failed to update blog: ' . $e->getMessage());
        }
    }

    public function incrementViews(int $id): bool {
        $stmt = $this->db->prepare("UPDATE blogs SET views = views + 1 WHERE id = ?");
        return $stmt->execute([$id]);
    }

    public function delete(int $id): bool {
        $stmt = $this->db->prepare("DELETE FROM blogs WHERE id = ?");
        return $stmt->execute([$id]);
    }

    public function getAll(): array {
        $stmt = $this->db->query("
            SELECT b.*, u.username as author_username, u.email as author_email
            FROM blogs b
            LEFT JOIN users u ON b.authorId = u.id
            ORDER BY b.updatedAt DESC
        ");
        $blogs = $stmt->fetchAll();
        foreach ($blogs as &$blog) {
            $blog['tags'] = json_decode($blog['tags'], true);
            $blog['likes'] = json_decode($blog['likes'], true);
            $blog['author'] = [
                'id' => $blog['authorId'],
                'username' => $blog['author_username'],
                'email' => $blog['author_email']
            ];
            unset($blog['author_username'], $blog['author_email']);
        }
        return $blogs;
    }
}
