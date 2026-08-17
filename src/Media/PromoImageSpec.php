<?php

declare(strict_types=1);

namespace Study114\Media;

final class PromoImageSpec
{
    public const MAX_BYTES = 4_194_304;
    public const MIN_WIDTH = 1200;
    public const MIN_HEIGHT = 900;
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
}
