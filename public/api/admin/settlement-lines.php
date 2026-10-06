<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Admin\AdminApi;
use Study114\Report\SettlementReportService;

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
