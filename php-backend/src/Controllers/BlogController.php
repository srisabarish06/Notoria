<?php

namespace Notoria\Controllers;

use Notoria\Models\Blog;
use Notoria\Models\User;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;

class BlogController {
    private Blog $blogModel;

    public function __construct() {
        $this->blogModel = new Blog();
    }

    public function getPublic(Request $request, Response $response): Response {
        try {
            $blogs = $this->blogModel->findPublic();
            $response->getBody()->write(json_encode($blogs));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function getMy(Request $request, Response $response): Response {
        try {
            $user = $request->getAttribute('user');
            $blogs = $this->blogModel->findByAuthorId($user['id']);
            $response->getBody()->write(json_encode($blogs));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function getById(Request $request, Response $response, array $args): Response {
        try {
            $user = $request->getAttribute('user');
            $blogId = (int) $args['id'];

            $blog = $this->blogModel->findById($blogId);

            if (!$blog) {
                $response->getBody()->write(json_encode(['error' => 'Blog not found']));
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }

            // Check access
            if (!$blog['isPublic'] && $user['id'] !== $blog['authorId']) {
                $response->getBody()->write(json_encode(['error' => 'Access denied']));
                return $response->withStatus(403)->withHeader('Content-Type', 'application/json');
            }

            // Increment views for public blogs
            if ($blog['isPublic']) {
                $this->blogModel->incrementViews($blogId);
                $blog['views'] += 1;
            }

            $response->getBody()->write(json_encode($blog));
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

            if (!isset($data['title']) || !isset($data['content'])) {
                $response->getBody()->write(json_encode(['error' => 'Title and content are required']));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            $blog = $this->blogModel->create([
                'title' => $data['title'],
                'content' => $data['content'],
                'tags' => $data['tags'] ?? [],
                'authorId' => $user['id'],
                'isPublic' => $data['isPublic'] ?? false,
            ]);

            $response->getBody()->write(json_encode($blog));
            return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function update(Request $request, Response $response, array $args): Response {
        try {
            $user = $request->getAttribute('user');
            $blogId = (int) $args['id'];
            $data = json_decode($request->getBody()->getContents(), true);

            $blog = $this->blogModel->findById($blogId);

            if (!$blog) {
                $response->getBody()->write(json_encode(['error' => 'Blog not found']));
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }

            // Only author can update
            if ($blog['authorId'] !== $user['id']) {
                $response->getBody()->write(json_encode(['error' => 'Permission denied']));
                return $response->withStatus(403)->withHeader('Content-Type', 'application/json');
            }

            $updateData = [];
            if (isset($data['title'])) $updateData['title'] = $data['title'];
            if (isset($data['content'])) $updateData['content'] = $data['content'];
            if (isset($data['tags'])) $updateData['tags'] = $data['tags'];
            if (isset($data['isPublic'])) $updateData['isPublic'] = $data['isPublic'];

            $updatedBlog = $this->blogModel->update($blogId, $updateData);

            $response->getBody()->write(json_encode($updatedBlog));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function delete(Request $request, Response $response, array $args): Response {
        try {
            $user = $request->getAttribute('user');
            $blogId = (int) $args['id'];

            $blog = $this->blogModel->findById($blogId);

            if (!$blog) {
                $response->getBody()->write(json_encode(['error' => 'Blog not found']));
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }

            // Only author can delete
            if ($blog['authorId'] !== $user['id']) {
                $response->getBody()->write(json_encode(['error' => 'Permission denied']));
                return $response->withStatus(403)->withHeader('Content-Type', 'application/json');
            }

            $success = $this->blogModel->delete($blogId);

            if (!$success) {
                $response->getBody()->write(json_encode(['error' => 'Failed to delete blog']));
                return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
            }

            $response->getBody()->write(json_encode(['message' => 'Blog deleted successfully']));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function like(Request $request, Response $response, array $args): Response {
        try {
            $user = $request->getAttribute('user');
            $blogId = (int) $args['id'];

            $blog = $this->blogModel->findById($blogId);

            if (!$blog) {
                $response->getBody()->write(json_encode(['error' => 'Blog not found']));
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }

            $likes = $blog['likes'] ?? [];
            $userId = $user['id'];
            $likeIndex = array_search($userId, $likes);

            if ($likeIndex !== false) {
                unset($likes[$likeIndex]);
                $likes = array_values($likes);
            } else {
                $likes[] = $userId;
            }

            $this->blogModel->update($blogId, ['likes' => $likes]);

            $response->getBody()->write(json_encode([
                'likes' => count($likes),
                'liked' => $likeIndex === false
            ]));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
}
