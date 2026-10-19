<?php

declare(strict_types=1);

namespace Study114\Support;

use PDO;

final class SupportNoticeRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    private const COLS = 'id, notice_key, notice_date, title, body_json, created_at, updated_at';

    /** @return list<array<string, mixed>> */
    public function listAll(): array
    {
        $stmt = $this->pdo->query(
            'SELECT ' . self::COLS . '
             FROM support_notices
             ORDER BY notice_date DESC, id DESC'
        );

        return $stmt->fetchAll();
    }

    /** @return array<string, mixed>|null */
    public function findByKey(string $noticeKey): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT ' . self::COLS . '
             FROM support_notices WHERE notice_key = ? LIMIT 1'
        );
        $stmt->execute([$noticeKey]);
        $row = $stmt->fetch();

        return $row === false ? null : $row;
    }

    /** @param list<string> $body */
    public function save(?string $noticeKey, string $date, string $title, array $body): array
    {
        $bodyJson = json_encode(array_values($body), JSON_UNESCAPED_UNICODE);
        $noticeKey = $noticeKey !== null && $noticeKey !== '' ? $noticeKey : 'notice-' . time();

        $existing = $this->findByKey($noticeKey);
        if ($existing !== null) {
            $stmt = $this->pdo->prepare(
                'UPDATE support_notices
                 SET notice_date = ?, title = ?, body_json = ?, updated_at = NOW()
                 WHERE notice_key = ?'
            );
            $stmt->execute([$date, $title, $bodyJson, $noticeKey]);
        } else {
            $stmt = $this->pdo->prepare(
                'INSERT INTO support_notices (notice_key, notice_date, title, body_json)
                 VALUES (?, ?, ?, ?)'
            );
            $stmt->execute([$noticeKey, $date, $title, $bodyJson]);
        }

        /** @var array<string, mixed> */
        return $this->findByKey($noticeKey);
    }

    public function delete(string $noticeKey): void
    {
        $stmt = $this->pdo->prepare('DELETE FROM support_notices WHERE notice_key = ?');
        $stmt->execute([$noticeKey]);
    }

    public function resetSeed(): void
    {
        $this->pdo->exec('DELETE FROM support_notices');
        $stmt = $this->pdo->prepare(
            'INSERT INTO support_notices (notice_key, notice_date, title, body_json) VALUES (?, ?, ?, ?)'
        );
        $seed = [
            [
                'notice-001',
                '2026-07-01',
                '고객센터·안전과외 가이드 안내',
                json_encode([
                    '고객센터 왼쪽 메뉴·자주 묻는 질문·공지와, 약관·정책의 안전과외 · 이용안내의 안전이용을 볼 수 있습니다.',
                    '공지와 안내는 운영 정책에 따라 업데이트됩니다.',
                ], JSON_UNESCAPED_UNICODE),
            ],
            [
                'notice-002',
                '2026-06-15',
                '쪽지함 이용 안내',
                json_encode([
                    '회원 간 공식 접촉은 쪽지함을 이용합니다.',
                    '운영 문의는 고객센터 문의 채널과 별도입니다.',
                ], JSON_UNESCAPED_UNICODE),
            ],
        ];

        foreach ($seed as $row) {
            $stmt->execute($row);
        }
    }
}
