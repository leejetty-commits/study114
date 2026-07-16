<?php

declare(strict_types=1);

namespace Study114\Admin;

use InvalidArgumentException;
use Study114\Database\Connection;

final class ContentConfigService
{
    private ContentConfigRepository $repo;
    private AdminOperationLogRepository $logs;

    public function __construct(
        ?ContentConfigRepository $repo = null,
        ?AdminOperationLogRepository $logs = null,
    ) {
        $pdo = Connection::get();
        $this->repo = $repo ?? new ContentConfigRepository($pdo);
        $this->logs = $logs ?? new AdminOperationLogRepository($pdo);
    }

    /** @return list<array<string, mixed>> */
    public function listChannels(): array
    {
        return array_map(fn (array $row) => $this->mapChannel($row), $this->repo->listChannels());
    }

    /** @param array<string, mixed> $input */
    public function saveChannel(array $input, string $operatorId): array
    {
        $boardKey = trim((string) ($input['boardKey'] ?? $input['board_key'] ?? ''));
        if ($boardKey === '') {
            throw new InvalidArgumentException('boardKey가 필요합니다.');
        }

        $existing = $this->repo->findChannel($boardKey);
        $row = $this->repo->saveChannel($input, $operatorId);
        $mapped = $this->mapChannel($row);

        $this->logs->insert(
            $operatorId,
            'board_channel',
            $boardKey,
            $existing === null ? 'channel_create' : 'channel_update',
            'board_channel_config',
            (string) ($mapped['menuLabel'] ?? '') . ' · ' . (string) ($mapped['status'] ?? ''),
            false,
            false,
        );

        return $mapped;
    }

    /** @return list<array<string, mixed>> */
    public function listRightRails(): array
    {
        return array_map(fn (array $row) => $this->mapRightRail($row), $this->repo->listRightRails());
    }

    /** @param array<string, mixed> $input */
    public function saveRightRail(array $input, string $operatorId): array
    {
        $slotKey = trim((string) ($input['slotKey'] ?? $input['slot_key'] ?? ''));
        if ($slotKey === '') {
            throw new InvalidArgumentException('slotKey가 필요합니다.');
        }

        $existing = $this->repo->findRightRail($slotKey);
        $row = $this->repo->saveRightRail($input, $operatorId);
        $mapped = $this->mapRightRail($row);

        $status = (string) ($mapped['status'] ?? 'active');
        $action = $existing === null
            ? 'slot_update'
            : ($status === 'active' ? 'slot_enable' : 'slot_disable');

        $this->logs->insert(
            $operatorId,
            'right_rail_slot',
            $slotKey,
            $action,
            'right_rail_config',
            (string) ($mapped['sectionTitle'] ?? '') . ' · ' . implode(', ', $mapped['sourceBoardKeys'] ?? []),
            false,
            false,
        );

        return $mapped;
    }

    /** @param array<string, mixed> $row @return array<string, mixed> */
    private function mapChannel(array $row): array
    {
        $allowed = json_decode((string) ($row['allowed_roles_json'] ?? '[]'), true);
        $archived = (bool) ($row['archived'] ?? false);
        $enabled = (bool) ($row['enabled'] ?? true);
        $status = $archived ? 'archived' : ($enabled ? 'active' : 'hidden');

        return [
            'boardKey' => (string) $row['board_key'],
            'menuLabel' => (string) $row['menu_label'],
            'boardType' => (string) $row['board_type'],
            'presetId' => (string) $row['preset_id'],
            'sectionOwner' => (string) $row['section_owner'],
            'routeSlug' => (string) $row['route_slug'],
            'visibility' => (string) $row['visibility'],
            'downloadPolicy' => (string) $row['download_policy'],
            'allowedRoles' => is_array($allowed) ? array_values(array_map('strval', $allowed)) : [],
            'allowWrite' => (bool) ($row['allow_write'] ?? false),
            'allowComment' => (bool) ($row['allow_comment'] ?? false),
            'allowUpload' => (bool) ($row['allow_upload'] ?? false),
            'requireReview' => (bool) ($row['require_review'] ?? false),
            'isGnuSeparated' => (bool) ($row['is_gnu_separated'] ?? true),
            'enabled' => $enabled,
            'status' => $status,
            'lastUpdatedAt' => substr((string) ($row['updated_at'] ?? ''), 0, 19),
            'source' => 'db',
        ];
    }

    /** @param array<string, mixed> $row @return array<string, mixed> */
    private function mapRightRail(array $row): array
    {
        $keys = json_decode((string) ($row['source_board_keys_json'] ?? '[]'), true);
        $keys = is_array($keys) ? array_values(array_map('strval', $keys)) : [];

        return [
            'slotKey' => (string) $row['slot_key'],
            'pageType' => (string) $row['page_type'],
            'enabled' => (bool) ($row['enabled'] ?? true),
            'sourceType' => (string) ($row['source_type'] ?? 'mixed'),
            'sourceBoardKey' => (string) ($row['source_board_key'] ?? ''),
            'sourceBoardKeys' => $keys,
            'selectionMode' => (string) ($row['selection_mode'] ?? 'curated'),
            'itemLimit' => (int) ($row['item_limit'] ?? 3),
            'sectionTitle' => (string) ($row['section_title'] ?? ''),
            'ctaLabel' => (string) ($row['cta_label'] ?? '바로가기'),
            'ctaTarget' => (string) ($row['cta_target'] ?? '#/support'),
            'visibilityRule' => (string) ($row['visibility_rule'] ?? 'public'),
            'roleTarget' => (string) ($row['role_target'] ?? 'all'),
            'mobileBehavior' => (string) ($row['mobile_behavior'] ?? 'stack'),
            'priority' => (int) ($row['priority'] ?? 50),
            'status' => (string) ($row['status'] ?? 'active'),
            'lastUpdatedAt' => substr((string) ($row['updated_at'] ?? ''), 0, 19),
            'source' => 'db',
        ];
    }
}
