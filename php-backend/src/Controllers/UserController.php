<?php

namespace Notoria\Controllers;

use Notoria\Models\User;
use Notoria\AuthMiddleware;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;

class UserController {
    private User $userModel;
    private AuthMiddleware $auth;

    public function __construct() {
        $this->userModel = new User();
        $this->auth = new AuthMiddleware();
    }

    public function register(Request $request, Response $response): Response {
        try {
            $data = json_decode($request->getBody()->getContents(), true);

            if (!isset($data['username']) || !isset($data['email']) || !isset($data['password'])) {
                $response->getBody()->write(json_encode(['error' => 'All fields are required']));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            $user = $this->userModel->create([
                'username' => $data['username'],
                'email' => $data['email'],
                'password' => $data['password'],
                'isAdmin' => $data['isAdmin'] ?? false
            ]);

            $accessToken = $this->auth->generateAccessToken($user['id']);
            $refreshToken = $this->auth->generateRefreshToken($user['id']);

            $this->userModel->updateRefreshToken($user['id'], $refreshToken);

            $response->getBody()->write(json_encode([
                'message' => 'User registered successfully',
                'user' => [
                    'id' => $user['id'],
                    'username' => $user['username'],
                    'email' => $user['email']
                ],
                'accessToken' => $accessToken,
                'refreshToken' => $refreshToken
            ]));

            return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function login(Request $request, Response $response): Response {
        try {
            $data = json_decode($request->getBody()->getContents(), true);

            if (!isset($data['email']) || !isset($data['password'])) {
                $response->getBody()->write(json_encode(['error' => 'Email and password are required']));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            $user = $this->userModel->findByEmail($data['email']);

            if (!$user || !$this->userModel->verifyPassword($data['password'], $user['password'])) {
                $response->getBody()->write(json_encode(['error' => 'Invalid credentials']));
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
            }

            $accessToken = $this->auth->generateAccessToken($user['id']);
            $refreshToken = $this->auth->generateRefreshToken($user['id']);

            $this->userModel->updateRefreshToken($user['id'], $refreshToken);

            $response->getBody()->write(json_encode([
                'message' => 'Login successful',
                'user' => [
                    'id' => $user['id'],
                    'username' => $user['username'],
                    'email' => $user['email'],
                    'isAdmin' => $user['isAdmin']
                ],
                'accessToken' => $accessToken,
                'refreshToken' => $refreshToken
            ]));

            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function refresh(Request $request, Response $response): Response {
        try {
            $data = json_decode($request->getBody()->getContents(), true);

            if (!isset($data['refreshToken'])) {
                $response->getBody()->write(json_encode(['error' => 'Refresh token required']));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            $decoded = $this->auth->validateRefreshToken($data['refreshToken']);

            if (!$decoded) {
                $response->getBody()->write(json_encode(['error' => 'Invalid refresh token']));
                return $response->withStatus(403)->withHeader('Content-Type', 'application/json');
            }

            $user = $this->userModel->findById($decoded->userId);

            if (!$user || $user['refreshToken'] !== $data['refreshToken']) {
                $response->getBody()->write(json_encode(['error' => 'Invalid refresh token']));
                return $response->withStatus(403)->withHeader('Content-Type', 'application/json');
            }

            $accessToken = $this->auth->generateAccessToken($user['id']);

            $response->getBody()->write(json_encode(['accessToken' => $accessToken]));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function me(Request $request, Response $response): Response {
        $user = $request->getAttribute('user');

        $response->getBody()->write(json_encode([
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'email' => $user['email'],
                'isAdmin' => $user['isAdmin']
            ]
        ]));

        return $response->withHeader('Content-Type', 'application/json');
    }

    public function getAll(Request $request, Response $response): Response {
        try {
            $users = $this->userModel->getAll();
            $response->getBody()->write(json_encode($users));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function delete(Request $request, Response $response, array $args): Response {
        try {
            $userId = (int) $args['id'];
            $success = $this->userModel->delete($userId);

            if (!$success) {
                $response->getBody()->write(json_encode(['error' => 'User not found']));
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }

            $response->getBody()->write(json_encode(['message' => 'User deleted successfully']));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
}
