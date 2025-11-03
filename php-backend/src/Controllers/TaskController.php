<?php

namespace Notoria\Controllers;

use Notoria\Models\Task;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;

class TaskController {
    private Task $taskModel;

    public function __construct() {
        $this->taskModel = new Task();
    }

    public function getAll(Request $request, Response $response): Response {
        try {
            $user = $request->getAttribute('user');
            $tasks = $this->taskModel->findByOwnerId($user['id']);
            $response->getBody()->write(json_encode($tasks));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function getById(Request $request, Response $response, array $args): Response {
        try {
            $user = $request->getAttribute('user');
            $taskId = (int) $args['id'];

            $task = $this->taskModel->findById($taskId);

            if (!$task) {
                $response->getBody()->write(json_encode(['error' => 'Task not found']));
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }

            // Check ownership
            if ($task['ownerId'] !== $user['id']) {
                $response->getBody()->write(json_encode(['error' => 'Access denied']));
                return $response->withStatus(403)->withHeader('Content-Type', 'application/json');
            }

            $response->getBody()->write(json_encode($task));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function create(Request $request, Response $response): Response {
        try {
            $user = $request->getAttribute('user');
            $data = json_decode($request->getBody()->getContents(), true);

            if (!isset($data['title'])) {
                $response->getBody()->write(json_encode(['error' => 'Title is required']));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            $task = $this->taskModel->create([
                'title' => $data['title'],
                'description' => $data['description'] ?? '',
                'status' => $data['status'] ?? 'todo',
                'dueDate' => $data['dueDate'] ?? null,
                'priority' => $data['priority'] ?? 'medium',
                'ownerId' => $user['id'],
            ]);

            $response->getBody()->write(json_encode($task));
            return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function update(Request $request, Response $response, array $args): Response {
        try {
            $user = $request->getAttribute('user');
            $taskId = (int) $args['id'];
            $data = json_decode($request->getBody()->getContents(), true);

            $task = $this->taskModel->findById($taskId);

            if (!$task) {
                $response->getBody()->write(json_encode(['error' => 'Task not found']));
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }

            // Check ownership
            if ($task['ownerId'] !== $user['id']) {
                $response->getBody()->write(json_encode(['error' => 'Permission denied']));
                return $response->withStatus(403)->withHeader('Content-Type', 'application/json');
            }

            $updateData = [];
            if (isset($data['title'])) $updateData['title'] = $data['title'];
            if (isset($data['description'])) $updateData['description'] = $data['description'];
            if (isset($data['status'])) $updateData['status'] = $data['status'];
            if (isset($data['dueDate'])) $updateData['dueDate'] = $data['dueDate'];
            if (isset($data['priority'])) $updateData['priority'] = $data['priority'];

            $updatedTask = $this->taskModel->update($taskId, $updateData);

            $response->getBody()->write(json_encode($updatedTask));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function delete(Request $request, Response $response, array $args): Response {
        try {
            $user = $request->getAttribute('user');
            $taskId = (int) $args['id'];

            $task = $this->taskModel->findById($taskId);

            if (!$task) {
                $response->getBody()->write(json_encode(['error' => 'Task not found']));
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }

            // Check ownership
            if ($task['ownerId'] !== $user['id']) {
                $response->getBody()->write(json_encode(['error' => 'Permission denied']));
                return $response->withStatus(403)->withHeader('Content-Type', 'application/json');
            }

            $success = $this->taskModel->delete($taskId);

            if (!$success) {
                $response->getBody()->write(json_encode(['error' => 'Failed to delete task']));
                return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
            }

            $response->getBody()->write(json_encode(['message' => 'Task deleted successfully']));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
}
