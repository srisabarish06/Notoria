<?php

namespace Notoria\Controllers;

use Notoria\Models\Note;
use Notoria\Models\User;
use Notoria\Models\Collab;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;

class NoteController {
    private Note $noteModel;
    private Collab $collabModel;

    public function __construct() {
        $this->noteModel = new Note();
        $this->collabModel = new Collab();
    }

    public function getAll(Request $request, Response $response): Response {
        try {
            $user = $request->getAttribute('user');

            // Get user's own notes
            $ownNotes = $this->noteModel->findByOwnerId($user['id']);

            // Get public notes
            $publicNotes = $this->noteModel->findPublic();

            // Get notes where user is collaborator
            $collabNotes = [];
            $collaborations = $this->collabModel->findByUserId($user['id']);
            foreach ($collaborations as $collab) {
                if ($collab['status'] === 'accepted') {
                    $note = $this->noteModel->findById($collab['noteId']);
                    if ($note) {
                        $collabNotes[] = $note;
                    }
                }
            }

            // Combine and deduplicate
            $allNotes = array_merge($ownNotes, $publicNotes, $collabNotes);
            $uniqueNotes = [];
            $seenIds = [];

            foreach ($allNotes as $note) {
                if (!in_array($note['id'], $seenIds)) {
                    $seenIds[] = $note['id'];
                    $uniqueNotes[] = $note;
                }
            }

            // Sort by updatedAt DESC
            usort($uniqueNotes, function($a, $b) {
                return strtotime($b['updatedAt']) - strtotime($a['updatedAt']);
            });

            $response->getBody()->write(json_encode($uniqueNotes));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function getById(Request $request, Response $response, array $args): Response {
        try {
            $user = $request->getAttribute('user');
            $noteId = (int) $args['id'];

            $note = $this->noteModel->findById($noteId);

            if (!$note) {
                $response->getBody()->write(json_encode(['error' => 'Note not found']));
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }

            // Check access
            $hasAccess = $note['ownerId'] === $user['id'] ||
                        $note['isPublic'] ||
                        $this->hasCollaborationAccess($noteId, $user['id']);

            if (!$hasAccess) {
                $response->getBody()->write(json_encode(['error' => 'Access denied']));
                return $response->withStatus(403)->withHeader('Content-Type', 'application/json');
            }

            $response->getBody()->write(json_encode($note));
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

            $note = $this->noteModel->create([
                'title' => $data['title'] ?? 'Untitled Note',
                'content' => $data['content'] ?? '',
                'tags' => $data['tags'] ?? [],
                'ownerId' => $user['id'],
                'isPublic' => $data['isPublic'] ?? false
            ]);

            $response->getBody()->write(json_encode($note));
            return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function update(Request $request, Response $response, array $args): Response {
        try {
            $user = $request->getAttribute('user');
            $noteId = (int) $args['id'];
            $data = json_decode($request->getBody()->getContents(), true);

            $note = $this->noteModel->findById($noteId);

            if (!$note) {
                $response->getBody()->write(json_encode(['error' => 'Note not found']));
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }

            // Check permissions
            $isOwner = $note['ownerId'] === $user['id'];
            $isEditor = $this->hasEditorAccess($noteId, $user['id']);

            if (!$isOwner && !$isEditor) {
                $response->getBody()->write(json_encode(['error' => 'Permission denied']));
                return $response->withStatus(403)->withHeader('Content-Type', 'application/json');
            }

            $updateData = [];
            if (isset($data['title'])) $updateData['title'] = $data['title'];
            if (isset($data['content'])) $updateData['content'] = $data['content'];
            if (isset($data['tags'])) $updateData['tags'] = $data['tags'];
            if (isset($data['isPublic']) && $isOwner) $updateData['isPublic'] = $data['isPublic'];

            $updatedNote = $this->noteModel->update($noteId, $updateData);

            // TODO: Emit WebSocket event for real-time updates

            $response->getBody()->write(json_encode($updatedNote));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function delete(Request $request, Response $response, array $args): Response {
        try {
            $user = $request->getAttribute('user');
            $noteId = (int) $args['id'];

            $note = $this->noteModel->findById($noteId);

            if (!$note) {
                $response->getBody()->write(json_encode(['error' => 'Note not found']));
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }

            // Only owner can delete
            if ($note['ownerId'] !== $user['id']) {
                $response->getBody()->write(json_encode(['error' => 'Only owner can delete note']));
                return $response->withStatus(403)->withHeader('Content-Type', 'application/json');
            }

            $success = $this->noteModel->delete($noteId);

            if (!$success) {
                $response->getBody()->write(json_encode(['error' => 'Failed to delete note']));
                return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
            }

            $response->getBody()->write(json_encode(['message' => 'Note deleted successfully']));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function addCollaborator(Request $request, Response $response, array $args): Response {
        try {
            $user = $request->getAttribute('user');
            $noteId = (int) $args['id'];
            $data = json_decode($request->getBody()->getContents(), true);

            $note = $this->noteModel->findById($noteId);

            if (!$note) {
                $response->getBody()->write(json_encode(['error' => 'Note not found']));
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }

            // Only owner can add collaborators
            if ($note['ownerId'] !== $user['id']) {
                $response->getBody()->write(json_encode(['error' => 'Only owner can add collaborators']));
                return $response->withStatus(403)->withHeader('Content-Type', 'application/json');
            }

            $collab = $this->collabModel->create([
                'noteId' => $noteId,
                'userId' => $data['userId'],
                'role' => $data['role'] ?? 'editor',
                'invitedById' => $user['id'],
                'status' => 'pending'
            ]);

            $response->getBody()->write(json_encode($collab));
            return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    private function hasCollaborationAccess(int $noteId, int $userId): bool {
        $collaborations = $this->collabModel->findByNoteId($noteId);
        foreach ($collaborations as $collab) {
            if ($collab['userId'] === $userId && $collab['status'] === 'accepted') {
                return true;
            }
        }
        return false;
    }

    private function hasEditorAccess(int $noteId, int $userId): bool {
        $collaborations = $this->collabModel->findByNoteId($noteId);
        foreach ($collaborations as $collab) {
            if ($collab['userId'] === $userId && $collab['status'] === 'accepted' && $collab['role'] === 'editor') {
                return true;
            }
        }
        return false;
    }
}
