<?php

declare(strict_types=1);

namespace Study114\Auth;

use InvalidArgumentException;
use PDO;
use PDOException;
use RuntimeException;
use Study114\Database\Connection;
use Study114\Region\ComplexEnsure;
use Study114\Region\RegionEnsure;
use Study114\Region\SidoRegionEnsure;
use Study114\Region\TutorRegionUnit;
use Study114\Registration\StudentBasicCompleteness;
use Study114\Registration\StudentHubRepository;
use Study114\Tutor\TutorBasicFields;

final class BasicRegisterService
{
    /**
     * @param array<string, mixed> $input
     * @return array{kind: string, id: int}
     */
    public function register(int $userId, string $roleUi, array $input): array
    {
        return match ($roleUi) {
            'student'    => ['kind' => 'student', 'id' => $this->registerStudent($userId, $input)],
            'study_room' => ['kind' => 'study_room', 'id' => $this->registerStudyRoom($userId, $input)],
            'tutor'      => ['kind' => 'tutor', 'id' => $this->registerTutor($userId, $input)],
            default      => throw new InvalidArgumentException('role: 지원하지 않는 역할입니다.'),
        };
    }

    /**
     * 기본등록 미완료 여부.
     * tutor 는 행이 있고 TutorBasicFields 필수 항목(과외지역 1·프로필 사진 포함)이 모두 있을 때만 완료.
     * study_room_owner 는 행이 있고 홍보지역 1(study_room_regions.slot=1)이 있을 때만 완료.
     * guardian_student 는 기존 학생 기본정보 판정.
     */
    public function needsBasicRegister(int $userId, string $roleType): bool
    {
        if ($userId < 1) {
            return false;
        }
        $pdo = Connection::get();
        return match ($roleType) {
            'tutor' => !$this->tutorAccountBasicComplete($pdo, $userId),
            'study_room_owner' => !$this->studyRoomAccountHasPromoSlot1($pdo, $userId),
            'guardian_student' => $this->studentNeedsBasicInfo($pdo, $userId),
            default => false,
        };
    }

    private function tutorAccountBasicComplete(PDO $pdo, int $userId): bool
    {
        $stmt = $pdo->prepare('SELECT id FROM tutors WHERE user_id = ? ORDER BY id ASC LIMIT 1');
        $stmt->execute([$userId]);
        $tutorId = $stmt->fetchColumn();
        if ($tutorId === false) {
            return false;
        }

        return TutorBasicFields::missingForTutor($pdo, (int) $tutorId) === [];
    }

    private function studyRoomAccountHasPromoSlot1(PDO $pdo, int $userId): bool
    {
        $alive = $this->columnExists($pdo, 'study_rooms', 'deleted_at')
            ? 'sr.deleted_at IS NULL'
            : '1 = 1';

        return $this->existsRow(
            $pdo,
            'SELECT 1 FROM study_rooms sr
             WHERE sr.user_id = ? AND ' . $alive . '
               AND EXISTS (
                 SELECT 1 FROM study_room_regions srr
                 WHERE srr.study_room_id = sr.id
                   AND srr.slot = 1
                   AND srr.region_id IS NOT NULL
                   AND srr.region_id <> 0
               )
             LIMIT 1',
            [$userId]
        );
    }

    private function studyRoomRowHasPromoSlot1(PDO $pdo, int $roomId): bool
    {
        return $this->existsRow(
            $pdo,
            'SELECT 1 FROM study_room_regions
             WHERE study_room_id = ? AND slot = 1
               AND region_id IS NOT NULL AND region_id <> 0
             LIMIT 1',
            [$roomId]
        );
    }

    /**
     * 학생은 행이 없거나, 행이 draft 이면서 기본정보가 비어 있으면 기본정보부터 다시 채운다.
     * hidden(관리자 조치)은 되돌려 보내지 않는다.
     */
    private function studentNeedsBasicInfo(PDO $pdo, int $userId): bool
    {
        if (!$this->existsRow(
            $pdo,
            'SELECT 1 FROM students WHERE guardian_user_id = ? AND deleted_at IS NULL LIMIT 1',
            [$userId]
        )) {
            return true;
        }
        $student = (new StudentHubRepository($pdo))->findFirstForGuardian($userId);
        if ($student === null) {
            return true;
        }

        return ($student['exposure_status'] ?? '') === 'draft'
            && !StudentBasicCompleteness::isComplete($student);
    }

    /** @param list<mixed> $params */
    private function existsRow(PDO $pdo, string $sql, array $params): bool
    {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchColumn() !== false;
    }

    /** 같은 계정의 동시 기본등록을 한 줄로 직렬화. 스키마 변경 없음. */
    private function lockUserRow(PDO $pdo, int $userId): void
    {
        $stmt = $pdo->prepare('SELECT id FROM users WHERE id = ? FOR UPDATE');
        $stmt->execute([$userId]);
    }

    /**
     * 이미 있으면 그 id. 두 번째 INSERT는 하지 않는다.
     */
    private function lockedExistingId(PDO $pdo, int $userId, string $sql): ?int
    {
        $this->lockUserRow($pdo, $userId);
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$userId]);
        $id = $stmt->fetchColumn();
        if ($id === false) {
            return null;
        }
        return (int) $id;
    }

    /** @return list<array{id: int, label: string}> */
    public function listRegions(): array
    {
        $pdo = Connection::get();
        SidoRegionEnsure::ensure($pdo);
        $stmt = $pdo->query(
            'SELECT id, sido_name, sigungu_name, dong_name,
                    CONCAT(sido_name, " ", sigungu_name, " ", dong_name) AS label
             FROM regions
             WHERE is_active = 1 AND unit_level = \'dong\' AND dong_name <> \'시 대표\'
             ORDER BY id ASC'
        );
        /** @var list<array{id: int, label: string}> $rows */
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return $rows;
    }

    /**
     * @return list<array{
     *   id: int,
     *   label: string,
     *   sido_code: string,
     *   sido_name: string,
     *   official_code: string,
     *   city_name: string,
     *   gu_name: ?string,
     *   kind: string
     * }>
     */
    public function listCities(): array
    {
        return SidoRegionEnsure::ensureAndListCities(Connection::get());
    }

    /**
     * 과외 단위(광역시 / 도의 시·군). 과외쌤 과외지역·학생 과외 희망지역 선택 목록.
     *
     * @return list<array{id: int, label: string, sido_code: string, sido_name: string, unit_name: string, kind: string, official_code: string}>
     */
    public function listTutorUnits(): array
    {
        return TutorRegionUnit::listUnits(Connection::get());
    }

    /**
     * 아파트단지 마스터 — 주소 포함 (건물 동 단위 아님)
     *
     * @return list<array{id: int, region_id: int, label: string, address: string}>
     */
    public function listComplexes(): array
    {
        $pdo = Connection::get();
        $stmt = $pdo->query(
            'SELECT id, region_id, name AS label, COALESCE(address, "") AS address
             FROM complexes WHERE is_active = 1 ORDER BY region_id ASC, id ASC'
        );
        /** @var list<array{id: int|string, region_id: int|string, label: string, address: string}> $rows */
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $out = [];
        foreach ($rows as $row) {
            $out[] = [
                'id' => (int) $row['id'],
                'region_id' => (int) $row['region_id'],
                'label' => (string) $row['label'],
                'address' => (string) $row['address'],
            ];
        }
        return $out;
    }

    /**
     * 학생 기본정보 저장. 여덟 칸(StudentBasicCompleteness)이 차면 같은 트랜잭션에서 바로 노출(published),
     * 아니면 draft 로 남긴다. 기존 draft 행이 있으면 이번 입력으로 다시 쓴다(이어쓰기 없음).
     *
     * @param array<string, mixed> $input
     */
    private function registerStudent(int $userId, array $input): int
    {
        $preferredLessonType = $this->requireEnum($input, 'preferred_lesson_type', ['tutor', 'study_room']);

        // 표시명은 기본정보 필수 칸이다. 비어 있으면 기본값으로 채우지 않는다.
        $publicName = $this->optionalBoundedString($input, 'public_display_name', 40);
        $studentName = $this->optionalBoundedString($input, 'student_name', 50) ?? $publicName ?? '학생';

        $studyroomRegionId = null;
        $studyroomComplexId = null;
        $studyroomBasis = null;
        $tutorRegionId = null;

        if ($preferredLessonType === 'study_room') {
            $studyroomBasis = $this->requireEnum($input, 'region_basis', ['dong', 'complex']);
            if ($studyroomBasis === 'dong') {
                $studyroomRegionId = $this->requireExplicitRegionId($input);
                $studyroomComplexId = null;
            } elseif (isset($input['complex_id']) && (string) $input['complex_id'] !== '') {
                $studyroomComplexId = $this->requireComplexId($input);
                $studyroomRegionId = $this->regionIdForComplex($studyroomComplexId);
            } else {
                // 가입 화면은 주소 검색 결과(행정동 region_id + 단지 이름)만 보낸다. 단지 행은 이름으로 찾거나 만든다.
                $studyroomRegionId = $this->requireExplicitRegionId($input);
                $studyroomComplexId = $this->resolveStudyRoomComplexId(Connection::get(), $input, $studyroomRegionId, '');
                if ($studyroomComplexId === null) {
                    throw new InvalidArgumentException('complex_id: 아파트단지를 선택해 주세요.');
                }
            }
        } else {
            // 과외쌤 찾기 — 과외 단위(광역시 / 도의 시·군) region_id 필수 (가입 기본주소 폴백 금지)
            $tutorRegionId = $this->requireExplicitRegionId($input);
            TutorRegionUnit::assertUnit(Connection::get(), $tutorRegionId);
        }

        $gradeLevel = $this->optionalBoundedString($input, 'grade_level', 20);
        $schoolLevel = $this->optionalEnum($input, 'school_level', [
            'preschool', 'elementary', 'middle', 'high', 'n_su', 'general', 'other',
        ]);
        $subjects = $this->optionalSubjectNames($input);
        if ($subjects !== [] && $schoolLevel === null) {
            $schoolLevel = $this->schoolLevelFromGradeText($gradeLevel);
        }
        if ($subjects !== [] && $schoolLevel === null) {
            throw new InvalidArgumentException('school_level: 학교급을 선택해 주세요.');
        }
        $lessonFormat = $this->optionalEnum($input, 'lesson_format', ['one_on_one', 'group']);
        $countGroup = $this->optionalEnum($input, 'preferred_student_count_group', ['solo', 'two', 'three', 'four_plus']);
        if ($lessonFormat === 'one_on_one') {
            $countGroup = 'solo';
        }
        $tutorFee = null;
        $studyroomFee = null;
        if ($preferredLessonType === 'tutor') {
            $tutorFee = $this->cheonwonInputToWon($this->optionalUnsignedInt($input, 'preferred_fee_amount'));
        } else {
            $studyroomFee = $this->cheonwonInputToWon($this->optionalUnsignedInt($input, 'preferred_studyroom_fee_amount'));
        }
        $requestSummary = $this->optionalBoundedString($input, 'request_summary', 200);

        $complete = StudentBasicCompleteness::isComplete([
            'public_display_name'            => $publicName,
            'grade_level'                    => $gradeLevel,
            'school_level'                   => $subjects !== [] ? $schoolLevel : null,
            'preferred_lesson_type'          => $preferredLessonType,
            'preferred_studyroom_region_basis' => $studyroomBasis,
            'preferred_studyroom_region_id'  => $studyroomRegionId,
            'preferred_studyroom_complex_id' => $studyroomComplexId,
            'preferred_tutor_region_id'      => $tutorRegionId,
            'subject_label'                  => $subjects[0] ?? '',
            'lesson_format'                  => $lessonFormat,
            'preferred_student_count_group'  => $countGroup,
            'preferred_fee_amount'           => $tutorFee,
            'preferred_studyroom_fee_amount' => $studyroomFee,
        ]);
        $exposureStatus = $complete ? 'published' : 'draft';
        $publishedAt = $complete ? date('Y-m-d H:i:s') : null;

        $basicValues = [
            'student_name'                   => $studentName,
            'public_display_name'            => $publicName,
            'grade_level'                    => $gradeLevel,
            'preferred_lesson_type'          => $preferredLessonType,
            'preferred_studyroom_region_id'  => $studyroomRegionId,
            'preferred_studyroom_complex_id' => $studyroomComplexId,
            'preferred_tutor_region_id'      => $tutorRegionId,
            'preferred_student_count_group'  => $countGroup,
            'preferred_fee_amount'           => $tutorFee,
            'preferred_studyroom_fee_amount' => $studyroomFee,
            'lesson_format'                  => $lessonFormat,
            'request_summary'                => $requestSummary,
        ];

        $pdo = Connection::get();
        $pdo->beginTransaction();
        try {
            if ($this->columnExists($pdo, 'students', 'preferred_studyroom_region_basis')) {
                $basicValues['preferred_studyroom_region_basis'] = $studyroomBasis;
            }
            $existingStudentId = $this->lockedExistingId(
                $pdo,
                $userId,
                'SELECT id FROM students WHERE guardian_user_id = ? AND deleted_at IS NULL ORDER BY id ASC LIMIT 1'
            );
            if ($existingStudentId !== null) {
                $statusStmt = $pdo->prepare('SELECT exposure_status FROM students WHERE id = ? FOR UPDATE');
                $statusStmt->execute([$existingStudentId]);
                // published·hidden 행은 기본정보 화면에서 다시 쓰지 않는다(수정은 마이페이지).
                if ((string) $statusStmt->fetchColumn() !== 'draft') {
                    $pdo->commit();
                    return $existingStudentId;
                }
                $sets = [];
                $params = [];
                foreach ($basicValues as $col => $value) {
                    $sets[] = "{$col} = ?";
                    $params[] = $value;
                }
                $params[] = $exposureStatus;
                $params[] = $publishedAt;
                $params[] = $existingStudentId;
                $pdo->prepare(
                    'UPDATE students SET ' . implode(', ', $sets) . ',
                        exposure_status = ?, published_at = COALESCE(?, published_at), updated_at = NOW()
                     WHERE id = ? AND exposure_status = \'draft\''
                )->execute($params);
                $pdo->prepare('DELETE FROM student_subject_targets WHERE student_id = ?')->execute([$existingStudentId]);
                if ($subjects !== [] && $schoolLevel !== null) {
                    $this->insertStudentSubjects($pdo, $existingStudentId, $subjects, $schoolLevel);
                }
                $pdo->commit();
                return $existingStudentId;
            }

            $insertValues = ['guardian_user_id' => $userId] + $basicValues + [
                'request_summary_visibility' => 'private',
                'exposure_status'            => $exposureStatus,
                'published_at'               => $publishedAt,
            ];
            $pdo->prepare(
                'INSERT INTO students (' . implode(', ', array_keys($insertValues)) . ')
                 VALUES (' . implode(', ', array_fill(0, count($insertValues), '?')) . ')'
            )->execute(array_values($insertValues));
            $studentId = (int) $pdo->lastInsertId();
            if ($subjects !== [] && $schoolLevel !== null) {
                $this->insertStudentSubjects($pdo, $studentId, $subjects, $schoolLevel);
            }

            $pdo->commit();
        } catch (\Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            if ($e instanceof PDOException) {
                throw new RuntimeException('학생 기본등록 저장 실패: ' . $e->getMessage(), 0, $e);
            }
            throw $e;
        }

        return $studentId;
    }

    /**
     * 기본등록: 교습형태 · 이름 · 주대상 · 주력과목 · 원장성별 · 슬로건 · 집주소 · 사업장주소 · 홍보 1곳 (필수).
     * 홍보 2·3은 선택. 주소는 검색 결과이며 단지 시드가 없어도 저장한다.
     *
     * @param array<string, mixed> $input
     */
    private function registerStudyRoom(int $userId, array $input): int
    {
        $name = $this->requireString($input, 'study_room_name');
        $mainSubject = $this->resolveMainSubjectNote($input);
        $lessonPlace = $this->requireEnum($input, 'lesson_place_type', ['academy', 'study_room']);
        $slogan = $this->requireString($input, 'slogan');
        ProfileGenderSync::sync($userId, $input);

        $home = trim((string) ($input['home_address'] ?? ''));
        if ($home === '') {
            throw new InvalidArgumentException('집주소를 검색해 주세요.');
        }
        $addressText = trim((string) ($input['address_text'] ?? ''));
        if ($addressText === '') {
            throw new InvalidArgumentException('사업장주소를 검색해 주세요.');
        }
        $regionId = $this->resolveStudyRoomRegionId($input);
        $basis = $this->optionalEnum($input, 'region_basis_type', ['dong', 'complex'])
            ?? $this->optionalEnum($input, 'region_basis', ['dong', 'complex'])
            ?? 'dong';

        $pdo = Connection::get();
        $complexId = $this->resolveStudyRoomComplexId($pdo, $input, $regionId, $addressText);
        if ($basis === 'complex' && ($complexId === null || $complexId <= 0)) {
            $basis = 'dong';
        }
        if ($basis !== 'complex') {
            $complexId = null;
            $basis = 'dong';
        }

        $slots = $this->normalizeSignupPromoSlots($pdo, $input, $regionId, $complexId, $basis);
        $homeZip = $this->optionalString($input, 'home_address_zip');
        $homeLine2 = $this->optionalString($input, 'home_address_line2');
        try {
            $pdo->prepare(
                'UPDATE user_profiles SET address_line1 = ?, address_zip = ?, address_line2 = ? WHERE user_id = ?'
            )->execute([$home, $homeZip, $homeLine2, $userId]);
        } catch (PDOException $e) {
            $pdo->prepare(
                'UPDATE user_profiles SET address_line1 = ?, address_zip = ? WHERE user_id = ?'
            )->execute([$home, $homeZip, $userId]);
        }

        $this->ensurePrimaryAudienceTable($pdo);
        $pdo->beginTransaction();
        try {
            $existStmt = $pdo->prepare(
                'SELECT id FROM study_rooms WHERE user_id = ? AND deleted_at IS NULL ORDER BY id ASC LIMIT 1'
            );
            $this->lockUserRow($pdo, $userId);
            $existStmt->execute([$userId]);
            $existingId = $existStmt->fetchColumn();
            $hasBasisCol = $this->columnExists($pdo, 'study_rooms', 'region_basis_type');
            if ($existingId !== false) {
                $roomId = (int) $existingId;
                if ($this->studyRoomRowHasPromoSlot1($pdo, $roomId)) {
                    $pdo->commit();
                    return $roomId;
                }
                if ($hasBasisCol) {
                    $stmt = $pdo->prepare(
                        'UPDATE study_rooms SET
                            study_room_name = ?, main_subject_note = ?, region_id = ?, complex_id = ?,
                            region_basis_type = ?, address_text = ?
                         WHERE id = ?'
                    );
                    $stmt->execute([
                        $name,
                        $mainSubject,
                        $regionId,
                        $complexId,
                        $basis,
                        $addressText,
                        $roomId,
                    ]);
                } else {
                    $stmt = $pdo->prepare(
                        'UPDATE study_rooms SET
                            study_room_name = ?, main_subject_note = ?, region_id = ?, complex_id = ?,
                            address_text = ?
                         WHERE id = ?'
                    );
                    $stmt->execute([
                        $name,
                        $mainSubject,
                        $regionId,
                        $complexId,
                        $addressText,
                        $roomId,
                    ]);
                }
                $pdo->prepare('DELETE FROM study_room_regions WHERE study_room_id = ?')->execute([$roomId]);
                $pdo->prepare('DELETE FROM study_room_subject_targets WHERE study_room_id = ?')->execute([$roomId]);
                try {
                    $pdo->prepare('DELETE FROM study_room_primary_audiences WHERE study_room_id = ?')->execute([$roomId]);
                } catch (PDOException $e) {
                    /* 대상 테이블이 없으면 아래 저장에서 만든다 */
                }
            } elseif ($hasBasisCol) {
                $stmt = $pdo->prepare(
                    'INSERT INTO study_rooms (
                        user_id, study_room_name, main_subject_note, region_id, complex_id, region_basis_type,
                        address_text, profile_status, detail_completion_status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
                );
                $stmt->execute([
                    $userId,
                    $name,
                    $mainSubject,
                    $regionId,
                    $complexId,
                    $basis,
                    $addressText,
                    'draft',
                    'basic_only',
                ]);
                $roomId = (int) $pdo->lastInsertId();
            } else {
                $stmt = $pdo->prepare(
                    'INSERT INTO study_rooms (
                        user_id, study_room_name, main_subject_note, region_id, complex_id, address_text,
                        profile_status, detail_completion_status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
                );
                $stmt->execute([
                    $userId,
                    $name,
                    $mainSubject,
                    $regionId,
                    $complexId,
                    $addressText,
                    'draft',
                    'basic_only',
                ]);
                $roomId = (int) $pdo->lastInsertId();
            }

            $pdo->prepare('UPDATE study_rooms SET lesson_place_type = ?, slogan = ? WHERE id = ?')
                ->execute([$lessonPlace, $slogan, $roomId]);
            $this->saveSignupPrimaryAudiences($pdo, $roomId, $input);

            $bizLine2 = $this->optionalString($input, 'address_line2');
            if ($bizLine2 !== null) {
                try {
                    $pdo->prepare('UPDATE study_rooms SET address_line2 = ? WHERE id = ?')->execute([$bizLine2, $roomId]);
                } catch (PDOException $e) {
                    /* 컬럼 미적용 */
                }
            }

            $hasSlotBasis = $this->columnExists($pdo, 'study_room_regions', 'region_basis_type');
            foreach ($slots as $slot) {
                if ($hasSlotBasis) {
                    $pdo->prepare(
                        'INSERT INTO study_room_regions (study_room_id, slot, region_id, complex_id, region_basis_type, is_primary)
                         VALUES (?, ?, ?, ?, ?, ?)'
                    )->execute([
                        $roomId,
                        $slot['slot'],
                        $slot['region_id'],
                        $slot['complex_id'],
                        $slot['region_basis_type'],
                        $slot['is_primary'],
                    ]);
                } else {
                    $pdo->prepare(
                        'INSERT INTO study_room_regions (study_room_id, slot, region_id, complex_id, is_primary)
                         VALUES (?, ?, ?, ?, ?)'
                    )->execute([
                        $roomId,
                        $slot['slot'],
                        $slot['region_id'],
                        $slot['complex_id'],
                        $slot['is_primary'],
                    ]);
                }
            }

            $subjectId = $this->findSubjectMasterId($pdo, $this->firstSubjectName($mainSubject));
            $pdo->prepare(
                'INSERT INTO study_room_subject_targets (study_room_id, subject_name, school_level, subject_master_id, is_main)
                 VALUES (?, ?, ?, ?, 1)'
            )->execute([$roomId, $this->firstSubjectName($mainSubject), 'middle', $subjectId]);

            $pdo->commit();
        } catch (PDOException $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw new RuntimeException('공부방 기본등록 저장 실패: ' . $e->getMessage(), 0, $e);
        }

        try {
            (new \Study114\Media\StudyRoomDefaultImageService())->ensureDefaultForRoom($pdo, $roomId);
        } catch (\Throwable $e) {
            /* 기본 이미지 실패해도 가입은 성공 */
        }

        return $roomId;
    }

    /** @param array<string, mixed> $input */
    private function resolveStudyRoomRegionId(array $input): int
    {
        if (isset($input['region_id']) && (string) $input['region_id'] !== '') {
            return $this->requireExplicitRegionId($input);
        }
        $pdo = Connection::get();

        return (int) RegionEnsure::fromKakao($pdo, $input)['id'];
    }

    /** @param array<string, mixed> $input */
    private function resolveStudyRoomComplexId(PDO $pdo, array $input, int $regionId, string $addressText): ?int
    {
        if (isset($input['complex_id']) && (string) $input['complex_id'] !== '') {
            try {
                return $this->requireComplexId($input);
            } catch (InvalidArgumentException $e) {
                /* 시드에 없는 id면 이름으로 생성 */
            }
        }
        $name = $this->optionalString($input, 'complex_name');
        if ($name === null) {
            return null;
        }
        $addr = $this->optionalString($input, 'complex_address') ?? $addressText;

        return ComplexEnsure::ensure($pdo, $regionId, $name, $addr);
    }

    /**
     * 홍보지역 슬롯에 의도된 입력( id / 주소 메타 )이 있는지.
     * 비어 있으면 사업장·집주소·다른 슬롯으로 채우지 않는다.
     *
     * @param array<string, mixed> $slot
     */
    private function promoSlotHasIntent(array $slot): bool
    {
        if (isset($slot['region_id']) && $slot['region_id'] !== '' && (int) $slot['region_id'] > 0) {
            return true;
        }
        if (isset($slot['complex_id']) && $slot['complex_id'] !== '' && (int) $slot['complex_id'] > 0) {
            return true;
        }
        foreach (
            [
                'address_sido',
                'address_sigungu',
                'address_bname',
                'address_hname',
                'region_label',
                'complex_name',
                'complex_address',
                'address_text',
            ] as $key
        ) {
            if (trim((string) ($slot[$key] ?? '')) !== '') {
                return true;
            }
        }

        return false;
    }

    /**
     * @param array<string, mixed> $input
     * @return list<array{slot:int,region_id:int,complex_id:?int,region_basis_type:string,is_primary:int}>
     */
    private function normalizeSignupPromoSlots(PDO $pdo, array $input, int $fallbackRegionId, ?int $fallbackComplexId, string $fallbackBasis): array
    {
        // 사업장 fallback 인자는 홍보 슬롯에 사용하지 않음 (복제 금지)
        unset($fallbackRegionId, $fallbackComplexId, $fallbackBasis);

        $raw = $input['saved_regions'] ?? null;
        $out = [];
        if (is_array($raw) && $raw !== []) {
            foreach (array_values($raw) as $idx => $slot) {
                $slotNum = $idx + 1;
                if ($slotNum > 3 || !is_array($slot)) {
                    continue;
                }
                // 선택 슬롯 2·3(및 미입력 슬롯)은 매핑 없음으로 유지
                if (!$this->promoSlotHasIntent($slot)) {
                    continue;
                }
                $regionId = isset($slot['region_id']) && $slot['region_id'] !== '' ? (int) $slot['region_id'] : 0;
                $complexId = isset($slot['complex_id']) && $slot['complex_id'] !== '' ? (int) $slot['complex_id'] : null;
                $slotBasis = isset($slot['region_basis_type']) && in_array($slot['region_basis_type'], ['dong', 'complex'], true)
                    ? $slot['region_basis_type']
                    : (($complexId !== null && $complexId > 0) ? 'complex' : 'dong');
                if ($regionId <= 0) {
                    try {
                        // 슬롯 자체 메타만 사용 — top-level 사업장주소($input) 폴백 금지
                        $regionId = (int) RegionEnsure::fromKakao($pdo, $slot)['id'];
                    } catch (InvalidArgumentException $e) {
                        continue;
                    }
                }
                if ($slotBasis === 'complex') {
                    $cname = trim((string) ($slot['complex_name'] ?? ''));
                    $caddr = trim((string) ($slot['complex_address'] ?? $slot['address_text'] ?? ''));
                    if (($complexId === null || $complexId <= 0) && $cname !== '') {
                        $complexId = ComplexEnsure::ensure($pdo, $regionId, $cname, $caddr !== '' ? $caddr : null);
                    }
                    if ($complexId === null || $complexId <= 0) {
                        continue;
                    }
                } else {
                    $complexId = null;
                    $slotBasis = 'dong';
                }
                $out[] = [
                    'slot' => $slotNum,
                    'region_id' => $regionId,
                    'complex_id' => $complexId,
                    'region_basis_type' => $slotBasis,
                    'is_primary' => $slotNum === 1 ? 1 : 0,
                ];
            }
        }

        $hasSlot1 = false;
        foreach ($out as $row) {
            if ((int) $row['slot'] === 1) {
                $hasSlot1 = true;
                break;
            }
        }
        if (!$hasSlot1) {
            throw new InvalidArgumentException('홍보지역 1(대표)을 선택해 주세요.');
        }

        return $out;
    }

    /**
     * 가입 기본정보: TutorBasicFields 필수 항목 + 활동지역 1~3(과외 단위).
     * 활동지역 1 필수 · 2·3 선택 · 빈 슬롯은 저장하지 않음 · 회원주소 폴백 금지.
     * 프로필 사진은 행이 생긴 뒤 /api/tutor/profile-image.php 로 올린다.
     * 이미 행이 있으면 사진을 먼저 올린 뒤 저장해야 하고, 새 행이면 저장 직후 같은 화면에서 올린다.
     * 사진까지 있어야 needsBasicRegister() 가 완료로 본다.
     *
     * @param array<string, mixed> $input
     */
    private function registerTutor(int $userId, array $input): int
    {
        if (trim((string) ($input['main_subject_note'] ?? '')) === '' && isset($input['main_subjects'])) {
            try {
                $input['main_subject_note'] = $this->resolveMainSubjectNote($input);
            } catch (InvalidArgumentException) {
                $input['main_subject_note'] = '';
            }
        }

        if (isset($input['gender']) && (string) $input['gender'] !== '') {
            ProfileGenderSync::sync($userId, $input);
        }

        $pdo = Connection::get();
        $pdo->beginTransaction();
        try {
            $existingTutorId = $this->lockedExistingId(
                $pdo,
                $userId,
                'SELECT id FROM tutors WHERE user_id = ? ORDER BY id ASC LIMIT 1'
            );
            if ($existingTutorId !== null && TutorBasicFields::missingForTutor($pdo, $existingTutorId) === []) {
                $pdo->commit();
                return $existingTutorId;
            }

            $values = TutorBasicFields::normalizeInput(
                $input,
                $this->tutorSignupHasSlot1($input),
                $existingTutorId === null || TutorBasicFields::hasProfileImage($pdo, $existingTutorId)
            );
            $regionIds = $this->normalizeTutorSignupRegions($input);

            if ($existingTutorId !== null) {
                $tutorId = $existingTutorId;
            } else {
                $pdo->prepare(
                    'INSERT INTO tutors (
                        user_id, tutor_display_name, main_subject_note,
                        profile_status, detail_completion_status
                    ) VALUES (?, ?, ?, ?, ?)'
                )->execute([
                    $userId,
                    $values['tutor_display_name'],
                    $values['main_subject_note'],
                    'draft',
                    'basic_only',
                ]);
                $tutorId = (int) $pdo->lastInsertId();
            }

            TutorBasicFields::write($pdo, $tutorId, $values);

            $pdo->prepare('DELETE FROM tutor_regions WHERE tutor_id = ?')->execute([$tutorId]);
            $ins = $pdo->prepare(
                'INSERT INTO tutor_regions (tutor_id, region_id, scope_type, priority_order, is_primary)
                 VALUES (?, ?, ?, ?, ?)'
            );
            foreach ($regionIds as $order => $regionId) {
                $ins->execute([$tutorId, $regionId, 'city', $order, $order === 0 ? 1 : 0]);
            }

            $pdo->commit();
        } catch (InvalidArgumentException $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        } catch (PDOException $e) {
            $pdo->rollBack();
            throw new RuntimeException('과외쌤 가입정보 저장 실패: ' . $e->getMessage(), 0, $e);
        }

        return $tutorId;
    }

    /** @param array<string, mixed> $input */
    private function tutorSignupHasSlot1(array $input): bool
    {
        $slots = $input['saved_regions'] ?? null;
        if (is_array($slots) && isset($slots[0]) && is_array($slots[0])) {
            return (int) ($slots[0]['region_id'] ?? 0) > 0;
        }

        return (int) ($input['region_id'] ?? 0) > 0;
    }

    /**
     * @param array<string, mixed> $input
     * @return list<int>
     */
    private function normalizeTutorSignupRegions(array $input): array
    {
        $pdo = Connection::get();
        $ids = [];
        $raw = $input['saved_regions'] ?? null;
        if (is_array($raw)) {
            foreach (array_values($raw) as $idx => $slot) {
                if ($idx >= 3 || !is_array($slot)) {
                    continue;
                }
                if (!isset($slot['region_id']) || $slot['region_id'] === '') {
                    continue;
                }
                $id = (int) $slot['region_id'];
                if ($id <= 0) {
                    throw new InvalidArgumentException(
                        $idx === 0
                            ? '과외지역 1: 유효한 지역을 선택해 주세요.'
                            : ('과외지역 ' . ($idx + 1) . ': 유효한 지역을 선택해 주세요.')
                    );
                }
                $ids[] = ['slot' => $idx, 'id' => $id];
            }
        }

        if ($ids === [] && isset($input['region_id']) && $input['region_id'] !== '') {
            $id = (int) $input['region_id'];
            if ($id > 0) {
                $ids[] = ['slot' => 0, 'id' => $id];
            }
        }

        if ($ids === [] || (int) $ids[0]['slot'] !== 0) {
            throw new InvalidArgumentException('과외지역 1을 선택해 주세요.');
        }

        $seen = [];
        $out = [];
        foreach ($ids as $row) {
            $id = (int) $row['id'];
            if (isset($seen[$id])) {
                throw new InvalidArgumentException('과외지역이 중복되었습니다. 같은 지역을 여러 칸에 넣을 수 없습니다.');
            }
            $seen[$id] = true;
            TutorRegionUnit::assertUnit($pdo, $id);
            $out[] = $id;
        }

        return $out;
    }

    /** @param list<string> $subjectNames */
    private function insertStudentSubjects(PDO $pdo, int $studentId, array $subjectNames, string $defaultLevel): void
    {
        if ($subjectNames === []) {
            $subjectNames = ['수학'];
        }

        foreach ($subjectNames as $i => $name) {
            $masterId = $this->findSubjectMasterId($pdo, $name);
            $pdo->prepare(
                'INSERT INTO student_subject_targets (student_id, subject_name, school_level, subject_master_id, is_primary)
                 VALUES (?, ?, ?, ?, ?)'
            )->execute([$studentId, $name, $defaultLevel, $masterId, $i === 0 ? 1 : 0]);
        }
    }

    /** @param list<string> $places */
    private function insertStudentPlaces(PDO $pdo, int $studentId, array $places): void
    {
        foreach ($places as $place) {
            $pdo->prepare(
                'INSERT INTO student_preferred_lesson_places (student_id, place_type) VALUES (?, ?)'
            )->execute([$studentId, $place]);
        }
    }

    /** @param list<string> $badges */
    private function insertStudentStyleBadges(PDO $pdo, int $studentId, array $badges): void
    {
        foreach ($badges as $i => $badge) {
            $pdo->prepare(
                'INSERT INTO student_preferred_teaching_style_badges (student_id, badge_name, display_order)
                 VALUES (?, ?, ?)'
            )->execute([$studentId, $badge, $i]);
        }
    }

    /** @param array<string, mixed> $input */
    private function requireExplicitRegionId(array $input): int
    {
        if (!isset($input['region_id']) || $input['region_id'] === '') {
            throw new InvalidArgumentException('region_id: 지역을 선택해 주세요.');
        }
        $id = (int) $input['region_id'];
        if ($id <= 0) {
            throw new InvalidArgumentException('region_id: 지역을 선택해 주세요.');
        }
        $pdo = Connection::get();
        $stmt = $pdo->prepare('SELECT id FROM regions WHERE id = ? AND is_active = 1');
        $stmt->execute([$id]);
        if (!$stmt->fetchColumn()) {
            throw new InvalidArgumentException('region_id: 유효하지 않은 지역입니다.');
        }
        return $id;
    }

    /** @param array<string, mixed> $input */
    private function requireComplexId(array $input): int
    {
        if (!isset($input['complex_id']) || $input['complex_id'] === '') {
            throw new InvalidArgumentException('complex_id: 아파트단지를 선택해 주세요.');
        }
        $id = (int) $input['complex_id'];
        if ($id <= 0) {
            throw new InvalidArgumentException('complex_id: 아파트단지를 선택해 주세요.');
        }
        $pdo = Connection::get();
        $stmt = $pdo->prepare('SELECT id FROM complexes WHERE id = ? AND is_active = 1');
        $stmt->execute([$id]);
        if (!$stmt->fetchColumn()) {
            throw new InvalidArgumentException('complex_id: 유효하지 않은 단지입니다.');
        }
        return $id;
    }

    private function regionIdForComplex(int $complexId): int
    {
        $pdo = Connection::get();
        $stmt = $pdo->prepare('SELECT region_id FROM complexes WHERE id = ? AND is_active = 1');
        $stmt->execute([$complexId]);
        $regionId = $stmt->fetchColumn();
        if (!$regionId) {
            throw new InvalidArgumentException('complex_id: 단지에 연결된 행정동이 없습니다.');
        }
        return (int) $regionId;
    }

    private function ensurePrimaryAudienceTable(PDO $pdo): void
    {
        static $done = false;
        if ($done) {
            return;
        }
        try {
            $exists = $pdo->query("SHOW TABLES LIKE 'study_room_primary_audiences'");
            if ($exists && $exists->fetchColumn()) {
                $done = true;
                return;
            }
        } catch (PDOException $e) {
            /* CREATE로 이어간다 */
        }
        $pdo->exec(
            "CREATE TABLE IF NOT EXISTS study_room_primary_audiences (
              study_room_id BIGINT UNSIGNED NOT NULL,
              school_level  ENUM('preschool', 'elementary', 'middle', 'high', 'n_su') NOT NULL,
              created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY (study_room_id, school_level),
              KEY idx_srpa_level (school_level),
              CONSTRAINT fk_srpa_room FOREIGN KEY (study_room_id) REFERENCES study_rooms (id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
        );
        $done = true;
    }

    /** @param array<string, mixed> $input */
    private function saveSignupPrimaryAudiences(PDO $pdo, int $roomId, array $input): void
    {
        $this->ensurePrimaryAudienceTable($pdo);
        $allowed = ['preschool', 'elementary', 'middle', 'high', 'n_su'];
        $raw = $input['primary_school_levels'] ?? [];
        if (is_string($raw)) {
            $raw = preg_split('/[,\s]+/', $raw) ?: [];
        }
        if (!is_array($raw)) {
            $raw = [];
        }
        $levels = [];
        foreach ($raw as $lv) {
            $lv = trim((string) $lv);
            if (in_array($lv, $allowed, true)) {
                $levels[] = $lv;
            }
        }
        $levels = array_values(array_unique($levels));
        if ($levels === []) {
            throw new InvalidArgumentException('주대상을 1개 이상 선택해 주세요.');
        }
        $ins = $pdo->prepare(
            'INSERT INTO study_room_primary_audiences (study_room_id, school_level) VALUES (?, ?)'
        );
        foreach ($levels as $lv) {
            $ins->execute([$roomId, $lv]);
        }
    }

    private function columnExists(PDO $pdo, string $table, string $column): bool
    {
        $stmt = $pdo->prepare(
            'SELECT COUNT(*) FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?'
        );
        $stmt->execute([$table, $column]);
        return (int) $stmt->fetchColumn() > 0;
    }

    /** @param array<string, mixed> $input */
    private function resolveMainSubjectNote(array $input): string
    {
        $note = $this->optionalString($input, 'main_subject_note');
        if ($note !== null) {
            return $note;
        }

        $subjects = $input['main_subjects'] ?? null;
        if (is_array($subjects)) {
            $parts = [];
            foreach ($subjects as $s) {
                $s = trim((string) $s);
                if ($s === '기타') {
                    $other = trim((string) ($input['main_subject_other'] ?? ''));
                    if ($other !== '') {
                        $parts[] = $other;
                    }
                    continue;
                }
                if ($s !== '') {
                    $parts[] = $s;
                }
            }
            if ($parts !== []) {
                return implode(' · ', $parts);
            }
        } elseif (is_string($subjects) && trim($subjects) !== '') {
            return trim($subjects);
        }

        throw new InvalidArgumentException('main_subject_note: 주력과목을 1개 이상 선택해 주세요.');
    }

    private function findSubjectMasterId(PDO $pdo, string $name): ?int
    {
        $stmt = $pdo->prepare(
            'SELECT id FROM subject_masters WHERE subject_name = ? OR subject_name LIKE ? ORDER BY id ASC LIMIT 1'
        );
        $stmt->execute([$name, '%' . $name . '%']);
        $id = $stmt->fetchColumn();
        return $id ? (int) $id : null;
    }

    private function firstSubjectName(string $raw): string
    {
        $parts = preg_split('/[,·\/]/u', $raw) ?: [];
        $first = trim($parts[0] ?? $raw);
        return $first !== '' ? $first : '수학';
    }

    /** @param array<string, mixed> $input @return list<string> */
    private function parseSubjectNames(array $input): array
    {
        $raw = trim((string) ($input['subject_names'] ?? ''));
        if ($raw === '') {
            return ['수학'];
        }
        $parts = preg_split('/[,·\/]/u', $raw) ?: [];
        return array_values(array_filter(array_map('trim', $parts)));
    }

    /**
     * @param array<string, mixed> $input
     * @param list<string> $allowed
     * @return list<string>
     */
    private function parseStringList(array $input, string $key, array $allowed): array
    {
        $value = $input[$key] ?? [];
        if (!is_array($value)) {
            $value = $value === '' || $value === null ? [] : [$value];
        }
        $out = [];
        foreach ($value as $item) {
            $item = (string) $item;
            if (in_array($item, $allowed, true)) {
                $out[] = $item;
            }
        }
        return array_values(array_unique($out));
    }

    /** @return list<string> */
    private function schoolLevelCodes(): array
    {
        return ['preschool', 'elementary', 'middle', 'high', 'n_su', 'general', 'other'];
    }

    /** @return list<string> */
    private function teachingStyleCodes(): array
    {
        return ['passion', 'meticulous', 'kind', 'from_basics', 'advanced_focus', 'concept_focus', 'solution_focus'];
    }

    /** @param array<string, mixed> $input */
    private function requireString(array $input, string $key): string
    {
        if (!isset($input[$key]) || trim((string) $input[$key]) === '') {
            throw new InvalidArgumentException("{$key}: 필수 입력입니다.");
        }
        return trim((string) $input[$key]);
    }

    /** @param array<string, mixed> $input */
    private function optionalString(array $input, string $key): ?string
    {
        if (!isset($input[$key]) || trim((string) $input[$key]) === '') {
            return null;
        }
        return trim((string) $input[$key]);
    }

    /** @param array<string, mixed> $input */
    private function optionalBoundedString(array $input, string $key, int $max): ?string
    {
        $value = $this->optionalString($input, $key);
        if ($value === null) {
            return null;
        }
        if (mb_strlen($value) > $max) {
            throw new InvalidArgumentException("{$key}: {$max}자 이하로 입력해 주세요.");
        }
        return $value;
    }

    /** 가입 화면 예산은 천원. DB는 원. */
    private function cheonwonInputToWon(?int $cheonwon): ?int
    {
        if ($cheonwon === null) {
            return null;
        }
        $won = $cheonwon * 1000;
        if ($won > 4294967295) {
            throw new InvalidArgumentException('예산: 값을 확인해 주세요.');
        }
        return $won;
    }

    /** @param array<string, mixed> $input */
    private function optionalUnsignedInt(array $input, string $key): ?int
    {
        if (!isset($input[$key]) || trim((string) $input[$key]) === '') {
            return null;
        }
        $raw = trim((string) $input[$key]);
        if (!preg_match('/^\d+$/', $raw)) {
            throw new InvalidArgumentException("{$key}: 0 이상의 숫자로 입력해 주세요.");
        }
        $value = (int) $raw;
        if ($value < 0 || $value > 4294967295) {
            throw new InvalidArgumentException("{$key}: 0 이상의 숫자로 입력해 주세요.");
        }
        return $value;
    }

    /**
     * 기존 입력 키 subject_names. 비어 있으면 저장하지 않는다.
     *
     * @param array<string, mixed> $input
     * @return list<string>
     */
    private function optionalSubjectNames(array $input): array
    {
        $raw = trim((string) ($input['subject_names'] ?? ''));
        if ($raw === '') {
            return [];
        }
        $parts = preg_split('/[,·\/]/u', $raw) ?: [];
        $out = [];
        foreach ($parts as $part) {
            $name = trim((string) $part);
            if ($name === '') {
                continue;
            }
            if (mb_strlen($name) > 50) {
                throw new InvalidArgumentException('subject_names: 과목명을 확인해 주세요.');
            }
            $out[] = $name;
        }
        return array_values(array_unique($out));
    }

    /** grade_level 표기(중2·초5·고1·N수)에서 기존 school_level code만 읽는다. 불명확하면 null. */
    private function schoolLevelFromGradeText(?string $gradeLevel): ?string
    {
        if ($gradeLevel === null || $gradeLevel === '') {
            return null;
        }
        if (str_contains($gradeLevel, '미취학')) {
            return 'preschool';
        }
        if (str_contains($gradeLevel, 'N수') || str_contains($gradeLevel, 'n수')) {
            return 'n_su';
        }
        if (str_contains($gradeLevel, '초')) {
            return 'elementary';
        }
        if (str_contains($gradeLevel, '중')) {
            return 'middle';
        }
        if (str_contains($gradeLevel, '고')) {
            return 'high';
        }
        return null;
    }

    /**
     * @param array<string, mixed> $input
     * @param list<string> $allowed
     */
    private function requireEnum(array $input, string $key, array $allowed): string
    {
        $value = (string) ($input[$key] ?? '');
        if (!in_array($value, $allowed, true)) {
            throw new InvalidArgumentException("{$key}: 유효하지 않은 값입니다.");
        }
        return $value;
    }

    /**
     * @param array<string, mixed> $input
     * @param list<string> $allowed
     */
    private function optionalEnum(array $input, string $key, array $allowed): ?string
    {
        $value = (string) ($input[$key] ?? '');
        if ($value === '') {
            return null;
        }
        if (!in_array($value, $allowed, true)) {
            throw new InvalidArgumentException("{$key}: 유효하지 않은 값입니다.");
        }
        return $value;
    }

    /** @param array<string, mixed> $input */
    private function requireBirthYear(array $input): int
    {
        if (!isset($input['birth_year']) || $input['birth_year'] === '') {
            throw new InvalidArgumentException('birth_year: 필수 입력입니다.');
        }
        $year = (int) $input['birth_year'];
        if ($year < 1990 || $year > (int) date('Y')) {
            throw new InvalidArgumentException('birth_year: 1990~현재 연도 사이로 입력해 주세요.');
        }
        return $year;
    }

    /** @param array<string, mixed> $input */
    private function requirePositiveInt(array $input, string $key): int
    {
        if (!isset($input[$key]) || $input[$key] === '') {
            throw new InvalidArgumentException("{$key}: 필수 입력입니다.");
        }
        $n = (int) $input[$key];
        if ($n <= 0) {
            throw new InvalidArgumentException("{$key}: 1 이상 입력해 주세요.");
        }
        return $n;
    }

    /** @param array<string, mixed> $input */
    private function optionalInt(array $input, string $key): ?int
    {
        if (!isset($input[$key]) || $input[$key] === '') {
            return null;
        }
        return (int) $input[$key];
    }
}
