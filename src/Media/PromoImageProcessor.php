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
                [$sx, $sy, $cw, $ch] = $this->cropRect($sw, $sh, $cropX, $cropY, $tw, $th);
                $canvas = imagecreatetruecolor($tw, $th);
                if ($canvas === false) {
                    throw new RuntimeException('이미지 캔버스를 만들 수 없습니다.');
                }
                imagealphablending($canvas, false);
                imagesavealpha($canvas, true);
                imagecopyresampled($canvas, $src, 0, 0, $sx, $sy, $tw, $th, $cw, $ch);
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

        return $img;
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
        $cx = (int) round($fx * $w - $cw / 2);
        $cy = (int) round($fy * $h - $ch / 2);
        $cx = max(0, min($w - $cw, $cx));
        $cy = max(0, min($h - $ch, $cy));

        return [$cx, $cy, $cw, $ch];
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
