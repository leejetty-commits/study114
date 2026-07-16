<?php

declare(strict_types=1);

namespace Study114\Admin;

use PDO;

final class ContentConfigRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    /** @return list<array<string, mixed>> */
    public function listChannels(): array
    {
        $stmt = $this->pdo->query(
            'SELECT id, board_key, menu_label, board_type, preset_id, section_owner, route_slug,
                    visibility, download_policy, allowed_roles_json, allow_write, allow_comment,
                    allow_upload, require_review, is_gnu_separated, enabled, archived, sort_order,
                    created_at, updated_at, created_by, updated_by
             FROM board_channel_definitions
             ORDER BY sort_order ASC, board_key ASC'
        );

        return $stmt->fetchAll();
    }

    /** @return array<string, mixed>|null */
    public function findChannel(string $boardKey): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT id, board_key, menu_label, board_type, preset_id, section_owner, route_slug,
                    visibility, download_policy, allowed_roles_json, allow_write, allow_comment,
                    allow_upload, require_review, is_gnu_separated, enabled, archived, sort_order,
                    created_at, updated_at, created_by, updated_by
             FROM board_channel_definitions
             WHERE board_key = ?'
        );
        $stmt->execute([$boardKey]);
        $row = $stmt->fetch();

        return $row !== false ? $row : null;
    }

    /** @param array<string, mixed> $input @return array<string, mixed> */
    public function saveChannel(array $input, string $operatorId): array
    {
        $boardKey = trim((string) ($input['boardKey'] ?? $input['board_key'] ?? ''));
        $existing = $this->findChannel($boardKey);
        $allowedRoles = json_encode($input['allowedRoles'] ?? $input['allowed_roles'] ?? ['admin'], JSON_UNESCAPED_UNICODE);
        $enabled = ($input['status'] ?? 'active') !== 'hidden' && ($input['status'] ?? 'active') !== 'archived';
        $archived = ($input['status'] ?? 'active') === 'archived';

        if ($existing !== null) {
            $stmt = $this->pdo->prepare(
                'UPDATE board_channel_definitions
                 SET menu_label = ?, board_type = ?, preset_id = ?, section_owner = ?, route_slug = ?,
                     visibility = ?, download_policy = ?, allowed_roles_json = ?, allow_write = ?,
                     allow_comment = ?, allow_upload = ?, require_review = ?, is_gnu_separated = ?,
                     enabled = ?, archived = ?, updated_by = ?, updated_at = NOW()
                 WHERE board_key = ?'
            );
            $stmt->execute([
                (string) ($input['menuLabel'] ?? $input['menu_label'] ?? ''),
                (string) ($input['boardType'] ?? $input['board_type'] ?? ''),
                (string) ($input['presetId'] ?? $input['preset_id'] ?? ''),
                (string) ($input['sectionOwner'] ?? $input['section_owner'] ?? ''),
                (string) ($input['routeSlug'] ?? $input['route_slug'] ?? ''),
                (string) ($input['visibility'] ?? 'public'),
                (string) ($input['downloadPolicy'] ?? $input['download_policy'] ?? 'none'),
                $allowedRoles,
                !empty($input['allowWrite']) ? 1 : 0,
                !empty($input['allowComment']) ? 1 : 0,
                !empty($input['allowUpload']) ? 1 : 0,
                !empty($input['requireReview']) ? 1 : 0,
                ($input['isGnuSeparated'] ?? true) !== false ? 1 : 0,
                $enabled ? 1 : 0,
                $archived ? 1 : 0,
                $operatorId,
                $boardKey,
            ]);
        } else {
            $stmt = $this->pdo->prepare(
                'INSERT INTO board_channel_definitions
                 (board_key, menu_label, board_type, preset_id, section_owner, route_slug, visibility,
                  download_policy, allowed_roles_json, allow_write, allow_comment, allow_upload,
                  require_review, is_gnu_separated, enabled, archived, created_by, updated_by)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            );
            $stmt->execute([
                $boardKey,
                (string) ($input['menuLabel'] ?? $input['menu_label'] ?? ''),
                (string) ($input['boardType'] ?? $input['board_type'] ?? ''),
                (string) ($input['presetId'] ?? $input['preset_id'] ?? ''),
                (string) ($input['sectionOwner'] ?? $input['section_owner'] ?? ''),
                (string) ($input['routeSlug'] ?? $input['route_slug'] ?? ''),
                (string) ($input['visibility'] ?? 'public'),
                (string) ($input['downloadPolicy'] ?? $input['download_policy'] ?? 'none'),
                $allowedRoles,
                !empty($input['allowWrite']) ? 1 : 0,
                !empty($input['allowComment']) ? 1 : 0,
                !empty($input['allowUpload']) ? 1 : 0,
                !empty($input['requireReview']) ? 1 : 0,
                ($input['isGnuSeparated'] ?? true) !== false ? 1 : 0,
                $enabled ? 1 : 0,
                $archived ? 1 : 0,
                $operatorId,
                $operatorId,
            ]);
        }

        /** @var array<string, mixed> */
        return $this->findChannel($boardKey) ?? [];
    }

    /** @return list<array<string, mixed>> */
    public function listRightRails(): array
    {
        $stmt = $this->pdo->query(
            'SELECT id, slot_key, page_type, source_type, source_board_key, source_board_keys_json,
                    selection_mode, item_limit, section_title, cta_label, cta_target, mobile_behavior,
                    visibility_rule, role_target, enabled, status, priority, sort_order,
                    created_at, updated_at, created_by, updated_by
             FROM right_rail_slot_definitions
             ORDER BY priority ASC, slot_key ASC'
        );

        return $stmt->fetchAll();
    }

    /** @return array<string, mixed>|null */
    public function findRightRail(string $slotKey): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT id, slot_key, page_type, source_type, source_board_key, source_board_keys_json,
                    selection_mode, item_limit, section_title, cta_label, cta_target, mobile_behavior,
                    visibility_rule, role_target, enabled, status, priority, sort_order,
                    created_at, updated_at, created_by, updated_by
             FROM right_rail_slot_definitions
             WHERE slot_key = ?'
        );
        $stmt->execute([$slotKey]);
        $row = $stmt->fetch();

        return $row !== false ? $row : null;
    }

    /** @param array<string, mixed> $input @return array<string, mixed> */
    public function saveRightRail(array $input, string $operatorId): array
    {
        $slotKey = trim((string) ($input['slotKey'] ?? $input['slot_key'] ?? ''));
        $existing = $this->findRightRail($slotKey);
        $sourceBoardKeys = $input['sourceBoardKeys'] ?? $input['source_board_keys'] ?? [];
        $sourceBoardKeysJson = json_encode(is_array($sourceBoardKeys) ? $sourceBoardKeys : [], JSON_UNESCAPED_UNICODE);
        $enabled = ($input['status'] ?? 'active') === 'active' && ($input['enabled'] ?? true) !== false;

        if ($existing !== null) {
            $stmt = $this->pdo->prepare(
                'UPDATE right_rail_slot_definitions
                 SET page_type = ?, source_type = ?, source_board_key = ?, source_board_keys_json = ?,
                     selection_mode = ?, item_limit = ?, section_title = ?, cta_label = ?, cta_target = ?,
                     mobile_behavior = ?, visibility_rule = ?, role_target = ?, enabled = ?, status = ?,
                     priority = ?, updated_by = ?, updated_at = NOW()
                 WHERE slot_key = ?'
            );
            $stmt->execute([
                (string) ($input['pageType'] ?? $input['page_type'] ?? ''),
                (string) ($input['sourceType'] ?? $input['source_type'] ?? 'mixed'),
                (string) ($input['sourceBoardKey'] ?? $input['source_board_key'] ?? ''),
                $sourceBoardKeysJson,
                (string) ($input['selectionMode'] ?? $input['selection_mode'] ?? 'curated'),
                (int) ($input['itemLimit'] ?? $input['item_limit'] ?? 3),
                (string) ($input['sectionTitle'] ?? $input['section_title'] ?? ''),
                (string) ($input['ctaLabel'] ?? $input['cta_label'] ?? '바로가기'),
                (string) ($input['ctaTarget'] ?? $input['cta_target'] ?? '#/support'),
                (string) ($input['mobileBehavior'] ?? $input['mobile_behavior'] ?? 'stack'),
                (string) ($input['visibilityRule'] ?? $input['visibility_rule'] ?? 'public'),
                (string) ($input['roleTarget'] ?? $input['role_target'] ?? 'all'),
                $enabled ? 1 : 0,
                (string) ($input['status'] ?? 'active'),
                (int) ($input['priority'] ?? 50),
                $operatorId,
                $slotKey,
            ]);
        } else {
            $stmt = $this->pdo->prepare(
                'INSERT INTO right_rail_slot_definitions
                 (slot_key, page_type, source_type, source_board_key, source_board_keys_json, selection_mode,
                  item_limit, section_title, cta_label, cta_target, mobile_behavior, visibility_rule,
                  role_target, enabled, status, priority, created_by, updated_by)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            );
            $stmt->execute([
                $slotKey,
                (string) ($input['pageType'] ?? $input['page_type'] ?? ''),
                (string) ($input['sourceType'] ?? $input['source_type'] ?? 'mixed'),
                (string) ($input['sourceBoardKey'] ?? $input['source_board_key'] ?? ''),
                $sourceBoardKeysJson,
                (string) ($input['selectionMode'] ?? $input['selection_mode'] ?? 'curated'),
                (int) ($input['itemLimit'] ?? $input['item_limit'] ?? 3),
                (string) ($input['sectionTitle'] ?? $input['section_title'] ?? ''),
                (string) ($input['ctaLabel'] ?? $input['cta_label'] ?? '바로가기'),
                (string) ($input['ctaTarget'] ?? $input['cta_target'] ?? '#/support'),
                (string) ($input['mobileBehavior'] ?? $input['mobile_behavior'] ?? 'stack'),
                (string) ($input['visibilityRule'] ?? $input['visibility_rule'] ?? 'public'),
                (string) ($input['roleTarget'] ?? $input['role_target'] ?? 'all'),
                $enabled ? 1 : 0,
                (string) ($input['status'] ?? 'active'),
                (int) ($input['priority'] ?? 50),
                $operatorId,
                $operatorId,
            ]);
        }

        /** @var array<string, mixed> */
        return $this->findRightRail($slotKey) ?? [];
    }
}
