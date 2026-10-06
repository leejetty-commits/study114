<?php

declare(strict_types=1);

namespace Study114\Admin;

use DateTimeImmutable;
use InvalidArgumentException;
use Study114\Database\Connection;
use Study114\Registration\BasicCardRegisteredQuery;
use Study114\Registration\OfficialRegionLabel;
use Study114\Report\ReportPeriod;

/** 등록 목록. SQL은 BasicCardRegisteredQuery 새 메서드만 호출한다. */
final class AdminRegistrationListRepository
{
    private const ROLES = ['study_room', 'tutor', 'student'];

    private const STATUS_KO = [
        'hidden' => '숨김',
        'published' => '게시중',
        'draft' => '작성중',
        'pending' => '검토중',
    ];

    private BasicCardRegisteredQuery $query;

    private ReportPeriod $period;

    private OfficialRegionLabel $labels;

    public function __construct(
        ?BasicCardRegisteredQuery $query = null,
        ?ReportPeriod $period = null,
        ?OfficialRegionLabel $labels = null,
    ) {
        $this->period = $period ?? new ReportPeriod();
        $this->query = $query ?? new BasicCardRegisteredQuery(null, $this->period);
        $this->labels = $labels ?? new OfficialRegionLabel(Connection::get());
    }

    /**
     * @return array{
     *   role: string,
     *   from: string,
     *   to: string,
     *   page: int,
     *   per_page: int,
     *   total: int,
     *   items: list<array{name: string, region: string, registered_at: string, status: string}>
     * }
     */
    public function page(
        string $role,
        ?string $from,
        ?string $to,
        ?int $regionId,
        int $page,
        int $perPage,
    ): array {
        if (!in_array($role, self::ROLES, true)) {
            throw new InvalidArgumentException('role은 study_room, tutor, student만 가능합니다.');
        }
        [$start, $end, $fromDay, $toDay] = $this->range($from, $to);
        $page = max(1, $page);
        if ($perPage < 1) {
            $perPage = 50;
        }
        $perPage = min(100, $perPage);
        $region = ($regionId !== null && $regionId > 0) ? $regionId : null;
        $listed = $this->query->listByRoleForAdmin($role, $start, $end, false, $page, $perPage, $region);
        $tz = $this->period->measuredTz();
        $source = $role === 'student' ? 'php' : 'db';
        $items = [];
        foreach ($listed['items'] as $row) {
            $shown = $this->period->storageToKst(
                (string) $row['registered_at'],
                $source,
                (int) $tz['db_offset_min'],
                (string) $tz['php_tz'],
            );
            $regionLabel = '';
            if ($row['region_id'] !== null) {
                $resolved = $this->labels->resolve($row['region_id']);
                $regionLabel = is_array($resolved) ? (string) $resolved['label'] : '';
            }
            $rawStatus = (string) $row['exposure_status'];
            $items[] = [
                'name' => (string) $row['display_name'],
                'region' => $regionLabel,
                'registered_at' => strlen($shown) >= 10 ? substr($shown, 0, 10) : '',
                'status' => self::STATUS_KO[$rawStatus] ?? $rawStatus,
            ];
        }

        return [
            'role' => $role,
            'from' => $fromDay,
            'to' => $toDay,
            'page' => $page,
            'per_page' => $perPage,
            'total' => (int) $listed['total'],
            'items' => $items,
        ];
    }

    /**
     * @return array{0: DateTimeImmutable, 1: DateTimeImmutable, 2: string, 3: string}
     */
    private function range(?string $from, ?string $to): array
    {
        $from = trim((string) $from);
        $to = trim((string) $to);
        if ($from === '' && $to === '') {
            $now = $this->period->now();
            $today = $now->format('Y-m-d');
            $startDay = $now->modify('-6 days')->format('Y-m-d');
            $start = $this->period->dayRange($startDay)['start'];
            $end = $this->period->dayRange($today)['end'];

            return [$start, $end, $startDay, $today];
        }
        if ($from === '' || $to === '') {
            throw new InvalidArgumentException('from과 to를 함께 지정해 주세요.');
        }
        $this->assertDay($from);
        $this->assertDay($to);
        if ($from > $to) {
            throw new InvalidArgumentException('from은 to보다 늦을 수 없습니다.');
        }
        $start = $this->period->dayRange($from)['start'];
        $end = $this->period->dayRange($to)['end'];

        return [$start, $end, $from, $to];
    }

    private function assertDay(string $ymd): void
    {
        $dt = DateTimeImmutable::createFromFormat('!Y-m-d', $ymd, $this->period->tz());
        $errors = DateTimeImmutable::getLastErrors();
        $warnings = is_array($errors) ? (int) ($errors['warning_count'] ?? 0) : 0;
        $problems = is_array($errors) ? (int) ($errors['error_count'] ?? 0) : 0;
        if ($dt === false || $warnings > 0 || $problems > 0 || $dt->format('Y-m-d') !== $ymd) {
            throw new InvalidArgumentException('from·to는 YYYY-MM-DD 형식이어야 합니다.');
        }
    }
}
