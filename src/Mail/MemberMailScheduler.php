<?php

declare(strict_types=1);

namespace Study114\Mail;

use DateTimeImmutable;
use PDO;
use Study114\Paid\PositionPeriodCalculator;

/**
 * 정해진 시각에 나가는 생활 메일 — 첫 일주일 안부 · Prime/Pick 마무리 3일 전.
 * cron(public/api/cron/member-mail.php)이 낮 동안 여러 번 부른다. 한 번에 조금씩 보내고, 남은 것은 다음 호출이 잇는다.
 *
 * - 밤(21시~9시)에는 보내지 않는다.
 * - Resend 무료 한도(하루 100통)는 가입 확인·비밀번호 재설정과 같이 쓴다 → 생활 메일이 하루 DAILY_CAP통이면 멈춘다.
 * - 이미 보낸(발송 기록이 있는) 대상은 고를 때부터 뺀다. 실패하면 기록이 지워져 다음 호출이 다시 시도한다.
 */
final class MemberMailScheduler
{
    public const SEND_FROM_HOUR = 9;
    public const SEND_UNTIL_HOUR = 21;
    public const DAILY_CAP = 60;
    public const BATCH = 30;
    public const CANDIDATE_LIMIT = 100;
    public const TIME_BUDGET_SECONDS = 20.0;
    public const WELCOME_MIN_DAYS = 7;
    public const WELCOME_MAX_DAYS = 10;
    public const ENDING_DAYS_LEFT = 3;

    /** user_roles.role_type 중 회원 역할(admin 제외) */
    private const MEMBER_ROLE_TYPES = ['study_room_owner', 'tutor', 'guardian_student'];

    /** @var callable(): float */
    private $clock;

    /** @param (callable(): float)|null $clock 초 단위 시계(시험용) */
    public function __construct(
        private readonly PDO $pdo,
        private readonly MemberLifecycleMailer $mailer,
        ?callable $clock = null,
    ) {
        $this->clock = $clock ?? static fn (): float => microtime(true);
    }

    /** @return array<string, mixed> */
    public function run(?DateTimeImmutable $now = null): array
    {
        $now = ($now ?? new DateTimeImmutable('now'))->setTimezone(PositionPeriodCalculator::timezone());
        if (!$this->mailer->isEnabled()) {
            return ['ran' => false, 'reason' => 'disabled'];
        }
        $hour = (int) $now->format('G');
        if ($hour < self::SEND_FROM_HOUR || $hour >= self::SEND_UNTIL_HOUR) {
            return ['ran' => false, 'reason' => 'quiet_hours'];
        }
        $settings = $this->mailer->settings();
        $endingOn = $settings->isEnabled(MemberMailSettings::POSITION_ENDING);
        $welcomeOn = $settings->isEnabled(MemberMailSettings::WELCOME_WEEK);
        if (!$endingOn && !$welcomeOn) {
            return ['ran' => false, 'reason' => 'paused'];
        }

        $sentToday = $this->countSentToday($now);
        $budget = min(self::BATCH, self::DAILY_CAP - $sentToday);
        $result = [
            'ran' => true,
            'sent_today_before' => $sentToday,
            'sent' => 0,
            'skipped' => 0,
            'failed' => 0,
            'by_kind' => ['position_ending' => [], 'welcome_week' => []],
            'stopped' => 'done',
        ];
        if ($budget <= 0) {
            $result['stopped'] = 'daily_cap';

            return $result;
        }

        $started = ($this->clock)();
        $today = $now->format('Y-m-d');
        $jobs = [];
        if ($endingOn) {
            foreach ($this->endingCandidates($now) as $sub) {
                $jobs[] = ['position_ending', fn (): string => $this->mailer->sendPositionEnding($sub, $today)];
            }
        }
        if ($welcomeOn) {
            foreach ($this->welcomeCandidates($now, $settings->enabledSince(MemberMailSettings::WELCOME_WEEK)) as $userId) {
                $jobs[] = ['welcome_week', fn (): string => $this->mailer->sendWelcomeWeek($userId)];
            }
        }

        foreach ($jobs as [$kind, $send]) {
            if ($result['sent'] >= $budget) {
                $result['stopped'] = $budget < self::BATCH ? 'daily_cap' : 'batch';
                break;
            }
            if (($this->clock)() - $started >= self::TIME_BUDGET_SECONDS) {
                $result['stopped'] = 'time';
                break;
            }
            $code = $send();
            $result['by_kind'][$kind][$code] = ($result['by_kind'][$kind][$code] ?? 0) + 1;
            if ($code === 'sent') {
                $result['sent']++;
            } elseif ($code === 'failed' || $code === 'error') {
                $result['failed']++;
            } else {
                $result['skipped']++;
            }
        }

        return $result;
    }

    private function countSentToday(DateTimeImmutable $now): int
    {
        $stmt = $this->pdo->prepare(
            "SELECT COUNT(*) FROM provider_reminder_dispatches
              WHERE channel = 'email' AND reminder_kind LIKE 'lifecycle%' AND sent_at >= ?"
        );
        $stmt->execute([$now->format('Y-m-d') . ' 00:00:00']);

        return (int) $stmt->fetchColumn();
    }

    /** @return list<array<string, mixed>> 오늘이 마지막 이용일 3일 전(end_exclusive_on = 오늘 + 3일)인 이용권 */
    private function endingCandidates(DateTimeImmutable $now): array
    {
        $endExclusive = $now->modify('+' . self::ENDING_DAYS_LEFT . ' days')->format('Y-m-d');
        $key = $this->concat(["'" . MemberLifecycleMailer::DEDUPE_POSITION_ENDING . "'", 's.id', "':'", 's.end_exclusive_on']);
        $stmt = $this->pdo->prepare(
            "SELECT s.id, s.user_id, s.sku_code, s.provider_type, s.provider_id, s.started_on, s.end_exclusive_on
               FROM provider_position_subscriptions s
               JOIN users u ON u.id = s.user_id
              WHERE s.end_exclusive_on = ?
                AND s.sku_code IN ('prime', 'pick')
                AND " . $this->mailableUserSql('u') . "
                AND NOT EXISTS (SELECT 1 FROM provider_reminder_dispatches d WHERE d.dedupe_key = {$key})
              ORDER BY s.id
              LIMIT " . self::CANDIDATE_LIMIT
        );
        $stmt->execute([$endExclusive]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * 가입 7~10일, 받을 수 있는 회원(대표 역할이 회원 역할), 아직 안 받은 회원.
     * $enabledSince(다시 켠 시각)가 있으면 가입 7일이 그 뒤에 된 회원만 — 꺼져 있던 동안 쌓인 대상에게 몰아서 보내지 않는다.
     *
     * @return list<int>
     */
    private function welcomeCandidates(DateTimeImmutable $now, ?string $enabledSince = null): array
    {
        $upper = $now->modify('-' . self::WELCOME_MIN_DAYS . ' days')->format('Y-m-d H:i:s');
        $lower = $now->modify('-' . self::WELCOME_MAX_DAYS . ' days')->format('Y-m-d H:i:s');
        if ($enabledSince !== null) {
            $since = (new DateTimeImmutable($enabledSince, PositionPeriodCalculator::timezone()))
                ->modify('-' . self::WELCOME_MIN_DAYS . ' days')->format('Y-m-d H:i:s');
            if ($since > $lower) {
                $lower = $since;
            }
        }
        $key = $this->concat(["'" . MemberLifecycleMailer::DEDUPE_WELCOME_WEEK . "'", 'u.id']);
        $roles = implode(', ', array_map(static fn (string $r): string => "'" . $r . "'", self::MEMBER_ROLE_TYPES));
        $stmt = $this->pdo->prepare(
            "SELECT u.id
               FROM users u
              WHERE " . $this->mailableUserSql('u') . "
                AND u.created_at <= ?
                AND u.created_at > ?
                AND (SELECT r.role_type FROM user_roles r
                      WHERE r.user_id = u.id AND r.status = 'active'
                      ORDER BY r.is_primary DESC, r.id ASC
                      LIMIT 1) IN ({$roles})
                AND NOT EXISTS (SELECT 1 FROM provider_reminder_dispatches d WHERE d.dedupe_key = {$key})
              ORDER BY u.created_at, u.id
              LIMIT " . self::CANDIDATE_LIMIT
        );
        $stmt->execute([$upper, $lower]);

        return array_map('intval', $stmt->fetchAll(PDO::FETCH_COLUMN));
    }

    /**
     * 메일을 받을 수 있는 회원 — MemberLifecycleMailer::recipient()·AccountContactService::isInternalEmail()과 같은 규칙.
     * 보내지 못할 회원이 후보 한도(CANDIDATE_LIMIT)를 매번 차지하지 않도록 고를 때 미리 뺀다.
     */
    private function mailableUserSql(string $alias): string
    {
        return "{$alias}.status = 'active'
                AND {$alias}.email_verified_at IS NOT NULL
                AND LOWER({$alias}.email) NOT LIKE '%@users.study114.local'
                AND LOWER({$alias}.email) NOT LIKE 'oauth!_%' ESCAPE '!'";
    }

    /** @param list<string> $parts SQL 조각 */
    private function concat(array $parts): string
    {
        return $this->pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'sqlite'
            ? '(' . implode(' || ', $parts) . ')'
            : 'CONCAT(' . implode(', ', $parts) . ')';
    }
}
