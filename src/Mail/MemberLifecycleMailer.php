<?php

declare(strict_types=1);

namespace Study114\Mail;

use DateTimeImmutable;
use PDO;
use Study114\Auth\AccountContactService;
use Study114\Auth\AuthMailer;
use Study114\Paid\PositionPeriodCalculator;
use Study114\Paid\ProviderTicketRepository;

/**
 * 생활 메일 발송 — 카드 게시 환영 · Prime/Pick 구매 감사 · 탈퇴 완료.
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

    /** 기본등록을 다시 저장해도 오래전에 게시된 카드에는 환영 메일을 보내지 않는다. */
    private const CARD_POSTED_WINDOW_SECONDS = 86400;

    /** @var array<string, mixed> */
    private array $config;

    /** @param array<string, mixed>|null $config */
    public function __construct(
        private readonly PDO $pdo,
        private ?AuthMailer $mailer = null,
        ?array $config = null,
    ) {
        $this->config = $config ?? study114_config('auth');
    }

    /** 기본등록 직후. 카드가 지금 노출(published) 상태가 된 경우에만 보낸다. */
    public function afterBasicRegister(int $userId, string $kind, int $profileId): string
    {
        return $this->guard('card_posted', function () use ($userId, $kind, $profileId): string {
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
        return $this->guard('purchase_thanks', function () use ($userId, $payload, $snapshot): string {
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

    /** @param array{user_id: int, email: string, role: string}|null $snapshot */
    public function sendWithdrawFarewell(?array $snapshot): string
    {
        return $this->guard('withdraw_farewell', function () use ($snapshot): string {
            if ($snapshot === null) {
                return 'skipped:recipient';
            }
            $userId = (int) $snapshot['user_id'];
            $mail = MemberLifecycleMailTemplate::withdrawn((string) $snapshot['role'], [
                'home_ui' => $this->homeUi(),
                'withdrawn_at' => (new DateTimeImmutable('now', PositionPeriodCalculator::timezone()))->format('Y-m-d H:i:s'),
            ]);

            return $this->deliver($userId, self::KIND_WITHDRAW_FAREWELL, 'lifecycle:withdraw_farewell:' . $userId, (string) $snapshot['email'], $mail);
        });
    }

    /** @param callable(): string $fn */
    private function guard(string $label, callable $fn): string
    {
        if (!$this->enabled()) {
            return 'skipped:disabled';
        }
        try {
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
            $insert . ' INTO provider_reminder_dispatches (user_id, channel, reminder_kind, dedupe_key)
             VALUES (?, ?, ?, ?)'
        );
        $stmt->execute([$userId, 'email', $kind, $dedupeKey]);

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
