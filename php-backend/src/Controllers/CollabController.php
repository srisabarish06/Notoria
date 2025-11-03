<?php

namespace Notoria\Controllers;

use Notoria\Models\Note;
use Notoria\Models\Collab;
use Notoria\Models\User;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;

class CollabController {
    private Collab $collabModel;
    private Note $noteModel;
    private User $userModel;

    public function __construct() {
        $this->collabModel = new Collab();
        $this->noteModel = new Note();
        $this->userModel = new User();
    }

    public function getInvites(Request $request, Response $response): Response {
        try {
            $user = $request->getAttribute('user');
            $invites = $this->collabModel->getPendingByUserId($user['id']);
            $response->getBody()->write(json_encode($invites));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function acceptInvite(Request $request, Response $response, array $args): Response {
        try {
            $user = $request->getAttribute('user');
            $collabId = (int) $args['id'];

            $collab = $this->collabModel->findById($collabId);

            if (!$collab) {
                $response->getBody()->write(json_encode(['error' => 'Invite not found']));
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }

            if ($collab['userId'] !== $user['id']) {
                $response->getBody()->write(json_encode(['error' => 'Permission denied']));
                return $response->withStatus(403)->withHeader('Content-Type', 'application/json');
            }

            $updatedCollab = $this->collabModel->updateStatus($collabId, 'accepted');

            $response->getBody()->write(json_encode([
                'message' => 'Invite accepted',
                'collab' => $updatedCollab
            ]));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function declineInvite(Request $request, Response $response, array $args): Response {
        try {
            $user = $request->getAttribute('user');
            $collabId = (int) $args['id'];

            $collab = $this->collabModel->findById($collabId);

            if (!$collab) {
                $response->getBody()->write(json_encode(['error' => 'Invite not found']));
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }

            if ($collab['userId'] !== $user['id']) {
                $response->getBody()->write(json_encode(['error' => 'Permission denied']));
                return $response->withStatus(403)->withHeader('Content-Type', 'application/json');
            }

            $this->collabModel->updateStatus($collabId, 'declined');

            $response->getBody()->write(json_encode(['message' => 'Invite declined']));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function share(Request $request, Response $response): Response {
        try {
            $user = $request->getAttribute('user');
            $data = json_decode($request->getBody()->getContents(), true);

            if (!isset($data['noteId']) || !isset($data['userEmail'])) {
                $response->getBody()->write(json_encode(['error' => 'Note ID and user email are required']));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            // Find note
            $note = $this->noteModel->findById($data['noteId']);

            if (!$note) {
                $response->getBody()->write(json_encode(['error' => 'Note not found']));
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }

            // Check ownership
            if ($note['ownerId'] !== $user['id']) {
                $response->getBody()->write(json_encode(['error' => 'Only owner can share note']));
                return $response->withStatus(403)->withHeader('Content-Type', 'application/json');
            }

            // Find user to invite
            $userToInvite = $this->userModel->findByEmail($data['userEmail']);

            if (!$userToInvite) {
                $response->getBody()->write(json_encode(['error' => 'User not found']));
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }

            // Check if already collaborator
            $existingCollab = $this->collabModel->findByNoteId($data['noteId']);
            foreach ($existingCollab as $collab) {
                if ($collab['userId'] === $userToInvite['id']) {
                    $response->getBody()->write(json_encode(['error' => 'User is already a collaborator']));
                    return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
                }
            }

            // Create collaboration invite
            $collab = $this->collabModel->create([
                'noteId' => $data['noteId'],
                'userId' => $userToInvite['id'],
                'role' => $data['role'] ?? 'editor',
                'invitedById' => $user['id'],
                'status' => 'pending',
            ]);

            // TODO: Emit WebSocket event for notification

            $response->getBody()->write(json_encode([
                'message' => 'Invitation sent',
                'collab' => $collab,
            ]));
            return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function getByNote(Request $request, Response $response, array $args): Response {
        try {
            $user = $request->getAttribute('user');
            $noteId = (int) $args['noteId'];

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

            $collaborators = $this->collabModel->findByNoteId($noteId);
            $response->getBody()->write(json_encode($collaborators));
            return $response->withHeader('Content-Type', 'application/json');
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
}
