<?php
function paint(int $w, int $h, array $a, array $b, string $file): void
{
    $im = imagecreatetruecolor($w, $h);
    $c1 = imagecolorallocate($im, $a[0], $a[1], $a[2]);
    $c2 = imagecolorallocate($im, $b[0], $b[1], $b[2]);
    imagefilledrectangle($im, 0, 0, $w, $h, $c1);
    imagefilledrectangle($im, (int) ($w * 0.08), (int) ($h * 0.08), (int) ($w * 0.92), (int) ($h * 0.92), $c2);
    imagepng($im, $file);
    imagedestroy($im);
}
$dir = dirname(__DIR__) . '/preview/home-ui';
paint(640, 256, [220, 38, 38], [250, 204, 21], $dir . '/288-wide.png');
paint(256, 640, [22, 163, 74], [14, 165, 233], $dir . '/288-tall.png');
echo "ok\n";
