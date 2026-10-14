<?php

declare(strict_types=1);

namespace Study114\Mail;

use DateTimeImmutable;
use InvalidArgumentException;
use PDO;
use RuntimeException;
use Study114\Admin\AdminOperationLogRepository;
use Study114\Auth\AccountContactService;
use Study114\Auth\AuthMailer;
use Study114\Paid\PositionPeriodCalculator;
use Throwable;

/**
 * 관리자 「알림·문자 › 회원 메일」 — 종류별 상태·최근 7일 보낸 수·미리보기·내 메일로 시험 발송·켜고 끄기 (정본 74 §4).
 * 미리보기·시험 발송은 견본 값으로 실제 문안 함수를 그대로 부른다(회원 정보를 읽지 않음).
 */
final class MemberMailAdminService
{
    /** 운영자 한 명이 하루(KST)에 보낼 수 있는 시험 메일 수 — Resend 무료 한도를 회원 메일 몫으로 남긴다 */
    public const TEST_DAILY_LIMIT = 10;
    public const TEST_SUBJECT_PREFIX = '[시험] ';

    public const LOG_TOGGLE = 'member_mail_toggle';
    public const LOG_TEST = 'member_mail_test';

    /** 종류 → 생활 메일 발송 기록의 reminder_kind */
    private const DISPATCH_KIND = [
        MemberMailSettings::CARD_POSTED => MemberLifecycleMailer::KIND_CARD_POSTED,
        MemberMailSettings::PURCHASE_THANKS => MemberLifecycleMailer::KIND_PURCHASE_THANKS,
        MemberMailSettings::WELCOME_WEEK => MemberLifecycleMailer::KIND_WELCOME_WEEK,
        MemberMailSettings::POSITION_ENDING => MemberLifecycleMailer::KIND_POSITION_ENDING,
        MemberMailSettings::WITHDRAW_FAREWELL => MemberLifecycleMailer::KIND_WITHDRAW_FAREWELL,
    ];

    /** 종류 → 미리보기 견본 (첫 번째가 기본) */
    public const VARIANTS = [
        MemberMailSettings::CARD_POSTED => ['study_room', 'tutor', 'student'],
        MemberMailSettings::PURCHASE_THANKS => ['study_room_prime', 'study_room_pick', 'tutor_prime', 'tutor_pick'],
        MemberMailSettings::WELCOME_WEEK => ['study_room', 'tutor', 'student', 'no_card'],
        MemberMailSettings::POSITION_ENDING => ['study_room_prime', 'study_room_pick', 'tutor_prime', 'tutor_pick'],
        MemberMailSettings::WITHDRAW_FAREWELL => ['study_room', 'tutor', 'student', 'reason_given'],
    ];

    /** 미리보기·시험 발송의 사유 받기 링크 값 — 실제 링크가 아니라 열면 「쓸 수 없는 링크」로 보인다 */
    public const SAMPLE_REASON_TOKEN = 'sample';

    /** @var array<string, mixed> */
    private array $config;

    /** @param array<string, mixed>|null $config */
    public function __construct(
        private readonly PDO $pdo,
        private readonly MemberMailSettings $settings,
        ?array $config = null,
        private ?AuthMailer $mailer = null,
        private readonly ?DateTimeImmutable $now = null,
    ) {
        $this->config = $config ?? study114_config('auth');
    }

    /** @return array<string, mixed> */
    public function view(bool $canEdit, string $operator): array
    {
        $states = $this->settings->all();
        $sent = $this->sentLast7Days();
        $kinds = [];
        foreach (MemberMailSettings::KINDS as $kind) {
            $kinds[] = [
                'id' => $kind,
                'enabled' => $states[$kind]['enabled'],
                'changed_at' => $states[$kind]['changed_at'],
                'changed_by' => $states[$kind]['changed_by'],
                'sent_7d' => $sent[$kind] ?? 0,
                'variants' => self::VARIANTS[$kind],
            ];
        }

        return [
            'kinds' => $kinds,
            'lifecycle_enabled' => ($this->config['lifecycle_mail_enabled'] ?? true) === true,
            'can_edit' => $canEdit,
            'daily_cap' => MemberMailScheduler::DAILY_CAP,
            'test_left' => max(0, self::TEST_DAILY_LIMIT - $this->testsToday($operator)),
        ];
    }

    /** @return array{subject: string, plain: string, html: string} */
    public function preview(string $kind, string $variant): array
    {
        if (!MemberMailSettings::isKind($kind)) {
            throw new InvalidArgumentException('알 수 없는 메일 종류입니다.');
        }
        $variants = self::VARIANTS[$kind];
        if ($variant === '') {
            $variant = $variants[0];
        }
        if (!in_array($variant, $variants, true)) {
            throw new InvalidArgumentException('알 수 없는 미리보기 견본입니다.');
        }
        $home = (string) ($this->config['home_ui'] ?? '');
        $today = $this->now()->format('Y-m-d');
        $day = fn (int $d): string => $this->now()->modify(($d >= 0 ? '+' : '') . $d . ' days')->format('Y-m-d');
        [$role, $product] = match ($variant) {
            'study_room', 'no_card' => [MemberMailRole::STUDY_ROOM, ''],
            'study_room_prime' => [MemberMailRole::STUDY_ROOM, 'prime'],
            'study_room_pick' => [MemberMailRole::STUDY_ROOM, 'pick'],
            'tutor' => [MemberMailRole::TUTOR, ''],
            'tutor_prime' => [MemberMailRole::TUTOR, 'prime'],
            'tutor_pick' => [MemberMailRole::TUTOR, 'pick'],
            default => [MemberMailRole::STUDENT, ''],
        };
        $room = ['room_name' => '해솔공부방'];

        return match ($kind) {
            MemberMailSettings::CARD_POSTED => MemberLifecycleMailTemplate::cardPosted($role, ['home_ui' => $home]
                + ($role === MemberMailRole::STUDY_ROOM ? $room : [])
                + ($role === MemberMailRole::TUTOR ? ['region_label' => '경기도 수원시'] : [])),
            MemberMailSettings::PURCHASE_THANKS => MemberLifecycleMailTemplate::purchaseThanks($role, [
                'home_ui' => $home,
                'product' => $product === 'pick' ? 'pick' : 'prime',
                'period_label' => '1개월',
                'started_on' => $today,
                'ends_on' => $day(29),
                'amount_won' => 50000,
            ] + ($role === MemberMailRole::STUDY_ROOM ? $room + ['scope_label' => '역삼동'] : ['city_label' => '경기도 수원시', 'subject_label' => '수학'])),
            MemberMailSettings::WELCOME_WEEK => MemberLifecycleMailTemplate::welcomeWeek($role, [
                'home_ui' => $home,
                'has_card' => $variant !== 'no_card',
            ] + ($variant === 'study_room' ? $room : [])
                + ($variant === 'tutor' ? ['region_label' => '경기도 수원시'] : [])),
            MemberMailSettings::POSITION_ENDING => MemberLifecycleMailTemplate::positionEnding($role, [
                'home_ui' => $home,
                'product' => $product === 'pick' ? 'pick' : 'prime',
                'started_on' => $day(-27),
                'ends_on' => $day(2),
            ] + ($role === MemberMailRole::STUDY_ROOM ? $room : [])),
            MemberMailSettings::WITHDRAW_FAREWELL => MemberLifecycleMailTemplate::withdrawn($role, [
                'home_ui' => $home,
                'withdrawn_at' => $this->now()->format('Y-m-d H:i:s'),
            ] + ($variant === 'reason_given'
                ? ['reason' => 'given']
                : ['reason' => 'ask', 'reason_url' => MemberLifecycleMailTemplate::withdrawReasonUrl($home, self::SAMPLE_REASON_TOKEN)])),
        };
    }

    /** 운영자 본인 주소로 견본을 보낸다. 발송 기록·하루 한도(회원 메일)에는 넣지 않는다. */
    public function sendTest(string $kind, string $variant, string $operatorEmail): string
    {
        $to = trim($operatorEmail);
        if (!filter_var($to, FILTER_VALIDATE_EMAIL) || (new AccountContactService())->isInternalEmail($to)) {
            throw new InvalidArgumentException('운영자 계정에 받을 수 있는 이메일이 없어 시험 메일을 보낼 수 없어요.');
        }
        if ($this->testsToday($to) >= self::TEST_DAILY_LIMIT) {
            throw new RuntimeException('test_limit');
        }
        $mail = $this->preview($kind, $variant);
        $ok = $this->mailer()->send($to, self::TEST_SUBJECT_PREFIX . $mail['subject'], $mail['plain'], $mail['html']);
        if (!$ok) {
            throw new RuntimeException('send_failed');
        }
        $this->log($to, self::LOG_TEST, $kind, $kind . ':' . ($variant !== '' ? $variant : self::VARIANTS[$kind][0]));

        return $to;
    }

    public function setEnabled(string $kind, bool $enabled, string $operator): void
    {
        $before = $this->settings->isEnabled($kind);
        $this->settings->setEnabled($kind, $enabled, $operator);
        if ($before !== $enabled) {
            $this->log($operator, self::LOG_TOGGLE, $kind, $kind . ($enabled ? ' 보내는 중' : ' 멈춤'));
        }
    }

    /** @return array<string, int> 종류 → 최근 7일(지금부터 168시간) 보낸 수 */
    private function sentLast7Days(): array
    {
        $byDispatch = array_flip(self::DISPATCH_KIND);
        $place = implode(', ', array_fill(0, count($byDispatch), '?'));
        $stmt = $this->pdo->prepare(
            "SELECT reminder_kind, COUNT(*) AS n FROM provider_reminder_dispatches
              WHERE channel = 'email' AND reminder_kind IN ({$place}) AND sent_at >= ?
              GROUP BY reminder_kind"
        );
        $stmt->execute([...array_keys($byDispatch), $this->now()->modify('-7 days')->format('Y-m-d H:i:s')]);
        $out = [];
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $kind = $byDispatch[(string) $row['reminder_kind']] ?? null;
            if ($kind !== null) {
                $out[$kind] = (int) $row['n'];
            }
        }

        return $out;
    }

    private function testsToday(string $operator): int
    {
        if ($operator === '') {
            return 0;
        }
        try {
            $stmt = $this->pdo->prepare(
                'SELECT COUNT(*) FROM admin_operation_logs WHERE operator_id = ? AND action_kind = ? AND acted_at >= ?'
            );
            $stmt->execute([$operator, self::LOG_TEST, $this->now()->format('Y-m-d') . ' 00:00:00']);

            return (int) $stmt->fetchColumn();
        } catch (Throwable $e) {
            error_log('[member-mail-admin] test count: ' . $e->getMessage());

            return 0;
        }
    }

    private function log(string $operator, string $action, string $kind, string $memo): void
    {
        try {
            (new AdminOperationLogRepository($this->pdo))->insert(
                $operator !== '' ? $operator : 'admin',
                'member_mail',
                $kind,
                $action,
                'member_mail',
                $memo,
                false,
                false,
            );
        } catch (Throwable $e) {
            error_log('[member-mail-admin] log skipped: ' . $e->getMessage());
        }
    }

    private function now(): DateTimeImmutable
    {
        return $this->now ?? new DateTimeImmutable('now', PositionPeriodCalculator::timezone());
    }

    private function mailer(): AuthMailer
    {
        return $this->mailer ??= new AuthMailer();
    }
}
