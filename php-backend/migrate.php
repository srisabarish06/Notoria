<?php

require_once __DIR__ . '/vendor/autoload.php';

use Notoria\Database;

// Load environment variables
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

// Initialize database
Database::init([
    'host' => $_ENV['DB_HOST'] ?? 'localhost',
    'database' => $_ENV['DB_NAME'] ?? 'notes',
    'username' => $_ENV['DB_USER'] ?? 'root',
    'password' => $_ENV['DB_PASSWORD'] ?? ''
]);

try {
    $db = Database::getInstance();

    echo "Creating database tables...\n";

    // Users table
    $db->exec("
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(30) NOT NULL UNIQUE,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            isAdmin BOOLEAN DEFAULT FALSE,
            refreshToken TEXT,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_username (username),
            INDEX idx_email (email)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    // Notes table
    $db->exec("
        CREATE TABLE IF NOT EXISTS notes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            content TEXT,
            tags JSON DEFAULT ('[]'),
            ownerId INT NOT NULL,
            isPublic BOOLEAN DEFAULT FALSE,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (ownerId) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_owner (ownerId),
            INDEX idx_public (isPublic)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    // Blogs table
    $db->exec("
        CREATE TABLE IF NOT EXISTS blogs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            authorId INT NOT NULL,
            isPublic BOOLEAN DEFAULT FALSE,
            tags JSON DEFAULT ('[]'),
            views INT DEFAULT 0,
            likes JSON DEFAULT ('[]'),
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (authorId) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_author (authorId),
            INDEX idx_public (isPublic)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    // Tasks table
    $db->exec("
        CREATE TABLE IF NOT EXISTS tasks (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            status ENUM('todo', 'in-progress', 'completed') DEFAULT 'todo',
            dueDate DATETIME NULL,
            ownerId INT NOT NULL,
            priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (ownerId) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_owner (ownerId),
            INDEX idx_status (status),
            INDEX idx_due_date (dueDate)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    // Collaborations table
    $db->exec("
        CREATE TABLE IF NOT EXISTS collaborations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            noteId INT NOT NULL,
            userId INT NOT NULL,
            role ENUM('viewer', 'editor') DEFAULT 'editor',
            invitedById INT,
            status ENUM('pending', 'accepted', 'declined') DEFAULT 'pending',
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (noteId) REFERENCES notes(id) ON DELETE CASCADE,
            FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (invitedById) REFERENCES users(id) ON DELETE SET NULL,
            UNIQUE KEY unique_note_user (noteId, userId),
            INDEX idx_note (noteId),
            INDEX idx_user (userId)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    echo "Database tables created successfully!\n";
    echo "Migration completed.\n";

} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
