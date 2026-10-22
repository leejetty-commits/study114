<?php

declare(strict_types=1);

/**
 * 과외쌤 원본+crop, cropRect 식, EXIF 회전.
 * php scripts/verify-photo-exif-nocrop.php
 * 내부에서 exif 없는 PHP를 한 번 더 띄운다(--no-exif).
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

$dir = sys_get_temp_dir() . '/study114-exif-' . getmypid();
if (!is_dir($dir) && !mkdir($dir, 0775, true) && !is_dir($dir)) {
    fwrite(STDERR, "임시 폴더를 만들지 못했습니다\n");
    exit(1);
}

if (in_array('--no-exif', $argv, true)) {
    $src = $dir . '/plain.jpg';
    writeJpeg($src, 900, 700, function ($im, $w, $h): void {
        $c = imagecolorallocate($im, 10, 20, 30);
        imagefilledrectangle($im, 0, 0, $w, $h, $c);
    });
    $dest = $dir . '/plain-fit.webp';
    $ok = false;
    $detail = function_exists('exif_read_data') ? 'exif_read_data 가 아직 있음' : '';
    if (!function_exists('exif_read_data')) {
        try {
            $processor = new PromoImageProcessor();
            $saved = $processor->shrinkLongEdgeWebp($src, $dest, PromoImageSpec::FIT_LONG_EDGE, 82, PromoImageSpec::FIT_TARGET_BYTES);
            $ok = ($saved['width'] ?? 0) === 900 && ($saved['height'] ?? 0) === 700;
            if (!$ok) {
                $detail = json_encode($saved) ?: '';
            }
        } catch (Throwable $e) {
            $detail = $e->getMessage();
        }
    }
    cleanup($dir);
    if ($ok) {
        echo "PASS  exif 확장 없음: 오류 없이 지나감\n";
        exit(0);
    }
    echo "FAIL  exif 확장 없음: 오류 없이 지나감 — {$detail}\n";
    exit(1);
}

if (!function_exists('imagewebp') || !function_exists('imagejpeg') || !function_exists('imagecreatetruecolor')) {
    check('GD WebP', false, 'imagewebp 없음');
    cleanup($dir);
    exit(1);
}

$processor = new PromoImageProcessor();

foreach ([
    ['abc', 0.5],
    ['NaN', 0.5],
    ['1e999', 0.5],
    [-1, 0.5],
    [2, 0.5],
    ['', 0.5],
    [null, 0.5],
    [0, 0.0],
    [1, 1.0],
    ['0', 0.0],
    ['1', 1.0],
    [0.25, 0.25],
] as [$input, $expect]) {
    $got = PromoImageSpec::normalizeCropOffset($input);
    check('crop ' . var_export($input, true) . ' → ' . $expect, abs($got - (float) $expect) < 0.00001, (string) $got);
}

$wide = $dir . '/wide.jpg';
writeJpeg($wide, 2000, 800, function ($im, $w, $h): void {
    $red = imagecolorallocate($im, 220, 20, 20);
    $blue = imagecolorallocate($im, 20, 40, 220);
    imagefilledrectangle($im, 0, 0, $w, $h, $blue);
    imagefilledrectangle($im, 0, 0, 899, $h, $red);
});
$basic = $dir . '/basic_720.webp';
$prime = $dir . '/prime_1280.webp';
$fit = $dir . '/fit.webp';
$processor->writeVariants($wide, 0.5, 0.5, [
    'basic_720' => $basic,
    'prime_1280' => $prime,
]);
$fitSaved = $processor->shrinkLongEdgeWebp($wide, $fit, PromoImageSpec::FIT_LONG_EDGE, 82, PromoImageSpec::FIT_TARGET_BYTES);
check('가로 crop 0.5 basic_720 720×720', sizeOfImage($basic) === [720, 720], implode('x', sizeOfImage($basic)));
check('가로 crop 0.5 prime_1280 1280×720', sizeOfImage($prime) === [1280, 720], implode('x', sizeOfImage($prime)));
check(
    '가로 fit 1280×512',
    ($fitSaved['width'] ?? 0) === 1280 && ($fitSaved['height'] ?? 0) === 512 && sizeOfImage($fit) === [1280, 512],
    json_encode($fitSaved) ?: '',
);
check('변조: 잘못된 기대 크기는 실패로 잡힘', sizeOfImage($fit) !== [10, 10]);

$basic0 = $dir . '/basic0.webp';
$basic1 = $dir . '/basic1.webp';
$processor->writeVariants($wide, 0.0, 0.5, ['basic_720' => $basic0]);
$processor->writeVariants($wide, 1.0, 0.5, ['basic_720' => $basic1]);
$c0 = centerColor($basic0);
$c1 = centerColor($basic1);
check('crop 0 basic은 왼쪽(빨강)', $c0[0] > 180 && $c0[2] < 80, implode(',', $c0));
check('crop 1 basic은 오른쪽(파랑)', $c1[2] > 180 && $c1[0] < 80, implode(',', $c1));
check('crop 0과 1은 서로 다른 쪽', $c0 !== $c1);

$tall = $dir . '/tall.jpg';
writeJpeg($tall, 800, 2000, function ($im, $w, $h): void {
    $c = imagecolorallocate($im, 20, 160, 40);
    imagefilledrectangle($im, 0, 0, $w, $h, $c);
});
$fitTall = $dir . '/fit-tall.webp';
$tallSaved = $processor->shrinkLongEdgeWebp($tall, $fitTall, PromoImageSpec::FIT_LONG_EDGE, 82, PromoImageSpec::FIT_TARGET_BYTES);
check(
    '세로 fit 512×1280',
    ($tallSaved['width'] ?? 0) === 512 && ($tallSaved['height'] ?? 0) === 1280,
    json_encode($tallSaved) ?: '',
);

$cropMethod = new ReflectionMethod(PromoImageProcessor::class, 'cropRect');
$cropMethod->setAccessible(true);
[$sx, $sy, $cw, $ch] = $cropMethod->invoke($processor, 2000, 800, 0.25, 0.0, 720, 720);
check(
    'cropRect = (w-cw)×fx',
    $cw === 800 && $ch === 800 && $sx === 300 && $sy === 0,
    "{$sx},{$sy},{$cw},{$ch}",
);

if (!function_exists('exif_read_data')) {
    check('EXIF 6·3', false, '이 PHP에 exif_read_data 없음');
} else {
    $exif6 = $dir . '/exif6.jpg';
    writeJpeg($exif6, 800, 400, function ($im, $w, $h): void {
        $green = imagecolorallocate($im, 0, 170, 0);
        $red = imagecolorallocate($im, 230, 0, 0);
        imagefilledrectangle($im, 0, 0, $w, $h, $green);
        imagefilledrectangle($im, 0, 0, 24, $h, $red);
    });
    file_put_contents($exif6, jpegWithOrientation((string) file_get_contents($exif6), 6));
    $read = @exif_read_data($exif6);
    check('EXIF 6 기록', is_array($read) && (int) ($read['Orientation'] ?? 0) === 6, json_encode($read['Orientation'] ?? null));
    $fit6 = $dir . '/fit6.webp';
    $saved6 = $processor->shrinkLongEdgeWebp($exif6, $fit6, PromoImageSpec::FIT_LONG_EDGE, 82, PromoImageSpec::FIT_TARGET_BYTES);
    $top6 = pixel($fit6, (int) (($saved6['width'] ?? 1) / 2), 2);
    check(
        'EXIF 6 fit은 세로이고 위가 빨강',
        ($saved6['height'] ?? 0) > ($saved6['width'] ?? 0) && $top6[0] > 180 && $top6[1] < 80,
        json_encode($saved6) . ' top=' . implode(',', $top6),
    );

    $exif3 = $dir . '/exif3.jpg';
    writeJpeg($exif3, 900, 700, function ($im, $w, $h): void {
        $red = imagecolorallocate($im, 230, 0, 0);
        $blue = imagecolorallocate($im, 0, 0, 230);
        imagefilledrectangle($im, 0, 0, $w, (int) ($h / 2), $blue);
        imagefilledrectangle($im, 0, (int) ($h / 2), $w, $h, $red);
    });
    file_put_contents($exif3, jpegWithOrientation((string) file_get_contents($exif3), 3));
    $fit3 = $dir . '/fit3.webp';
    $saved3 = $processor->shrinkLongEdgeWebp($exif3, $fit3, PromoImageSpec::FIT_LONG_EDGE, 82, PromoImageSpec::FIT_TARGET_BYTES);
    $top3 = pixel($fit3, (int) (($saved3['width'] ?? 1) / 2), 4);
    $bot3 = pixel($fit3, (int) (($saved3['width'] ?? 1) / 2), max(0, ($saved3['height'] ?? 1) - 5));
    check(
        'EXIF 3 위는 빨강 아래는 파랑',
        $top3[0] > 180 && $top3[2] < 80 && $bot3[2] > 180 && $bot3[0] < 80,
        'top=' . implode(',', $top3) . ' bot=' . implode(',', $bot3),
    );
}

$js = (string) file_get_contents(dirname(__DIR__) . '/preview/home-ui/src/tutor-reg/profile-photos.js');
check('브라우저 upload_1200_path 없음', !str_contains($js, 'upload_1200_path'));
check('브라우저 긴 변 1600', str_contains($js, 'uploadLongEdge: 1600') && str_contains($js, 'fileForTutorProfileUpload'));

$extDir = (string) ini_get('extension_dir');
$cmd = [
    PHP_BINARY,
    '-n',
    '-d', 'extension_dir=' . $extDir,
    '-d', 'extension=gd',
    __FILE__,
    '--no-exif',
];
$desc = [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']];
$proc = proc_open($cmd, $desc, $pipes, dirname(__DIR__));
$noExifOk = false;
$noExifDetail = 'proc_open 실패';
if (is_resource($proc)) {
    fclose($pipes[0]);
    $out = stream_get_contents($pipes[1]);
    $err = stream_get_contents($pipes[2]);
    fclose($pipes[1]);
    fclose($pipes[2]);
    $code = proc_close($proc);
    $noExifOk = $code === 0 && str_contains((string) $out, 'PASS  exif 확장 없음');
    $noExifDetail = trim((string) $out . "\n" . (string) $err);
}
check('exif 확장 없음: 오류 없이 지나감', $noExifOk, $noExifDetail);

cleanup($dir);
exit($fail > 0 ? 1 : 0);

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

function jpegWithOrientation(string $jpeg, int $orientation): string
{
    if (!str_starts_with($jpeg, "\xFF\xD8")) {
        throw new RuntimeException('JPEG 아님');
    }
    $tiff = 'II' . pack('v', 42) . pack('V', 8);
    $entry = pack('v', 0x0112) . pack('v', 3) . pack('V', 1) . pack('v', $orientation) . "\x00\x00";
    $ifd = pack('v', 1) . $entry . pack('V', 0);
    $payload = "Exif\x00\x00" . $tiff . $ifd;
    $app1 = "\xFF\xE1" . pack('n', strlen($payload) + 2) . $payload;

    return "\xFF\xD8" . $app1 . substr($jpeg, 2);
}

/** @return array{0:int,1:int} */
function sizeOfImage(string $path): array
{
    $info = @getimagesize($path);
    if (!is_array($info)) {
        return [0, 0];
    }

    return [(int) $info[0], (int) $info[1]];
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
    $raw = (string) file_get_contents($path);
    $im = @imagecreatefromstring($raw);
    if ($im === false) {
        return [0, 0, 0];
    }
    $rgb = imagecolorat($im, max(0, $x), max(0, $y));
    imagedestroy($im);

    return [($rgb >> 16) & 255, ($rgb >> 8) & 255, $rgb & 255];
}

function cleanup(string $dir): void
{
    foreach (glob($dir . '/*') ?: [] as $file) {
        @unlink($file);
    }
    @rmdir($dir);
}
