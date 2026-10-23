<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/src/bootstrap.php';

use Study114\Media\PromoImageProcessor;

$processor = new PromoImageProcessor();
$fail = 0;

function check(string $name, bool $ok, string $detail = ''): void
{
    global $fail;
    if ($ok) {
        echo "PASS  $name\n";
        return;
    }
    $fail++;
    echo "FAIL  $name" . ($detail !== '' ? " — $detail" : '') . "\n";
}

$wide = sys_get_temp_dir() . '/c240-wide.jpg';
$small = sys_get_temp_dir() . '/c240-small.png';
$doc = sys_get_temp_dir() . '/c240-note.txt';
$wideOut = sys_get_temp_dir() . '/c240-wide-out.webp';
$smallOut = sys_get_temp_dir() . '/c240-small-out.webp';

$img = imagecreatetruecolor(3200, 800);
for ($x = 0; $x < 3200; $x += 8) {
    $c = imagecolorallocate($img, $x % 256, ($x * 3) % 256, ($x * 7) % 256);
    imagefilledrectangle($img, $x, 0, $x + 7, 799, $c);
}
imagejpeg($img, $wide, 95);
imagedestroy($img);
$wideBefore = filesize($wide);

$tiny = imagecreatetruecolor(200, 120);
$blue = imagecolorallocate($tiny, 20, 80, 180);
imagefilledrectangle($tiny, 0, 0, 199, 119, $blue);
imagepng($tiny, $small);
imagedestroy($tiny);

file_put_contents($doc, 'not a photo');

$saved = $processor->shrinkLongEdgeWebp($wide, $wideOut, 1600, 82, 1024 * 1024);
$info = $processor->inspect($wideOut);
check('큰 사진 긴 쪽 1600 이하', $info['width'] <= 1600 && $info['height'] <= 1600, $info['width'] . 'x' . $info['height']);
check('큰 사진은 줄어듦', $info['width'] < 3200, $info['width'] . 'x' . $info['height']);
check('저장 형식 webp', $info['mime'] === 'image/webp', $info['mime']);
check('약 1MB 이하', $saved['bytes'] <= 1024 * 1024, (string) $saved['bytes']);
check('원본 jpg는 그대로', is_file($wide) && filesize($wide) === $wideBefore);
check('원본과 저장 파일이 다름', realpath($wide) !== realpath($wideOut));
echo "wide out {$info['width']}x{$info['height']} {$saved['bytes']} bytes q{$saved['quality']}\n";

$noise = sys_get_temp_dir() . '/c240-noise.jpg';
$noiseOut = sys_get_temp_dir() . '/c240-noise-out.webp';
$noisy = imagecreatetruecolor(2400, 1600);
for ($y = 0; $y < 1600; $y += 4) {
    for ($x = 0; $x < 2400; $x += 4) {
        $c = imagecolorallocate($noisy, random_int(0, 255), random_int(0, 255), random_int(0, 255));
        imagefilledrectangle($noisy, $x, $y, $x + 3, $y + 3, $c);
    }
}
imagejpeg($noisy, $noise, 100);
imagedestroy($noisy);
$noiseSaved = $processor->shrinkLongEdgeWebp($noise, $noiseOut, 1600, 82, 1024 * 1024);
$noiseInfo = $processor->inspect($noiseOut);
check('잡음 사진도 1600·1MB', $noiseInfo['width'] <= 1600 && $noiseSaved['bytes'] <= 1024 * 1024, $noiseInfo['width'] . 'x' . $noiseInfo['height'] . ' ' . $noiseSaved['bytes'] . ' q' . $noiseSaved['quality']);
echo "noise out {$noiseInfo['width']}x{$noiseInfo['height']} {$noiseSaved['bytes']} bytes q{$noiseSaved['quality']}\n";

$smallSaved = $processor->shrinkLongEdgeWebp($small, $smallOut, 1600, 82, 1024 * 1024);
$smallInfo = $processor->inspect($smallOut);
check('작은 사진은 키우지 않음', $smallInfo['width'] === 200 && $smallInfo['height'] === 120, $smallInfo['width'] . 'x' . $smallInfo['height']);
check('작은 원본 png는 그대로', is_file($small));

$blocked = false;
try {
    $processor->inspect($doc);
} catch (InvalidArgumentException) {
    $blocked = true;
}
check('문서 파일은 사진으로 읽지 않음', $blocked);

echo $fail === 0 ? "\nall passed\n" : "\n$fail failed\n";
exit($fail === 0 ? 0 : 1);
