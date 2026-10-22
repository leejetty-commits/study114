<?php

declare(strict_types=1);

namespace Study114\Media;

final class PromoImageSpec
{
    public const MAX_BYTES = 4_194_304;
    public const MIN_WIDTH = 800;
    public const MIN_HEIGHT = 600;
    public const MAX_COUNT = 5;
    public const CROP_ONCE = true;

    /** @var list<string> */
    public const ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'webp'];

    /** @var list<string> */
    public const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

    /** @var array<string, array{0: int, 1: int}> */
    public const VARIANTS = [
        'prime_1280' => [1280, 720],
        'prime_1600' => [1600, 900],
        'basic_360'  => [360, 360],
        'basic_720'  => [720, 720],
    ];

    /** @var array<string, string> */
    public const VARIANT_ASPECT = [
        'prime_1280' => '16:9',
        'prime_1600' => '16:9',
        'basic_360'  => '1:1',
        'basic_720'  => '1:1',
    ];

    /** 자르지 않은 긴 변 파일. VARIANTS에 넣지 않는다. */
    public const FIT_KEY = 'fit_1280';
    public const FIT_LONG_EDGE = 1280;
    public const FIT_TARGET_BYTES = 409600;

    /**
     * 같은 토큰의 파생 경로를 fit_1280.webp 경로로 바꾼다.
     * _orig 나 이미 fit 인 경로는 빈 문자열.
     */
    public static function fitPathFor(string $variantPath): string
    {
        $path = str_replace('\\', '/', trim($variantPath));
        if ($path === '') {
            return '';
        }
        if (!preg_match('/_(?:prime_1600|prime_1280|basic_720|basic_360)\.[A-Za-z0-9]+$/', $path)) {
            return '';
        }
        $next = preg_replace(
            '/_(?:prime_1600|prime_1280|basic_720|basic_360)\.[A-Za-z0-9]+$/',
            '_fit_1280.webp',
            $path,
            1,
        );

        return is_string($next) ? $next : '';
    }

    public static function publicRoot(): string
    {
        $doc = (string) ($_SERVER['DOCUMENT_ROOT'] ?? '');
        if ($doc !== '' && is_dir($doc)) {
            return rtrim(str_replace('\\', '/', $doc), '/');
        }

        return dirname(__DIR__, 2) . '/public';
    }

    /** 파일이 있을 때만 공개 경로. 없으면 빈 문자열. */
    public static function existingFitUrl(string $variantPath, ?string $publicRoot = null): string
    {
        $url = self::fitPathFor($variantPath);
        if ($url === '') {
            return '';
        }
        $rel = ltrim($url, '/');
        if ($rel === '' || str_contains($rel, '..')) {
            return '';
        }
        $root = rtrim(str_replace('\\', '/', $publicRoot ?? self::publicRoot()), '/');
        if (!is_file($root . '/' . $rel)) {
            return '';
        }

        return str_starts_with($url, '/') ? $url : '/' . $rel;
    }
}
