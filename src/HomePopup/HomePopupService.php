<?php

declare(strict_types=1);

namespace Study114\HomePopup;

use DateTimeImmutable;
use DateTimeZone;

final class HomePopupValidationException extends \RuntimeException
{
    public function __construct(private readonly string $errorCode, string $message)
    {
        parent::__construct($message);
    }

    public function errorCode(): string
    {
        return $this->errorCode;
    }
}

final class HomePopupService
{
    /** @var array<string, list<string>> */
    private const CONTENT_KEYS = [
        'notice' => ['date', 'title', 'body', 'bullets', 'cta', 'ctaHref'],
        'event' => ['kicker', 'title', 'chip', 'body', 'period', 'note', 'cta', 'ctaHref'],
        'ad' => ['chip', 'title', 'body', 'aside', 'primary', 'primaryHref', 'secondary', 'secondaryHref'],
    ];

    /** @var list<string> */
    private const AUDIENCE = ['all', 'guest', 'studyRoom', 'tutor', 'student'];

    /** @var list<string> */
    private const HREF_KEYS = ['ctaHref', 'primaryHref', 'secondaryHref'];

    /** @var list<string> */
    private const BUTTON_KEYS = ['cta', 'primary', 'secondary'];

    public function __construct(private readonly ?HomePopupRepository $repo = null)
    {
    }

    private function repo(): HomePopupRepository
    {
        return $this->repo ?? HomePopupRepository::connect();
    }

    /** @return list<array<string, mixed>> */
    public function list(): array
    {
        return array_map($this->present(...), $this->repo()->listAll());
    }

    /** @return array<string, mixed>|null */
    public function get(int $id): ?array
    {
        $row = $this->repo()->find($id);

        return $row === null ? null : $this->present($row);
    }

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function save(array $input): array
    {
        $row = $this->normalize($input);
        $id = isset($input['id']) ? (int) $input['id'] : 0;
        if ($id > 0) {
            if ($this->repo()->find($id) === null) {
                throw new HomePopupValidationException('not_found', '팝업을 찾을 수 없습니다.');
            }
            $this->repo()->update($id, $row);
        } else {
            $id = $this->repo()->insert($row);
        }
        $saved = $this->repo()->find($id);
        if ($saved === null) {
            throw new \RuntimeException('저장한 팝업을 읽지 못했습니다.');
        }

        return $this->present($saved);
    }

    public function delete(int $id): void
    {
        $this->repo()->delete($id);
    }

    /** @return list<array<string, mixed>> */
    public function listPublic(): array
    {
        $today = (new DateTimeImmutable('now', new DateTimeZone('Asia/Seoul')))->format('Y-m-d');
        $out = [];
        foreach ($this->repo()->listPublishedInWindow($today) as $row) {
            $item = $this->present($row);
            unset($item['published'], $item['createdAt']);
            $out[] = $item;
        }

        return $out;
    }

    /**
     * @param array<string, mixed> $input
     * @return array{
     *   type: string, family: string, audience: string, content: string,
     *   start_at: ?string, end_at: ?string, published: int, sort_order: int
     * }
     */
    private function normalize(array $input): array
    {
        $type = (string) ($input['type'] ?? '');
        if (!isset(self::CONTENT_KEYS[$type])) {
            throw new HomePopupValidationException('bad_type', 'type은 notice, event, ad만 허용됩니다.');
        }
        $family = (string) ($input['family'] ?? '');
        if ($family !== 'a' && $family !== 'b') {
            throw new HomePopupValidationException('bad_family', 'family는 a 또는 b만 허용됩니다.');
        }

        return [
            'type' => $type,
            'family' => $family,
            'audience' => json_encode($this->normalizeAudience($input['audience'] ?? null), JSON_UNESCAPED_UNICODE),
            'content' => json_encode($this->normalizeContent($type, $input['content'] ?? null), JSON_UNESCAPED_UNICODE),
            'start_at' => $this->normalizeDate($input['startAt'] ?? $input['start_at'] ?? null, 'startAt'),
            'end_at' => $this->boundEnd(
                $this->normalizeDate($input['startAt'] ?? $input['start_at'] ?? null, 'startAt'),
                $this->normalizeDate($input['endAt'] ?? $input['end_at'] ?? null, 'endAt'),
            ),
            'published' => $this->normalizePublished($input['published'] ?? 0),
            'sort_order' => $this->normalizeSort($input['sortOrder'] ?? $input['sort_order'] ?? 0),
        ];
    }

    /** @return list<string> */
    private function normalizeAudience(mixed $raw): array
    {
        if (!is_array($raw) || $raw === []) {
            throw new HomePopupValidationException('audience_required', 'audience가 필요합니다.');
        }
        $out = [];
        foreach ($raw as $item) {
            $code = trim((string) $item);
            if (!in_array($code, self::AUDIENCE, true)) {
                throw new HomePopupValidationException('bad_audience', '허용되지 않은 audience입니다.');
            }
            if (!in_array($code, $out, true)) {
                $out[] = $code;
            }
        }
        if ($out === []) {
            throw new HomePopupValidationException('audience_required', 'audience가 필요합니다.');
        }
        if (in_array('all', $out, true)) {
            return ['all'];
        }

        return $out;
    }

    /** @return array<string, mixed> */
    private function normalizeContent(string $type, mixed $raw): array
    {
        $src = is_array($raw) ? $raw : [];
        $out = [];
        foreach (self::CONTENT_KEYS[$type] as $key) {
            if ($key === 'bullets') {
                $out['bullets'] = $this->normalizeBullets($src['bullets'] ?? []);
                continue;
            }
            if (!array_key_exists($key, $src) || $src[$key] === null) {
                continue;
            }
            $text = trim((string) $src[$key]);
            if ($text === '') {
                continue;
            }
            if (in_array($key, self::HREF_KEYS, true)) {
                $this->assertHref($text);
            }
            $out[$key] = $this->clip($text, $this->limitFor($key));
        }

        return $out;
    }

    /** @return list<string> */
    private function normalizeBullets(mixed $raw): array
    {
        if (!is_array($raw)) {
            return [];
        }
        $out = [];
        foreach ($raw as $line) {
            $text = trim((string) $line);
            if ($text === '') {
                continue;
            }
            $out[] = $this->clip($text, 80);
            if (count($out) >= 4) {
                break;
            }
        }

        return $out;
    }

    private function assertHref(string $value): void
    {
        $ok = str_starts_with($value, '#/')
            || str_starts_with($value, '/')
            || str_starts_with($value, 'https://');
        if (!$ok) {
            throw new HomePopupValidationException('bad_href', '링크는 #/ , / , https:// 만 허용됩니다.');
        }
    }

    private function limitFor(string $key): int
    {
        if ($key === 'title') {
            return 60;
        }
        if ($key === 'body') {
            return 400;
        }
        if (in_array($key, self::BUTTON_KEYS, true)) {
            return 20;
        }

        return 80;
    }

    private function clip(string $text, int $max): string
    {
        if (mb_strlen($text) <= $max) {
            return $text;
        }

        return mb_substr($text, 0, $max);
    }

    private function normalizeDate(mixed $raw, string $field): ?string
    {
        if ($raw === null || $raw === '') {
            return null;
        }
        $value = trim((string) $raw);
        $date = DateTimeImmutable::createFromFormat('!Y-m-d', $value);
        $errors = DateTimeImmutable::getLastErrors();
        $bad = $date === false
            || ($errors !== false && ($errors['warning_count'] > 0 || $errors['error_count'] > 0))
            || $date->format('Y-m-d') !== $value;
        if ($bad) {
            throw new HomePopupValidationException('bad_date', $field . '는 YYYY-MM-DD 또는 null이어야 합니다.');
        }

        return $value;
    }

    private function boundEnd(?string $start, ?string $end): ?string
    {
        if ($start !== null && $end !== null && $start > $end) {
            throw new HomePopupValidationException('bad_range', 'startAt은 endAt보다 늦을 수 없습니다.');
        }

        return $end;
    }

    private function normalizePublished(mixed $raw): int
    {
        if ($raw === true || $raw === 1 || $raw === '1') {
            return 1;
        }
        if ($raw === false || $raw === 0 || $raw === '0' || $raw === null || $raw === '') {
            return 0;
        }
        throw new HomePopupValidationException('bad_published', 'published는 0 또는 1입니다.');
    }

    private function normalizeSort(mixed $raw): int
    {
        if (is_int($raw)) {
            return $raw;
        }
        if (is_string($raw) && preg_match('/^-?\d+$/', $raw) === 1) {
            return (int) $raw;
        }
        if (is_float($raw) && floor($raw) === $raw) {
            return (int) $raw;
        }
        throw new HomePopupValidationException('bad_sort', 'sortOrder는 정수여야 합니다.');
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function present(array $row): array
    {
        $audience = json_decode((string) ($row['audience'] ?? '[]'), true);
        $content = json_decode((string) ($row['content'] ?? '{}'), true);

        return [
            'id' => (string) $row['id'],
            'type' => (string) $row['type'],
            'family' => (string) $row['family'],
            'audience' => is_array($audience) ? array_values($audience) : [],
            'content' => is_array($content) ? $content : [],
            'startAt' => $row['start_at'] !== null ? (string) $row['start_at'] : null,
            'endAt' => $row['end_at'] !== null ? (string) $row['end_at'] : null,
            'published' => isset($row['published']) ? ((int) $row['published'] === 1) : true,
            'sortOrder' => (int) ($row['sort_order'] ?? 0),
            'updatedAt' => $this->stamp($row['updated_at'] ?? null),
            'createdAt' => isset($row['created_at']) ? $this->stamp($row['created_at']) : null,
        ];
    }

    private function stamp(mixed $value): string
    {
        $text = trim((string) $value);
        if ($text === '') {
            return '';
        }

        return str_replace(' ', 'T', $text);
    }
}
