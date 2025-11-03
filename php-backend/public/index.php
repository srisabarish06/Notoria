<?php

require_once __DIR__ . '/../vendor/autoload.php';

use Slim\Factory\AppFactory;
use Notoria\Database;
use Notoria\AuthMiddleware;
use Notoria\Controllers\UserController;
use Notoria\Controllers\NoteController;
use Notoria\Controllers\BlogController;
use Notoria\Controllers\TaskController;
use Notoria\Controllers\CollabController;
use Notoria\Controllers\AdminController;

// Load environment variables
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->load();

// Initialize database
Database::init([
    'host' => $_ENV['DB_HOST'] ?? 'localhost',
    'database' => $_ENV['DB_NAME'] ?? 'notes',
    'username' => $_ENV['DB_USER'] ?? 'root',
    'password' => $_ENV['DB_PASSWORD'] ?? ''
]);

$app = AppFactory::create();
$app->addBodyParsingMiddleware();
$app->addRoutingMiddleware();

// CORS middleware
$app->add(function ($request, $handler) {
    $response = $handler->handle($request);
    return $response
        ->withHeader('Access-Control-Allow-Origin', $_ENV['FRONTEND_URL'] ?? 'http://localhost:5173')
        ->withHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Origin, Authorization')
        ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        ->withHeader('Access-Control-Allow-Credentials', 'true');
});

// Initialize controllers
$auth = new AuthMiddleware();
$userController = new UserController();
$noteController = new NoteController();
$blogController = new BlogController();
$taskController = new TaskController();
$collabController = new CollabController();
$adminController = new AdminController();

// Routes
$app->post('/api/users/register', [$userController, 'register']);
$app->post('/api/users/login', [$userController, 'login']);
$app->post('/api/users/refresh', [$userController, 'refresh']);
$app->get('/api/users/me', [$userController, 'me'])->add(function ($request, $handler) use ($auth) {
    return $auth->authenticateToken($request, $handler);
});

// Admin routes
$app->get('/api/admin/users', [$adminController, 'getUsers'])->add(function ($request, $handler) use ($auth) {
    return $auth->authenticateToken($request, $handler);
})->add(function ($request, $handler) use ($auth) {
    return $auth->authenticateAdmin($request, $handler);
});
$app->get('/api/admin/notes', [$adminController, 'getNotes'])->add(function ($request, $handler) use ($auth) {
    return $auth->authenticateToken($request, $handler);
})->add(function ($request, $handler) use ($auth) {
    return $auth->authenticateAdmin($request, $handler);
});
$app->get('/api/admin/blogs', [$adminController, 'getBlogs'])->add(function ($request, $handler) use ($auth) {
    return $auth->authenticateToken($request, $handler);
})->add(function ($request, $handler) use ($auth) {
    return $auth->authenticateAdmin($request, $handler);
});
$app->get('/api/admin/analytics', [$adminController, 'getAnalytics'])->add(function ($request, $handler) use ($auth) {
    return $auth->authenticateToken($request, $handler);
})->add(function ($request, $handler) use ($auth) {
    return $auth->authenticateAdmin($request, $handler);
});
$app->delete('/api/admin/users/{id}', [$adminController, 'deleteUser'])->add(function ($request, $handler) use ($auth) {
    return $auth->authenticateToken($request, $handler);
})->add(function ($request, $handler) use ($auth) {
    return $auth->authenticateAdmin($request, $handler);
});

// Note routes
$app->get('/api/notes', [$noteController, 'getAll'])->add(function ($request, $handler) use ($auth) {
    return $auth->authenticateToken($request, $handler);
});
$app->get('/api/notes/{id}', [$noteController, 'getById'])->add(function ($request, $handler) use ($auth) {
    return $auth->authenticateToken($request, $handler);
});
$app->post('/api/notes', [$noteController, 'create'])->add(function ($request, $handler) use ($auth) {
    return $auth->authenticateToken($request, $handler);
});
$app->put('/api/notes/{id}', [$noteController, 'update'])->add(function ($request, $handler) use ($auth) {
    return $auth->authenticateToken($request, $handler);
});
$app->delete('/api/notes/{id}', [$noteController, 'delete'])->add(function ($request, $handler) use ($auth) {
    return $auth->authenticateToken($request, $handler);
});
$app->post('/api/notes/{id}/collaborators', [$noteController, 'addCollaborator'])->add(function ($request, $handler) use ($auth) {
    return $auth->authenticateToken($request, $handler);
});

// Blog routes
$app->get('/api/blogs/public', [$blogController, 'getPublic']);
$app->get('/api/blogs/my', [$blogController, 'getMy'])->add(function ($request, $handler) use ($auth) {
    return $auth->authenticateToken($request, $handler);
});
$app->get('/api/blogs/{id}', [$blogController, 'getById']);
$app->post('/api/blogs', [$blogController, 'create'])->add(function ($request, $handler) use ($auth) {
    return $auth->authenticateToken($request, $handler);
});
$app->put('/api/blogs/{id}', [$blogController, 'update'])->add(function ($request, $handler) use ($auth) {
    return $auth->authenticateToken($request, $handler);
});
$app->delete('/api/blogs/{id}', [$blogController, 'delete'])->add(function ($request, $handler) use ($auth) {
    return $auth->authenticateToken($request, $handler);
});
$app->post('/api/blogs/{id}/like', [$blogController, 'like'])->add(function ($request, $handler) use ($auth) {
    return $auth->authenticateToken($request, $handler);
});

// Task routes
$app->get('/api/tasks', [$taskController, 'getAll'])->add(function ($request, $handler) use ($auth) {
    return $auth->authenticateToken($request, $handler);
});
$app->get('/api/tasks/{id}', [$taskController, 'getById'])->add(function ($request, $handler) use ($auth) {
    return $auth->authenticateToken($request, $handler);
});
$app->post('/api/tasks', [$taskController, 'create'])->add(function ($request, $handler) use ($auth) {
    return $auth->authenticateToken($request, $handler);
});
$app->put('/api/tasks/{id}', [$taskController, 'update'])->add(function ($request, $handler) use ($auth) {
    return $auth->authenticateToken($request, $handler);
});
$app->delete('/api/tasks/{id}', [$taskController, 'delete'])->add(function ($request, $handler) use ($auth) {
    return $auth->authenticateToken($request, $handler);
});

// Collaboration routes
$app->get('/api/collaborations/invites', [$collabController, 'getInvites'])->add(function ($request, $handler) use ($auth) {
    return $auth->authenticateToken($request, $handler);
});
$app->post('/api/collaborations/invites/{id}/accept', [$collabController, 'acceptInvite'])->add(function ($request, $handler) use ($auth) {
    return $auth->authenticateToken($request, $handler);
});
$app->post('/api/collaborations/invites/{id}/decline', [$collabController, 'declineInvite'])->add(function ($request, $handler) use ($auth) {
    return $auth->authenticateToken($request, $handler);
});
$app->post('/api/collaborations/share', [$collabController, 'share'])->add(function ($request, $handler) use ($auth) {
    return $auth->authenticateToken($request, $handler);
});
$app->get('/api/collaborations/note/{noteId}', [$collabController, 'getByNote'])->add(function ($request, $handler) use ($auth) {
    return $auth->authenticateToken($request, $handler);
});

// Health check
$app->get('/api/health', function ($request, $response) {
    $response->getBody()->write(json_encode([
        'status' => 'OK',
        'message' => 'Notoria PHP API is running'
    ]));
    return $response->withHeader('Content-Type', 'application/json');
});

$app->run();
