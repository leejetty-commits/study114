<?php

declare(strict_types=1);

/**
 * fit_1280: VARIANTS에 없음, 긴 변만 줄이고 자르지 않음, 지우기 목록에 있음.
 * php scripts/verify-photo-fit-1280.php
 */

require dirname(__DIR__) . '/src/bootstrap.php';

use Study114\Media\PromoImageProcessor;
use Study114\Media\PromoImageSpec;

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

$keys = array_keys(PromoImageSpec::VARIANTS);
check('VARIANTS에 fit 없음', !in_array('fit_1280', $keys, true) && !in_array(PromoImageSpec::FIT_KEY, $keys, true));
check(
    'fitPathFor 파생 이름',
    PromoImageSpec::fitPathFor('/uploads/promo/rooms/1/ab_prime_1280.webp') === '/uploads/promo/rooms/1/ab_fit_1280.webp'
        && PromoImageSpec::fitPathFor('/uploads/promo/rooms/1/ab_prime_1600.jpg') === '/uploads/promo/rooms/1/ab_fit_1280.webp'
        && PromoImageSpec::fitPathFor('/uploads/promo/tutors/2/ab_basic_720.webp') === '/uploads/promo/tutors/2/ab_fit_1280.webp'
        && PromoImageSpec::fitPathFor('/uploads/promo/tutors/2/ab_basic_360.png') === '/uploads/promo/tutors/2/ab_fit_1280.webp'
        && PromoImageSpec::fitPathFor('/uploads/promo/rooms/1/ab_orig.jpg') === ''
        && PromoImageSpec::fitPathFor('/uploads/promo/rooms/1/ab_fit_1280.webp') === '',
);

$root = dirname(__DIR__);
$roomDelete = file_get_contents($root . '/src/Media/PromoImageService.php');
$tutorUnlink = file_get_contents($root . '/src/Media/TutorProfileImageService.php');
check('공부방 삭제에 fitPathFor', is_string($roomDelete) && str_contains($roomDelete, 'PromoImageSpec::fitPathFor'));
check('과외쌤 unlinkVariants에 fitPathFor', is_string($tutorUnlink) && str_contains($tutorUnlink, 'PromoImageSpec::fitPathFor'));

if (!function_exists('imagewebp') || !function_exists('imagejpeg') || !function_exists('imagecreatetruecolor')) {
    check('GD WebP로 긴 변 검사', false, 'imagewebp 없음');
    exit(1);
}

$processor = new PromoImageProcessor();
$dir = sys_get_temp_dir() . '/study114-fit-' . getmypid();
if (!is_dir($dir) && !mkdir($dir, 0775, true) && !is_dir($dir)) {
    check('임시 폴더', false, $dir);
    exit(1);
}

$cases = [
    '가로 2000x800 → 1280x512' => [2000, 800, 1280, 512],
    '세로 800x2000 → 512x1280' => [800, 2000, 512, 1280],
    '작은 600x400 → 600x400' => [600, 400, 600, 400],
];
foreach ($cases as $name => [$sw, $sh, $ew, $eh]) {
    $src = $dir . "/src-{$sw}x{$sh}.jpg";
    $dest = $dir . "/fit-{$sw}x{$sh}.webp";
    $canvas = imagecreatetruecolor($sw, $sh);
    if ($canvas === false) {
        check($name, false, '캔버스 실패');
        continue;
    }
    $color = imagecolorallocate($canvas, 20, 90, 160);
    imagefilledrectangle($canvas, 0, 0, $sw, $sh, $color);
    imagejpeg($canvas, $src, 90);
    imagedestroy($canvas);
    try {
        $saved = $processor->shrinkLongEdgeWebp($src, $dest, PromoImageSpec::FIT_LONG_EDGE, 82, PromoImageSpec::FIT_TARGET_BYTES);
        $info = @getimagesize($dest);
        $ok = ($saved['width'] ?? 0) === $ew
            && ($saved['height'] ?? 0) === $eh
            && is_array($info)
            && (int) $info[0] === $ew
            && (int) $info[1] === $eh
            && ($saved['bytes'] ?? 0) > 0
            && ($saved['bytes'] ?? PHP_INT_MAX) <= PromoImageSpec::FIT_TARGET_BYTES;
        check($name, $ok, json_encode($saved, JSON_UNESCAPED_UNICODE) ?: '');
    } catch (Throwable $e) {
        check($name, false, $e->getMessage());
    }
}

foreach (glob($dir . '/*') ?: [] as $file) {
    @unlink($file);
}
@rmdir($dir);

exit($fail > 0 ? 1 : 0);
