<?php

declare(strict_types=1);

namespace Study114\Admin;

use InvalidArgumentException;
use Study114\Board\BoardPostRepository;
use Study114\Database\Connection;
use Study114\Paid\ProviderReminderRepository;
use Study114\Registration\StudentBasicCompleteness;
use Study114\Registration\StudentHubRepository;
use Study114\Registration\StudyRoomHubRepository;
use Study114\Registration\TutorHubRepository;
use Throwable;

final class ExposureDraftPublishException extends \RuntimeException
{
}

final class AdminExposureService
{
    private const INQUIRY_STATUSES = ['open', 'paused', 'capacity_full', 'waiting_only'];
    private const HIDE_NOTICE_TITLE = '홈·찾기 숨김';
    private const HIDE_NOTICE_BODY = '이 카드는 지금 홈·찾기에서 숨김 처리되었습니다. 궁금한 점은 고객센터 운영문의로 남겨 주세요.';
    private const HIDE_NOTICE_HREF = '/support/contact?category=unhide_request';

    private AdminExposureRepository $targets;
  private StudyRoomHubRepository $studyRooms;
  private TutorHubRepository $tutors;
  private StudentHubRepository $students;
  private BoardPostRepository $posts;
  private AdminOperationLogRepository $logs;

  public function __construct(
      ?AdminExposureRepository $targets = null,
      ?StudyRoomHubRepository $studyRooms = null,
      ?TutorHubRepository $tutors = null,
      ?BoardPostRepository $posts = null,
      ?AdminOperationLogRepository $logs = null,
      ?StudentHubRepository $students = null,
  ) {
      $pdo = Connection::get();
      $this->targets = $targets ?? new AdminExposureRepository($pdo);
      $this->studyRooms = $studyRooms ?? new StudyRoomHubRepository($pdo);
      $this->tutors = $tutors ?? new TutorHubRepository($pdo);
      $this->students = $students ?? new StudentHubRepository($pdo);
      $this->posts = $posts ?? new BoardPostRepository($pdo);
      $this->logs = $logs ?? new AdminOperationLogRepository($pdo);
  }

  /** @return list<array<string, mixed>> */
  public function list(?string $targetType = null, ?string $status = null, ?int $userId = null): array
  {
      $type = $targetType !== null && $targetType !== '' ? $targetType : 'all';
      $items = [];

      if ($type === 'all' || $type === 'study_room') {
          $items = array_merge($items, $this->targets->listStudyRooms($status, $userId));
      }
      if ($type === 'all' || $type === 'tutor') {
          $items = array_merge($items, $this->targets->listTutors($status, $userId));
      }
      if ($type === 'all' || $type === 'student') {
          $items = array_merge($items, $this->targets->listStudents($status, $userId));
      }
      if ($type === 'all' || $type === 'submission') {
          $items = array_merge($items, $this->targets->listSubmissions($status));
      }

      if (!in_array($type, ['all', 'study_room', 'tutor', 'student', 'submission'], true)) {
          throw new InvalidArgumentException('target_type은 study_room, tutor, student, submission 중 하나여야 합니다.');
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
          'student' => $this->correctStudent($targetId, $action, $operatorId, $reasonCategory, $internalMemo),
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

      if (!in_array($action, ['hide', 'publish', 'inquiry_status'], true)) {
          throw new InvalidArgumentException('action은 hide, publish, inquiry_status 중 하나여야 합니다.');
      }

      if ($action === 'hide') {
          return $this->hideProviderCard(
              'study_room',
              $roomId,
              (string) ($existing['status'] ?? ''),
              $operatorId,
              $reasonCategory,
              $internalMemo,
              function () use ($roomId): void {
                  $this->studyRooms->setProfileStatus($roomId, 'hidden');
              },
              fn () => $this->targets->findStudyRoom($roomId),
          );
      }

      $missing = [];
      if ($action === 'publish') {
          $this->rejectDraftPublish((string) ($existing['status'] ?? ''));
          $missing = $this->studyRoomUnhideMissing($roomId);
          if ($missing === []) {
              $this->studyRooms->setProfileStatus($roomId, 'published', date('Y-m-d H:i:s'));
          } else {
              $this->studyRooms->setProfileStatus($roomId, 'draft');
          }
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
          'exposure_correction',
          $reasonCategory !== '' ? $reasonCategory : null,
          $internalMemo !== '' ? $internalMemo : null,
          true,
          false,
      );

      $result = [
          'item' => $snapshot,
          'log' => $this->mapLog($log),
      ];
      if ($action === 'publish' && $missing !== []) {
          $result['missing'] = $missing;
      }

      return $result;
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

      if (!in_array($action, ['hide', 'publish'], true)) {
          throw new InvalidArgumentException('action은 hide 또는 publish만 허용됩니다.');
      }

      $existing = $this->targets->findTutor($tutorId);
      if ($action === 'hide') {
          return $this->hideProviderCard(
              'tutor',
              $tutorId,
              (string) ($existing['status'] ?? ''),
              $operatorId,
              $reasonCategory,
              $internalMemo,
              function () use ($tutorId): void {
                  $this->tutors->setProfileStatus($tutorId, 'hidden');
              },
              fn () => $this->targets->findTutor($tutorId),
          );
      }

      $this->rejectDraftPublish((string) ($existing['status'] ?? ''));
      $missing = $this->tutorUnhideMissing($tutorId);
      if ($missing === []) {
          $this->tutors->setProfileStatus($tutorId, 'published', date('Y-m-d H:i:s'));
      } else {
          $this->tutors->setProfileStatus($tutorId, 'draft');
      }

      $snapshot = $this->targets->findTutor($tutorId);
      $log = $this->logs->insert(
          $operatorId,
          'tutor',
          (string) $tutorId,
          'exposure_correction',
          $reasonCategory !== '' ? $reasonCategory : null,
          $internalMemo !== '' ? $internalMemo : null,
          true,
          false,
      );

      $result = [
          'item' => $snapshot,
          'log' => $this->mapLog($log),
      ];
      if ($missing !== []) {
          $result['missing'] = $missing;
      }

      return $result;
  }

  /** @return array<string, mixed> */
  private function correctStudent(
      string $targetId,
      string $action,
      string $operatorId,
      string $reasonCategory,
      string $internalMemo,
  ): array {
      $studentId = (int) $targetId;
      if ($studentId <= 0) {
          throw new InvalidArgumentException('target_id가 올바르지 않습니다.');
      }

      $existing = $this->targets->findStudent($studentId);
      if ($existing === null) {
          throw new InvalidArgumentException('카드를 찾을 수 없습니다.');
      }

      [$actionKind, $userNotified] = match ($action) {
          'hide' => ['hide_profile', false],
          'publish' => ['exposure_correction', false],
          default => throw new InvalidArgumentException('action은 hide 또는 publish만 허용됩니다.'),
      };

      if ($action === 'publish') {
          $this->rejectDraftPublish((string) ($existing['status'] ?? ''));
          $full = $this->students->findById($studentId);
          $missing = $full !== null
              ? StudentBasicCompleteness::missingLabels($full)
              : array_values(StudentBasicCompleteness::LABELS);
          if ($missing !== []) {
              throw new ExposureDraftPublishException(
                  '기본정보가 다 채워지지 않아 홈·찾기에 올릴 수 없어요. 빈 항목: ' . implode(', ', $missing)
              );
          }
          $this->students->updateExposureStatus($studentId, 'published', date('Y-m-d H:i:s'));
      } else {
          $this->students->updateExposureStatus($studentId, 'hidden');
      }

      $snapshot = $this->targets->findStudent($studentId);
      $log = $this->logs->insert(
          $operatorId,
          'student',
          (string) $studentId,
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

  private function rejectDraftPublish(string $status): void
  {
      if ($status === 'draft' || $status === 'pending') {
          throw new ExposureDraftPublishException('작성 중인 카드는 홈·찾기에 올릴 수 없어요.');
      }
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
          'hide' => ['hidden', 'submission_hide', false],
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

  /**
   * @param callable(): void $setHidden
   * @param callable(): ?array $reload
   * @return array<string, mixed>
   */
  private function hideProviderCard(
      string $cardType,
      int $cardId,
      string $currentStatus,
      string $operatorId,
      string $reasonCategory,
      string $internalMemo,
      callable $setHidden,
      callable $reload,
  ): array {
      $pdo = Connection::get();
      $pdo->beginTransaction();
      try {
          if ($currentStatus === 'hidden') {
              $log = $this->logs->insert(
                  $operatorId,
                  $cardType,
                  (string) $cardId,
                  'hide_profile',
                  $reasonCategory !== '' ? $reasonCategory : null,
                  $internalMemo !== '' ? $internalMemo : null,
                  true,
                  false,
              );
              $pdo->commit();

              return [
                  'item' => $reload(),
                  'log' => $this->mapLog($log),
              ];
          }

          $setHidden();
          $logKey = 'LOG-' . date('YmdHis') . '-' . substr(bin2hex(random_bytes(3)), 0, 6);
          $ownerId = $this->cardOwnerUserId($cardType, $cardId);
          $notified = false;
          if ($ownerId > 0) {
              try {
                  (new ProviderReminderRepository($pdo))->upsertSystemNotice(
                      $ownerId,
                      'admin_hide',
                      'admin_hide:' . $cardType . ':' . $cardId . ':' . $logKey,
                      self::HIDE_NOTICE_TITLE,
                      self::HIDE_NOTICE_BODY,
                      self::HIDE_NOTICE_HREF,
                  );
                  $notified = true;
              } catch (Throwable $e) {
                  if ($pdo->inTransaction() === false) {
                      throw $e;
                  }
                  $notified = false;
              }
          }

          $log = $this->logs->insert(
              $operatorId,
              $cardType,
              (string) $cardId,
              'hide_profile',
              $reasonCategory !== '' ? $reasonCategory : null,
              $internalMemo !== '' ? $internalMemo : null,
              true,
              $notified,
              $logKey,
          );
          $pdo->commit();

          return [
              'item' => $reload(),
              'log' => $this->mapLog($log),
          ];
      } catch (Throwable $e) {
          if ($pdo->inTransaction()) {
              $pdo->rollBack();
          }
          throw $e;
      }
  }

  private function cardOwnerUserId(string $cardType, int $cardId): int
  {
      $table = $cardType === 'tutor' ? 'tutors' : 'study_rooms';
      $stmt = Connection::get()->prepare("SELECT user_id FROM {$table} WHERE id = ?");
      $stmt->execute([$cardId]);
      $id = $stmt->fetchColumn();

      return $id === false ? 0 : (int) $id;
  }

  /** @return list<string> */
  private function studyRoomUnhideMissing(int $roomId): array
  {
      $missing = [];
      $pdo = Connection::get();
      $slot = $pdo->prepare(
          'SELECT 1 FROM study_room_regions
           WHERE study_room_id = ? AND slot = 1
             AND region_id IS NOT NULL AND region_id <> 0
           LIMIT 1'
      );
      $slot->execute([$roomId]);
      if ($slot->fetchColumn() === false) {
          $missing[] = '대표지역1';
      }

      $stmt = $pdo->prepare(
          'SELECT study_room_name, lesson_place_type, main_subject_note, slogan, address_text
           FROM study_rooms WHERE id = ?'
      );
      $stmt->execute([$roomId]);
      $row = $stmt->fetch();
      if (!is_array($row)) {
          $row = [];
      }
      $need = static function (string $value, string $label) use (&$missing): void {
          if (trim($value) === '') {
              $missing[] = $label;
          }
      };
      $need((string) ($row['study_room_name'] ?? ''), '이름');
      $need((string) ($row['lesson_place_type'] ?? ''), '교습형태');
      $need((string) ($row['main_subject_note'] ?? ''), '주력과목');
      $need((string) ($row['slogan'] ?? ''), '슬로건');
      $need((string) ($row['address_text'] ?? ''), '사업장주소');

      return $missing;
  }

  /** @return list<string> */
  private function tutorUnhideMissing(int $tutorId): array
  {
      $missing = [];
      $pdo = Connection::get();
      $slot = $pdo->prepare(
          'SELECT 1 FROM tutor_regions
           WHERE tutor_id = ? AND priority_order = 0
             AND region_id IS NOT NULL AND region_id <> 0
           LIMIT 1'
      );
      $slot->execute([$tutorId]);
      if ($slot->fetchColumn() === false) {
          $missing[] = '과외지역1';
      }

      $stmt = $pdo->prepare(
          'SELECT tutor_display_name, main_subject_note FROM tutors WHERE id = ?'
      );
      $stmt->execute([$tutorId]);
      $row = $stmt->fetch();
      if (!is_array($row)) {
          $row = [];
      }
      if (trim((string) ($row['tutor_display_name'] ?? '')) === '') {
          $missing[] = '표시명';
      }
      if (trim((string) ($row['main_subject_note'] ?? '')) === '') {
          $missing[] = '주력과목';
      }

      return $missing;
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
