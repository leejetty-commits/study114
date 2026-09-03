<?php

declare(strict_types=1);

namespace Study114\Paid;

use InvalidArgumentException;

/**
 * 유료상품 카탈로그 SSOT (PR-A · 2026-09-04 잠금)
 *
 * 가격·기간·할인·무료 쪽지 혜택의 서버 정본.
 * 클라이언트가 보낸 금액·할인·무료혜택은 신뢰하지 않는다.
 */
final class PaidCatalog
{
    public const VERSION = '2026-09-04.1';

    /** @var list<string> */
    public const PERIODS = ['2주', '1개월', '2개월', '3개월', '6개월'];

    /** @var array<string, array{0: 'day'|'month', 1: int}> */
    public const PERIOD_DURATION = [
        '2주' => ['day', 14],
        '1개월' => ['month', 1],
        '2개월' => ['month', 2],
        '3개월' => ['month', 3],
        '6개월' => ['month', 6],
    ];

    /** 역할별 장기 할인율 (판매가 = 정상가 × (1 - rate)) */
    private const DISCOUNT_RATES = [
        'study_room' => [
            '2개월' => 0.10,
            '3개월' => 0.15,
            '6개월' => 0.20,
        ],
        'tutor' => [
            '2개월' => 0.05,
            '3개월' => 0.10,
            '6개월' => 0.15,
        ],
    ];

    /** 판매가 정본 — 역할 × SKU × 기간 */
    private const POSITION_SALE = [
        'study_room' => [
            'prime' => [30000, 50000, 90000, 127500, 240000],
            'pick' => [15000, 30000, 54000, 76500, 144000],
        ],
        'tutor' => [
            'prime' => [18000, 30000, 57000, 81000, 153000],
            'pick' => [10000, 20000, 38000, 54000, 102000],
        ],
    ];

    private const BADGE_SALE = [
        'study_room' => [2500, 5000, 9000, 12750, 24000],
        'tutor' => [5000, 10000, 19000, 27000, 51000],
    ];

    /** @var array<string, list<string>> */
    private const BADGES_BY_ROLE = [
        'study_room' => ['hot', 'subject_track'],
        'tutor' => ['hot', 'jjokjipge', 'sky'],
    ];

    /** 과외쌤 무료 쪽지 — 현금가치 없음 */
    private const TUTOR_MEMO_BUNDLE = [
        'prime' => [2, 5, 10, 15, 30],
        'pick' => [1, 2, 4, 6, 12],
    ];

    private const MEMO_TICKETS = [
        '1회' => [
            'option_id' => 'memo_1',
            'ticket_kind' => 'immediate',
            'credit_count' => 1,
            'list_price_krw' => 1000,
            'discount_rate' => 0.0,
            'discount_krw' => 0,
            'sale_price_krw' => 1000,
            'expire_days' => null,
            'balance_stored' => false,
            'label' => '1회 즉시권',
        ],
        '5회권' => [
            'option_id' => 'memo_5',
            'ticket_kind' => 'pack',
            'credit_count' => 5,
            'list_price_krw' => 5000,
            'discount_rate' => 0.10,
            'discount_krw' => 500,
            'sale_price_krw' => 4500,
            'expire_days' => 120,
            'balance_stored' => true,
            'label' => '5회권',
        ],
        '10회권' => [
            'option_id' => 'memo_10',
            'ticket_kind' => 'pack',
            'credit_count' => 10,
            'list_price_krw' => 10000,
            'discount_rate' => 0.20,
            'discount_krw' => 2000,
            'sale_price_krw' => 8000,
            'expire_days' => 120,
            'balance_stored' => true,
            'label' => '10회권',
        ],
    ];

    /** @var array<string, string> */
    private const PRODUCT_NAMES = [
        'prime' => 'Prime 노출',
        'pick' => 'Pick 노출',
        'hot' => 'Hot',
        'subject_track' => '단과',
        'jjokjipge' => '쪽집게',
        'sky' => 'SKY',
        'memo_ticket' => '쪽지권',
    ];

    public static function version(): string
    {
        return self::VERSION;
    }

    /** @return list<string> */
    public static function periods(): array
    {
        return self::PERIODS;
    }

    public static function isPeriod(string $period): bool
    {
        return isset(self::PERIOD_DURATION[$period]);
    }

    /**
     * @return array{duration_type: 'day'|'month', duration_value: int}
     */
    public static function periodDuration(string $period): array
    {
        if (!isset(self::PERIOD_DURATION[$period])) {
            throw new InvalidArgumentException('기간: 2주 · 1개월 · 2개월 · 3개월 · 6개월');
        }
        [$type, $value] = self::PERIOD_DURATION[$period];

        return ['duration_type' => $type, 'duration_value' => $value];
    }

    public static function periodFromDuration(string $durationType, int $durationValue): ?string
    {
        foreach (self::PERIOD_DURATION as $label => [$type, $value]) {
            if ($type === $durationType && $value === $durationValue) {
                return $label;
            }
        }

        return null;
    }

    /**
     * 공개 카탈로그 페이로드
     *
     * @return array<string, mixed>
     */
    public static function export(): array
    {
        $products = [];
        foreach (['study_room', 'tutor'] as $role) {
            foreach (['prime', 'pick'] as $sku) {
                $products[] = self::exportPositionProduct($role, $sku);
            }
            foreach (self::BADGES_BY_ROLE[$role] as $badge) {
                $products[] = self::exportBadgeProduct($role, $badge);
            }
        }
        $products[] = self::exportMemoProduct();

        return [
            'catalog_version' => self::VERSION,
            'locked_on' => '2026-09-04',
            'periods' => self::PERIODS,
            'discount_rates' => self::DISCOUNT_RATES,
            'memo_pack_expire_days' => 120,
            'products' => $products,
            'removed_skus' => [
                'memo_20',
                '20회권',
                'request_view',
                'new',
                'recommend',
            ],
        ];
    }

    /**
     * checkout 검증·금액 재계산. 클라이언트 금액은 무시한다.
     *
     * @param 'study_room'|'tutor'|null $providerType
     * @return array{
     *   catalog_version: string,
     *   product_id: string,
     *   product_kind: 'position'|'count'|'badge_addon',
     *   variant_label: string,
     *   provider_type: 'study_room'|'tutor'|null,
     *   list_price_krw: int,
     *   discount_rate: float,
     *   discount_krw: int,
     *   sale_price_krw: int,
     *   amount_won: int,
     *   memo_bundle: int,
     *   ticket_kind: string|null,
     *   credit_count: int|null,
     *   expire_days: int|null,
     *   balance_stored: bool|null,
     *   period_inherited: bool,
     *   price_snapshot: array<string, mixed>
     * }
     */
    public static function quote(string $productId, string $variant, ?string $providerType): array
    {
        $productId = self::normalizeProductId($productId);
        $variant = trim($variant);

        if ($productId === 'memo_ticket') {
            return self::quoteMemo($variant);
        }

        if (in_array($productId, ['prime', 'pick'], true)) {
            return self::quotePosition($productId, $variant, $providerType);
        }

        if (in_array($productId, ['hot', 'subject_track', 'jjokjipge', 'sky', 'picked'], true)) {
            return self::quoteBadge($productId, $variant, $providerType);
        }

        if ($productId === 'request_view' || $variant === '20회권' || str_contains($productId, '20')) {
            throw new InvalidArgumentException('판매가 종료되었거나 알 수 없는 상품입니다.');
        }

        throw new InvalidArgumentException('알 수 없는 상품입니다.');
    }

    public static function memoBundle(string $productId, string $period, ?string $providerType): int
    {
        if ($providerType !== 'tutor' || !in_array($productId, ['prime', 'pick'], true)) {
            return 0;
        }
        $idx = array_search($period, self::PERIODS, true);
        if ($idx === false) {
            return 0;
        }

        return (int) (self::TUTOR_MEMO_BUNDLE[$productId][$idx] ?? 0);
    }

    private static function normalizeProductId(string $productId): string
    {
        $id = trim($productId);
        if ($id === 'picked') {
            return 'jjokjipge';
        }

        return $id;
    }

    /**
     * @param 'study_room'|'tutor' $role
     * @return array<string, mixed>
     */
    private static function exportPositionProduct(string $role, string $sku): array
    {
        $options = [];
        foreach (self::PERIODS as $i => $period) {
            $priced = self::priceRow($role, (int) self::POSITION_SALE[$role][$sku][$i], $period);
            $options[] = [
                'option_id' => $sku . '_' . self::periodOptionSuffix($period),
                'period' => $period,
                'duration_type' => self::PERIOD_DURATION[$period][0],
                'duration_value' => self::PERIOD_DURATION[$period][1],
                'list_price_krw' => $priced['list_price_krw'],
                'discount_rate' => $priced['discount_rate'],
                'discount_krw' => $priced['discount_krw'],
                'sale_price_krw' => $priced['sale_price_krw'],
                'memo_bundle' => self::memoBundle($sku, $period, $role),
                'api_variant' => $period,
                'label' => $period,
            ];
        }

        return [
            'product_code' => $sku,
            'family' => 'position',
            'provider_type' => $role,
            'name' => self::PRODUCT_NAMES[$sku],
            'period_inherited' => false,
            'options' => $options,
        ];
    }

    /**
     * @param 'study_room'|'tutor' $role
     * @return array<string, mixed>
     */
    private static function exportBadgeProduct(string $role, string $badge): array
    {
        $options = [];
        foreach (self::PERIODS as $i => $period) {
            $priced = self::priceRow($role, (int) self::BADGE_SALE[$role][$i], $period);
            $options[] = [
                'option_id' => $badge . '_' . self::periodOptionSuffix($period),
                'period' => $period,
                'duration_type' => self::PERIOD_DURATION[$period][0],
                'duration_value' => self::PERIOD_DURATION[$period][1],
                'list_price_krw' => $priced['list_price_krw'],
                'discount_rate' => $priced['discount_rate'],
                'discount_krw' => $priced['discount_krw'],
                'sale_price_krw' => $priced['sale_price_krw'],
                'memo_bundle' => 0,
                'api_variant' => $period,
                'label' => $period,
            ];
        }

        return [
            'product_code' => $badge,
            'family' => 'badge_addon',
            'provider_type' => $role,
            'name' => self::PRODUCT_NAMES[$badge],
            'period_inherited' => true,
            'options' => $options,
        ];
    }

    /** @return array<string, mixed> */
    private static function exportMemoProduct(): array
    {
        $options = [];
        foreach (self::MEMO_TICKETS as $variant => $row) {
            $options[] = [
                'option_id' => $row['option_id'],
                'ticket_kind' => $row['ticket_kind'],
                'credit_count' => $row['credit_count'],
                'list_price_krw' => $row['list_price_krw'],
                'discount_rate' => $row['discount_rate'],
                'discount_krw' => $row['discount_krw'],
                'sale_price_krw' => $row['sale_price_krw'],
                'expire_days' => $row['expire_days'],
                'balance_stored' => $row['balance_stored'],
                'api_variant' => $variant,
                'label' => $row['label'],
            ];
        }

        return [
            'product_code' => 'memo_ticket',
            'family' => 'access',
            'provider_type' => 'both',
            'name' => self::PRODUCT_NAMES['memo_ticket'],
            'period_inherited' => false,
            'pack_expire_days' => 120,
            'options' => $options,
        ];
    }

    /**
     * @return array{
     *   catalog_version: string,
     *   product_id: string,
     *   product_kind: 'position'|'count'|'badge_addon',
     *   variant_label: string,
     *   provider_type: 'study_room'|'tutor'|null,
     *   list_price_krw: int,
     *   discount_rate: float,
     *   discount_krw: int,
     *   sale_price_krw: int,
     *   amount_won: int,
     *   memo_bundle: int,
     *   ticket_kind: string|null,
     *   credit_count: int|null,
     *   expire_days: int|null,
     *   balance_stored: bool|null,
     *   period_inherited: bool,
     *   price_snapshot: array<string, mixed>
     * }
     */
    private static function quotePosition(string $sku, string $period, ?string $providerType): array
    {
        $role = self::requireRole($providerType);
        if (!isset(self::POSITION_SALE[$role][$sku])) {
            throw new InvalidArgumentException('알 수 없는 노출상품입니다.');
        }
        if (!self::isPeriod($period)) {
            throw new InvalidArgumentException('기간: 2주 · 1개월 · 2개월 · 3개월 · 6개월');
        }
        $idx = (int) array_search($period, self::PERIODS, true);
        $sale = (int) self::POSITION_SALE[$role][$sku][$idx];
        $priced = self::priceRow($role, $sale, $period);
        $bundle = self::memoBundle($sku, $period, $role);

        return self::quotePayload(
            $sku,
            'position',
            $period,
            $role,
            $priced,
            $bundle,
            null,
            null,
            null,
            null,
            false,
        );
    }

    /**
     * 배지: 기간은 선택한 Prime/Pick 기간을 상속. variant = 기간 라벨.
     *
     * @return array<string, mixed>
     */
    private static function quoteBadge(string $badge, string $variant, ?string $providerType): array
    {
        $role = self::requireRole($providerType);
        $badge = self::normalizeProductId($badge);
        if (!in_array($badge, self::BADGES_BY_ROLE[$role], true)) {
            throw new InvalidArgumentException('해당 역할에서 판매하지 않는 배지입니다.');
        }
        $period = $variant;
        if ($period === '' || $period === '-' || $period === '포지션종속') {
            throw new InvalidArgumentException(
                '배지는 선택한 노출상품 기간을 상속합니다. variant(기간)가 필요합니다.',
            );
        }
        if (!self::isPeriod($period)) {
            throw new InvalidArgumentException('배지 기간: 2주 · 1개월 · 2개월 · 3개월 · 6개월');
        }
        $idx = (int) array_search($period, self::PERIODS, true);
        $sale = (int) self::BADGE_SALE[$role][$idx];
        $priced = self::priceRow($role, $sale, $period);

        return self::quotePayload(
            $badge,
            'badge_addon',
            $period,
            $role,
            $priced,
            0,
            null,
            null,
            null,
            null,
            true,
        );
    }

    /** @return array<string, mixed> */
    private static function quoteMemo(string $variant): array
    {
        // 구버전 별칭
        if ($variant === '5회') {
            $variant = '5회권';
        }
        if ($variant === '10회') {
            $variant = '10회권';
        }
        if ($variant === '20회' || $variant === '20회권') {
            throw new InvalidArgumentException('20회권은 판매가 종료되었습니다.');
        }
        if (!isset(self::MEMO_TICKETS[$variant])) {
            throw new InvalidArgumentException('variant: 1회 · 5회권 · 10회권');
        }
        $row = self::MEMO_TICKETS[$variant];
        $priced = [
            'list_price_krw' => $row['list_price_krw'],
            'discount_rate' => $row['discount_rate'],
            'discount_krw' => $row['discount_krw'],
            'sale_price_krw' => $row['sale_price_krw'],
        ];

        return self::quotePayload(
            'memo_ticket',
            'count',
            $variant,
            null,
            $priced,
            0,
            $row['ticket_kind'],
            $row['credit_count'],
            $row['expire_days'],
            $row['balance_stored'],
            false,
        );
    }

    /**
     * @param array{list_price_krw: int, discount_rate: float, discount_krw: int, sale_price_krw: int} $priced
     * @return array<string, mixed>
     */
    private static function quotePayload(
        string $productId,
        string $kind,
        string $variant,
        ?string $providerType,
        array $priced,
        int $memoBundle,
        ?string $ticketKind,
        ?int $creditCount,
        ?int $expireDays,
        ?bool $balanceStored,
        bool $periodInherited,
    ): array {
        $snapshot = [
            'catalog_version' => self::VERSION,
            'product_id' => $productId,
            'product_kind' => $kind,
            'variant_label' => $variant,
            'provider_type' => $providerType,
            'list_price_krw' => $priced['list_price_krw'],
            'discount_rate' => $priced['discount_rate'],
            'discount_krw' => $priced['discount_krw'],
            'sale_price_krw' => $priced['sale_price_krw'],
            'memo_bundle' => $memoBundle,
            'ticket_kind' => $ticketKind,
            'credit_count' => $creditCount,
            'expire_days' => $expireDays,
            'balance_stored' => $balanceStored,
            'period_inherited' => $periodInherited,
        ];

        return [
            'catalog_version' => self::VERSION,
            'product_id' => $productId,
            'product_kind' => $kind,
            'variant_label' => $variant,
            'provider_type' => $providerType,
            'list_price_krw' => $priced['list_price_krw'],
            'discount_rate' => $priced['discount_rate'],
            'discount_krw' => $priced['discount_krw'],
            'sale_price_krw' => $priced['sale_price_krw'],
            'amount_won' => $priced['sale_price_krw'],
            'memo_bundle' => $memoBundle,
            'ticket_kind' => $ticketKind,
            'credit_count' => $creditCount,
            'expire_days' => $expireDays,
            'balance_stored' => $balanceStored,
            'period_inherited' => $periodInherited,
            'price_snapshot' => $snapshot,
        ];
    }

    /**
     * @return array{list_price_krw: int, discount_rate: float, discount_krw: int, sale_price_krw: int}
     */
    private static function priceRow(string $role, int $salePrice, string $period): array
    {
        $rate = (float) (self::DISCOUNT_RATES[$role][$period] ?? 0.0);
        if ($rate > 0 && $rate < 1) {
            $list = (int) round($salePrice / (1 - $rate));
        } else {
            $list = $salePrice;
            $rate = 0.0;
        }
        $discount = max(0, $list - $salePrice);

        return [
            'list_price_krw' => $list,
            'discount_rate' => $rate,
            'discount_krw' => $discount,
            'sale_price_krw' => $salePrice,
        ];
    }

    private static function periodOptionSuffix(string $period): string
    {
        return match ($period) {
            '2주' => '14',
            '1개월' => '1m',
            '2개월' => '2m',
            '3개월' => '3m',
            '6개월' => '6m',
            default => $period,
        };
    }

    /** @return 'study_room'|'tutor' */
    private static function requireRole(?string $providerType): string
    {
        if ($providerType !== 'study_room' && $providerType !== 'tutor') {
            throw new InvalidArgumentException('provider_type은 study_room | tutor 만 허용합니다.');
        }

        return $providerType;
    }
}
