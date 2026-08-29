<?php

declare(strict_types=1);

/**
 * ACL seed 목표값 dry-run (DB 불필요).
 * 운영 PDO 연결 시 ContentSchemaMigrateService::planAclSeed() 로 current diff 확인.
 * 사용: php scripts/acl-seed-static-plan.php
 */

require_once dirname(__DIR__) . '/src/bootstrap.php';

use Study114\Admin\ContentAclSeedGuard;

$plan = ContentAclSeedGuard::staticPlan();
$plan['rollback_template'] = dirname(__DIR__) . '/sql/schema/060_acl_seed_rollback.example.sql';
$plan['note'] = '운영 DB 미적용. 적용 전 GET /api/admin/content/migrate.php 의 acl_seed_plan 또는 apply dry_run=true 로 current diff 확인.';

echo json_encode($plan, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . PHP_EOL;
