<?php

declare(strict_types=1);

namespace Study114\Media;

use InvalidArgumentException;
use RuntimeException;

/** GD 기반 크롭·리사이즈·WebP 저장. Imagick 없이 닷홈 PHP에서도 동작. */
final class PromoImageProcessor
{
    /**
     * @return array{width: int, height: int, mime: string}
     */
    public function inspect(string $absolutePath): array
    {
        $info = @getimagesize($absolutePath);
        if ($info === false) {
            throw new InvalidArgumentException('이미지 파일을 읽을 수 없습니다.');
        }
        $width = (int) ($info[0] ?? 0);
        $height = (int) ($info[1] ?? 0);
        $mime = (string) ($info['mime'] ?? '');
        if ($width < 1 || $height < 1) {
            throw new InvalidArgumentException('이미지 크기를 확인할 수 없습니다.');
        }

        return ['width' => $width, 'height' => $height, 'mime' => $mime];
    }

    public function assertUpload(string $absolutePath, int $sizeBytes, string $originalName, string $clientMime): array
    {
        if ($sizeBytes < 1 || $sizeBytes > PromoImageSpec::MAX_BYTES) {
            throw new InvalidArgumentException('파일 용량은 4MB 이하여야 합니다.');
        }
        $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
        if (!in_array($ext, PromoImageSpec::ALLOWED_EXT, true)) {
            throw new InvalidArgumentException('JPG, PNG, WebP 파일만 올릴 수 있습니다.');
        }
        $info = $this->inspect($absolutePath);
        $mime = $info['mime'] !== '' ? $info['mime'] : $clientMime;
        if (!in_array($mime, PromoImageSpec::ALLOWED_MIME, true)) {
            throw new InvalidArgumentException('JPG, PNG, WebP 파일만 올릴 수 있습니다.');
        }
        if ($info['width'] < PromoImageSpec::MIN_WIDTH || $info['height'] < PromoImageSpec::MIN_HEIGHT) {
            throw new InvalidArgumentException(
                '최소 ' . PromoImageSpec::MIN_WIDTH . '×' . PromoImageSpec::MIN_HEIGHT . ' 픽셀 이상이어야 합니다.'
            );
        }

        return $info;
    }

    /**
     * 웹 폴더에 저장하기 전에 임시 파일만 검사한다.
     * 확장자는 읽어 낸 MIME으로 정한다. 사용자 파일 이름은 쓰지 않는다.
     *
     * @return array{width: int, height: int, mime: string, ext: string}
     */
    public function assertUploadTmp(string $tmp, int $sizeBytes): array
    {
        $onDisk = $tmp !== '' && is_file($tmp) ? @filesize($tmp) : false;
        if (
            $sizeBytes < 1
            || $sizeBytes > PromoImageSpec::MAX_BYTES
            || ($onDisk !== false && $onDisk > PromoImageSpec::MAX_BYTES)
        ) {
            throw new InvalidArgumentException('파일 용량은 4MB 이하여야 합니다.');
        }
        $info = $this->inspect($tmp);
        $mime = $info['mime'];
        $ext = match ($mime) {
            'image/jpeg', 'image/jpg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            default => '',
        };
        if ($ext === '' || !in_array($mime, PromoImageSpec::ALLOWED_MIME, true)) {
            throw new InvalidArgumentException('JPG, PNG, WebP 파일만 올릴 수 있습니다.');
        }
        $width = $info['width'];
        $height = $info['height'];
        if (
            max($width, $height) > 12000
            || ($width > 0 && $height > intdiv(40000000, $width))
        ) {
            throw new InvalidArgumentException('사진이 너무 커요. 더 작은 사진을 올려 주세요.');
        }
        if ($width < PromoImageSpec::MIN_WIDTH || $height < PromoImageSpec::MIN_HEIGHT) {
            throw new InvalidArgumentException(
                '최소 ' . PromoImageSpec::MIN_WIDTH . '×' . PromoImageSpec::MIN_HEIGHT . ' 픽셀 이상이어야 합니다.'
            );
        }

        return [
            'width' => $width,
            'height' => $height,
            'mime' => $mime === 'image/jpg' ? 'image/jpeg' : $mime,
            'ext' => $ext,
        ];
    }

    /**
     * @param array<string, string> $destAbsoluteByVariant  variant => path
     * @return array<string, string> variant => saved path
     */
    public function writeVariants(string $sourceAbsolute, float $cropX, float $cropY, array $destAbsoluteByVariant): array
    {
        $src = $this->load($sourceAbsolute);
        $sw = imagesx($src);
        $sh = imagesy($src);
        $cropX = max(0.0, min(1.0, $cropX));
        $cropY = max(0.0, min(1.0, $cropY));
        $saved = [];

        try {
            foreach ($destAbsoluteByVariant as $variant => $dest) {
                [$tw, $th] = PromoImageSpec::VARIANTS[$variant] ?? [0, 0];
                if ($tw < 1 || $th < 1) {
                    continue;
                }
                if (in_array($variant, PromoImageSpec::CONTAIN_VARIANTS, true)) {
                    $canvas = $this->containOnBlur($src, $tw, $th);
                } else {
                    [$sx, $sy, $cw, $ch] = $this->cropRect($sw, $sh, $cropX, $cropY, $tw, $th);
                    $canvas = imagecreatetruecolor($tw, $th);
                    if ($canvas === false) {
                        throw new RuntimeException('이미지 캔버스를 만들 수 없습니다.');
                    }
                    imagealphablending($canvas, false);
                    imagesavealpha($canvas, true);
                    imagecopyresampled($canvas, $src, 0, 0, $sx, $sy, $tw, $th, $cw, $ch);
                }
                $this->saveWebpOrJpeg($canvas, $dest);
                imagedestroy($canvas);
                $saved[$variant] = $dest;
            }
        } finally {
            imagedestroy($src);
        }

        return $saved;
    }

    /** @return \GdImage */
    private function load(string $path)
    {
        $raw = @file_get_contents($path);
        if ($raw === false || $raw === '') {
            throw new RuntimeException('원본 이미지를 읽지 못했습니다.');
        }
        $img = @imagecreatefromstring($raw);
        if ($img === false) {
            throw new InvalidArgumentException('지원하지 않는 이미지 형식입니다.');
        }

        return $this->applyExifOrientation($img, $path);
    }

    /** JPEG EXIF가 있으면 바로 세운다. 확장이 없거나 값이 깨져도 업로드는 계속한다. */
    private function applyExifOrientation($img, string $path)
    {
        if (!function_exists('exif_read_data')) {
            return $img;
        }
        $orientation = 1;
        try {
            $exif = @exif_read_data($path);
            if (is_array($exif)) {
                $orientation = (int) ($exif['Orientation'] ?? 1);
            }
        } catch (\Throwable) {
            return $img;
        }
        if ($orientation < 2 || $orientation > 8) {
            return $img;
        }
        $next = $this->orientGdImage($img, $orientation);
        if ($next === false) {
            return $img;
        }
        if ($next !== $img) {
            imagedestroy($img);
        }

        return $next;
    }

    /**
     * @param \GdImage $img
     * @return \GdImage|false
     */
    private function orientGdImage($img, int $orientation)
    {
        switch ($orientation) {
            case 2:
                imageflip($img, IMG_FLIP_HORIZONTAL);

                return $img;
            case 3:
                return imagerotate($img, 180, 0);
            case 4:
                imageflip($img, IMG_FLIP_VERTICAL);

                return $img;
            case 5:
                $rot = imagerotate($img, 90, 0);
                if ($rot === false) {
                    return false;
                }
                imageflip($rot, IMG_FLIP_HORIZONTAL);

                return $rot;
            case 6:
                return imagerotate($img, -90, 0);
            case 7:
                $rot = imagerotate($img, -90, 0);
                if ($rot === false) {
                    return false;
                }
                imageflip($rot, IMG_FLIP_HORIZONTAL);

                return $rot;
            case 8:
                return imagerotate($img, 90, 0);
            default:
                return $img;
        }
    }

    /**
     * @return array{0: int, 1: int, 2: int, 3: int} x, y, w, h
     */
    private function cropRect(int $w, int $h, float $fx, float $fy, int $tw, int $th): array
    {
        $target = $tw / $th;
        $src = $w / max(1, $h);
        if ($src > $target) {
            $cw = (int) round($h * $target);
            $ch = $h;
        } else {
            $cw = $w;
            $ch = (int) round($w / $target);
        }
        $cw = max(1, min($w, $cw));
        $ch = max(1, min($h, $ch));
        // 미리보기 object-position·cropResizeToCanvas 와 같음. 0.5는 가운데 식과 같다.
        $cx = (int) round(($w - $cw) * $fx);
        $cy = (int) round(($h - $ch) * $fy);
        $cx = max(0, min($w - $cw, $cx));
        $cy = max(0, min($h - $ch, $cy));

        return [$cx, $cy, $cw, $ch];
    }

    /**
     * 16:9 틀. 앞은 사진 전체(원본보다 키우지 않음), 빈 곳은 같은 사진을 흐리게.
     *
     * @param \GdImage $src
     * @return \GdImage
     */
    private function containOnBlur($src, int $tw, int $th)
    {
        $sw = max(1, imagesx($src));
        $sh = max(1, imagesy($src));
        $canvas = imagecreatetruecolor($tw, $th);
        if ($canvas === false) {
            throw new RuntimeException('이미지 캔버스를 만들 수 없습니다.');
        }
        $bw = max(8, intdiv($tw, 8));
        $bh = max(8, intdiv($th, 8));
        $blur = imagecreatetruecolor($bw, $bh);
        if ($blur === false) {
            imagedestroy($canvas);
            throw new RuntimeException('이미지 캔버스를 만들 수 없습니다.');
        }
        $cover = $bw / $bh;
        $srcRatio = $sw / $sh;
        if ($srcRatio > $cover) {
            $cropH = $sh;
            $cropW = max(1, min($sw, (int) round($sh * $cover)));
        } else {
            $cropW = $sw;
            $cropH = max(1, min($sh, (int) round($sw / $cover)));
        }
        $sx = intdiv($sw - $cropW, 2);
        $sy = intdiv($sh - $cropH, 2);
        imagecopyresampled($blur, $src, 0, 0, $sx, $sy, $bw, $bh, $cropW, $cropH);
        for ($i = 0; $i < 3; $i++) {
            @imagefilter($blur, IMG_FILTER_GAUSSIAN_BLUR);
        }
        imagecopyresampled($canvas, $blur, 0, 0, 0, 0, $tw, $th, $bw, $bh);
        imagedestroy($blur);

        $scale = min($tw / $sw, $th / $sh, 1.0);
        $fw = max(1, (int) round($sw * $scale));
        $fh = max(1, (int) round($sh * $scale));
        $fx = intdiv($tw - $fw, 2);
        $fy = intdiv($th - $fh, 2);
        imagealphablending($canvas, true);
        imagecopyresampled($canvas, $src, $fx, $fy, 0, 0, $fw, $fh, $sw, $sh);

        return $canvas;
    }

    /**
     * 긴 쪽이 $maxLongEdge 를 넘으면 그 길이로만 줄인다. 더 작은 사진은 키우지 않는다.
     * WebP 품질 $quality 로 저장하고, 결과가 $targetBytes 를 넘으면 품질을 낮춘다.
     * 호출한 쪽 원본 파일은 지우지 않는다.
     *
     * @return array{width: int, height: int, bytes: int, quality: int}
     */
    public function shrinkLongEdgeWebp(
        string $sourceAbsolute,
        string $destAbsolute,
        int $maxLongEdge = 1600,
        int $quality = 82,
        int $targetBytes = 1048576,
    ): array {
        if (!function_exists('imagewebp')) {
            throw new RuntimeException('사진을 WebP로 저장할 수 없어요.');
        }
        $this->inspect($sourceAbsolute);
        $src = $this->load($sourceAbsolute);
        $sw = imagesx($src);
        $sh = imagesy($src);
        $long = max($sw, $sh);
        $scale = ($maxLongEdge > 0 && $long > $maxLongEdge) ? ($maxLongEdge / $long) : 1.0;
        $tw = max(1, (int) round($sw * $scale));
        $th = max(1, (int) round($sh * $scale));

        $canvas = imagecreatetruecolor($tw, $th);
        if ($canvas === false) {
            imagedestroy($src);
            throw new RuntimeException('이미지 캔버스를 만들 수 없습니다.');
        }
        $white = imagecolorallocate($canvas, 255, 255, 255);
        imagefilledrectangle($canvas, 0, 0, $tw, $th, $white);
        imagecopyresampled($canvas, $src, 0, 0, 0, 0, $tw, $th, $sw, $sh);
        imagedestroy($src);

        $dir = dirname($destAbsolute);
        if (!is_dir($dir) && !mkdir($dir, 0775, true) && !is_dir($dir)) {
            imagedestroy($canvas);
            throw new RuntimeException('사진 저장 폴더를 만들 수 없습니다.');
        }

        $q = max(30, min(100, $quality));
        $floor = 30;
        $savedBytes = 0;
        do {
            if (!imagewebp($canvas, $destAbsolute, $q)) {
                imagedestroy($canvas);
                throw new RuntimeException('사진을 저장하지 못했어요.');
            }
            clearstatcache(true, $destAbsolute);
            $savedBytes = (int) (@filesize($destAbsolute) ?: 0);
            if ($savedBytes <= $targetBytes || $q <= $floor) {
                break;
            }
            $q = max($floor, $q - 10);
        } while (true);

        imagedestroy($canvas);

        return ['width' => $tw, 'height' => $th, 'bytes' => $savedBytes, 'quality' => $q];
    }

    /** @param \GdImage $canvas */
    private function saveWebpOrJpeg($canvas, string $dest): void
    {
        $dir = dirname($dest);
        if (!is_dir($dir) && !mkdir($dir, 0775, true) && !is_dir($dir)) {
            throw new RuntimeException('사진 저장 폴더를 만들 수 없습니다.');
        }
        if (function_exists('imagewebp') && str_ends_with(strtolower($dest), '.webp')) {
            $ok = imagewebp($canvas, $dest, 82);
            if ($ok) {
                return;
            }
        }
        $jpeg = preg_replace('/\.webp$/i', '.jpg', $dest) ?: ($dest . '.jpg');
        if (!imagejpeg($canvas, $jpeg, 86)) {
            throw new RuntimeException('파생 이미지를 저장하지 못했습니다.');
        }
        if ($jpeg !== $dest && is_file($dest)) {
            @unlink($dest);
        }
    }
}
