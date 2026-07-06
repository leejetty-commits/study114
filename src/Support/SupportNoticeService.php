<?php

declare(strict_types=1);

namespace Study114\Support;

use InvalidArgumentException;
use Study114\Database\Connection;

final class SupportNoticeService
{
    private SupportNoticeRepository $repo;

    public function __construct(?SupportNoticeRepository $repo = null)
    {
        $this->repo = $repo ?? new SupportNoticeRepository(Connection::get());
    }

    /** @return list<array<string, mixed>> */
    public function list(): array
    {
        return array_map(fn (array $row) => $this->mapNotice($row), $this->repo->listAll());
    }

    /** @param array<string, mixed> $input */
    public function save(array $input): array
    {
        $noticeKey = isset($input['id']) ? trim((string) $input['id']) : null;
        $date = trim((string) ($input['date'] ?? ''));
        $title = trim((string) ($input['title'] ?? ''));
        $body = $input['body'] ?? [];

        if ($date === '') {
            throw new InvalidArgumentException('날짜가 필요합니다.');
        }
        if ($title === '') {
            throw new InvalidArgumentException('제목이 필요합니다.');
        }

        $paragraphs = is_array($body)
            ? array_values(array_filter(array_map(static fn ($v) => trim((string) $v), $body)))
            : array_values(array_filter(array_map('trim', preg_split('/\R/u', (string) $body) ?: [])));
        if ($paragraphs === []) {
            throw new InvalidArgumentException('본문이 필요합니다.');
        }

        return $this->mapNotice($this->repo->save($noticeKey, $date, $title, $paragraphs));
    }

    public function delete(string $noticeKey): void
    {
        if ($noticeKey === '') {
            throw new InvalidArgumentException('공지 id가 필요합니다.');
        }
        $this->repo->delete($noticeKey);
    }

    /** @return list<array<string, mixed>> */
    public function resetSeed(): array
    {
        $this->repo->resetSeed();
        return $this->list();
    }

    /** @param array<string, mixed> $row @return array<string, mixed> */
    private function mapNotice(array $row): array
    {
        $body = json_decode((string) $row['body_json'], true);
        return [
            'id' => (string) $row['notice_key'],
            'date' => (string) $row['notice_date'],
            'title' => (string) $row['title'],
            'body' => is_array($body) ? array_values(array_map('strval', $body)) : [],
        ];
    }
}
