<?php

namespace Notoria\Controllers;

use Notoria\Models\User;
use Notoria\Models\Note;
use Notoria\Models\Blog;
use Notoria\Models\Task;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;

class AdminController {
    private User $userModel;
    private Note $noteModel;
    private Blog $blogModel;
    private Task $taskModel;

    public function __construct() {
        $this->userModel = new User();
        $this->noteModel = new Note();
        $this->blogModel = new Blog();
        $this->taskModel = new Task();
    }

    public function getUsers(Request $request, Response $response): Response {
        try {
            $users = $this->userModel->getAll();
            // Remove passwords and refresh tokens
            foreach ($users as &$user) {
                unset($user['password'], $user['refreshToken']);
            }
            $response->getBody()->write(json_encode($users));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function getNotes(Request $request, Response $response): Response {
        try {
            $notes = $this->noteModel->getAll();
            $response->getBody()->write(json_encode($notes));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function getBlogs(Request $request, Response $response): Response {
        try {
            $blogs = $this->blogModel->getAll();
            $response->getBody()->write(json_encode($blogs));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function getAnalytics(Request $request, Response $response): Response {
        try {
            $totalUsers = count($this->userModel->getAll());
            $totalNotes = count($this->noteModel->getAll());
            $totalBlogs = count($this->blogModel->getAll());
            $totalTasks = count($this->taskModel->getAll());

            $publicBlogs = 0;
            $blogs = $this->blogModel->getAll();
            foreach ($blogs as $blog) {
                if ($blog['isPublic']) {
                    $publicBlogs++;
                }
            }

            $publicNotes = 0;
            $notes = $this->noteModel->getAll();
            foreach ($notes as $note) {
                if ($note['isPublic']) {
                    $publicNotes++;
                }
            }

            // Recent activity (last 7 days)
            $sevenDaysAgo = date('Y-m-d H:i:s', strtotime('-7 days'));

            $recentUsers = 0;
            $users = $this->userModel->getAll();
            foreach ($users as $user) {
                if ($user['createdAt'] >= $sevenDaysAgo) {
                    $recentUsers++;
                }
            }

            $recentNotes = 0;
            foreach ($notes as $note) {
                if ($note['createdAt'] >= $sevenDaysAgo) {
                    $recentNotes++;
                }
            }

            $recentBlogs = 0;
            foreach ($blogs as $blog) {
                if ($blog['createdAt'] >= $sevenDaysAgo) {
                    $recentBlogs++;
                }
            }

            $response->getBody()->write(json_encode([
                'overview' => [
                    'totalUsers' => $totalUsers,
                    'totalNotes' => $totalNotes,
                    'totalBlogs' => $totalBlogs,
                    'totalTasks' => $totalTasks,
                    'publicBlogs' => $publicBlogs,
                    'publicNotes' => $publicNotes,
                ],
                'recentActivity' => [
                    'recentUsers' => $recentUsers,
                    'recentNotes' => $recentNotes,
                    'recentBlogs' => $recentBlogs,
                ],
            ]));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function deleteUser(Request $request, Response $response, array $args): Response {
        try {
            $userId = (int) $args['id'];
            $user = $this->userModel->findById($userId);

            if (!$user) {
                $response->getBody()->write(json_encode(['error' => 'User not found']));
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }

            // Prevent deleting self
            $currentUser = $request->getAttribute('user');
            if ($user['id'] === $currentUser['id']) {
                $response->getBody()->write(json_encode(['error' => 'Cannot delete yourself']));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            $success = $this->userModel->delete($userId);

            if (!$success) {
                $response->getBody()->write(json_encode(['error' => 'Failed to delete user']));
                return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
            }

            $response->getBody()->write(json_encode(['message' => 'User deleted successfully']));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
}
