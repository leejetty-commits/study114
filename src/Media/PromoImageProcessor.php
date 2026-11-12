<?php

declare(strict_types=1);

namespace Study114\Media;

/** GD 기반 크롭·리사이즈·WebP 저장. Imagick 없이 닷홈 PHP에서도 동작. */
final class PromoImageProcessor
{
    public static function assertGdAvailable(): void
    {
        if (!extension_loaded('gd') || !function_exists('imagecreatefromstring') || !function_exists('imagecreatetruecolor')) {
            throw PromoImageException::gdMissing();
        }
    }

    /**
     * @return array{width: int, height: int, mime: string}
     */
    public function inspect(string $absolutePath): array
    {
        $info = @getimagesize($absolutePath);
        if ($info === false) {
            throw PromoImageException::badType('이미지를 읽을 수 없어요. JPG, PNG, WebP로 올려 주세요.');
        }
        $width = (int) ($info[0] ?? 0);
        $height = (int) ($info[1] ?? 0);
        $mime = (string) ($info['mime'] ?? '');
        if ($width < 1 || $height < 1) {
            throw PromoImageException::badType('이미지 크기를 확인할 수 없어요.');
        }

        return ['width' => $width, 'height' => $height, 'mime' => $mime];
    }

    public function assertUpload(string $absolutePath, int $sizeBytes, string $originalName, string $clientMime): array
    {
        if ($sizeBytes < 1 || $sizeBytes > PromoImageSpec::MAX_BYTES) {
            throw PromoImageException::tooLarge('파일이 너무 커요. 4MB 이하로 줄여 주세요.');
        }
        $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
        if (in_array($ext, ['heic', 'heif'], true)) {
            throw PromoImageException::badType('이 형식은 아직 지원하지 않아요. JPG나 PNG로 바꿔 올려 주세요.');
        }
        if (!in_array($ext, PromoImageSpec::ALLOWED_EXT, true)) {
            throw PromoImageException::badType('JPG, PNG, WebP 파일만 올릴 수 있어요.');
        }
        $info = $this->inspect($absolutePath);
        $mime = $info['mime'] !== '' ? $info['mime'] : $clientMime;
        if (!in_array($mime, PromoImageSpec::ALLOWED_MIME, true)) {
            throw PromoImageException::badType('JPG, PNG, WebP 파일만 올릴 수 있어요.');
        }
        // 작아도 거절하지 않음 — writeVariants / crop 경로에서 키운다.

        return $info;
    }

    /**
     * 웹 폴더에 저장하기 전에 임시 파일만 검사한다.
     * 확장자는 읽어 낸 MIME으로 정한다. 사용자 파일 이름은 쓰지 않는다.
     * 최소 픽셀 거절 없음 — 작으면 파생본 만들 때 비율 유지로 키운다.
     *
     * @return array{width: int, height: int, mime: string, ext: string, soft_small: bool}
     */
    public function assertUploadTmp(string $tmp, int $sizeBytes): array
    {
        self::assertGdAvailable();
        $onDisk = $tmp !== '' && is_file($tmp) ? @filesize($tmp) : false;
        if (
            $sizeBytes < 1
            || $sizeBytes > PromoImageSpec::MAX_BYTES
            || ($onDisk !== false && $onDisk > PromoImageSpec::MAX_BYTES)
        ) {
            throw PromoImageException::tooLarge('파일이 너무 커요. 4MB 이하로 줄여 주세요.');
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
            throw PromoImageException::badType('JPG, PNG, WebP 파일만 올릴 수 있어요.');
        }
        $width = $info['width'];
        $height = $info['height'];
        $pixels = $width * $height;
        if (
            max($width, $height) > PromoImageSpec::MAX_LONG_EDGE
            || $pixels > PromoImageSpec::MAX_PIXELS
        ) {
            throw PromoImageException::tooLarge('사진이 너무 커요. 더 작은 사진을 올려 주세요.');
        }
        $this->assertFitsMemoryBudget($width, $height);

        return [
            'width' => $width,
            'height' => $height,
            'mime' => $mime === 'image/jpg' ? 'image/jpeg' : $mime,
            'ext' => $ext,
            'soft_small' => $width < PromoImageSpec::MIN_WIDTH || $height < PromoImageSpec::MIN_HEIGHT,
        ];
    }

    /** GD truecolor ≈ 4바이트/픽셀 · 원본+캔버스+임시 ≈ 3배. memory_limit을 넘기면 too_large. */
    private function assertFitsMemoryBudget(int $width, int $height): void
    {
        $limit = self::memoryLimitBytes();
        if ($limit < 1) {
            return;
        }
        $estimate = $width * $height * 4 * 3;
        $headroom = max(8_388_608, (int) ($limit * 0.15));
        if ($estimate + memory_get_usage(true) + $headroom > $limit) {
            throw PromoImageException::tooLarge('사진이 너무 커요. 더 작은 사진을 올려 주세요.');
        }
    }

    private static function memoryLimitBytes(): int
    {
        $raw = trim((string) ini_get('memory_limit'));
        if ($raw === '' || $raw === '-1') {
            return 0;
        }
        $unit = strtolower(substr($raw, -1));
        $num = (float) $raw;
        return (int) match ($unit) {
            'g' => $num * 1024 * 1024 * 1024,
            'm' => $num * 1024 * 1024,
            'k' => $num * 1024,
            default => $num,
        };
    }

    /**
     * @param array<string, string> $destAbsoluteByVariant  variant => path
     * @return array<string, string> variant => saved path
     */
    public function writeVariants(string $sourceAbsolute, float $cropX, float $cropY, array $destAbsoluteByVariant): array
    {
        self::assertGdAvailable();
        $src = $this->load($sourceAbsolute);
        // 베이직 등 크롭용이면 목표 cover까지 키운다. 같은 $src를 프라임 contain에도 쓰므로 앞 사진이 원본보다 커질 수 있다.
        $src = $this->upscaleForCropVariants($src, $destAbsoluteByVariant);
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
                        throw PromoImageException::writeFailed('이미지 캔버스를 만들 수 없어요.');
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

    /**
     * 크롭 파생본(베이직 등)이 요청되면 원본을 목표 cover까지 비율 유지로 키운다.
     * 프라임+베이직을 같이 요청하면 키운 원본이 contain에도 들어가 앞 사진이 커질 수 있다.
     * 프라임 contain만 요청하면 여기서는 키우지 않는다.
     *
     * @param \GdImage $src
     * @param array<string, string> $destAbsoluteByVariant
     * @return \GdImage
     */
    private function upscaleForCropVariants($src, array $destAbsoluteByVariant)
    {
        $needW = 0;
        $needH = 0;
        foreach (array_keys($destAbsoluteByVariant) as $variant) {
            if (in_array($variant, PromoImageSpec::CONTAIN_VARIANTS, true)) {
                continue;
            }
            [$tw, $th] = PromoImageSpec::VARIANTS[$variant] ?? [0, 0];
            $needW = max($needW, $tw);
            $needH = max($needH, $th);
        }
        if ($needW < 1 || $needH < 1) {
            return $src;
        }
        $sw = max(1, imagesx($src));
        $sh = max(1, imagesy($src));
        // cover에 필요한 최소 원본: 목표 비율을 덮을 수 있을 만큼
        $target = $needW / $needH;
        $srcRatio = $sw / $sh;
        if ($srcRatio > $target) {
            $minH = $needH;
            $minW = (int) ceil($needH * $srcRatio);
        } else {
            $minW = $needW;
            $minH = (int) ceil($needW / max(0.0001, $srcRatio));
        }
        if ($sw >= $minW && $sh >= $minH) {
            return $src;
        }
        $scale = max($minW / $sw, $minH / $sh);
        $tw = max(1, (int) round($sw * $scale));
        $th = max(1, (int) round($sh * $scale));
        $canvas = imagecreatetruecolor($tw, $th);
        if ($canvas === false) {
            throw PromoImageException::writeFailed('이미지 캔버스를 만들 수 없어요.');
        }
        imagealphablending($canvas, false);
        imagesavealpha($canvas, true);
        imagecopyresampled($canvas, $src, 0, 0, 0, 0, $tw, $th, $sw, $sh);
        imagedestroy($src);

        return $canvas;
    }

    /** @return \GdImage */
    private function load(string $path)
    {
        self::assertGdAvailable();
        $raw = @file_get_contents($path);
        if ($raw === false || $raw === '') {
            throw PromoImageException::writeFailed('원본 사진을 읽지 못했어요.');
        }
        $img = @imagecreatefromstring($raw);
        if ($img === false) {
            throw PromoImageException::badType('지원하지 않는 사진 형식이에요. JPG, PNG, WebP로 올려 주세요.');
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
            throw PromoImageException::writeFailed('이미지 캔버스를 만들 수 없어요.');
        }
        $bw = max(8, intdiv($tw, 8));
        $bh = max(8, intdiv($th, 8));
        $blur = imagecreatetruecolor($bw, $bh);
        if ($blur === false) {
            imagedestroy($canvas);
            throw PromoImageException::writeFailed('이미지 캔버스를 만들 수 없어요.');
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
        self::assertGdAvailable();
        if (!function_exists('imagewebp')) {
            throw PromoImageException::gdMissing('사진을 WebP로 저장할 수 없어요.');
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
            throw PromoImageException::writeFailed('이미지 캔버스를 만들 수 없어요.');
        }
        $white = imagecolorallocate($canvas, 255, 255, 255);
        imagefilledrectangle($canvas, 0, 0, $tw, $th, $white);
        imagecopyresampled($canvas, $src, 0, 0, 0, 0, $tw, $th, $sw, $sh);
        imagedestroy($src);

        $dir = dirname($destAbsolute);
        if (!is_dir($dir) && !mkdir($dir, 0775, true) && !is_dir($dir)) {
            imagedestroy($canvas);
            throw PromoImageException::writeFailed('사진 저장 폴더를 만들 수 없어요.');
        }

        $q = max(30, min(100, $quality));
        $floor = 30;
        $savedBytes = 0;
        do {
            if (!imagewebp($canvas, $destAbsolute, $q)) {
                imagedestroy($canvas);
                throw PromoImageException::writeFailed('사진을 저장하지 못했어요.');
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
            throw PromoImageException::writeFailed('사진 저장 폴더를 만들 수 없어요.');
        }
        if (function_exists('imagewebp') && str_ends_with(strtolower($dest), '.webp')) {
            $ok = imagewebp($canvas, $dest, 82);
            if ($ok) {
                return;
            }
        }
        $jpeg = preg_replace('/\.webp$/i', '.jpg', $dest) ?: ($dest . '.jpg');
        if (!imagejpeg($canvas, $jpeg, 86)) {
            throw PromoImageException::writeFailed('파생 이미지를 저장하지 못했어요.');
        }
        if ($jpeg !== $dest && is_file($dest)) {
            @unlink($dest);
        }
    }
}
