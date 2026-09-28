<?php

declare(strict_types=1);

namespace Study114\Neighborhood;

use Study114\Database\Connection;

/** 동네 인사 1차. 파일 저장. 랭킹 가산 없음. */
final class NeighborhoodGreetingService
{
    private const MAX = 80;
    private const TEASER = 20;

    public function __construct(private readonly string $file)
    {
    }

    public static function fromDefaultPath(): self
    {
        return new self(dirname(__DIR__, 2) . '/storage/neighborhood-greetings.json');
    }

    /** @return list<array<string, mixed>> */
    public function listPublic(bool $full): array
    {
        $items = [];
        foreach ($this->read() as $row) {
            if (($row['status'] ?? '') !== 'up') {
                continue;
            }
            $body = (string) ($row['body'] ?? '');
            $name = (string) ($row['display_name'] ?? '');
            $item = [
                'provider_type' => $row['provider_type'],
                'registration_id' => (int) $row['registration_id'],
                'neighborhood' => (string) ($row['neighborhood'] ?? ''),
                'status' => 'up',
                'updated_at' => (int) ($row['updated_at'] ?? 0),
                'masked_name' => self::maskName($name),
                'teaser' => self::teaser($body),
            ];
            if ($full) {
                $item['display_name'] = $name;
                $item['body'] = $body;
            }
            $items[] = $item;
        }
        usort($items, static fn (array $a, array $b): int => ($b['updated_at'] <=> $a['updated_at']));
        return $items;
    }

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function save(int $userId, string $roleType, array $input): array
    {
        $providerType = ($input['provider_type'] ?? '') === 'tutor' ? 'tutor' : 'study_room';
        $expected = $providerType === 'tutor' ? 'tutor' : 'study_room_owner';
        if ($roleType !== $expected) {
            throw new \InvalidArgumentException('공부방·과외쌤만 인사를 올릴 수 있어요.');
        }
        $registrationId = (int) ($input['registration_id'] ?? 0);
        if ($registrationId < 1) {
            throw new \InvalidArgumentException('기본등록이 연결된 뒤에 올릴 수 있어요.');
        }
        $this->assertOwns($userId, $providerType, $registrationId);
        $status = ($input['status'] ?? 'up') === 'down' ? 'down' : 'up';
        $neighborhood = trim((string) ($input['neighborhood'] ?? ''));
        $displayName = trim((string) ($input['display_name'] ?? ''));
        $existing = $this->find($providerType, $registrationId);
        if ($status === 'down') {
            if ($existing === null) {
                throw new \InvalidArgumentException('올릴 인사가 없어요.');
            }
            $existing['status'] = 'down';
            $existing['updated_at'] = (int) round(microtime(true) * 1000);
            $this->upsert($existing);
            return $existing;
        }
        $body = self::normalize((string) ($input['body'] ?? ''));
        $error = self::validate($body);
        if ($error !== '') {
            throw new \InvalidArgumentException($error);
        }
        if ($neighborhood === '') {
            throw new \InvalidArgumentException('등록된 동네가 있어야 올릴 수 있어요.');
        }
        $row = [
            'provider_type' => $providerType,
            'registration_id' => $registrationId,
            'user_id' => $userId,
            'body' => $body,
            'neighborhood' => $neighborhood,
            'display_name' => $displayName !== '' ? $displayName : ($providerType === 'tutor' ? '과외쌤' : '공부방'),
            'status' => 'up',
            'updated_at' => (int) round(microtime(true) * 1000),
        ];
        $this->upsert($row);
        return $row;
    }

    public static function normalize(string $text): string
    {
        $text = preg_replace("/[\r\n]+/u", ' ', $text) ?? $text;
        $text = preg_replace('/[ \t]{2,}/u', ' ', $text) ?? $text;
        return trim($text);
    }

    public static function validate(string $body): string
    {
        if ($body === '') {
            return '한 줄을 입력해 주세요.';
        }
        if (mb_strlen($body) > self::MAX) {
            return '80자 이내로 적어 주세요.';
        }
        if (preg_match('/카카오|카톡|오픈채팅|kakao/iu', $body) === 1) {
            return '전화, 카톡, 주소는 넣을 수 없어요.';
        }
        if (preg_match('/https?:\/\/|www\./iu', $body) === 1) {
            return '전화, 카톡, 주소는 넣을 수 없어요.';
        }
        if (preg_match('/\b[\w-]+\.(com|kr|net|me|io|co)\b/iu', $body) === 1) {
            return '전화, 카톡, 주소는 넣을 수 없어요.';
        }
        $compact = preg_replace('/[\s().\-]/u', '', $body) ?? $body;
        if (preg_match('/01[016789]\d{7,8}/', $compact) === 1) {
            return '전화, 카톡, 주소는 넣을 수 없어요.';
        }
        if (preg_match('/0(?:2|[3-6]\d)\d{7,8}/', $compact) === 1) {
            return '전화, 카톡, 주소는 넣을 수 없어요.';
        }
        return '';
    }

    public static function maskName(string $name): string
    {
        $chars = preg_split('//u', trim($name), -1, PREG_SPLIT_NO_EMPTY) ?: [];
        if ($chars === []) {
            return '○○';
        }
        if (count($chars) === 1) {
            return $chars[0] . '○';
        }
        return $chars[0] . str_repeat('○', min(count($chars) - 1, 2));
    }

    public static function teaser(string $body): string
    {
        $chars = preg_split('//u', self::normalize($body), -1, PREG_SPLIT_NO_EMPTY) ?: [];
        if (count($chars) <= self::TEASER) {
            return implode('', $chars);
        }
        return implode('', array_slice($chars, 0, self::TEASER)) . '…';
    }

    private function assertOwns(int $userId, string $providerType, int $registrationId): void
    {
        try {
            $pdo = Connection::get();
        } catch (\Throwable) {
            return;
        }
        $sql = $providerType === 'tutor'
            ? 'SELECT user_id FROM tutors WHERE id = ? LIMIT 1'
            : 'SELECT user_id FROM study_rooms WHERE id = ? LIMIT 1';
        try {
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$registrationId]);
            $owner = $stmt->fetchColumn();
        } catch (\Throwable) {
            return;
        }
        if ($owner === false) {
            return;
        }
        if ((int) $owner !== $userId) {
            throw new \InvalidArgumentException('이 등록에는 인사를 올릴 수 없어요.');
        }
    }

    /** @return array<string, mixed>|null */
    private function find(string $providerType, int $registrationId): ?array
    {
        foreach ($this->read() as $row) {
            if (($row['provider_type'] ?? '') === $providerType && (int) ($row['registration_id'] ?? 0) === $registrationId) {
                return $row;
            }
        }
        return null;
    }

    /** @param array<string, mixed> $row */
    private function upsert(array $row): void
    {
        $items = array_values(array_filter(
            $this->read(),
            static fn (array $item): bool => !(
                ($item['provider_type'] ?? '') === $row['provider_type']
                && (int) ($item['registration_id'] ?? 0) === (int) $row['registration_id']
            ),
        ));
        $items[] = $row;
        $this->write($items);
    }

    /** @return list<array<string, mixed>> */
    private function read(): array
    {
        if (!is_file($this->file)) {
            return [];
        }
        $raw = file_get_contents($this->file);
        if (!is_string($raw) || $raw === '') {
            return [];
        }
        $data = json_decode($raw, true);
        return is_array($data) ? array_values(array_filter($data, 'is_array')) : [];
    }

    /** @param list<array<string, mixed>> $items */
    private function write(array $items): void
    {
        $dir = dirname($this->file);
        if (!is_dir($dir) && !mkdir($dir, 0775, true) && !is_dir($dir)) {
            throw new \RuntimeException('저장 폴더를 만들지 못했습니다.');
        }
        $json = json_encode(array_values($items), JSON_UNESCAPED_UNICODE);
        if ($json === false) {
            throw new \RuntimeException('저장에 실패했습니다.');
        }
        file_put_contents($this->file, $json, LOCK_EX);
    }
}
