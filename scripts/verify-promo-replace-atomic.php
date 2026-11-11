<?php

declare(strict_types=1);

/**
 * 368-보완5 — 원자적 교체(atomic replace)를 실제 PromoImageService::uploadForRoom으로 검증.
 *
 * (a) 잘못된 파일로 교체 → 예외, 기존 행·파일 유지
 * (b) BEFORE INSERT TRIGGER로 INSERT 실패 → ROLLBACK + 운영 코드 cleanup(새 토큰 0건)
 * (c) 다른 방 사진 id → findImage 거부
 *
 * CLI 는 is_uploaded_file 을 통과할 수 없어, 같은 파일을 php-cgi 멀티파트로 호출한다.
 * CGI 워커도 이 파일이며 STUDY114_VERIFY_PROMO_UPLOAD=1 일 때 uploadForRoom 만 수행한다.
 *
 * docker exec study114-api-dev php scripts/verify-promo-replace-atomic.php
 */

require dirname(__DIR__) . '/src/bootstrap.php';

use Study114\Database\Connection;
use Study114\Media\PromoImageException;
use Study114\Media\PromoImageService;

// ── CGI 워커: 실제 uploadForRoom 호출 ─────────────────────────────
if (getenv('STUDY114_VERIFY_PROMO_UPLOAD') === '1') {
    header('Content-Type: application/json; charset=utf-8');
    $userId = (int) ($_POST['user_id'] ?? 0);
    $roomId = (int) ($_POST['study_room_id'] ?? 0);
    $replaceImageId = (int) ($_POST['replace_image_id'] ?? 0);
    $cx = (float) ($_POST['crop_x'] ?? 0.5);
    $cy = (float) ($_POST['crop_y'] ?? 0.5);
    try {
        if (!isset($_FILES['file']) || !is_array($_FILES['file'])) {
            throw new InvalidArgumentException('file missing');
        }
        $fileArr = $_FILES['file'];
        // 필수: 실제 운영 메서드 호출 (tmp_name·name·size·error 구비)
        $image = (new PromoImageService())->uploadForRoom(
            $userId,
            $roomId,
            $fileArr,
            $cx,
            $cy,
            'cover',
            0,
            '',
            $replaceImageId,
        );
        echo json_encode(['ok' => true, 'image' => $image], JSON_UNESCAPED_UNICODE);
    } catch (Throwable $e) {
        $errorCode = $e instanceof PromoImageException ? $e->errorCode() : '';
        echo json_encode([
            'ok' => false,
            'exception' => $e::class,
            'message' => $e->getMessage(),
            'errorCode' => $errorCode,
        ], JSON_UNESCAPED_UNICODE);
    }
    exit(0);
}

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
$dbName = (string) $pdo->query('SELECT DATABASE()')->fetchColumn();
if ($dbName !== 'study114_dev') {
    fwrite(STDERR, "ABORT  DB={$dbName} (study114_dev 아님). 아무것도 하지 않고 종료.\n");
    exit(2);
}
echo "OK  DATABASE={$dbName}\n";

$publicRoot = dirname(__DIR__) . '/public';
$scriptAbs = str_replace('\\', '/', __FILE__);

/** @return array{ok:bool,exception?:string,message?:string,errorCode?:string,image?:array} */
function callUploadForRoomViaCgi(
    string $scriptAbs,
    int $userId,
    int $roomId,
    string $filePath,
    string $clientName,
    int $replaceImageId,
    float $cx = 0.5,
    float $cy = 0.5,
): array {
    if (!is_file($filePath)) {
        return ['ok' => false, 'exception' => 'RuntimeException', 'message' => 'fixture missing', 'errorCode' => ''];
    }
    $boundary = '----S114' . bin2hex(random_bytes(8));
    $body = '';
    $fields = [
        'user_id' => (string) $userId,
        'study_room_id' => (string) $roomId,
        'replace_image_id' => (string) $replaceImageId,
        'crop_x' => (string) $cx,
        'crop_y' => (string) $cy,
    ];
    foreach ($fields as $k => $v) {
        $body .= "--{$boundary}\r\n";
        $body .= "Content-Disposition: form-data; name=\"{$k}\"\r\n\r\n{$v}\r\n";
    }
    $bin = (string) file_get_contents($filePath);
    $body .= "--{$boundary}\r\n";
    $body .= "Content-Disposition: form-data; name=\"file\"; filename=\"{$clientName}\"\r\n";
    $body .= "Content-Type: application/octet-stream\r\n\r\n";
    $body .= $bin . "\r\n";
    $body .= "--{$boundary}--\r\n";

    $env = [
        'REQUEST_METHOD' => 'POST',
        'CONTENT_TYPE' => "multipart/form-data; boundary={$boundary}",
        'CONTENT_LENGTH' => (string) strlen($body),
        'GATEWAY_INTERFACE' => 'CGI/1.1',
        'SCRIPT_FILENAME' => $scriptAbs,
        'SCRIPT_NAME' => '/scripts/verify-promo-replace-atomic.php',
        'REDIRECT_STATUS' => '200',
        'STUDY114_VERIFY_PROMO_UPLOAD' => '1',
        'STUDY114_DB_HOST' => getenv('STUDY114_DB_HOST') ?: 'mysql',
        'STUDY114_DB_PORT' => getenv('STUDY114_DB_PORT') ?: '3306',
        'STUDY114_DB_NAME' => getenv('STUDY114_DB_NAME') ?: 'study114_dev',
        'STUDY114_DB_USER' => getenv('STUDY114_DB_USER') ?: 'root',
        'STUDY114_DB_PASS' => getenv('STUDY114_DB_PASS') ?: 'study114dev',
    ];

    $proc = proc_open('php-cgi', [
        0 => ['pipe', 'r'],
        1 => ['pipe', 'w'],
        2 => ['pipe', 'w'],
    ], $pipes, dirname($scriptAbs, 2), $env);
    if (!is_resource($proc)) {
        return ['ok' => false, 'exception' => 'RuntimeException', 'message' => 'proc_open failed', 'errorCode' => ''];
    }
    fwrite($pipes[0], $body);
    fclose($pipes[0]);
    $out = (string) stream_get_contents($pipes[1]);
    $err = (string) stream_get_contents($pipes[2]);
    fclose($pipes[1]);
    fclose($pipes[2]);
    proc_close($proc);
    if ($err !== '') {
        echo "NOTE  cgi-stderr=" . substr($err, 0, 200) . "\n";
    }
    $pos = strpos($out, "\r\n\r\n");
    $json = $pos === false ? $out : substr($out, $pos + 4);
    $data = json_decode($json, true);
    if (!is_array($data)) {
        return ['ok' => false, 'exception' => 'RuntimeException', 'message' => 'bad cgi json: ' . substr($json, 0, 200), 'errorCode' => ''];
    }
    return $data;
}

function listPromoFiles(string $absDir): array
{
    if (!is_dir($absDir)) {
        return [];
    }
    $out = [];
    foreach (scandir($absDir) ?: [] as $name) {
        if ($name === '.' || $name === '..') {
            continue;
        }
        $out[] = $name;
    }
    sort($out);
    return $out;
}

function tokenFromOrigPath(string $origPath): string
{
    $base = pathinfo($origPath, PATHINFO_FILENAME);
    return (string) preg_replace('/_orig$/i', '', (string) $base);
}

function deleteFilesByToken(string $absDir, string $token): void
{
    if ($token === '' || !is_dir($absDir)) {
        return;
    }
    foreach (glob($absDir . '/' . $token . '*') ?: [] as $f) {
        @unlink($f);
    }
}

// ── 픽스처 ───────────────────────────────────────────────────────
$tmpDir = sys_get_temp_dir() . '/study114-replace-atomic-' . getmypid();
@mkdir($tmpDir, 0775, true);

$goodJpg = $tmpDir . '/good.jpg';
$im = imagecreatetruecolor(800, 600);
imagefill($im, 0, 0, imagecolorallocate($im, 120, 180, 60));
imagejpeg($im, $goodJpg, 90);
imagedestroy($im);

$badFile = $tmpDir . '/bad.bin';
file_put_contents($badFile, 'not-a-real-image-file');

$room1 = 1;
$user1 = 1;
$room2 = 2;
$user2 = 2;
$room1Dir = $publicRoot . '/uploads/promo/rooms/' . $room1;
$room2Dir = $publicRoot . '/uploads/promo/rooms/' . $room2;

$createdIds = [];
$createdTokens = []; // roomId => [token, ...]
$triggerName = 't_fail';

try {
    // 기존 사진: 실제 uploadForRoom 으로 시드 (replaceImageId=0)
    echo "SETUP  room1 기존 사진 uploadForRoom\n";
    $seed = callUploadForRoomViaCgi($scriptAbs, $user1, $room1, $goodJpg, 'seed.jpg', 0);
    if (empty($seed['ok']) || empty($seed['image']['id'])) {
        throw new RuntimeException('seed failed: ' . ($seed['message'] ?? json_encode($seed)));
    }
    $existingId = (int) $seed['image']['id'];
    $existingOrig = (string) ($seed['image']['original_path'] ?? '');
    $existingToken = tokenFromOrigPath($existingOrig);
    $createdIds[] = $existingId;
    $createdTokens[$room1][] = $existingToken;
    echo "SETUP  existingId={$existingId} token={$existingToken}\n";

    // 방2 사진: 교차 거부용 (실제 업로드 — findImage 거부만 보면 됨)
    echo "SETUP  room2 교차용 사진 uploadForRoom\n";
    $other = callUploadForRoomViaCgi($scriptAbs, $user2, $room2, $goodJpg, 'other.jpg', 0);
    if (empty($other['ok']) || empty($other['image']['id'])) {
        throw new RuntimeException('other seed failed: ' . ($other['message'] ?? json_encode($other)));
    }
    $otherId = (int) $other['image']['id'];
    $otherToken = tokenFromOrigPath((string) ($other['image']['original_path'] ?? ''));
    $createdIds[] = $otherId;
    $createdTokens[$room2][] = $otherToken;
    echo "SETUP  otherId={$otherId} token={$otherToken}\n";

    $stmt = $pdo->prepare('SELECT original_path, prime_1280_path, basic_720_path FROM study_room_images WHERE id=?');
    $stmt->execute([$existingId]);
    $beforeRow = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!is_array($beforeRow)) {
        throw new RuntimeException('seed row missing');
    }
    $beforeOrigAbs = $publicRoot . $beforeRow['original_path'];
    $beforePrimeAbs = $publicRoot . ($beforeRow['prime_1280_path'] ?? '');

    // ══════════════════════════════════════════════════
    // (a) 잘못된 파일로 교체 → 예외, 기존 유지
    // ══════════════════════════════════════════════════
    echo "\n=== (a) 잘못된 파일로 교체 ===\n";
    $beforeFiles = listPromoFiles($room1Dir);
    $resA = callUploadForRoomViaCgi($scriptAbs, $user1, $room1, $badFile, 'bad.bin', $existingId);
    check('(a) 예외 발생(ok=false)', empty($resA['ok']));
    $isBadType = ($resA['errorCode'] ?? '') === 'bad_type'
        || str_contains((string) ($resA['exception'] ?? ''), 'PromoImageException')
        || str_contains((string) ($resA['message'] ?? ''), 'JPG')
        || str_contains((string) ($resA['message'] ?? ''), '읽을 수');
    check('(a) bad_type/형식 오류', $isBadType, json_encode($resA, JSON_UNESCAPED_UNICODE));
    echo "NOTE  (a) exception={$resA['exception']} code={$resA['errorCode']} msg={$resA['message']}\n";

    $stmt->execute([$existingId]);
    $rowA = $stmt->fetch(PDO::FETCH_ASSOC);
    check('(a) 기존 행 존재', is_array($rowA));
    check('(a) original_path 그대로', is_array($rowA) && ($rowA['original_path'] ?? '') === $beforeRow['original_path']);
    check('(a) 원본 파일 존재', is_file($beforeOrigAbs));
    check('(a) 프라임 파일 존재', $beforePrimeAbs !== $publicRoot && is_file($beforePrimeAbs));
    $afterAFiles = listPromoFiles($room1Dir);
    check('(a) 방1 파일 목록 동일', $beforeFiles === $afterAFiles, 'before=' . count($beforeFiles) . ' after=' . count($afterAFiles));

    // ══════════════════════════════════════════════════
    // (b) TRIGGER 로 INSERT 실패 → ROLLBACK + 운영 cleanup
    // ══════════════════════════════════════════════════
    echo "\n=== (b) TRIGGER INSERT 실패 (ROLLBACK + cleanup) ===\n";
    $pdo->exec("DROP TRIGGER IF EXISTS `{$triggerName}`");
    $pdo->exec(
        "CREATE TRIGGER `{$triggerName}` BEFORE INSERT ON study_room_images
         FOR EACH ROW
         SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'verify-promo-replace-atomic forced fail'"
    );
    echo "NOTE  CREATE TRIGGER {$triggerName}\n";

    $filesBeforeB = listPromoFiles($room1Dir);
    try {
        $resB = callUploadForRoomViaCgi($scriptAbs, $user1, $room1, $goodJpg, 'replace.jpg', $existingId);
    } finally {
        $pdo->exec("DROP TRIGGER IF EXISTS `{$triggerName}`");
        echo "NOTE  DROP TRIGGER {$triggerName} (finally)\n";
    }

    check('(b) 교체 실패(ok=false)', empty($resB['ok']));
    echo "NOTE  (b) exception={$resB['exception']} msg=" . substr((string) ($resB['message'] ?? ''), 0, 120) . "\n";

    $stmt->execute([$existingId]);
    $rowB = $stmt->fetch(PDO::FETCH_ASSOC);
    check('(b) 기존 행 복원', is_array($rowB));
    check('(b) original_path 그대로', is_array($rowB) && ($rowB['original_path'] ?? '') === $beforeRow['original_path']);
    check('(b) 기존 원본 파일 존재', is_file($beforeOrigAbs));
    check('(b) 기존 프라임 파일 존재', $beforePrimeAbs !== $publicRoot && is_file($beforePrimeAbs));

    $filesAfterB = listPromoFiles($room1Dir);
    $newFiles = array_values(array_diff($filesAfterB, $filesBeforeB));
    // 새 토큰 파일이 운영 catch(@unlink orig/webp/fit)에 의해 남지 않아야 함
    $newOrig = array_filter($newFiles, static fn($n) => str_contains($n, '_orig.'));
    $newWebp = array_filter($newFiles, static fn($n) => str_ends_with($n, '.webp'));
    $newFit = array_filter($newFiles, static fn($n) => str_contains($n, '_fit_'));
    check('(b) 새 _orig 0건', count($newOrig) === 0, implode(',', $newOrig));
    check('(b) 새 webp 0건', count($newWebp) === 0, implode(',', $newWebp));
    check('(b) 새 _fit 0건', count($newFit) === 0, implode(',', $newFit));
    check('(b) 새 파일 전체 0건', count($newFiles) === 0, implode(',', $newFiles));

    // ══════════════════════════════════════════════════
    // (c) 다른 방 사진 id → findImage 거부
    // ══════════════════════════════════════════════════
    echo "\n=== (c) 다른 방 사진 id로 교체 ===\n";
    $filesBeforeC = listPromoFiles($room1Dir);
    $resC = callUploadForRoomViaCgi($scriptAbs, $user1, $room1, $goodJpg, 'cross.jpg', $otherId);
    check('(c) 거부(ok=false)', empty($resC['ok']));
    check(
        '(c) 사진을 찾을 수 없습니다',
        str_contains((string) ($resC['message'] ?? ''), '찾을 수 없'),
        (string) ($resC['message'] ?? ''),
    );
    echo "NOTE  (c) exception={$resC['exception']} msg={$resC['message']}\n";

    $stmt->execute([$existingId]);
    check('(c) 방1 테스트 행 온전', is_array($stmt->fetch(PDO::FETCH_ASSOC)));
    $stmt->execute([$otherId]);
    check('(c) 방2 행 온전', is_array($stmt->fetch(PDO::FETCH_ASSOC)));
    $filesAfterC = listPromoFiles($room1Dir);
    check('(c) 방1 파일 목록 동일', $filesBeforeC === $filesAfterC);
} catch (Throwable $e) {
    $fail++;
    echo "FAIL  SETUP/RUN — " . $e::class . ': ' . $e->getMessage() . "\n";
} finally {
    // 트리거 잔존 방지
    try {
        $pdo->exec("DROP TRIGGER IF EXISTS `{$triggerName}`");
    } catch (Throwable $e) {
        echo "NOTE  DROP TRIGGER 재시도 실패: " . $e->getMessage() . "\n";
    }

    echo "\n=== 정리 (테스트가 만든 id·토큰만) ===\n";
    foreach ($createdIds as $id) {
        $pdo->prepare('DELETE FROM study_room_images WHERE id = ?')->execute([$id]);
        echo "CLEANUP  row id={$id}\n";
    }
    foreach ($createdTokens[$room1] ?? [] as $tok) {
        deleteFilesByToken($room1Dir, $tok);
        echo "CLEANUP  room1 token={$tok}\n";
    }
    foreach ($createdTokens[$room2] ?? [] as $tok) {
        deleteFilesByToken($room2Dir, $tok);
        echo "CLEANUP  room2 token={$tok}\n";
    }
    foreach (glob($tmpDir . '/*') ?: [] as $f) {
        @unlink($f);
    }
    @rmdir($tmpDir);
}

echo "\n=== SHOW TRIGGERS (study_room_images) ===\n";
$trig = $pdo->query(
    "SELECT TRIGGER_NAME, EVENT_MANIPULATION, ACTION_TIMING
       FROM information_schema.TRIGGERS
      WHERE TRIGGER_SCHEMA = DATABASE()
        AND EVENT_OBJECT_TABLE = 'study_room_images'"
)->fetchAll(PDO::FETCH_ASSOC);
if (!$trig) {
    echo "(none)\n";
} else {
    foreach ($trig as $t) {
        echo "TRIGGER  {$t['TRIGGER_NAME']} {$t['ACTION_TIMING']} {$t['EVENT_MANIPULATION']}\n";
    }
}
$stillFail = false;
foreach ($trig as $t) {
    if (($t['TRIGGER_NAME'] ?? '') === $triggerName) {
        $stillFail = true;
    }
}
check('(cleanup) t_fail 트리거 없음', !$stillFail);

echo "\n" . ($fail > 0 ? "FAIL  {$fail}건 실패\n" : "ALL PASS\n");
exit($fail > 0 ? 1 : 0);
