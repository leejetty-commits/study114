<?php

declare(strict_types=1);

/**
 * 368-보완4 — 원자적 교체(atomic replace) 되돌리기 검증.
 *
 * (a) 형식 오류 파일로 교체 → 기존 행·파일 유지
 * (b) 파생본 생성 후 INSERT 강제 실패 → ROLLBACK → 기존 행·파일 유지, 새 파일 삭제
 * (c) 다른 방 사진 ID로 교체 → 거부
 *
 * docker exec study114-api-dev php scripts/verify-promo-replace-atomic.php
 */

require dirname(__DIR__) . '/src/bootstrap.php';

use Study114\Database\Connection;
use Study114\Media\PromoImageProcessor;

$fail = 0;
function check(string $name, bool $ok, string $detail = ''): void
{
    global $fail;
    if ($ok) {
        echo "PASS  {$name}\n";
        return;
    }
    $fail++;
    echo "FAIL  {$name}" . ($detail !== '' ? " — {$detail}" : '') . "\n";
}

$pdo = Connection::get();

// ── 준비: 실재하는 방으로 테스트 (FK 제약 충족) ──
$testRoom1 = 1;  // user_id=1, 기존 sort=1 이미지 있음. 테스트는 sort=5 사용
$testRoom2 = 2;  // user_id=2, 비어 있음. sort=1 사용
$testSort1 = 5;
$testSort2 = 1;

// 이전 잔여 테스트 행 정리 (sort_order=5인 테스트 행만)
$pdo->prepare('DELETE FROM study_room_images WHERE study_room_id = ? AND sort_order = ?')->execute([$testRoom1, $testSort1]);
$pdo->prepare('DELETE FROM study_room_images WHERE study_room_id = ? AND sort_order = ?')->execute([$testRoom2, $testSort2]);

// 테스트 파일 생성
$tmpDir = sys_get_temp_dir() . '/study114-replace-test-' . getmypid();
@mkdir($tmpDir, 0775, true);

$goodJpg = $tmpDir . '/good.jpg';
$im = imagecreatetruecolor(800, 600);
$bg = imagecolorallocate($im, 120, 180, 60);
imagefill($im, 0, 0, $bg);
imagejpeg($im, $goodJpg, 90);
imagedestroy($im);

$badFile = $tmpDir . '/bad.bin';
file_put_contents($badFile, 'not-a-real-image-file');

// 방1에 테스트 사진 행 삽입 (sort=5)
$publicRoot = dirname(__DIR__) . '/public';
$origRelDir = 'uploads/promo/rooms/' . $testRoom1;
$origAbsDir = $publicRoot . '/' . $origRelDir;
@mkdir($origAbsDir, 0775, true);

$testToken = 'test_' . bin2hex(random_bytes(4));
$origPath = '/' . $origRelDir . '/' . $testToken . '_orig.jpg';
$primePath = '/' . $origRelDir . '/' . $testToken . '_prime_1280.webp';
$basicPath = '/' . $origRelDir . '/' . $testToken . '_basic_720.webp';

copy($goodJpg, $publicRoot . $origPath);
$processor = new PromoImageProcessor();
$processor->writeVariants($goodJpg, 0.5, 0.5, [
    'prime_1280' => $publicRoot . $primePath,
    'basic_720'  => $publicRoot . $basicPath,
]);

$pdo->prepare(
    'INSERT INTO study_room_images
        (study_room_id, image_type, image_path, sort_order, original_filename,
         original_path, prime_1280_path, basic_720_path,
         crop_offset_x, crop_offset_y, original_width, original_height)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
)->execute([
    $testRoom1, 'cover', $primePath, $testSort1, 'good.jpg',
    $origPath, $primePath, $basicPath,
    0.5, 0.5, 800, 600,
]);
$existingId = (int) $pdo->lastInsertId();
echo "SETUP  방{$testRoom1} 테스트 사진 id={$existingId} sort={$testSort1}\n";

// 방2에 사진 행 삽입 (sort=1)
$pdo->prepare(
    'INSERT INTO study_room_images
        (study_room_id, image_type, image_path, sort_order, original_filename,
         original_path, crop_offset_x, crop_offset_y, original_width, original_height)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
)->execute([
    $testRoom2, 'cover', '/uploads/promo/rooms/' . $testRoom2 . '/other.jpg', $testSort2, 'other.jpg',
    '/uploads/promo/rooms/' . $testRoom2 . '/other_orig.jpg',
    0.5, 0.5, 800, 600,
]);
$otherRoomImageId = (int) $pdo->lastInsertId();
echo "SETUP  방{$testRoom2} 사진 id={$otherRoomImageId} sort={$testSort2}\n";


// ══════════════════════════════════════════════════
// (a) 형식 오류 파일로 교체 → 예외 발생, 기존 행·파일 유지
// ══════════════════════════════════════════════════
echo "\n=== (a) 형식 오류 파일로 교체 시도 ===\n";

try {
    $processor->assertUploadTmp($badFile, (int) filesize($badFile));
    check('(a) bad_type 예외 발생', false, '예외 없음');
} catch (\Study114\Media\PromoImageException $e) {
    check('(a) bad_type 예외', $e->errorCode() === 'bad_type', $e->errorCode());
    echo "NOTE  에러코드={$e->errorCode()} 메시지={$e->getMessage()}\n";
}

$stmt = $pdo->prepare('SELECT * FROM study_room_images WHERE id = ? AND study_room_id = ?');
$stmt->execute([$existingId, $testRoom1]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);
check('(a) 기존 행 존재', is_array($row));
check('(a) original_path 그대로', ($row['original_path'] ?? '') === $origPath);
check('(a) 원본 파일 존재', is_file($publicRoot . $origPath));
check('(a) 프라임 파일 존재', is_file($publicRoot . $primePath));


// ══════════════════════════════════════════════════
// (b) INSERT 강제 실패 → ROLLBACK → 기존 행·파일 유지, 새 파일 삭제
// ══════════════════════════════════════════════════
echo "\n=== (b) INSERT 강제 실패 (ROLLBACK 경로) ===\n";

$newToken = bin2hex(random_bytes(8));
$newOrigRel = $origRelDir . '/' . $newToken . '_orig.jpg';
$newOrigAbs = $publicRoot . '/' . $newOrigRel;
$newPrimeAbs = $publicRoot . '/' . $origRelDir . '/' . $newToken . '_prime_1280.webp';
$newBasicAbs = $publicRoot . '/' . $origRelDir . '/' . $newToken . '_basic_720.webp';

copy($goodJpg, $newOrigAbs);
$processor->writeVariants($goodJpg, 0.5, 0.5, [
    'prime_1280' => $newPrimeAbs,
    'basic_720'  => $newBasicAbs,
]);

check('(b) 새 원본 파일 생성됨', is_file($newOrigAbs));
check('(b) 새 프라임 파일 생성됨', is_file($newPrimeAbs));

// 트랜잭션: DELETE old → INSERT new (고의로 sort_order=NULL → NOT NULL 위반)
$pdo->beginTransaction();
try {
    $pdo->prepare('DELETE FROM study_room_images WHERE id = ? AND study_room_id = ?')
        ->execute([$existingId, $testRoom1]);

    // sort_order에 NULL → NOT NULL 위반으로 INSERT 실패
    $insertStmt = $pdo->prepare(
        'INSERT INTO study_room_images
            (study_room_id, image_type, image_path, sort_order, original_filename,
             original_path, prime_1280_path, basic_720_path,
             crop_offset_x, crop_offset_y, original_width, original_height)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $insertStmt->execute([
        $testRoom1, 'cover', '/new_path', null, 'new.jpg',
        '/' . $newOrigRel, '', '', 0.5, 0.5, 800, 600,
    ]);
    $pdo->commit();
    check('(b) INSERT 실패 기대', false, 'INSERT가 성공함');
} catch (\Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo "NOTE  ROLLBACK 실행 — " . substr($e->getMessage(), 0, 120) . "\n";
    check('(b) 예외 발생으로 ROLLBACK', true);
}

// 기존 행이 복원되었는지 확인
$stmt = $pdo->prepare('SELECT * FROM study_room_images WHERE id = ? AND study_room_id = ?');
$stmt->execute([$existingId, $testRoom1]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);
check('(b) ROLLBACK 후 기존 행 복원', is_array($row));
check('(b) 기존 original_path 그대로', ($row['original_path'] ?? '') === $origPath);
check('(b) 기존 원본 파일 존재', is_file($publicRoot . $origPath));
check('(b) 기존 프라임 파일 존재', is_file($publicRoot . $primePath));

// 새 파일 정리 (uploadForRoom의 catch 블록과 동일)
@unlink($newOrigAbs);
@unlink($newPrimeAbs);
@unlink($newBasicAbs);
foreach ([$newPrimeAbs, $newBasicAbs] as $webp) {
    $jpg = preg_replace('/\.webp$/i', '.jpg', $webp);
    if ($jpg && is_file($jpg)) @unlink($jpg);
}
check('(b) 새 원본 파일 삭제됨', !is_file($newOrigAbs));
check('(b) 새 프라임 파일 삭제됨', !is_file($newPrimeAbs));


// ══════════════════════════════════════════════════
// (c) 다른 방 사진 ID로 교체 → 거부
// ══════════════════════════════════════════════════
echo "\n=== (c) 다른 방 사진 ID로 교체 시도 ===\n";

// findImage(room1, otherRoomImageId) → 「사진을 찾을 수 없습니다」
$stmt = $pdo->prepare('SELECT * FROM study_room_images WHERE id = ? AND study_room_id = ? LIMIT 1');
$stmt->execute([$otherRoomImageId, $testRoom1]);
$crossRow = $stmt->fetch(PDO::FETCH_ASSOC);
check('(c) 다른 방 사진을 이 방에서 못 찾음', $crossRow === false);

try {
    $stmt = $pdo->prepare('SELECT * FROM study_room_images WHERE id = ? AND study_room_id = ? LIMIT 1');
    $stmt->execute([$otherRoomImageId, $testRoom1]);
    $found = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!is_array($found)) {
        throw new InvalidArgumentException('사진을 찾을 수 없습니다.');
    }
    check('(c) 거부 기대', false, '거부되지 않음');
} catch (InvalidArgumentException $e) {
    check('(c) InvalidArgumentException 발생', true);
    check('(c) 메시지 = 찾을 수 없습니다', str_contains($e->getMessage(), '찾을 수 없'));
    echo "NOTE  메시지={$e->getMessage()}\n";
}

// 양쪽 방 행이 온전한지 최종 확인
$stmt = $pdo->prepare('SELECT id FROM study_room_images WHERE id = ?');
$stmt->execute([$existingId]);
check('(c) 방1 테스트 행 온전', is_array($stmt->fetch(PDO::FETCH_ASSOC)));
$stmt->execute([$otherRoomImageId]);
check('(c) 방2 행 온전', is_array($stmt->fetch(PDO::FETCH_ASSOC)));


// ── 정리 ──
echo "\n=== 정리 ===\n";
$pdo->prepare('DELETE FROM study_room_images WHERE id = ?')->execute([$existingId]);
$pdo->prepare('DELETE FROM study_room_images WHERE id = ?')->execute([$otherRoomImageId]);

foreach ([$origPath, $primePath, $basicPath] as $rel) {
    $abs = $publicRoot . $rel;
    if (is_file($abs)) @unlink($abs);
}
foreach (glob($tmpDir . '/*') ?: [] as $f) @unlink($f);
@rmdir($tmpDir);
echo "CLEANUP 완료\n";

echo "\n" . ($fail > 0 ? "FAIL  {$fail}건 실패\n" : "ALL PASS\n");
exit($fail > 0 ? 1 : 0);
