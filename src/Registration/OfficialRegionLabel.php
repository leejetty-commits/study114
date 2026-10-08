<?php

declare(strict_types=1);

namespace Study114\Registration;

use PDO;

/**
 * regions 행 → 「시도 시군구(+동)」 정식 라벨. 공부방 축(학생 공부방 희망지역 등)·관리자 등록 목록이 쓴다.
 * 과외 축(과외쌤 과외지역·학생 과외 희망지역)의 이름은 Study114\Region\TutorRegionUnit 이 만든다.
 * 카카오 주소검색으로 만든 동 행은 시도가 약칭(경기)이라 같은 시군구 코드의 선택 단위 행(공식 시드)에서
 * 시도·시군구 이름을 가져온다. 행이 없으면 null. 지역 id 숫자를 라벨로 쓰지 않는다.
 */
final class OfficialRegionLabel
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    /**
     * 「시도 시군구(+동)」 라벨과 상위 선택 단위(시·군·구).
     *
     * @return array{label: string, sigungu_id: ?int, sigungu_label: ?string}|null
     */
    public function resolve(mixed $regionId): ?array
    {
        $row = $this->fetchRow($regionId);
        if ($row === null) {
            return null;
        }

        if ((string) ($row['unit_level'] ?? 'dong') !== 'dong') {
            $label = self::joinRegionTokens([(string) $row['sido_name'], (string) $row['sigungu_name']]);

            return $label === '' ? null : [
                'label' => $label,
                'sigungu_id' => (int) ($row['is_selectable'] ?? 0) === 1 ? (int) $row['id'] : null,
                'sigungu_label' => (int) ($row['is_selectable'] ?? 0) === 1 ? $label : null,
            ];
        }

        $gu = $this->selectableSigunguForDong((string) ($row['sigungu_code'] ?? ''));
        $sido = $gu !== null ? (string) $gu['sido_name'] : (string) $row['sido_name'];
        $sigungu = $gu !== null ? (string) $gu['sigungu_name'] : (string) $row['sigungu_name'];
        $dong = trim((string) ($row['dong_name'] ?? ''));
        if ($dong === '시 대표') {
            $dong = '';
        }
        $label = self::joinRegionTokens([$sido, $sigungu, $dong]);
        if ($label === '') {
            return null;
        }
        $guLabel = $gu !== null ? self::joinRegionTokens([(string) $gu['sido_name'], (string) $gu['sigungu_name']]) : '';

        return [
            'label' => $label,
            'sigungu_id' => $gu !== null ? (int) $gu['id'] : null,
            'sigungu_label' => $guLabel !== '' ? $guLabel : null,
        ];
    }

    /** @return array<string, mixed>|null */
    private function fetchRow(mixed $regionId): ?array
    {
        if ($regionId === null || (int) $regionId <= 0) {
            return null;
        }
        $stmt = $this->pdo->prepare(
            'SELECT id, sido_name, sigungu_name, sigungu_code, dong_name, unit_level, official_code, is_selectable
             FROM regions WHERE id = ? LIMIT 1'
        );
        $stmt->execute([(int) $regionId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return is_array($row) ? $row : null;
    }

    /**
     * 동 행의 시군구 코드 앞 5자리 = 선택 단위 행 official_code 앞 5자리 (RegionGuLink 와 같은 기준).
     *
     * @return array{id: int|string, sido_name: string, sigungu_name: string}|null
     */
    private function selectableSigunguForDong(string $sigunguCode): ?array
    {
        if (strlen($sigunguCode) < 5) {
            return null;
        }
        $stmt = $this->pdo->prepare(
            'SELECT id, sido_name, sigungu_name FROM regions
             WHERE is_selectable = 1 AND CHAR_LENGTH(official_code) >= 5 AND LEFT(official_code, 5) = ?
             ORDER BY id ASC LIMIT 1'
        );
        $stmt->execute([substr($sigunguCode, 0, 5)]);
        $gu = $stmt->fetch(PDO::FETCH_ASSOC);

        return is_array($gu) ? $gu : null;
    }

    /** 빈 칸·반복 토큰(세종 「세종특별자치시 세종특별자치시」)을 접는다. @param list<string> $parts */
    private static function joinRegionTokens(array $parts): string
    {
        $out = [];
        foreach ($parts as $part) {
            foreach (preg_split('/\s+/u', trim($part)) ?: [] as $token) {
                if ($token !== '' && !in_array($token, $out, true)) {
                    $out[] = $token;
                }
            }
        }

        return implode(' ', $out);
    }
}
