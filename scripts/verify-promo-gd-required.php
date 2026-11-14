<?php

declare(strict_types=1);

/**
 * GD가 없으면 업로드 검사가 실패해야 한다(원인 코드 gd_missing).
 * php scripts/verify-promo-gd-required.php
 * docker exec study114-api-dev php scripts/verify-promo-gd-required.php
 */

require dirname(__DIR__) . '/src/bootstrap.php';

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

$hasGd = extension_loaded('gd') && function_exists('imagecreatefromstring');
check('GD 로드됨(로컬/컨테이너 기대)', $hasGd, $hasGd ? '' : 'gd 없음 — Dockerfile.api 재빌드 필요');

if ($hasGd) {
    try {
        PromoImageProcessor::assertGdAvailable();
        check('assertGdAvailable 통과', true);
    } catch (Throwable $e) {
        check('assertGdAvailable 통과', false, $e->getMessage());
    }
    $dir = sys_get_temp_dir() . '/study114-gd-' . getmypid();
    if (!is_dir($dir)) {
        mkdir($dir, 0775, true);
    }
    $small = $dir . '/small.jpg';
    $im = imagecreatetruecolor(400, 300);
    $bg = imagecolorallocate($im, 40, 120, 200);
    imagefilledrectangle($im, 0, 0, 399, 299, $bg);
    imagejpeg($im, $small, 90);
    imagedestroy($im);
    $processor = new PromoImageProcessor();
    try {
        $info = $processor->assertUploadTmp($small, (int) filesize($small));
        check('작은 사진(400×300) 거절하지 않음', ($info['width'] ?? 0) === 400 && ($info['soft_small'] ?? false) === true);
        $dest = $dir . '/basic_720.webp';
        $processor->writeVariants($small, 0.5, 0.5, ['basic_720' => $dest]);
        $out = @getimagesize($dest);
        check('작은 사진 → basic_720 720×720', is_array($out) && (int) $out[0] === 720 && (int) $out[1] === 720, json_encode($out));
    } catch (Throwable $e) {
        check('작은 사진 처리', false, $e->getMessage());
    }
    foreach (glob($dir . '/*') ?: [] as $f) {
        @unlink($f);
    }
    @rmdir($dir);
} else {
    try {
        PromoImageProcessor::assertGdAvailable();
        check('GD 없을 때 assertGdAvailable 실패', false, '예외 없음');
    } catch (Throwable $e) {
        check('GD 없을 때 assertGdAvailable 실패', str_contains($e->getMessage(), 'gd_missing'), $e->getMessage());
    }
}

$api = (string) file_get_contents(dirname(__DIR__) . '/public/api/study-room/promo-image.php');
$tutorApi = (string) file_get_contents(dirname(__DIR__) . '/public/api/tutor/profile-image.php');
check('promo-image 로그에 원인 코드', str_contains($api, 'gd_missing') && str_contains($api, 'too_large'));
check('tutor profile-image 예외 원문 미노출', !str_contains($tutorApi, "사진 처리 중 오류: ' . \$e->getMessage()"));
check('tutor profile-image 사용자 말투', str_contains($tutorApi, '사진을 처리하지 못했어요'));

$js = (string) file_get_contents(dirname(__DIR__) . '/preview/shared/promo-image.js');
check('FE 최소 픽셀 거절 문구 없음', !preg_match('/최소 \$\{PROMO_IMAGE_SPEC\.minWidth\}/', $js));
check('FE 소프트 안내', str_contains($js, '사진이 작아 조금 흐릿하게 보일 수 있어요'));

$dockerfile = (string) file_get_contents(dirname(__DIR__) . '/docker/Dockerfile.api');
check('Dockerfile.api gd+exif', str_contains($dockerfile, 'docker-php-ext-install gd exif'));
check('Dockerfile.api jpeg/webp/freetype', str_contains($dockerfile, '--with-jpeg') && str_contains($dockerfile, '--with-webp') && str_contains($dockerfile, '--with-freetype'));
check('Dockerfile.api memory 256M', str_contains($dockerfile, 'memory_limit = 256M'));

exit($fail > 0 ? 1 : 0);
