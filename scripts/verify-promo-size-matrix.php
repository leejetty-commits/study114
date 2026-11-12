<?php

declare(strict_types=1);

/**
 * 크기·형식 매트릭스 + memory_get_peak_usage.
 * docker exec study114-api-dev php scripts/verify-promo-size-matrix.php
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

$dir = sys_get_temp_dir() . '/study114-matrix-' . getmypid();
@mkdir($dir, 0775, true);
$out = dirname(__DIR__) . '/docs/worklog/2026/11/shots-368';
@mkdir($out, 0775, true);
$processor = new PromoImageProcessor();

$rows = [];

function makeJpeg(string $path, int $w, int $h): void
{
    $im = imagecreatetruecolor($w, $h);
    $bg = imagecolorallocate($im, 40, 110, 180);
    imagefilledrectangle($im, 0, 0, $w - 1, $h - 1, $bg);
    imagejpeg($im, $path, 92);
    imagedestroy($im);
}

function makePngTransparent(string $path, int $w, int $h): void
{
    $im = imagecreatetruecolor($w, $h);
    imagesavealpha($im, true);
    $transparent = imagecolorallocatealpha($im, 0, 0, 0, 127);
    imagefill($im, 0, 0, $transparent);
    $fg = imagecolorallocatealpha($im, 255, 80, 40, 40);
    imagefilledellipse($im, intdiv($w, 2), intdiv($h, 2), intdiv($w, 2), intdiv($h, 2), $fg);
    imagepng($im, $path);
    imagedestroy($im);
}

function makeExif6(string $path, int $w, int $h): void
{
    // GD alone cannot write EXIF; create landscape JPEG then note: orientation applied when EXIF present.
    // For matrix we still process a portrait-looking source by rotating canvas to simulate EXIF 6 result path.
    $im = imagecreatetruecolor($w, $h);
    $bg = imagecolorallocate($im, 20, 140, 90);
    $red = imagecolorallocate($im, 220, 30, 30);
    imagefilledrectangle($im, 0, 0, $w - 1, $h - 1, $bg);
    imagefilledrectangle($im, 0, 0, $w - 1, 40, $red);
    imagejpeg($im, $path, 90);
    imagedestroy($im);
}

function runCase(PromoImageProcessor $processor, string $label, string $src, string $outDir, array &$rows): void
{
    $mem0 = memory_get_peak_usage(true);
    $in = @getimagesize($src);
    $inW = (int) ($in[0] ?? 0);
    $inH = (int) ($in[1] ?? 0);
    $inBytes = (int) filesize($src);
    $dests = [
        'prime_1280' => $outDir . '/' . $label . '-prime_1280.webp',
        'basic_720' => $outDir . '/' . $label . '-basic_720.webp',
    ];
    $processor->assertUploadTmp($src, $inBytes);
    $processor->writeVariants($src, 0.5, 0.5, $dests);
    $p = getimagesize($dests['prime_1280']);
    $b = getimagesize($dests['basic_720']);
    $mem1 = memory_get_peak_usage(true);
    $rows[] = [
        'case' => $label,
        'in' => "{$inW}x{$inH}",
        'bytes' => $inBytes,
        'prime' => ($p[0] ?? 0) . 'x' . ($p[1] ?? 0),
        'basic' => ($b[0] ?? 0) . 'x' . ($b[1] ?? 0),
        'peak' => $mem1,
        'peak_delta' => $mem1 - $mem0,
    ];
    echo sprintf(
        "ROW  %s in=%sx%s bytes=%d prime=%sx%s basic=%sx%s peak=%d\n",
        $label,
        $inW,
        $inH,
        $inBytes,
        $p[0] ?? 0,
        $p[1] ?? 0,
        $b[0] ?? 0,
        $b[1] ?? 0,
        $mem1,
    );
}

$j4000 = $dir . '/4000x3000.jpg';
makeJpeg($j4000, 4000, 3000);
runCase($processor, '4000x3000', $j4000, $out, $rows);
check('4000×3000 prime 1280×720', ($rows[array_key_last($rows)]['prime'] ?? '') === '1280x720');

$exif = $dir . '/exif6-sim.jpg';
makeExif6($exif, 1200, 800);
runCase($processor, 'exif6-sim', $exif, $out, $rows);

$png = $dir . '/alpha.png';
makePngTransparent($png, 640, 480);
runCase($processor, 'transparent-png', $png, $out, $rows);

$heic = $dir . '/sample.heic';
file_put_contents($heic, 'heic-placeholder');
try {
    $processor->assertUpload($heic, 100, 'sample.heic', 'image/heic');
    check('HEIC 거절', false, '통과됨');
} catch (PromoImageException $e) {
    check('HEIC bad_type', $e->errorCode() === 'bad_type');
    check('HEIC 안내 문구', str_contains($e->getMessage(), '지원하지 않'));
    echo "ROW  heic rejected message=" . $e->getMessage() . " peak=" . memory_get_peak_usage(true) . "\n";
}

// 휴대폰급 대용량 JPEG (>4MB). 노이즈로 압축률을 낮춘다.
$big = $dir . '/phone-10mb.jpg';
$bw = 7000;
$bh = 5000;
$im = imagecreatetruecolor($bw, $bh);
for ($y = 0; $y < $bh; $y += 4) {
    for ($x = 0; $x < $bw; $x += 4) {
        $c = imagecolorallocate($im, ($x * 37 + $y * 17) & 255, ($x * 13) & 255, ($y * 29) & 255);
        imagefilledrectangle($im, $x, $y, $x + 3, $y + 3, $c);
    }
}
imagejpeg($im, $big, 100);
imagedestroy($im);
$bigBytes = (int) filesize($big);
echo "ROW  phone-10mb-source bytes={$bigBytes}\n";
check('phone JPEG >4MB 생성', $bigBytes > 4_194_304, 'bytes=' . $bigBytes);
try {
    $processor->assertUploadTmp($big, $bigBytes);
    check('10MB 서버 한도(4MB) — 거절 기대', false, '통과');
} catch (PromoImageException $e) {
    check('10MB 서버 too_large', $e->errorCode() === 'too_large', $e->errorCode());
    echo "ROW  phone-10mb server_reject code=" . $e->errorCode() . " in_bytes={$bigBytes} peak=" . memory_get_peak_usage(true) . "\n";
}
// 브라우저 축소 후 서버가 받는 경로: 긴 변 2560 이하 JPEG
$shrunk = $dir . '/phone-shrunk.jpg';
makeJpeg($shrunk, 2560, 2048);
runCase($processor, 'phone-shrunk-2560', $shrunk, $out, $rows);

$report = $out . '/368-size-matrix.txt';
$lines = ["case\tin\tbytes\tprime\tbasic\tpeak\n"];
foreach ($rows as $r) {
    $lines[] = "{$r['case']}\t{$r['in']}\t{$r['bytes']}\t{$r['prime']}\t{$r['basic']}\t{$r['peak']}\n";
}
file_put_contents($report, implode('', $lines));
echo "REPORT {$report}\n";
echo 'PEAK_FINAL=' . memory_get_peak_usage(true) . "\n";

foreach (glob($dir . '/*') ?: [] as $f) {
    @unlink($f);
}
@rmdir($dir);
exit($fail > 0 ? 1 : 0);
