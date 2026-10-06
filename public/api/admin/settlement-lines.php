<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Admin\AdminApi;
use Study114\Report\SettlementReportService;

function settlement_lines_date_ok(string $period, string $date): bool
{
    if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $date) === 1) {
        $parts = array_map('intval', explode('-', $date));

        return checkdate($parts[1], $parts[2], $parts[0]);
    }
    if ($period === 'month' && preg_match('/^\d{4}-\d{2}$/', $date) === 1) {
        $month = (int) substr($date, 5, 2);

        return $month >= 1 && $month <= 12;
    }

    return false;
}

AdminApi::bootstrap();

AdminApi::run(static function (): void {
    if (AdminApi::method() !== 'GET') {
        AdminApi::fail(405, 'method_not_allowed', 'GET만 허용됩니다.');
    }
    AdminApi::requireAdmin();
    $period = AdminApi::queryString('period', 'day') ?? 'day';
    $date = AdminApi::queryString('date', '') ?? '';
    $line = AdminApi::queryString('line', 'pay') ?? 'pay';
    $page = max(1, AdminApi::queryInt('page', 1));
    if (!in_array($period, ['day', 'week', 'month'], true)) {
        AdminApi::fail(422, 'validation', 'period는 day, week, month만 가능합니다.');
    }
    if (!in_array($line, ['pay', 'inquiry', 'report', 'reg', 'withdraw', 'delete', 'popup'], true)) {
        AdminApi::fail(422, 'validation', 'line이 올바르지 않습니다.');
    }
    if ($date === '') {
        AdminApi::fail(422, 'validation', 'date가 필요합니다.');
    }
    if (!settlement_lines_date_ok($period, $date)) {
        AdminApi::fail(422, 'validation', 'date 형식이 올바르지 않습니다.');
    }
    try {
        $payload = (new SettlementReportService())->readLines(
            $period,
            $date,
            $line,
            $page,
            new DateTimeImmutable('now', new DateTimeZone('Asia/Seoul'))
        );
    } catch (RuntimeException $e) {
        if ($e->getMessage() === 'schema_missing') {
            AdminApi::fail(503, 'schema_missing', '보고서 저장 공간이 아직 준비되지 않았어요. 운영 DB에 077을 먼저 적용해 주세요.');
        }
        throw $e;
    }
    AdminApi::ok($payload);
});
