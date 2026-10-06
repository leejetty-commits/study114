<?php

declare(strict_types=1);

namespace Study114\Report;

use DateTimeImmutable;
use DateTimeZone;
use InvalidArgumentException;
use Study114\Database\Connection;
use Study114\Paid\PositionPeriodCalculator;

/** KST 일·주·월 경계와 저장 시각 변환. 쿼리의 날짜 자르기는 두지 않는다. */
final class ReportPeriod
{
    private ?int $dbOffsetMin = null;

    public function tz(): DateTimeZone
    {
        return new DateTimeZone(PositionPeriodCalculator::BUSINESS_TZ);
    }

    public function now(?DateTimeImmutable $now = null): DateTimeImmutable
    {
        $now ??= new DateTimeImmutable('now', $this->tz());

        return $now->setTimezone($this->tz());
    }

    /** @return array{start: DateTimeImmutable, end: DateTimeImmutable, startDate: string, endDate: string} */
    public function dayRange(string $ymd): array
    {
        $start = new DateTimeImmutable($ymd . ' 00:00:00', $this->tz());
        $end = $start->modify('+1 day');

        return $this->pack($start, $end);
    }

    /** @return array{start: DateTimeImmutable, end: DateTimeImmutable, startDate: string, endDate: string} */
    public function weekRange(string $ymd): array
    {
        $day = new DateTimeImmutable($ymd . ' 00:00:00', $this->tz());
        $n = (int) $day->format('N');
        $start = $day->modify('-' . ($n - 1) . ' days');
        $end = $start->modify('+7 days');

        return $this->pack($start, $end);
    }

    /** @return array{start: DateTimeImmutable, end: DateTimeImmutable, startDate: string, endDate: string} */
    public function monthRange(string $ymd): array
    {
        if (preg_match('/^\d{4}-\d{2}$/', $ymd) === 1) {
            $start = new DateTimeImmutable($ymd . '-01 00:00:00', $this->tz());
        } else {
            $day = new DateTimeImmutable($ymd . ' 00:00:00', $this->tz());
            $start = $day->modify('first day of this month')->setTime(0, 0, 0);
        }
        $end = $start->modify('+1 month');

        return $this->pack($start, $end);
    }

    /** @param array{start: DateTimeImmutable, end: DateTimeImmutable, startDate: string, endDate: string} $range */
    public function rangeFor(string $kind, string $ymd): array
    {
        return match ($kind) {
            'day' => $this->dayRange($ymd),
            'week' => $this->weekRange($ymd),
            'month' => $this->monthRange($ymd),
            default => throw new InvalidArgumentException('period는 day, week, month만 가능합니다.'),
        };
    }

    public function toStorage(DateTimeImmutable $kst, string $source): string
    {
        $kst = $kst->setTimezone($this->tz());
        if ($source === 'php') {
            $phpTz = new DateTimeZone(date_default_timezone_get());

            return $kst->setTimezone($phpTz)->format('Y-m-d H:i:s');
        }
        if ($source !== 'db') {
            throw new InvalidArgumentException('source는 db 또는 php입니다.');
        }
        $utc = $kst->setTimezone(new DateTimeZone('UTC'));
        $offset = $this->dbOffsetMinutes();
        $sign = $offset >= 0 ? '+' : '';
        $stored = $utc->modify($sign . $offset . ' minutes');

        return $stored->format('Y-m-d H:i:s');
    }

    public function dbOffsetMinutes(): int
    {
        if ($this->dbOffsetMin !== null) {
            return $this->dbOffsetMin;
        }
        $value = Connection::get()->query('SELECT TIMESTAMPDIFF(MINUTE, UTC_TIMESTAMP(), NOW())')->fetchColumn();
        $this->dbOffsetMin = (int) $value;

        return $this->dbOffsetMin;
    }

    public function phpTzName(): string
    {
        return date_default_timezone_get();
    }

    /** @return array{db_offset_min: int, php_tz: string} */
    public function measuredTz(): array
    {
        return [
            'db_offset_min' => $this->dbOffsetMinutes(),
            'php_tz' => $this->phpTzName(),
        ];
    }

    public function storageToKst(string $stored, string $source, int $dbOffsetMin, string $phpTz): string
    {
        $stored = trim($stored);
        if ($stored === '') {
            return '';
        }
        if ($source === 'php') {
            $dt = new DateTimeImmutable($stored, new DateTimeZone($phpTz));

            return $dt->setTimezone($this->tz())->format('Y-m-d H:i');
        }
        $asUtc = new DateTimeImmutable($stored, new DateTimeZone('UTC'));
        $utc = $asUtc->modify((-$dbOffsetMin) . ' minutes');

        return $utc->setTimezone($this->tz())->format('Y-m-d H:i');
    }

    public function isOpen(string $kind, string $startDate, DateTimeImmutable $now): bool
    {
        $today = $now->setTimezone($this->tz())->format('Y-m-d');
        if ($kind === 'day') {
            return $startDate >= $today;
        }
        if ($kind === 'week') {
            return $startDate >= $this->weekRange($today)['startDate'];
        }

        return $startDate >= $now->setTimezone($this->tz())->format('Y-m-01');
    }

    public function defaultStart(string $kind, DateTimeImmutable $now): string
    {
        $now = $now->setTimezone($this->tz());
        if ($kind === 'day') {
            return $now->modify('-1 day')->format('Y-m-d');
        }
        if ($kind === 'week') {
            $thisMonday = $this->weekRange($now->format('Y-m-d'))['start'];

            return $thisMonday->modify('-7 days')->format('Y-m-d');
        }
        $first = $now->modify('first day of this month')->setTime(0, 0, 0);

        return $first->modify('-1 month')->format('Y-m-d');
    }

    /** 기간 끝난 다음 날 00:00 이상, 00:31 미만. */
    public function inMailWindow(DateTimeImmutable $now, string $periodEnd): bool
    {
        $endDay = (new DateTimeImmutable(substr($periodEnd, 0, 10) . ' 00:00:00', $this->tz()));
        $open = $endDay->modify('+1 day');
        $close = $open->modify('+31 minutes');
        $now = $now->setTimezone($this->tz());

        return $now >= $open && $now < $close;
    }

    /**
     * @return array{start: DateTimeImmutable, end: DateTimeImmutable, startDate: string, endDate: string}
     */
    private function pack(DateTimeImmutable $start, DateTimeImmutable $end): array
    {
        return [
            'start' => $start,
            'end' => $end,
            'startDate' => $start->format('Y-m-d'),
            'endDate' => $end->modify('-1 day')->format('Y-m-d'),
        ];
    }
}
