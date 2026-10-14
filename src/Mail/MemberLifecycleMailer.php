<?php

declare(strict_types=1);

namespace Study114\Mail;

use DateTimeImmutable;
use PDO;
use Study114\Auth\AccountContactService;
use Study114\Auth\AuthMailer;
use Study114\Auth\WithdrawReasonService;
use Study114\Paid\PositionPeriodCalculator;
use Study114\Paid\ProviderTicketRepository;

/**
 * 생활 메일 발송 — 카드 게시 환영 · Prime/Pick 구매 감사 · 탈퇴 완료
 * · 첫 일주일 안부 · Prime/Pick 마무리 3일 전(이 둘은 MemberMailScheduler가 대상을 고른다).
 *
 * 본 기능(등록·결제·탈퇴)을 절대 막지 않는다: 모든 진입점은 예외를 밖으로 던지지 않고 결과 코드만 돌려준다.
 * 중복 방지는 provider_reminder_dispatches(dedupe_key UNIQUE)에 먼저 자리를 잡은 뒤 보낸다.
 * 그 테이블을 못 쓰면 보내지 않는다(fail-closed).
 * 받는 사람은 활성·이메일 확인 완료·내부 주소 아님일 때만.
 */
final class MemberLifecycleMailer
{
    public const KIND_CARD_POSTED = 'lifecycle_card_posted';
    public const KIND_PURCHASE_THANKS = 'lifecycle_purchase_thanks';
    public const KIND_WITHDRAW_FAREWELL = 'lifecycle_withdraw_farewell';
    public const KIND_WELCOME_WEEK = 'lifecycle_welcome_week';
    public const KIND_POSITION_ENDING = 'lifecycle_position_ending';

    public const DEDUPE_WELCOME_WEEK = 'lifecycle:welcome_week:';
    public const DEDUPE_POSITION_ENDING = 'lifecycle:position_ending:';

    /** 기본등록을 다시 저장해도 오래전에 게시된 카드에는 환영 메일을 보내지 않는다. */
    private const CARD_POSTED_WINDOW_SECONDS = 86400;

    /** @var array<string, mixed> */
    private array $config;

    /** @param array<string, mixed>|null $config */
    public function __construct(
        private readonly PDO $pdo,
        private ?AuthMailer $mailer = null,
        ?array $config = null,
        private ?MemberMailSettings $settings = null,
    ) {
        $this->config = $config ?? study114_config('auth');
    }

    /** 관리자 종류별 켜고 끄기 (정본 74 §4) */
    public function settings(): MemberMailSettings
    {
        return $this->settings ??= new MemberMailSettings($this->pdo);
    }

    /** 기본등록 직후. 카드가 지금 노출(published) 상태가 된 경우에만 보낸다. */
    public function afterBasicRegister(int $userId, string $kind, int $profileId): string
    {
        return $this->guard(MemberMailSettings::CARD_POSTED, function () use ($userId, $kind, $profileId): string {
            $role = MemberMailRole::normalize($kind);
            if ($role === '' || $profileId < 1) {
                return 'skipped:kind';
            }
            if (!$this->isFreshlyPublished($userId, $role, $profileId)) {
                return 'skipped:not_published';
            }
            $to = $this->recipient($userId);
            if ($to === null) {
                return 'skipped:recipient';
            }

            $ctx = ['home_ui' => $this->homeUi()];
            if ($role === MemberMailRole::STUDY_ROOM) {
                $ctx['room_name'] = $this->roomName($profileId);
            } elseif ($role === MemberMailRole::TUTOR) {
                $ctx['region_label'] = $this->tutorRegionLabel($profileId);
            }
            $mail = MemberLifecycleMailTemplate::cardPosted($role, $ctx);

            return $this->deliver($userId, self::KIND_CARD_POSTED, 'lifecycle:card_posted:' . $role . ':' . $profileId, $to, $mail);
        });
    }

    /**
     * Prime·Pick 지급 성공 직후(트랜잭션 커밋 뒤).
     *
     * @param array<string, mixed> $payload ProviderCheckoutService::completeOrder 응답
     * @param array<string, mixed> $snapshot 주문 price_snapshot
     */
    public function afterPositionPurchase(int $userId, array $payload, array $snapshot): string
    {
        return $this->guard(MemberMailSettings::PURCHASE_THANKS, function () use ($userId, $payload, $snapshot): string {
            $product = (string) ($payload['product_id'] ?? '');
            $role = MemberMailRole::normalize((string) ($payload['provider_type'] ?? ''));
            $orderRef = trim((string) ($payload['order_ref'] ?? ''));
            if (!in_array($product, ['prime', 'pick'], true)
                || !in_array($role, [MemberMailRole::STUDY_ROOM, MemberMailRole::TUTOR], true)
                || $orderRef === ''
                || ($payload['fulfilled'] ?? false) !== true) {
                return 'skipped:order';
            }
            $to = $this->recipient($userId);
            if ($to === null) {
                return 'skipped:recipient';
            }

            $providerId = (int) ($payload['provider_id'] ?? 0);
            $ctx = [
                'home_ui' => $this->homeUi(),
                'product' => $product,
                'extend' => ($payload['grant_mode'] ?? '') === 'extend',
                'period_label' => (string) ($payload['variant_label'] ?? ''),
                'started_on' => (string) ($payload['started_on'] ?? ''),
                'ends_on' => (string) ($payload['ends_on'] ?? ''),
                'amount_won' => (int) ($payload['amount_won'] ?? 0),
            ];
            if ($role === MemberMailRole::STUDY_ROOM) {
                $ctx['room_name'] = $this->roomName($providerId);
                $region = is_array($snapshot['prime_region'] ?? null) ? $snapshot['prime_region'] : [];
                $ctx['scope_label'] = $this->scopeLabel($region);
            } else {
                $axis = is_array($snapshot['tutor_axis'] ?? null) ? $snapshot['tutor_axis'] : [];
                $ctx['city_label'] = (string) ($axis['city_label'] ?? '');
                $ctx['subject_label'] = (string) ($axis['subject_label'] ?? '');
            }
            $mail = MemberLifecycleMailTemplate::purchaseThanks($role, $ctx);

            return $this->deliver($userId, self::KIND_PURCHASE_THANKS, 'lifecycle:purchase_thanks:' . $orderRef, $to, $mail);
        });
    }

    /**
     * 탈퇴 정리 전에 받는 주소·역할을 잡아 둔다(정리 후에는 주소가 지워진다).
     *
     * @return array{user_id: int, email: string, role: string}|null
     */
    public function captureWithdrawSnapshot(int $userId): ?array
    {
        try {
            if (!$this->enabled()) {
                return null;
            }
            $to = $this->recipient($userId);
            if ($to === null) {
                return null;
            }

            return ['user_id' => $userId, 'email' => $to, 'role' => MemberMailRole::lookup($this->pdo, $userId)];
        } catch (\Throwable $e) {
            error_log('[lifecycle-mail] withdraw snapshot: ' . $e->getMessage());

            return null;
        }
    }

    /**
     * @param array{user_id: int, email: string, role: string}|null $snapshot
     * @param bool|null $reasonGiven 탈퇴 사유(정본 74 §1-4): true 고름 → 고맙다는 한 줄 · false 안 고름 → 사유 받기 링크 · null 덧붙이지 않음
     */
    public function sendWithdrawFarewell(?array $snapshot, ?bool $reasonGiven = null): string
    {
        return $this->guard(MemberMailSettings::WITHDRAW_FAREWELL, function () use ($snapshot, $reasonGiven): string {
            if ($snapshot === null) {
                return 'skipped:recipient';
            }
            $userId = (int) $snapshot['user_id'];
            $role = (string) $snapshot['role'];
            $reason = ['reason' => ''];
            if ($reasonGiven === true) {
                $reason = ['reason' => 'given'];
            } elseif ($reasonGiven === false) {
                $token = (new WithdrawReasonService($this->pdo))->issueLink($userId, $role);
                if ($token !== null) {
                    $reason = ['reason' => 'ask', 'reason_url' => MemberLifecycleMailTemplate::withdrawReasonUrl($this->homeUi(), $token)];
                }
            }
            $mail = MemberLifecycleMailTemplate::withdrawn($role, [
                'home_ui' => $this->homeUi(),
                'withdrawn_at' => (new DateTimeImmutable('now', PositionPeriodCalculator::timezone()))->format('Y-m-d H:i:s'),
            ] + $reason);

            return $this->deliver($userId, self::KIND_WITHDRAW_FAREWELL, 'lifecycle:withdraw_farewell:' . $userId, (string) $snapshot['email'], $mail);
        });
    }

    /**
     * 가입 7일 뒤 안부 (MemberMailScheduler가 대상을 고른다).
     * 공부방·과외쌤: 노출 중 카드 있음 → 안부, 초안뿐이거나 없음 → 등록 안내, 그 밖(숨김 등) → 안 보냄.
     */
    public function sendWelcomeWeek(int $userId): string
    {
        return $this->guard(MemberMailSettings::WELCOME_WEEK, function () use ($userId): string {
            $role = MemberMailRole::lookup($this->pdo, $userId);
            if ($role === '') {
                return 'skipped:kind';
            }
            $card = $this->cardState($userId, $role);
            if ($role !== MemberMailRole::STUDENT && $card['published_id'] === 0 && $card['other']) {
                return 'skipped:card';
            }
            $to = $this->recipient($userId);
            if ($to === null) {
                return 'skipped:recipient';
            }

            $ctx = ['home_ui' => $this->homeUi(), 'has_card' => $card['published_id'] > 0];
            if ($role === MemberMailRole::STUDY_ROOM && $card['published_id'] > 0) {
                $ctx['room_name'] = $this->roomName($card['published_id']);
            } elseif ($role === MemberMailRole::TUTOR && $card['published_id'] > 0) {
                $ctx['region_label'] = $this->tutorRegionLabel($card['published_id']);
            }
            $mail = MemberLifecycleMailTemplate::welcomeWeek($role, $ctx);

            return $this->deliver($userId, self::KIND_WELCOME_WEEK, self::DEDUPE_WELCOME_WEEK . $userId, $to, $mail);
        });
    }

    /**
     * Prime·Pick 마무리 3일 전(못 보냈으면 2일 전). 카드가 지금 노출 중일 때만 보낸다(본문이 「베이직으로 이어서 노출」을 약속하므로).
     * 남은 날이 2~3일이 아니면 보내지 않는다 — 제목·안내에 그 날수가 들어간다.
     *
     * @param array<string, mixed> $sub provider_position_subscriptions 행
     *   (id, user_id, sku_code, provider_type, provider_id, started_on, end_exclusive_on)
     */
    public function sendPositionEnding(array $sub, string $today): string
    {
        return $this->guard(MemberMailSettings::POSITION_ENDING, function () use ($sub, $today): string {
            $subId = (int) ($sub['id'] ?? 0);
            $userId = (int) ($sub['user_id'] ?? 0);
            $product = (string) ($sub['sku_code'] ?? '');
            $endExclusive = substr(trim((string) ($sub['end_exclusive_on'] ?? '')), 0, 10);
            if ($subId < 1 || $userId < 1 || !in_array($product, ['prime', 'pick'], true)
                || preg_match('/^\d{4}-\d{2}-\d{2}$/', $endExclusive) !== 1 || $endExclusive <= $today) {
                return 'skipped:subscription';
            }
            $tz = PositionPeriodCalculator::timezone();
            $daysLeft = (int) (new DateTimeImmutable($today, $tz))->diff(new DateTimeImmutable($endExclusive, $tz))->days;
            if ($daysLeft < MemberMailScheduler::ENDING_LAST_CHANCE_DAYS_LEFT || $daysLeft > MemberMailScheduler::ENDING_DAYS_LEFT) {
                return 'skipped:subscription';
            }
            $role = MemberMailRole::normalize((string) ($sub['provider_type'] ?? ''));
            if ($role === '') {
                $role = MemberMailRole::lookup($this->pdo, $userId);
            }
            if (!in_array($role, [MemberMailRole::STUDY_ROOM, MemberMailRole::TUTOR], true)) {
                return 'skipped:kind';
            }
            $providerId = (int) ($sub['provider_id'] ?? 0);
            $cardId = $this->publishedProviderCard($userId, $role, $providerId);
            if ($cardId === 0) {
                return 'skipped:card';
            }
            $to = $this->recipient($userId);
            if ($to === null) {
                return 'skipped:recipient';
            }

            $lastDay = (new DateTimeImmutable($endExclusive, $tz))->modify('-1 day')->format('Y-m-d');
            $ctx = [
                'home_ui' => $this->homeUi(),
                'product' => $product,
                'started_on' => substr(trim((string) ($sub['started_on'] ?? '')), 0, 10),
                'ends_on' => $lastDay,
                'days_left' => $daysLeft,
            ];
            if ($role === MemberMailRole::STUDY_ROOM) {
                $ctx['room_name'] = $this->roomName($cardId);
            }
            $mail = MemberLifecycleMailTemplate::positionEnding($role, $ctx);

            return $this->deliver(
                $userId,
                self::KIND_POSITION_ENDING,
                self::DEDUPE_POSITION_ENDING . $subId . ':' . $endExclusive,
                $to,
                $mail,
            );
        });
    }

    public function isEnabled(): bool
    {
        return $this->enabled();
    }

    /**
     * 내 카드 상태. published_id = 노출 중인 첫 카드 id(없으면 0), other = 초안·노출 말고 다른 상태(숨김 등) 카드 있음.
     *
     * @return array{published_id: int, other: bool}
     */
    private function cardState(int $userId, string $role): array
    {
        [$sql, $draft] = match ($role) {
            MemberMailRole::STUDY_ROOM => ['SELECT id, profile_status AS s FROM study_rooms WHERE user_id = ? ORDER BY id', 'draft'],
            MemberMailRole::TUTOR => ['SELECT id, profile_status AS s FROM tutors WHERE user_id = ? ORDER BY id', 'draft'],
            default => ['SELECT id, exposure_status AS s FROM students WHERE guardian_user_id = ? ORDER BY id', 'draft'],
        };
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$userId]);
        $publishedId = 0;
        $other = false;
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $status = (string) $row['s'];
            if ($status === 'published') {
                $publishedId = $publishedId ?: (int) $row['id'];
            } elseif ($status !== $draft) {
                $other = true;
            }
        }

        return ['published_id' => $publishedId, 'other' => $other];
    }

    /** 이용권의 카드(provider_id)가 본인 것이고 노출 중이면 그 id. provider_id가 없던 옛 행은 본인 노출 카드 중 첫 번째. */
    private function publishedProviderCard(int $userId, string $role, int $providerId): int
    {
        $table = $role === MemberMailRole::STUDY_ROOM ? 'study_rooms' : 'tutors';
        if ($providerId > 0) {
            $stmt = $this->pdo->prepare("SELECT id FROM {$table} WHERE id = ? AND user_id = ? AND profile_status = 'published' LIMIT 1");
            $stmt->execute([$providerId, $userId]);
        } else {
            $stmt = $this->pdo->prepare("SELECT id FROM {$table} WHERE user_id = ? AND profile_status = 'published' ORDER BY id LIMIT 1");
            $stmt->execute([$userId]);
        }
        $id = $stmt->fetchColumn();

        return $id === false ? 0 : (int) $id;
    }

    /** @param string $label MemberMailSettings::KINDS 중 하나 @param callable(): string $fn */
    private function guard(string $label, callable $fn): string
    {
        if (!$this->enabled()) {
            return 'skipped:disabled';
        }
        try {
            if (!$this->settings()->isEnabled($label)) {
                return 'skipped:paused';
            }

            return $fn();
        } catch (\Throwable $e) {
            error_log('[lifecycle-mail] ' . $label . ': ' . $e->getMessage());

            return 'error';
        }
    }

    /** @param array{subject: string, plain: string, html: string} $mail */
    private function deliver(int $userId, string $kind, string $dedupeKey, string $to, array $mail): string
    {
        if (!$this->claim($userId, $kind, $dedupeKey)) {
            return 'skipped:duplicate';
        }
        $ok = false;
        try {
            $ok = $this->mailer()->send($to, $mail['subject'], $mail['plain'], $mail['html']);
        } finally {
            if (!$ok) {
                $this->release($dedupeKey);
            }
        }

        return $ok ? 'sent' : 'failed';
    }

    private function claim(int $userId, string $kind, string $dedupeKey): bool
    {
        $insert = $this->pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'sqlite' ? 'INSERT OR IGNORE' : 'INSERT IGNORE';
        $stmt = $this->pdo->prepare(
            $insert . ' INTO provider_reminder_dispatches (user_id, channel, reminder_kind, dedupe_key, sent_at)
             VALUES (?, ?, ?, ?, ?)'
        );
        $sentAt = (new DateTimeImmutable('now', PositionPeriodCalculator::timezone()))->format('Y-m-d H:i:s');
        $stmt->execute([$userId, 'email', $kind, $dedupeKey, $sentAt]);

        return $stmt->rowCount() === 1;
    }

    private function release(string $dedupeKey): void
    {
        try {
            $this->pdo->prepare('DELETE FROM provider_reminder_dispatches WHERE dedupe_key = ?')->execute([$dedupeKey]);
        } catch (\Throwable $e) {
            error_log('[lifecycle-mail] release: ' . $e->getMessage());
        }
    }

    private function recipient(int $userId): ?string
    {
        if ($userId < 1) {
            return null;
        }
        $stmt = $this->pdo->prepare('SELECT email, status, email_verified_at FROM users WHERE id = ? LIMIT 1');
        $stmt->execute([$userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!is_array($row) || (string) $row['status'] !== 'active' || ($row['email_verified_at'] ?? null) === null) {
            return null;
        }
        $email = trim((string) $row['email']);
        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || (new AccountContactService())->isInternalEmail($email)) {
            return null;
        }

        return $email;
    }

    private function isFreshlyPublished(int $userId, string $role, int $profileId): bool
    {
        [$sql, $publishedValue] = match ($role) {
            MemberMailRole::STUDY_ROOM => ['SELECT profile_status AS s, published_at AS p FROM study_rooms WHERE id = ? AND user_id = ? LIMIT 1', 'published'],
            MemberMailRole::TUTOR => ['SELECT profile_status AS s, published_at AS p FROM tutors WHERE id = ? AND user_id = ? LIMIT 1', 'published'],
            default => ['SELECT exposure_status AS s, published_at AS p FROM students WHERE id = ? AND guardian_user_id = ? LIMIT 1', 'published'],
        };
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$profileId, $userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!is_array($row) || (string) $row['s'] !== $publishedValue) {
            return false;
        }
        $publishedAt = trim((string) ($row['p'] ?? ''));
        if ($publishedAt === '') {
            return false;
        }
        $threshold = (new DateTimeImmutable('now', PositionPeriodCalculator::timezone()))
            ->modify('-' . self::CARD_POSTED_WINDOW_SECONDS . ' seconds')
            ->format('Y-m-d H:i:s');

        return $publishedAt >= $threshold;
    }

    private function roomName(int $roomId): string
    {
        if ($roomId < 1) {
            return '';
        }
        try {
            $stmt = $this->pdo->prepare('SELECT study_room_name FROM study_rooms WHERE id = ? LIMIT 1');
            $stmt->execute([$roomId]);
            $name = $stmt->fetchColumn();

            return is_string($name) ? trim($name) : '';
        } catch (\Throwable) {
            return '';
        }
    }

    private function tutorRegionLabel(int $tutorId): string
    {
        try {
            return (string) ((new ProviderTicketRepository($this->pdo))->primaryRegionLabel('tutor', $tutorId) ?? '');
        } catch (\Throwable) {
            return '';
        }
    }

    /** @param array<string, mixed> $region 주문 스냅샷 prime_region */
    private function scopeLabel(array $region): string
    {
        try {
            $complexId = (int) ($region['complex_id'] ?? 0);
            if (($region['region_basis_type'] ?? '') === 'complex' && $complexId > 0) {
                $stmt = $this->pdo->prepare('SELECT name FROM complexes WHERE id = ? LIMIT 1');
                $stmt->execute([$complexId]);
                $name = $stmt->fetchColumn();
                if (is_string($name) && trim($name) !== '') {
                    return trim($name);
                }
            }
            $regionId = (int) ($region['region_id'] ?? 0);
            if ($regionId > 0) {
                $stmt = $this->pdo->prepare('SELECT dong_name FROM regions WHERE id = ? LIMIT 1');
                $stmt->execute([$regionId]);
                $name = $stmt->fetchColumn();
                if (is_string($name) && trim($name) !== '') {
                    return trim($name);
                }
            }
        } catch (\Throwable) {
        }

        return '';
    }

    private function enabled(): bool
    {
        return ($this->config['lifecycle_mail_enabled'] ?? true) === true;
    }

    private function homeUi(): string
    {
        return (string) ($this->config['home_ui'] ?? '');
    }

    private function mailer(): AuthMailer
    {
        return $this->mailer ??= new AuthMailer();
    }
}
