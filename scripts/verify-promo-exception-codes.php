<?php

declare(strict_types=1);

/**
 * PromoImageException 코드·문구(접두어 없음) · 쪽지/고민방 표면.
 * docker exec study114-api-dev php scripts/verify-promo-exception-codes.php
 */

require dirname(__DIR__) . '/src/bootstrap.php';

use Study114\Media\PromoImageException;
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

$dir = sys_get_temp_dir() . '/study114-ex-' . getmypid();
@mkdir($dir, 0775, true);
$bad = $dir . '/not-image.bin';
file_put_contents($bad, 'not-an-image');

try {
    (new PromoImageProcessor())->inspect($bad);
    check('깨진 파일 inspect 예외', false, '예외 없음');
} catch (PromoImageException $e) {
    check('깨진 파일은 PromoImageException', true);
    check('errorCode=bad_type', $e->errorCode() === 'bad_type', $e->errorCode());
    check('메시지에 bad_type: 접두어 없음', !str_starts_with($e->getMessage(), 'bad_type:'));
    check('메시지는 사용자 말투', str_contains($e->getMessage(), 'JPG') || str_contains($e->getMessage(), '읽을 수'));
} catch (Throwable $e) {
    check('깨진 파일은 PromoImageException', false, $e::class . ' ' . $e->getMessage());
}

$msgApi = (string) file_get_contents(dirname(__DIR__) . '/src/Messages/MessagesApi.php');
check('MessagesApi가 PromoImageException을 먼저 catch', str_contains($msgApi, 'PromoImageException'));
$boardApi = (string) file_get_contents(dirname(__DIR__) . '/src/Board/BoardApi.php');
check('BoardApi가 PromoImageException을 먼저 catch', str_contains($boardApi, 'PromoImageException'));

$processor = (string) file_get_contents(dirname(__DIR__) . '/src/Media/PromoImageProcessor.php');
check('Processor 문구에 bad_type: 접두어 없음', !preg_match("/'bad_type:/", $processor));
check('Processor 문구에 too_large: 접두어 없음', !preg_match("/'too_large:/", $processor));

@unlink($bad);
@rmdir($dir);
exit($fail > 0 ? 1 : 0);
