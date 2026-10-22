<?php

declare(strict_types=1);

/**
 * 기존 사진의 _orig 에서 fit_1280.webp 만 만든다.
 * 기본은 dry-run. 파일을 쓰려면 --apply.
 * 기존 파일은 지우거나 바꾸지 않는다. DB 는 읽기만 한다.
 * 운영에서는 돌리지 않는다.
 *
 * php scripts/backfill-photo-fit-1280.php
 * php scripts/backfill-photo-fit-1280.php --apply
 */

require dirname(__DIR__) . '/src/bootstrap.php';

use Study114\Database\Connection;
use Study114\Media\PromoImageProcessor;
use Study114\Media\PromoImageSpec;

$apply = in_array('--apply', $argv, true);
$root = PromoImageSpec::publicRoot();
$processor = new PromoImageProcessor();

try {
    $pdo = Connection::get();
} catch (Throwable $e) {
    fwrite(STDERR, "DB 연결 실패: " . $e->getMessage() . PHP_EOL);
    exit(1);
}

$made = [];
$skipExists = [];
$skipNoOrig = [];
$failed = [];

$roomRows = fetchRows($pdo, 'study_room_images');
foreach ($roomRows as $row) {
    consider($row, 'study_room_images', $root, $processor, $apply, $made, $skipExists, $skipNoOrig, $failed);
}
$tutorRows = fetchRows($pdo, 'tutor_images');
foreach ($tutorRows as $row) {
    consider($row, 'tutor_images', $root, $processor, $apply, $made, $skipExists, $skipNoOrig, $failed);
}

echo ($apply ? 'APPLY' : 'DRY-RUN') . PHP_EOL;
echo '만들 파일 ' . count($made) . PHP_EOL;
foreach ($made as $line) {
    echo '  + ' . $line . PHP_EOL;
}
echo '이미 있음 ' . count($skipExists) . PHP_EOL;
foreach ($skipExists as $line) {
    echo '  = ' . $line . PHP_EOL;
}
echo '원본 없음 ' . count($skipNoOrig) . PHP_EOL;
foreach ($skipNoOrig as $line) {
    echo '  - ' . $line . PHP_EOL;
}
echo '실패 ' . count($failed) . PHP_EOL;
foreach ($failed as $line) {
    echo '  ! ' . $line . PHP_EOL;
}

exit($failed === [] ? 0 : 1);

/** @return list<array<string, mixed>> */
function fetchRows(PDO $pdo, string $table): array
{
    if (!in_array($table, ['study_room_images', 'tutor_images'], true)) {
        return [];
    }
    try {
        $stmt = $pdo->query('SELECT * FROM ' . $table);
        $rows = $stmt ? $stmt->fetchAll(PDO::FETCH_ASSOC) : [];
    } catch (Throwable $e) {
        fwrite(STDERR, $table . ' 읽기 실패: ' . $e->getMessage() . PHP_EOL);

        return [];
    }

    return is_array($rows) ? $rows : [];
}

/**
 * @param array<string, mixed> $row
 * @param list<string> $made
 * @param list<string> $skipExists
 * @param list<string> $skipNoOrig
 * @param list<string> $failed
 */
function consider(
    array $row,
    string $table,
    string $root,
    PromoImageProcessor $processor,
    bool $apply,
    array &$made,
    array &$skipExists,
    array &$skipNoOrig,
    array &$failed,
): void {
    if ((int) ($row['is_system_default'] ?? 0) === 1) {
        return;
    }
    $id = (string) ($row['id'] ?? '?');
    $label = $table . '#' . $id;
    $origAbs = findOriginal($row, $root);
    if ($origAbs === null) {
        $skipNoOrig[] = $label;

        return;
    }
    $fitAbs = fitAbsFromOriginal($origAbs);
    if ($fitAbs === '' || !str_starts_with(str_replace('\\', '/', $fitAbs), rtrim(str_replace('\\', '/', $root), '/'))) {
        $failed[] = $label . ' fit 경로가 공개 폴더 밖';

        return;
    }
    if (is_file($fitAbs)) {
        $skipExists[] = $label . ' ' . $fitAbs;

        return;
    }
    $made[] = $label . ' ' . $fitAbs;
    if (!$apply) {
        return;
    }
    try {
        $processor->shrinkLongEdgeWebp(
            $origAbs,
            $fitAbs,
            PromoImageSpec::FIT_LONG_EDGE,
            82,
            PromoImageSpec::FIT_TARGET_BYTES,
        );
    } catch (Throwable $e) {
        $failed[] = $label . ' ' . $e->getMessage();
        if (is_file($fitAbs)) {
            @unlink($fitAbs);
        }
    }
}

/** @param array<string, mixed> $row */
function findOriginal(array $row, string $root): ?string
{
    $candidates = [];
    $original = ltrim(str_replace('\\', '/', (string) ($row['original_path'] ?? '')), '/');
    if ($original !== '' && !str_contains($original, '..')) {
        $candidates[] = $root . '/' . $original;
    }
    foreach (['prime_1280_path', 'prime_1600_path', 'basic_720_path', 'basic_360_path', 'image_path'] as $key) {
        $rel = ltrim(str_replace('\\', '/', (string) ($row[$key] ?? '')), '/');
        if ($rel === '' || str_contains($rel, '..')) {
            continue;
        }
        if (!preg_match('/_(?:prime_1600|prime_1280|basic_720|basic_360)\.[A-Za-z0-9]+$/', $rel)) {
            continue;
        }
        $stem = preg_replace('/_(?:prime_1600|prime_1280|basic_720|basic_360)\.[A-Za-z0-9]+$/', '_orig', $rel);
        if (!is_string($stem)) {
            continue;
        }
        foreach (['jpg', 'jpeg', 'png', 'webp'] as $ext) {
            $candidates[] = $root . '/' . $stem . '.' . $ext;
        }
    }
    foreach ($candidates as $abs) {
        if (is_file($abs)) {
            return $abs;
        }
    }

    return null;
}

function fitAbsFromOriginal(string $origAbs): string
{
    $dir = dirname($origAbs);
    $name = basename($origAbs);
    $token = preg_replace('/_orig\.[^.]+$/i', '', $name);
    if (!is_string($token) || $token === '' || $token === $name) {
        return '';
    }

    return $dir . DIRECTORY_SEPARATOR . $token . '_fit_1280.webp';
}
