<?php

declare(strict_types=1);

require dirname(__DIR__) . '/src/Media/PromoImageSpec.php';
require dirname(__DIR__) . '/src/Media/PromoImageProcessor.php';

use Study114\Media\PromoImageProcessor;

$processor = new PromoImageProcessor();
$dir = sys_get_temp_dir() . '/s114-285';
if (!is_dir($dir)) {
    mkdir($dir);
}
$before = scandir($dir);

function expect(string $name, callable $fn, string $contains): void
{
    try {
        $fn();
        fwrite(STDERR, "FAIL  {$name} — no throw\n");
    } catch (Throwable $e) {
        $ok = str_contains($e->getMessage(), $contains);
        echo ($ok ? 'PASS  ' : 'FAIL  ') . $name . ' — ' . $e->getMessage() . "\n";
    }
}

$txt = $dir . '/photo.jpg';
file_put_contents($txt, 'not an image');
expect('text as jpg', fn () => $processor->assertUploadTmp($txt, filesize($txt)), '이미지 파일을 읽을 수 없습니다');

$php = $dir . '/x.php';
file_put_contents($php, '<?php echo 1;');
expect('php file', fn () => $processor->assertUploadTmp($php, filesize($php)), '이미지 파일을 읽을 수 없습니다');

$phpJpg = $dir . '/x.jpg';
file_put_contents($phpJpg, '<?php echo 1;');
expect('php renamed jpg', fn () => $processor->assertUploadTmp($phpJpg, filesize($phpJpg)), '이미지 파일을 읽을 수 없습니다');

$jpeg = base64_decode('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=');
$jpg = $dir . '/x.php.jpg-real';
$namedPhp = $dir . '/real.php';
file_put_contents($jpg, $jpeg);
file_put_contents($namedPhp, $jpeg);
$info = @getimagesize($jpg);
echo 'getimagesize=' . json_encode($info) . "\n";
if (is_array($info)) {
    expect('tiny jpeg min size', fn () => $processor->assertUploadTmp($jpg, filesize($jpg)), '픽셀 이상이어야 합니다');
    expect('tiny jpeg named php', fn () => $processor->assertUploadTmp($namedPhp, filesize($namedPhp)), '픽셀 이상이어야 합니다');

    $sof = false;
    $marker = '';
    for ($i = 0; $i < strlen($jpeg) - 1; $i++) {
        if (ord($jpeg[$i]) === 0xFF && in_array(ord($jpeg[$i + 1]), [0xC0, 0xC1, 0xC2], true)) {
            $sof = $i;
            $marker = sprintf('%02X', ord($jpeg[$i + 1]));
            break;
        }
    }
    echo "sof={$sof} marker={$marker}\n";
    if ($sof === false) {
        echo "FAIL  no SOF0\n";
    } else {
        $patch = static function (string $bytes, int $w, int $h) use ($sof): string {
            $bytes[$sof + 5] = chr(($h >> 8) & 0xFF);
            $bytes[$sof + 6] = chr($h & 0xFF);
            $bytes[$sof + 7] = chr(($w >> 8) & 0xFF);
            $bytes[$sof + 8] = chr($w & 0xFF);
            return $bytes;
        };
        $okPath = $dir . '/real-ok.php';
        file_put_contents($okPath, $patch($jpeg, 800, 600));
        try {
            $got = $processor->assertUploadTmp($okPath, filesize($okPath));
            $pass = $got['ext'] === 'jpg' && $got['mime'] === 'image/jpeg' && $got['width'] === 800 && $got['height'] === 600;
            echo ($pass ? 'PASS  ' : 'FAIL  ') . 'jpeg named php saves as jpg — ' . json_encode($got) . "\n";
        } catch (Throwable $e) {
            echo 'FAIL  jpeg named php — ' . $e->getMessage() . "\n";
        }
        $bigEdge = $dir . '/edge.jpg';
        file_put_contents($bigEdge, $patch($jpeg, 12001, 800));
        expect('long edge 12001', fn () => $processor->assertUploadTmp($bigEdge, filesize($bigEdge)), '사진이 너무 커요');
        $bigPx = $dir . '/pixels.jpg';
        file_put_contents($bigPx, $patch($jpeg, 8000, 6000));
        expect('40M pixels', fn () => $processor->assertUploadTmp($bigPx, filesize($bigPx)), '사진이 너무 커요');
    }
}

$after = scandir($dir);
$extra = array_diff($after, $before, [basename($txt), basename($php), basename($phpJpg), basename($jpg), basename($namedPhp)]);
echo 'extra-files=' . json_encode(array_values($extra)) . "\n";
