<?php

declare(strict_types=1);

namespace Study114\Support;

use PDO;

final class SupportNoticeRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    /** @return list<array<string, mixed>> */
    public function listAll(): array
    {
        $stmt = $this->pdo->query(
            'SELECT id, notice_key, notice_date, title, body_json, created_at, updated_at
             FROM support_notices
             ORDER BY notice_date DESC, id DESC'
        );

        return $stmt->fetchAll();
    }

    /** @return array<string, mixed>|null */
    public function findByKey(string $noticeKey): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT id, notice_key, notice_date, title, body_json, created_at, updated_at
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
                '고객센터·안전과외 가이드 1차 오픈 (프리뷰)',
                json_encode([
                    '고객센터 좌측 메뉴·게시판형 FAQ/공지·안전과외 아코디언 UI를 프리뷰에 반영했습니다.',
                    '1차는 정적 콘텐츠이며, 후순위에 관리자 게시판 연동 예정입니다.',
                ], JSON_UNESCAPED_UNICODE),
            ],
            [
                'notice-002',
                '2026-06-15',
                '쪽지함 프리뷰(16a) 안내',
                json_encode([
                    '회원 간 공식 접촉은 쪽지함(16장)을 이용합니다.',
                    '운영 문의는 고객센터 운영 문의 채널과 별도입니다.',
                ], JSON_UNESCAPED_UNICODE),
            ],
        ];

        foreach ($seed as $row) {
            $stmt->execute($row);
        }
    }
}
