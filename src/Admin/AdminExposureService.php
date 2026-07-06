<?php

declare(strict_types=1);

namespace Study114\Admin;

use InvalidArgumentException;
use Study114\Board\BoardPostRepository;
use Study114\Database\Connection;
use Study114\Registration\StudyRoomHubRepository;
use Study114\Registration\TutorHubRepository;

final class AdminExposureService
{
    private const INQUIRY_STATUSES = ['open', 'paused', 'capacity_full', 'waiting_only'];

    private AdminExposureRepository $targets;
  private StudyRoomHubRepository $studyRooms;
  private TutorHubRepository $tutors;
  private BoardPostRepository $posts;
  private AdminOperationLogRepository $logs;

  public function __construct(
      ?AdminExposureRepository $targets = null,
      ?StudyRoomHubRepository $studyRooms = null,
      ?TutorHubRepository $tutors = null,
      ?BoardPostRepository $posts = null,
      ?AdminOperationLogRepository $logs = null,
  ) {
      $pdo = Connection::get();
      $this->targets = $targets ?? new AdminExposureRepository($pdo);
      $this->studyRooms = $studyRooms ?? new StudyRoomHubRepository($pdo);
      $this->tutors = $tutors ?? new TutorHubRepository($pdo);
      $this->posts = $posts ?? new BoardPostRepository($pdo);
      $this->logs = $logs ?? new AdminOperationLogRepository($pdo);
  }

  /** @return list<array<string, mixed>> */
  public function list(?string $targetType = null, ?string $status = null): array
  {
      $type = $targetType !== null && $targetType !== '' ? $targetType : 'all';
      $items = [];

      if ($type === 'all' || $type === 'study_room') {
          $items = array_merge($items, $this->targets->listStudyRooms($status));
      }
      if ($type === 'all' || $type === 'tutor') {
          $items = array_merge($items, $this->targets->listTutors($status));
      }
      if ($type === 'all' || $type === 'submission') {
          $items = array_merge($items, $this->targets->listSubmissions($status));
      }

      if ($type !== 'all' && $type !== 'study_room' && $type !== 'tutor' && $type !== 'submission') {
          throw new InvalidArgumentException('target_type은 study_room, tutor, submission 중 하나여야 합니다.');
      }

      usort($items, static fn (array $a, array $b) => strcmp((string) $b['updatedAt'], (string) $a['updatedAt']));

      return $items;
  }

  /** @param array<string, mixed> $input */
  public function applyCorrection(array $input, string $operatorId): array
  {
      $targetType = trim((string) ($input['target_type'] ?? $input['targetType'] ?? ''));
      $targetId = trim((string) ($input['target_id'] ?? $input['targetId'] ?? $input['id'] ?? ''));
      $action = trim((string) ($input['action'] ?? ''));
      $operatorId = trim($operatorId);
      $reasonCategory = trim((string) ($input['reason_category'] ?? $input['reasonCategory'] ?? 'internal_review'));
      $internalMemo = trim((string) ($input['internal_memo'] ?? $input['internalMemo'] ?? ''));
      $inquiryStatus = trim((string) ($input['inquiry_status'] ?? $input['inquiryStatus'] ?? ''));

      if ($targetType === '' || $targetId === '') {
          throw new InvalidArgumentException('target_type과 target_id가 필요합니다.');
      }
      if ($operatorId === '') {
          throw new InvalidArgumentException('operator_id가 필요합니다.');
      }

      return match ($targetType) {
          'study_room' => $this->correctStudyRoom($targetId, $action, $inquiryStatus, $operatorId, $reasonCategory, $internalMemo),
          'tutor' => $this->correctTutor($targetId, $action, $operatorId, $reasonCategory, $internalMemo),
          'submission' => $this->correctSubmission($targetId, $action, $operatorId, $reasonCategory, $internalMemo),
          default => throw new InvalidArgumentException('지원하지 않는 target_type입니다.'),
      };
  }

  /** @return array<string, mixed> */
  private function correctStudyRoom(
      string $targetId,
      string $action,
      string $inquiryStatus,
      string $operatorId,
      string $reasonCategory,
      string $internalMemo,
  ): array {
      $roomId = (int) $targetId;
      if ($roomId <= 0) {
          throw new InvalidArgumentException('target_id가 올바르지 않습니다.');
      }

      $existing = $this->targets->findStudyRoom($roomId);
      if ($existing === null) {
          throw new InvalidArgumentException('공부방을 찾을 수 없습니다.');
      }

      [$actionKind, $userNotified] = match ($action) {
          'hide' => ['hide_profile', true],
          'publish' => ['exposure_correction', false],
          'inquiry_status' => ['exposure_correction', false],
          default => throw new InvalidArgumentException('action은 hide, publish, inquiry_status 중 하나여야 합니다.'),
      };

      if ($action === 'hide') {
          $this->studyRooms->setProfileStatus($roomId, 'hidden');
      } elseif ($action === 'publish') {
          $this->studyRooms->setProfileStatus($roomId, 'published', date('Y-m-d H:i:s'));
      } elseif ($action === 'inquiry_status') {
          if ($inquiryStatus === '' || !in_array($inquiryStatus, self::INQUIRY_STATUSES, true)) {
              throw new InvalidArgumentException('inquiry_status가 올바르지 않습니다.');
          }
          $this->studyRooms->setInquiryStatus($roomId, $inquiryStatus);
      }

      $snapshot = $this->targets->findStudyRoom($roomId);
      $log = $this->logs->insert(
          $operatorId,
          'study_room',
          (string) $roomId,
          $actionKind,
          $reasonCategory !== '' ? $reasonCategory : null,
          $internalMemo !== '' ? $internalMemo : null,
          true,
          $userNotified,
      );

      return [
          'item' => $snapshot,
          'log' => $this->mapLog($log),
      ];
  }

  /** @return array<string, mixed> */
  private function correctTutor(
      string $targetId,
      string $action,
      string $operatorId,
      string $reasonCategory,
      string $internalMemo,
  ): array {
      $tutorId = (int) $targetId;
      if ($tutorId <= 0) {
          throw new InvalidArgumentException('target_id가 올바르지 않습니다.');
      }

      if ($this->targets->findTutor($tutorId) === null) {
          throw new InvalidArgumentException('과외 프로필을 찾을 수 없습니다.');
      }

      [$actionKind, $userNotified] = match ($action) {
          'hide' => ['hide_profile', true],
          'publish' => ['exposure_correction', false],
          default => throw new InvalidArgumentException('action은 hide 또는 publish만 허용됩니다.'),
      };

      if ($action === 'hide') {
          $this->tutors->setProfileStatus($tutorId, 'hidden');
      } else {
          $this->tutors->setProfileStatus($tutorId, 'published', date('Y-m-d H:i:s'));
      }

      $snapshot = $this->targets->findTutor($tutorId);
      $log = $this->logs->insert(
          $operatorId,
          'tutor',
          (string) $tutorId,
          $actionKind,
          $reasonCategory !== '' ? $reasonCategory : null,
          $internalMemo !== '' ? $internalMemo : null,
          true,
          $userNotified,
      );

      return [
          'item' => $snapshot,
          'log' => $this->mapLog($log),
      ];
  }

  /** @return array<string, mixed> */
  private function correctSubmission(
      string $postKey,
      string $action,
      string $operatorId,
      string $reasonCategory,
      string $internalMemo,
  ): array {
      if ($postKey === '') {
          throw new InvalidArgumentException('target_id가 올바르지 않습니다.');
      }

      $existing = $this->targets->findSubmission($postKey);
      if ($existing === null) {
          throw new InvalidArgumentException('제출 항목을 찾을 수 없습니다.');
      }

      $currentStatus = (string) $existing['status'];

      [$nextStatus, $actionKind, $userNotified] = match ($action) {
          'hide' => ['hidden', 'submission_hide', true],
          'publish' => ['published', 'submission_expose', false],
          default => throw new InvalidArgumentException('action은 hide 또는 publish만 허용됩니다.'),
      };

      if ($action === 'publish' && $currentStatus === 'submitted') {
          throw new InvalidArgumentException(
              '제출됨 상태는 A28-06 제출자료 큐에서 노출 반영하세요. (submitted → published는 A28-07 publish 불가)'
          );
      }

      $this->posts->updateAdminReview('submission', $postKey, $nextStatus, $internalMemo !== '' ? $internalMemo : null);

      $snapshot = $this->targets->findSubmission($postKey);
      $log = $this->logs->insert(
          $operatorId,
          'board_post',
          'submission:' . $postKey,
          $actionKind,
          $reasonCategory !== '' ? $reasonCategory : null,
          $internalMemo !== '' ? $internalMemo : null,
          true,
          $userNotified,
      );

      return [
          'item' => $snapshot,
          'log' => $this->mapLog($log),
      ];
  }

  /** @param array<string, mixed> $row @return array<string, mixed> */
  private function mapLog(array $row): array
  {
      return [
          'id' => (string) $row['log_key'],
          'action' => (string) $row['action_kind'],
          'targetType' => (string) $row['target_type'],
          'target' => (string) $row['target_id'],
          'operator' => (string) $row['operator_id'],
          'at' => (string) $row['acted_at'],
          'reasonCategory' => (string) ($row['reason_category'] ?? ''),
          'detailMemo' => (string) ($row['detail_memo'] ?? ''),
          'reversible' => (bool) $row['reversible'],
          'userNotified' => (bool) $row['user_notified'],
      ];
  }
}
