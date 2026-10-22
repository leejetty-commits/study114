<?php

declare(strict_types=1);

/**
 * 프라임 16:9는 자르지 않고 담고, 빈 곳은 같은 사진을 흐리게.
 * php scripts/verify-prime-contain-blur.php
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

$dir = sys_get_temp_dir() . '/study114-prime-' . getmypid();
if (!is_dir($dir) && !mkdir($dir, 0775, true) && !is_dir($dir)) {
    fwrite(STDERR, "임시 폴더를 만들지 못했습니다\n");
    exit(1);
}

if (!function_exists('imagewebp') || !function_exists('imagejpeg') || !function_exists('imagecreatetruecolor')) {
    check('GD WebP', false, 'imagewebp 없음');
    cleanup($dir);
    exit(1);
}

$processor = new PromoImageProcessor();

$wide = $dir . '/wide.jpg';
writeJpeg($wide, 2000, 800, function ($im, $w, $h): void {
    $green = imagecolorallocate($im, 0, 170, 0);
    $red = imagecolorallocate($im, 230, 0, 0);
    $blue = imagecolorallocate($im, 0, 0, 230);
    imagefilledrectangle($im, 0, 0, $w, $h, $green);
    imagefilledrectangle($im, 0, 0, 59, $h, $red);
    imagefilledrectangle($im, $w - 60, 0, $w, $h, $blue);
});
$p1280 = $dir . '/prime_1280.webp';
$p1600 = $dir . '/prime_1600.webp';
$processor->writeVariants($wide, 0.5, 0.5, [
    'prime_1280' => $p1280,
    'prime_1600' => $p1600,
]);
check('가로 prime_1280 1280×720, 양끝 보임, 위가 채워짐', widePrimeOk($p1280, 1280, 720), describe($p1280));
check('가로 prime_1600 1600×900, 같은 규칙', widePrimeOk($p1600, 1600, 900), describe($p1600));

$tall = $dir . '/tall.jpg';
writeJpeg($tall, 800, 2000, function ($im, $w, $h): void {
    $green = imagecolorallocate($im, 0, 170, 0);
    $red = imagecolorallocate($im, 230, 0, 0);
    $blue = imagecolorallocate($im, 0, 0, 230);
    imagefilledrectangle($im, 0, 0, $w, $h, $green);
    imagefilledrectangle($im, 0, 0, $w, 79, $red);
    imagefilledrectangle($im, 0, $h - 80, $w, $h, $blue);
});
$tallPrime = $dir . '/tall-prime.webp';
$processor->writeVariants($tall, 0.5, 0.5, ['prime_1280' => $tallPrime]);
check('세로 prime_1280 위아래 끝, 양옆 채워짐', tallPrimeOk($tallPrime), describe($tallPrime));

$square = $dir . '/square.jpg';
writeJpeg($square, 1000, 1000, function ($im, $w, $h): void {
    $green = imagecolorallocate($im, 0, 170, 0);
    $red = imagecolorallocate($im, 230, 0, 0);
    $blue = imagecolorallocate($im, 0, 0, 230);
    $yellow = imagecolorallocate($im, 230, 210, 0);
    $cyan = imagecolorallocate($im, 0, 200, 210);
    imagefilledrectangle($im, 0, 0, $w, $h, $green);
    imagefilledrectangle($im, 0, 0, $w, 49, $red);
    imagefilledrectangle($im, 0, $h - 50, $w, $h, $blue);
    imagefilledrectangle($im, 0, 0, 49, $h, $yellow);
    imagefilledrectangle($im, $w - 50, 0, $w, $h, $cyan);
});
$sqPrime = $dir . '/square-prime.webp';
$processor->writeVariants($square, 0.5, 0.5, ['prime_1280' => $sqPrime]);
check('정사각 prime_1280 네 끝, 양옆 채워짐', squarePrimeOk($sqPrime), describe($sqPrime));

$basicSrc = $dir . '/basic-src.jpg';
writeJpeg($basicSrc, 2000, 800, function ($im, $w, $h): void {
    $red = imagecolorallocate($im, 230, 0, 0);
    $blue = imagecolorallocate($im, 0, 0, 230);
    imagefilledrectangle($im, 0, 0, $w, $h, $blue);
    imagefilledrectangle($im, 0, 0, 1099, $h, $red);
});
$basic0 = $dir . '/basic0.webp';
$basic1 = $dir . '/basic1.webp';
$processor->writeVariants($basicSrc, 0.0, 0.5, ['basic_720' => $basic0]);
$processor->writeVariants($basicSrc, 1.0, 0.5, ['basic_720' => $basic1]);
$c0 = centerColor($basic0);
$c1 = centerColor($basic1);
check('basic_720 crop 0은 왼쪽(빨강)', $c0[0] > 180 && $c0[2] < 80, implode(',', $c0));
check('basic_720 crop 1은 오른쪽(파랑)', $c1[2] > 180 && $c1[0] < 80, implode(',', $c1));
check('basic crop 0과 1은 다른 쪽', $c0 !== $c1);

$small = $dir . '/small.jpg';
writeJpeg($small, 800, 600, function ($im, $w, $h): void {
    $green = imagecolorallocate($im, 0, 170, 0);
    $mag = imagecolorallocate($im, 230, 0, 230);
    imagefilledrectangle($im, 0, 0, $w, $h, $green);
    imagefilledrectangle($im, 200, 0, 239, $h, $mag);
});
$smallPrime = $dir . '/small-prime.webp';
$processor->writeVariants($small, 0.5, 0.5, ['prime_1280' => $smallPrime]);
$sharp = pixel($smallPrime, 450, 360);
$band = 0;
for ($x = 0; $x < 1280; $x++) {
    $p = pixel($smallPrime, $x, 360);
    if ($p[0] > 200 && $p[2] > 180 && $p[1] < 40) {
        $band++;
    }
}
check(
    '작은 원본 앞 사진은 키우지 않음',
    sizeOfImage($smallPrime) === [1280, 720] && $sharp[0] > 180 && $sharp[2] > 150 && $sharp[1] < 80 && $band > 20 && $band < 55,
    'sharp=' . implode(',', $sharp) . " band={$band}",
);

$js = (string) file_get_contents(dirname(__DIR__) . '/preview/shared/promo-image.js');
$primeBlock = '';
if (preg_match('/data-crop-prime[\s\S]*?data-crop-basic/', $js, $m)) {
    $primeBlock = $m[0];
}
$together = preg_match('/잘릴 중심[\s\S]{0,80}프라임|프라임[\s\S]{0,40}잘릴 중심/u', $js) === 1;
check(
    '창 문구: 프라임은 전체, 잘릴 중심과 프라임이 같이 없음',
    str_contains($js, '프라임(16:9)은 사진 전체가 들어갑니다') && !$together,
);
check('프라임 틀에 spot 없음', $primeBlock !== '' && !str_contains($primeBlock, 'data-crop-spot'));
check(
    '베이직 틀에서 고름',
    str_contains($js, "basic?.addEventListener('click', onPoint)") && !str_contains($js, "prime?.addEventListener('click', onPoint)"),
);

$cropped = $dir . '/cropped.webp';
writeCroppedWide($wide, $cropped);
check('변조: prime을 crop으로 되돌리면 가로 끝 검사가 실패', widePrimeOk($p1280, 1280, 720) && !widePrimeOk($cropped, 1280, 720));

cleanup($dir);
exit($fail > 0 ? 1 : 0);

function widePrimeOk(string $path, int $w, int $h): bool
{
    if (sizeOfImage($path) !== [$w, $h]) {
        return false;
    }
    $left = pixel($path, 4, (int) ($h / 2));
    $right = pixel($path, $w - 5, (int) ($h / 2));
    $top = pixel($path, (int) ($w / 2), 4);

    return $left[0] > 160 && $left[1] < 90
        && $right[2] > 160 && $right[0] < 90
        && filled($top);
}

function tallPrimeOk(string $path): bool
{
    if (sizeOfImage($path) !== [1280, 720]) {
        return false;
    }
    $top = pixel($path, 640, 4);
    $bot = pixel($path, 640, 715);
    $side = pixel($path, 4, 360);

    return $top[0] > 160 && $top[1] < 90
        && $bot[2] > 160 && $bot[0] < 90
        && filled($side);
}

function squarePrimeOk(string $path): bool
{
    if (sizeOfImage($path) !== [1280, 720]) {
        return false;
    }
    $top = pixel($path, 640, 4);
    $bot = pixel($path, 640, 715);
    $left = pixel($path, 290, 360);
    $right = pixel($path, 990, 360);
    $side = pixel($path, 8, 360);

    return $top[0] > 160 && $bot[2] > 160
        && $left[0] > 160 && $left[1] > 140
        && $right[1] > 140 && $right[2] > 140
        && filled($side);
}

/** @param array{0:int,1:int,2:int} $rgb */
function filled(array $rgb): bool
{
    $max = max($rgb);
    $min = min($rgb);
    $white = $min > 235;
    $black = $max < 20;

    return !$white && !$black && ($max - $min) > 25;
}

function writeCroppedWide(string $src, string $dest): void
{
    $raw = (string) file_get_contents($src);
    $im = imagecreatefromstring($raw);
    if ($im === false) {
        throw new RuntimeException('crop 원본 실패');
    }
    $w = imagesx($im);
    $h = imagesy($im);
    $cw = max(1, min($w, (int) round($h * (1280 / 720))));
    $cx = (int) round(($w - $cw) * 0.5);
    $canvas = imagecreatetruecolor(1280, 720);
    imagecopyresampled($canvas, $im, 0, 0, $cx, 0, 1280, 720, $cw, $h);
    imagewebp($canvas, $dest, 82);
    imagedestroy($im);
    imagedestroy($canvas);
}

function writeJpeg(string $file, int $w, int $h, callable $paint): void
{
    $im = imagecreatetruecolor($w, $h);
    if ($im === false) {
        throw new RuntimeException('캔버스 실패');
    }
    $paint($im, $w, $h);
    imagejpeg($im, $file, 95);
    imagedestroy($im);
}

/** @return array{0:int,1:int} */
function sizeOfImage(string $path): array
{
    $info = @getimagesize($path);

    return is_array($info) ? [(int) $info[0], (int) $info[1]] : [0, 0];
}

/** @return array{0:int,1:int,2:int} */
function centerColor(string $path): array
{
    [$w, $h] = sizeOfImage($path);

    return pixel($path, (int) ($w / 2), (int) ($h / 2));
}

/** @return array{0:int,1:int,2:int} */
function pixel(string $path, int $x, int $y): array
{
    $im = @imagecreatefromstring((string) file_get_contents($path));
    if ($im === false) {
        return [0, 0, 0];
    }
    $rgb = imagecolorat($im, max(0, $x), max(0, $y));
    imagedestroy($im);

    return [($rgb >> 16) & 255, ($rgb >> 8) & 255, $rgb & 255];
}

function describe(string $path): string
{
    [$w, $h] = sizeOfImage($path);

    return $w . 'x' . $h
        . ' L' . implode(',', pixel($path, 4, (int) ($h / 2)))
        . ' R' . implode(',', pixel($path, max(0, $w - 5), (int) ($h / 2)))
        . ' T' . implode(',', pixel($path, (int) ($w / 2), 4));
}

function cleanup(string $dir): void
{
    foreach (glob($dir . '/*') ?: [] as $file) {
        @unlink($file);
    }
    @rmdir($dir);
}
