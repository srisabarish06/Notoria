<?php

namespace Notoria;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Notoria\Models\User;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;

class AuthMiddleware {
    private string $jwtSecret;
    private string $jwtRefreshSecret;

    public function __construct() {
        $this->jwtSecret = $_ENV['JWT_SECRET'] ?? 'your-secret-key';
        $this->jwtRefreshSecret = $_ENV['JWT_REFRESH_SECRET'] ?? 'your-refresh-secret-key';
    }

    public function authenticateToken(Request $request, Response $response, callable $next): Response {
        try {
            $authHeader = $request->getHeaderLine('Authorization');
            $token = null;

            if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
                $token = $matches[1];
            }

            if (!$token) {
                $response->getBody()->write(json_encode(['error' => 'Access token required']));
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
            }

            $decoded = JWT::decode($token, new Key($this->jwtSecret, 'HS256'));
            $userModel = new User();
            $user = $userModel->findById($decoded->userId);

            if (!$user) {
                $response->getBody()->write(json_encode(['error' => 'User not found']));
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
            }

            // Add user to request attributes
            $request = $request->withAttribute('user', $user);

            return $next($request, $response);
        } catch (\Exception $e) {
            if ($e instanceof \Firebase\JWT\ExpiredException) {
                $response->getBody()->write(json_encode(['error' => 'Token expired']));
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
            }
            $response->getBody()->write(json_encode(['error' => 'Invalid token']));
            return $response->withStatus(403)->withHeader('Content-Type', 'application/json');
        }
    }

    public function authenticateAdmin(Request $request, Response $response, callable $next): Response {
        $user = $request->getAttribute('user');

        if (!$user || !$user['isAdmin']) {
            $response->getBody()->write(json_encode(['error' => 'Admin access required']));
            return $response->withStatus(403)->withHeader('Content-Type', 'application/json');
        }

        return $next($request, $response);
    }

    public function generateAccessToken(int $userId): string {
        $payload = [
            'userId' => $userId,
            'iat' => time(),
            'exp' => time() + (15 * 60) // 15 minutes
        ];

        return JWT::encode($payload, $this->jwtSecret, 'HS256');
    }

    public function generateRefreshToken(int $userId): string {
        $payload = [
            'userId' => $userId,
            'iat' => time(),
            'exp' => time() + (7 * 24 * 60 * 60) // 7 days
        ];

        return JWT::encode($payload, $this->jwtRefreshSecret, 'HS256');
    }

    public function validateRefreshToken(string $token): ?object {
        try {
            return JWT::decode($token, new Key($this->jwtRefreshSecret, 'HS256'));
        } catch (\Exception $e) {
            return null;
        }
    }
}
