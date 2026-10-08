<?php

declare(strict_types=1);

namespace Study114\StudyRoom;

use PDO;

/**
 * 공부방 기본등록 완료 = 홍보지역 1 있음 = 노출(published). 가입 게이트·검색과 같은 기준.
 * 회원이 노출 상태를 고르는 동작은 없고, 관리자 숨김(hidden)은 건드리지 않는다(정본 22).
 */
final class StudyRoomBasicExposure
{
    public static function syncProfileStatus(PDO $pdo, int $roomId): void
    {
        $stmt = $pdo->prepare(
            'SELECT 1 FROM study_room_regions
             WHERE study_room_id = ? AND slot = 1
               AND region_id IS NOT NULL AND region_id <> 0
             LIMIT 1'
        );
        $stmt->execute([$roomId]);
        $status = $stmt->fetchColumn() !== false ? 'published' : 'draft';

        $pdo->prepare(
            "UPDATE study_rooms SET profile_status = ?,
                published_at = CASE WHEN ? = 'published' THEN COALESCE(published_at, NOW()) ELSE published_at END
             WHERE id = ? AND profile_status <> 'hidden'"
        )->execute([$status, $status, $roomId]);
    }
}
