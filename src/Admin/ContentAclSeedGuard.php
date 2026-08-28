<?php

declare(strict_types=1);

namespace Study114\Admin;

use Study114\Board\BoardChannelAcl;

/**
 * ACL 관련 channel/rail seed 안전 가드.
 * 운영자 임의 설정을 전량 UPDATE 하지 않고, 명시 키만 알려진 이전값 → 목표값으로 바꾼다.
 */
final class ContentAclSeedGuard
{
    /** @var list<string> */
    public const CHANNEL_KEYS = ['submission'];

    /** @var list<string> */
    public const RAIL_KEYS = ['home_right_rail', 'search_right_rail', 'detail_right_rail'];

    /**
     * @return array{
     *   channels: list<array<string, mixed>>,
     *   rails: list<array<string, mixed>>
     * }
     */
    public static function targets(): array
    {
        return [
            'channels' => [
                [
                    'board_key' => 'submission',
                    'fields' => [
                        'menu_label' => '신뢰·증빙자료 제출',
                        'visibility' => 'role',
                        'allowed_roles_json' => self::json(['tutor', 'admin']),
                    ],
                    'replaceable' => [
                        'allowed_roles_json' => [
                            self::json(['tutor', 'admin']),
                            self::json(['study_room', 'tutor', 'admin']),
                            self::json(['tutor', 'study_room', 'admin']),
                            self::json(['study_room', 'tutor']),
                            self::json(['tutor', 'study_room']),
                        ],
                    ],
                ],
            ],
            'rails' => [
                [
                    'slot_key' => 'home_right_rail',
                    'fields' => [
                        'source_board_keys_json' => self::json(['notice', 'concern-director', 'concern-tutor', 'concern-parent']),
                        'guest_filter' => 'intro_only',
                        'visibility_rule' => 'public',
                        'role_target' => 'all',
                        'mobile_behavior' => 'stack',
                    ],
                    'replaceable' => [
                        'guest_filter' => ['intro_only', 'summary_only', 'summary-only', 'summary'],
                        'source_board_keys_json' => [
                            self::json(['notice', 'concern-director', 'concern-tutor', 'concern-parent']),
                            self::json(['notice', 'concern-director', 'concern-tutor', 'concern-family']),
                        ],
                    ],
                ],
                [
                    'slot_key' => 'search_right_rail',
                    'fields' => [
                        'source_board_keys_json' => self::json(['faq', 'concern-parent', 'safe-guide']),
                        'guest_filter' => 'intro_only',
                        'visibility_rule' => 'public',
                        'role_target' => 'all',
                        'mobile_behavior' => 'stack',
                    ],
                    'replaceable' => [
                        'guest_filter' => ['intro_only', 'summary_only', 'summary-only', 'summary'],
                        'source_board_keys_json' => [
                            self::json(['faq', 'concern-parent', 'safe-guide']),
                            self::json(['faq', 'concern-family', 'safe-guide']),
                        ],
                    ],
                ],
                [
                    'slot_key' => 'detail_right_rail',
                    'fields' => [
                        'source_board_keys_json' => self::json(['safe-guide', 'notice']),
                        'guest_filter' => 'allow',
                        'visibility_rule' => 'public',
                        'role_target' => 'all',
                        'mobile_behavior' => 'collapse',
                    ],
                    'replaceable' => [
                        'source_board_keys_json' => [
                            self::json(['safe-guide', 'notice']),
                            self::json(['safe-guide', 'notice', 'submission']),
                            self::json(['notice', 'safe-guide', 'submission']),
                        ],
                    ],
                ],
            ],
        ];
    }

    /** @param list<string> $items */
    public static function json(array $items): string
    {
        return json_encode(array_values($items), JSON_UNESCAPED_UNICODE);
    }

    /**
     * @param array<string, mixed>|null $current
     * @param array<string, mixed> $spec
     * @return array{action: string, key: string, diffs: list<array<string, mixed>>, unexpected: list<string>, rollback_sql: string}
     */
    public static function planChannel(?array $current, array $spec): array
    {
        $key = (string) $spec['board_key'];
        if ($current === null) {
            return [
                'action' => 'insert_if_missing',
                'key' => $key,
                'diffs' => [],
                'unexpected' => [],
                'rollback_sql' => "-- {$key} 없음: INSERT 후 DELETE FROM board_channel_definitions WHERE board_key = '{$key}';",
            ];
        }

        return self::planFields('channel', $key, $current, $spec);
    }

    /**
     * @param array<string, mixed>|null $current
     * @param array<string, mixed> $spec
     * @return array{action: string, key: string, diffs: list<array<string, mixed>>, unexpected: list<string>, rollback_sql: string}
     */
    public static function planRail(?array $current, array $spec): array
    {
        $key = (string) $spec['slot_key'];
        if ($current === null) {
            return [
                'action' => 'insert_if_missing',
                'key' => $key,
                'diffs' => [],
                'unexpected' => [],
                'rollback_sql' => "-- {$key} 없음: INSERT 후 DELETE FROM right_rail_slot_definitions WHERE slot_key = '{$key}';",
            ];
        }

        return self::planFields('rail', $key, $current, $spec);
    }

    /**
     * @param array<string, mixed> $current
     * @param array<string, mixed> $spec
     * @return array{action: string, key: string, diffs: list<array<string, mixed>>, unexpected: list<string>, rollback_sql: string}
     */
    private static function planFields(string $kind, string $key, array $current, array $spec): array
    {
        $diffs = [];
        $unexpected = [];
        $rollback = [];
        /** @var array<string, mixed> $fields */
        $fields = $spec['fields'];
        /** @var array<string, list<string>> $replaceable */
        $replaceable = $spec['replaceable'] ?? [];

        foreach ($fields as $col => $target) {
            $rawCur = (string) ($current[$col] ?? '');
            $rawTgt = (string) $target;
            $cur = self::normalizeField($col, $rawCur);
            $tgt = self::normalizeField($col, $rawTgt);
            if ($cur === $tgt) {
                if ($col === 'guest_filter' && $rawCur !== '' && $rawCur !== $rawTgt && $tgt === 'intro_only') {
                    $diffs[] = ['field' => $col, 'before' => $rawCur, 'after' => $rawTgt, 'rewrite_alias' => true];
                    $rollback[] = sprintf("%s = %s", $col, self::sqlLiteral($rawCur));
                }
                continue;
            }
            $allowed = array_map(
                static fn (string $v): string => self::normalizeField($col, $v),
                $replaceable[$col] ?? [$tgt],
            );
            if (!in_array($cur, $allowed, true)) {
                $unexpected[] = "{$col}: current={$cur} target={$tgt}";
            }
            $diffs[] = ['field' => $col, 'before' => $cur, 'after' => $tgt];
            $rollback[] = sprintf("%s = %s", $col, self::sqlLiteral($rawCur));
        }

        $action = 'noop';
        if ($unexpected) {
            $action = 'abort_unexpected';
        } elseif ($diffs) {
            $action = 'update';
        }

        $table = $kind === 'channel' ? 'board_channel_definitions' : 'right_rail_slot_definitions';
        $idCol = $kind === 'channel' ? 'board_key' : 'slot_key';
        $sql = $rollback
            ? sprintf(
                "UPDATE %s SET %s, updated_at = NOW() WHERE %s = %s;",
                $table,
                implode(', ', $rollback),
                $idCol,
                self::sqlLiteral($key),
            )
            : "-- {$key}: 변경 없음";

        return [
            'action' => $action,
            'key' => $key,
            'diffs' => $diffs,
            'unexpected' => $unexpected,
            'rollback_sql' => $sql,
        ];
    }

    private static function normalizeField(string $col, string $value): string
    {
        if ($col === 'guest_filter') {
            $n = BoardChannelAcl::normalizeGuestFilter($value);

            return $n !== '' ? $n : $value;
        }
        if (str_ends_with($col, '_json')) {
            $decoded = json_decode($value, true);
            if (is_array($decoded)) {
                $decoded = array_values(array_map('strval', $decoded));
                if ($col === 'source_board_keys_json') {
                    $decoded = array_values(array_unique(array_map(
                        static fn (string $k): string => BoardChannelAcl::normalizeBoardKey($k),
                        $decoded,
                    )));
                }
                sort($decoded);

                return json_encode($decoded, JSON_UNESCAPED_UNICODE);
            }
        }

        return trim($value);
    }

    private static function sqlLiteral(string $value): string
    {
        return "'" . str_replace("'", "''", $value) . "'";
    }

    /** 운영 DB 없이 목표값·rollback 템플릿만 출력 */
    public static function staticPlan(): array
    {
        $targets = self::targets();
        $out = ['channels' => [], 'rails' => [], 'note' => 'DB 미연결 정적 목표값. 실제 current diff 는 dry-run API/로컬 PDO에서만 확인.'];
        foreach ($targets['channels'] as $spec) {
            $out['channels'][] = [
                'key' => $spec['board_key'],
                'target' => $spec['fields'],
                'replaceable' => $spec['replaceable'] ?? [],
            ];
        }
        foreach ($targets['rails'] as $spec) {
            $out['rails'][] = [
                'key' => $spec['slot_key'],
                'target' => $spec['fields'],
                'replaceable' => $spec['replaceable'] ?? [],
            ];
        }

        return $out;
    }

    /**
     * family+parent 동시 존재 시 자동 삭제·머지 금지. 운영 확인 전 abort.
     *
     * @param list<string> $railsWithFamily
     * @return array<string, mixed>
     */
    public static function planFamilyCollision(
        bool $hasFamilyChannel,
        bool $hasParentChannel,
        int $familyPosts,
        int $parentPosts,
        array $railsWithFamily,
    ): array {
        $base = [
            'key' => 'concern-family',
            'canonical' => 'concern-parent',
            'keep' => 'concern-parent',
            'family_action' => 'disable_do_not_delete',
            'posts' => ['concern-family' => $familyPosts, 'concern-parent' => $parentPosts],
            'rails_with_family' => $railsWithFamily,
            'next' => '정본은 concern-parent. family 행은 비활성만 검토하고 즉시 삭제하지 않음. 게시글 board_key 이전은 운영 확인 후.',
        ];
        if (!$hasFamilyChannel && $familyPosts === 0) {
            return ['action' => 'noop', ...$base];
        }
        if ($hasFamilyChannel || $familyPosts > 0) {
            return [
                'action' => 'abort_unexpected',
                'unexpected' => [
                    $hasFamilyChannel && $hasParentChannel
                        ? 'both_channel_rows'
                        : ($hasFamilyChannel ? 'family_channel_without_safe_rename' : 'family_posts_without_channel'),
                ],
                'diffs' => [],
                'rollback_sql' => '-- concern-family 자동 삭제/머지 없음. 운영 확인 후 수동 이전.',
                ...$base,
            ];
        }

        return ['action' => 'noop', ...$base];
    }
}
