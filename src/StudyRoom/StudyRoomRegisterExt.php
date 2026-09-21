<?php

declare(strict_types=1);

namespace Study114\StudyRoom;

/**
 * 공부방 등록 확장 착지점 (growth landing).
 *
 * StudyRoomRegisterService 는 공개 API 허브(getMasters / loadForUser / saveStep)로 유지하고,
 * 신규 저장·hydrate·스키마 헬퍼는 여기 또는 형제 *Writer / *Store 클래스에 둔다.
 *
 * 예: StudyRoomLessonDetailStore — 이미 분리된 수업 상세 저장소.
 *
 * 금지: Service 의 private 메서드를 한꺼번에 이관하는 대규모 리팩터.
 */
final class StudyRoomRegisterExt
{
    /** saveStep 허용 step — Service 와 SSOT */
    public const STEPS = [
        'basic',
        'basic_all',
        'location',
        'lesson',
        'career',
        'facility',
    ];
}
