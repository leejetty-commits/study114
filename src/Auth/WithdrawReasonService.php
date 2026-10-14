<?php

declare(strict_types=1);

namespace Study114\Auth;

use DateTimeImmutable;
use PDO;
use PDOException;
use RuntimeException;
use Study114\Mail\MemberMailRole;
use Study114\Paid\PositionPeriodCalculator;
use Throwable;

/**
 * 탈퇴 사유 받기 (정본 74 §1-4 · SQL 080).
 *
 * - 사유 표 withdraw_reasons 에는 회원 번호·이메일을 두지 않는다. 날짜(KST)만 남긴다.
 * - 메일 링크 표 withdraw_reason_links 는 링크 값의 sha256·역할·만료 시각만. 한 번 쓰면 행을 지운다.
 * - 표가 없으면(SQL 080 적용 전) 저장·링크 만들기는 조용히 건너뛴다 → 탈퇴는 그대로 진행.
 */
final class WithdrawReasonService
{
    public const SOURCE_WITHDRAW = 'withdraw';
    public const SOURCE_MAIL = 'mail';

    public const LINK_DAYS = 30;
    /** 링크로 여는 화면 — 고객센터 아래 공개 화면(로그인 없음). 값은 ?t= 로 붙인다 */
    public const LINK_PATH = '/#/support/leave-reason';
    public const NOTE_MAX = 100;
    public const OTHER = 'other';

    public const SCHEMA_MISSING = 'schema_missing';

    /** 역할별 선택지 (화면 순서). 문구는 preview/home-ui/src/withdraw-reason-copy.js */
    public const ROLE_CODES = [
        MemberMailRole::STUDENT => ['found_teacher', 'no_match'],
        MemberMailRole::STUDY_ROOM => ['enough_students', 'no_inquiry', 'cost'],
        MemberMailRole::TUTOR => ['enough_students', 'no_inquiry', 'cost'],
    ];

    /** 모두에게 보이는 선택지 (역할별 선택지 뒤) */
    public const COMMON_CODES = ['inconvenient', 'other_service', 'taking_break', self::OTHER];

    /** 관리자 화면에서 고를 수 있는 기간(일) */
    public const SUMMARY_DAYS = [30, 90, 365];

    private const NOTES_LIMIT = 50;

    public function __construct(
        private readonly PDO $pdo,
        private readonly ?DateTimeImmutable $now = null,
    ) {
    }

    /** @return list<string> 이 역할에게 보이는 선택지. 역할을 모르면 공통 선택지만 */
    public static function codesFor(string $role): array
    {
        return [...(self::ROLE_CODES[$role] ?? []), ...self::COMMON_CODES];
    }

    /** @return list<string> 모든 선택지 (겹침 없이, 관리자 표 순서) */
    public static function allCodes(): array
    {
        $out = [];
        foreach ([...self::ROLE_CODES[MemberMailRole::STUDENT], ...self::ROLE_CODES[MemberMailRole::STUDY_ROOM], ...self::COMMON_CODES] as $code) {
            if (!in_array($code, $out, true)) {
                $out[] = $code;
            }
        }

        return $out;
    }

    public static function normalizeRole(string $role): string
    {
        return isset(self::ROLE_CODES[$role]) ? $role : '';
    }

    /**
     * 화면·API에서 받은 값 → 저장할 값. 고르지 않았거나 모르는 선택지면 null.
     * 한 줄은 「기타」일 때만 남긴다(줄바꿈·제어문자 제거, 100자).
     *
     * @return array{code: string, note: ?string}|null
     */
    public static function normalizeAnswer(mixed $code, mixed $note): ?array
    {
        $code = is_string($code) ? trim($code) : '';
        if ($code === '' || !in_array($code, self::allCodes(), true)) {
            return null;
        }
        $clean = null;
        if ($code === self::OTHER && is_string($note)) {
            $text = trim((string) preg_replace('/\s+/u', ' ', (string) preg_replace('/\p{C}+/u', ' ', $note)));
            $text = (string) preg_replace('/^(.{' . self::NOTE_MAX . '}).+$/us', '$1', $text);
            $clean = $text !== '' ? $text : null;
        }

        return ['code' => $code, 'note' => $clean];
    }

    /** 사유 한 건 저장. 실패해도 예외를 밖으로 던지지 않는다(탈퇴를 막지 않음). */
    public function record(string $role, string $code, ?string $note, string $source): bool
    {
        try {
            $this->insertReason($role, $code, $note, $source);

            return true;
        } catch (Throwable $e) {
            error_log('[withdraw-reason] record: ' . $e->getMessage());

            return false;
        }
    }

    /** 메일 링크 값(64자). 표가 없거나 실패하면 null → 메일에 링크를 넣지 않는다. */
    public function issueLink(string $role): ?string
    {
        try {
            $token = bin2hex(random_bytes(32));
            $this->pdo->prepare('DELETE FROM withdraw_reason_links WHERE expires_at < ?')->execute([$this->stamp()]);
            $this->pdo->prepare(
                'INSERT INTO withdraw_reason_links (token_hash, role_type, expires_at) VALUES (?, ?, ?)'
            )->execute([
                hash('sha256', $token),
                self::normalizeRole($role),
                $this->now()->modify('+' . self::LINK_DAYS . ' days')->format('Y-m-d H:i:s'),
            ]);

            return $token;
        } catch (Throwable $e) {
            error_log('[withdraw-reason] link: ' . $e->getMessage());

            return null;
        }
    }

    /** @return array{role: string}|null 쓸 수 있는 링크면 역할, 아니면(없음·만료·이미 씀·표 없음) null */
    public function peekLink(string $token): ?array
    {
        if (!self::isToken($token)) {
            return null;
        }
        try {
            $stmt = $this->pdo->prepare(
                'SELECT role_type FROM withdraw_reason_links WHERE token_hash = ? AND expires_at >= ? LIMIT 1'
            );
            $stmt->execute([hash('sha256', $token), $this->stamp()]);
            $role = $stmt->fetchColumn();
        } catch (PDOException $e) {
            if ($this->isMissingTable($e)) {
                return null;
            }
            throw $e;
        }

        return $role === false ? null : ['role' => self::normalizeRole((string) $role)];
    }

    /**
     * 메일 링크로 받은 사유. 링크는 한 번만 — 저장과 같은 트랜잭션에서 링크 행을 지운다.
     * 선택지가 틀리면 링크를 쓰지 않고 null.
     *
     * @return bool|null true 저장 · false 쓸 수 없는 링크 · null 선택지 틀림
     */
    public function answerLink(string $token, mixed $code, mixed $note): ?bool
    {
        $answer = self::normalizeAnswer($code, $note);
        if ($answer === null) {
            return null;
        }
        if (!self::isToken($token)) {
            return false;
        }
        $mysql = $this->pdo->getAttribute(PDO::ATTR_DRIVER_NAME) !== 'sqlite';
        $this->pdo->beginTransaction();
        try {
            $stmt = $this->pdo->prepare(
                'SELECT id, role_type FROM withdraw_reason_links WHERE token_hash = ? AND expires_at >= ? LIMIT 1'
                . ($mysql ? ' FOR UPDATE' : '')
            );
            $stmt->execute([hash('sha256', $token), $this->stamp()]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$row) {
                $this->pdo->rollBack();

                return false;
            }
            $del = $this->pdo->prepare('DELETE FROM withdraw_reason_links WHERE id = ?');
            $del->execute([(int) $row['id']]);
            if ($del->rowCount() !== 1) {
                $this->pdo->rollBack();

                return false;
            }
            $this->insertReason((string) $row['role_type'], $answer['code'], $answer['note'], self::SOURCE_MAIL);
            $this->pdo->commit();

            return true;
        } catch (PDOException $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            if ($this->isMissingTable($e)) {
                return false;
            }
            throw $e;
        } catch (Throwable $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $e;
        }
    }

    /**
     * 관리자 「회원관리 › 탈퇴 사유」. 오늘을 포함한 최근 $days일.
     *
     * @return array{
     *   days: int, since: string, total: int,
     *   by_source: array{withdraw: int, mail: int},
     *   rows: list<array{code: string, study_room: int, tutor: int, student: int, unknown: int, total: int}>,
     *   notes: list<array{on: string, role: string, note: string}>
     * }
     */
    public function summary(int $days): array
    {
        if (!in_array($days, self::SUMMARY_DAYS, true)) {
            $days = self::SUMMARY_DAYS[0];
        }
        $since = $this->now()->modify('-' . ($days - 1) . ' days')->format('Y-m-d');
        try {
            $stmt = $this->pdo->prepare(
                'SELECT reason_code, role_type, source, COUNT(*) AS n
                   FROM withdraw_reasons
                  WHERE answered_on >= ?
                  GROUP BY reason_code, role_type, source'
            );
            $stmt->execute([$since]);
            $counts = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $notesStmt = $this->pdo->prepare(
                'SELECT answered_on, role_type, reason_note
                   FROM withdraw_reasons
                  WHERE answered_on >= ? AND reason_code = ? AND reason_note IS NOT NULL AND reason_note <> \'\'
                  ORDER BY answered_on DESC, id DESC
                  LIMIT ' . self::NOTES_LIMIT
            );
            $notesStmt->execute([$since, self::OTHER]);
            $noteRows = $notesStmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            if ($this->isMissingTable($e)) {
                throw new RuntimeException(self::SCHEMA_MISSING, 0, $e);
            }
            throw $e;
        }

        $rows = [];
        foreach (self::allCodes() as $code) {
            $rows[$code] = ['code' => $code, 'study_room' => 0, 'tutor' => 0, 'student' => 0, 'unknown' => 0, 'total' => 0];
        }
        $bySource = [self::SOURCE_WITHDRAW => 0, self::SOURCE_MAIL => 0];
        $total = 0;
        foreach ($counts as $c) {
            $code = (string) $c['reason_code'];
            $n = (int) $c['n'];
            if (!isset($rows[$code])) {
                continue;
            }
            $role = self::normalizeRole((string) $c['role_type']);
            $rows[$code][$role === '' ? 'unknown' : $role] += $n;
            $rows[$code]['total'] += $n;
            $source = (string) $c['source'];
            if (isset($bySource[$source])) {
                $bySource[$source] += $n;
            }
            $total += $n;
        }

        return [
            'days' => $days,
            'since' => $since,
            'total' => $total,
            'by_source' => $bySource,
            'rows' => array_values($rows),
            'notes' => array_map(static fn (array $r): array => [
                'on' => (string) $r['answered_on'],
                'role' => self::normalizeRole((string) $r['role_type']),
                'note' => (string) $r['reason_note'],
            ], $noteRows),
        ];
    }

    public static function isToken(string $token): bool
    {
        return preg_match('/^[a-f0-9]{64}$/', $token) === 1;
    }

    private function insertReason(string $role, string $code, ?string $note, string $source): void
    {
        if (!in_array($code, self::allCodes(), true)) {
            throw new RuntimeException('unknown reason code');
        }
        if (!in_array($source, [self::SOURCE_WITHDRAW, self::SOURCE_MAIL], true)) {
            throw new RuntimeException('unknown reason source');
        }
        $this->pdo->prepare(
            'INSERT INTO withdraw_reasons (role_type, reason_code, reason_note, source, answered_on) VALUES (?, ?, ?, ?, ?)'
        )->execute([
            self::normalizeRole($role),
            $code,
            $code === self::OTHER ? $note : null,
            $source,
            $this->now()->format('Y-m-d'),
        ]);
    }

    private function isMissingTable(PDOException $e): bool
    {
        $msg = $e->getMessage();

        return str_contains($msg, 'withdraw_reason')
            && (str_contains($msg, '1146') || str_contains($msg, '42S02') || str_contains($msg, 'no such table') || str_contains($msg, 'exist'));
    }

    private function stamp(): string
    {
        return $this->now()->format('Y-m-d H:i:s');
    }

    private function now(): DateTimeImmutable
    {
        return $this->now ?? new DateTimeImmutable('now', PositionPeriodCalculator::timezone());
    }
}
