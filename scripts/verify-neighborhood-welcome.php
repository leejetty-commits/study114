<?php

declare(strict_types=1);

/**
 * 새 이웃 환영 줄 검증 스크립트 (정본 71)
 *
 * 검증 항목:
 * 1. 자격 6가지 각각 통과/탈락
 *    (1) 등록 종류: tutors, study_rooms 만 대상
 *    (2) 등록 생성 후 7일 이내 (7일 이내 통과, 8일 전 탈락)
 *    (3) 카드 팝업 상태 (hidden 탈락, 삭제 탈락, 탈퇴 탈락, 1번자리 없음 탈락)
 *    (4) 인사 기록 하나도 없음 (기록 1건이라도 있으면 탈락, 없으면 통과)
 *    (5) 같은 회원의 같은 종류 첫 등록 (이전 등록 있으면 탈락, 첫 등록 통과)
 *    (6) 동 이름 비어있지 않음 (NULL 또는 빈문자열 탈락, 정상 통과)
 * 2. 로그인 전후 필드 (로그인 전 display_name/body 미포함, 로그인 후 포함, origin: 'welcome')
 * 3. welcome_off (본인 성공, 남의 등록 거부, 기록 있으면 무변경)
 * 4. GET 후 파일 미변경 (파일 쓰기 없음)
 * 5. 문구가 validate() 통과
 *
 * 실행:
 *   D:\php8.2\php.exe -d extension=pdo_sqlite scripts/verify-neighborhood-welcome.php
 */

require_once dirname(__DIR__) . '/src/bootstrap.php';

if (!function_exists('mb_strlen')) {
    function mb_strlen(string $s, ?string $encoding = null): int
    {
        return preg_match_all('/./u', $s, $m) ? count($m[0]) : strlen($s);
    }
}
if (!function_exists('mb_substr')) {
    function mb_substr(string $s, int $start, ?int $length = null, ?string $encoding = null): string
    {
        return $length === null ? substr($s, $start) : substr($s, $start, $length);
    }
}

use Study114\Database\Connection;
use Study114\Neighborhood\NeighborhoodGreetingService;

$failed = 0;
function ok(string $name, bool $cond, string $detail = ''): void
{
    global $failed;
    if ($cond) {
        echo "PASS  {$name}\n";
        return;
    }
    $failed++;
    fwrite(STDERR, "FAIL  {$name}" . ($detail !== '' ? " — {$detail}" : '') . "\n");
}

function createWelcomeTestPdo(): PDO
{
    $pdo = new PDO('sqlite::memory:');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $pdo->exec('CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT "active"
    )');

    $pdo->exec('CREATE TABLE regions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sido_name TEXT NOT NULL,
        sigungu_name TEXT NOT NULL,
        dong_name TEXT NOT NULL,
        is_selectable INTEGER NOT NULL DEFAULT 1
    )');

    $pdo->exec('CREATE TABLE tutors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        tutor_display_name TEXT NOT NULL,
        main_subject_note TEXT NULL,
        profile_status TEXT NOT NULL DEFAULT "published",
        preferred_fee_amount INTEGER NULL,
        lessons_per_week INTEGER NULL,
        minutes_per_lesson INTEGER NULL,
        feature_1 TEXT NULL,
        feature_2 TEXT NULL,
        feature_3 TEXT NULL,
        university_name TEXT NULL,
        major_name TEXT NULL,
        career_year_band TEXT NULL,
        intro_short TEXT NULL,
        created_at TEXT NOT NULL
    )');

    $pdo->exec('CREATE TABLE tutor_regions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tutor_id INTEGER NOT NULL,
        region_id INTEGER NOT NULL,
        priority_order INTEGER NOT NULL DEFAULT 0,
        is_primary INTEGER NOT NULL DEFAULT 0
    )');

    $pdo->exec('CREATE TABLE study_rooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        study_room_name TEXT NOT NULL,
        slogan TEXT NULL,
        intro_short TEXT NULL,
        intro_long TEXT NULL,
        main_subject_note TEXT NULL,
        feature_1 TEXT NULL,
        feature_2 TEXT NULL,
        feature_3 TEXT NULL,
        teaching_style TEXT NULL,
        lesson_place_type TEXT NULL,
        capacity_per_time TEXT NULL,
        lesson_operation_type TEXT NULL,
        price_amount INTEGER NULL,
        facility_note TEXT NULL,
        inquiry_status TEXT NULL,
        profile_status TEXT NOT NULL DEFAULT "published",
        price_description TEXT NULL,
        region_id INTEGER NULL,
        complex_id INTEGER NULL,
        deleted_at TEXT NULL,
        created_at TEXT NOT NULL
    )');

    $pdo->exec('CREATE TABLE study_room_regions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        study_room_id INTEGER NOT NULL,
        slot INTEGER NOT NULL,
        region_id INTEGER NOT NULL,
        complex_id INTEGER NULL,
        region_basis_type TEXT NULL,
        address_zip TEXT NULL,
        is_primary INTEGER NOT NULL DEFAULT 0
    )');

    $pdo->exec('CREATE TABLE complexes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        region_id INTEGER NOT NULL,
        name TEXT NOT NULL
    )');

    return $pdo;
}

$pdo = createWelcomeTestPdo();
$refProp = new ReflectionProperty(Connection::class, 'pdo');
$refProp->setValue(null, $pdo);

// 기본 시드 데이터
$now = time();
$dateRecent = date('Y-m-d H:i:s', $now - 2 * 86400); // 2일 전 (7일 이내)
$dateOld = date('Y-m-d H:i:s', $now - 10 * 86400);   // 10일 전 (7일 경과)

// 1) regions
$pdo->exec("INSERT INTO regions (id, sido_name, sigungu_name, dong_name, is_selectable) VALUES
    (1, '서울특별시', '도봉구', '방학동', 1),
    (2, '서울특별시', '도봉구', '쌍문동', 1),
    (3, '서울특별시', '노원구', '', 1),
    (4, '서울특별시', '도봉구', '', 1),
    (5, '서울특별시', '', '', 1)");

// 2) users
$pdo->exec("INSERT INTO users (id, email, status) VALUES
    (101, 'active_tutor@test.com', 'active'),
    (102, 'withdrawn_tutor@test.com', 'withdrawn'),
    (103, 'active_room@test.com', 'active'),
    (104, 'withdrawn_room@test.com', 'withdrawn'),
    (105, 'multi_tutor@test.com', 'active'),
    (106, 'multi_room@test.com', 'active'),
    (107, 'nodong_tutor@test.com', 'active'),
    (108, 'noslot_room@test.com', 'active'),
    (109, 'welcome_off_user@test.com', 'active'),
    (111, 'old_tutor@test.com', 'active'),
    (112, 'old_room@test.com', 'active'),
    (113, 'hidden_tutor@test.com', 'active'),
    (114, 'noregion_tutor@test.com', 'active'),
    (115, 'deleted_room@test.com', 'active'),
    (120, 'save_test_tutor@test.com', 'active')");

// 3) tutors
// id=1: 정상 환영 대상 (2일 전, 활성회원, 대표지역1=region_id 4: sigungu_name='도봉구', dong_name='', is_selectable=1 인 구 단위 지역)
$pdo->exec("INSERT INTO tutors (id, user_id, tutor_display_name, profile_status, created_at)
    VALUES (1, 101, '김수학', 'published', '{$dateRecent}')");
$pdo->exec("INSERT INTO tutor_regions (id, tutor_id, region_id, priority_order, is_primary)
    VALUES (1, 1, 4, 0, 1)");

// id=2: 10일 전 생성 (자격 2 탈락)
$pdo->exec("INSERT INTO tutors (id, user_id, tutor_display_name, profile_status, created_at)
    VALUES (2, 111, '이영어', 'published', '{$dateOld}')");
$pdo->exec("INSERT INTO tutor_regions (id, tutor_id, region_id, priority_order, is_primary)
    VALUES (2, 2, 4, 0, 1)");

// id=3: hidden 상태 (자격 3 탈락)
$pdo->exec("INSERT INTO tutors (id, user_id, tutor_display_name, profile_status, created_at)
    VALUES (3, 113, '박숨김', 'hidden', '{$dateRecent}')");
$pdo->exec("INSERT INTO tutor_regions (id, tutor_id, region_id, priority_order, is_primary)
    VALUES (3, 3, 4, 0, 1)");

// id=4: 탈퇴 회원 (자격 3 탈락)
$pdo->exec("INSERT INTO tutors (id, user_id, tutor_display_name, profile_status, created_at)
    VALUES (4, 102, '최탈퇴', 'published', '{$dateRecent}')");
$pdo->exec("INSERT INTO tutor_regions (id, tutor_id, region_id, priority_order, is_primary)
    VALUES (4, 4, 4, 0, 1)");

// id=5: 1번 자리 없음 (자격 3 탈락)
$pdo->exec("INSERT INTO tutors (id, user_id, tutor_display_name, profile_status, created_at)
    VALUES (5, 114, '정지역없음', 'published', '{$dateRecent}')");

// id=6,7: 같은 회원 복수 등록 (user_id=105). id=6이 오래된 등록, id=7이 최근 등록 (자격 5에 의해 id=7은 첫 등록이 아니므로 탈락)
$pdo->exec("INSERT INTO tutors (id, user_id, tutor_display_name, profile_status, created_at)
    VALUES (6, 105, '선등록', 'published', '{$dateOld}')");
$pdo->exec("INSERT INTO tutor_regions (id, tutor_id, region_id, priority_order, is_primary)
    VALUES (6, 6, 4, 0, 1)");
$pdo->exec("INSERT INTO tutors (id, user_id, tutor_display_name, profile_status, created_at)
    VALUES (7, 105, '후등록', 'published', '{$dateRecent}')");
$pdo->exec("INSERT INTO tutor_regions (id, tutor_id, region_id, priority_order, is_primary)
    VALUES (7, 7, 4, 0, 1)");

// id=8: sigungu_name 없음 (region_id=5 sigungu_name 빈문자열, 자격 6 탈락)
$pdo->exec("INSERT INTO tutors (id, user_id, tutor_display_name, profile_status, created_at)
    VALUES (8, 107, '지역이름없음', 'published', '{$dateRecent}')");
$pdo->exec("INSERT INTO tutor_regions (id, tutor_id, region_id, priority_order, is_primary)
    VALUES (8, 8, 5, 0, 1)");

// 4) study_rooms
// id=10: 정상 환영 대상 (2일 전, 활성회원, 홍보1=쌍문동)
$pdo->exec("INSERT INTO study_rooms (id, user_id, study_room_name, profile_status, created_at)
    VALUES (10, 103, '열공공부방', 'published', '{$dateRecent}')");
$pdo->exec("INSERT INTO study_room_regions (id, study_room_id, slot, region_id, is_primary)
    VALUES (10, 10, 1, 2, 1)");

// id=11: 10일 전 생성 (자격 2 탈락)
$pdo->exec("INSERT INTO study_rooms (id, user_id, study_room_name, profile_status, created_at)
    VALUES (11, 112, '옛날공부방', 'published', '{$dateOld}')");
$pdo->exec("INSERT INTO study_room_regions (id, study_room_id, slot, region_id, is_primary)
    VALUES (11, 11, 1, 2, 1)");

// id=12: 삭제된 공부방 (deleted_at IS NOT NULL, 자격 3 탈락)
$pdo->exec("INSERT INTO study_rooms (id, user_id, study_room_name, profile_status, created_at, deleted_at)
    VALUES (12, 115, '삭제공부방', 'published', '{$dateRecent}', '{$dateRecent}')");
$pdo->exec("INSERT INTO study_room_regions (id, study_room_id, slot, region_id, is_primary)
    VALUES (12, 12, 1, 2, 1)");

// id=13: 탈퇴 회원 공부방 (자격 3 탈락)
$pdo->exec("INSERT INTO study_rooms (id, user_id, study_room_name, profile_status, created_at)
    VALUES (13, 104, '탈퇴공부방', 'published', '{$dateRecent}')");
$pdo->exec("INSERT INTO study_room_regions (id, study_room_id, slot, region_id, is_primary)
    VALUES (13, 13, 1, 2, 1)");

// id=14: 홍보 slot 1 없음 (자격 3 탈락)
$pdo->exec("INSERT INTO study_rooms (id, user_id, study_room_name, profile_status, created_at)
    VALUES (14, 108, '슬롯없음공부방', 'published', '{$dateRecent}')");

// id=15,16: 같은 회원(user_id=106). id=15는 과거에 등록 후 삭제됨(deleted_at), id=16은 최근 재등록.
// 자격 5에 의해 삭제된 등록 포함 더 오래된 등록이 있으므로 id=16 탈락!
$pdo->exec("INSERT INTO study_rooms (id, user_id, study_room_name, profile_status, created_at, deleted_at)
    VALUES (15, 106, '이전삭제공부방', 'published', '{$dateOld}', '{$dateOld}')");
$pdo->exec("INSERT INTO study_rooms (id, user_id, study_room_name, profile_status, created_at)
    VALUES (16, 106, '재등록공부방', 'published', '{$dateRecent}')");
$pdo->exec("INSERT INTO study_room_regions (id, study_room_id, slot, region_id, is_primary)
    VALUES (16, 16, 1, 2, 1)");

// 임시 저장 파일 설정
$testJsonFile = sys_get_temp_dir() . '/study114-test-ng-' . bin2hex(random_bytes(4)) . '.json';
register_shutdown_function(static function () use ($testJsonFile) {
    if (file_exists($testJsonFile)) {
        @unlink($testJsonFile);
    }
});

$service = new NeighborhoodGreetingService($testJsonFile);

// =========================================================================
// 1. 자격 6가지 각각 통과/탈락 검증
// =========================================================================
$since = date('Y-m-d H:i:s', time() - 7 * 86400);
$publicItems = $service->listPublic(true);
$welcomeItems = array_values(array_filter($publicItems, static fn ($i) => ($i['origin'] ?? '') === 'welcome'));

// 정상 통과 대상은 tutor id=1 과 study_room id=10 뿐이어야 함
$welcomeTutorIds = array_map(static fn ($i) => (int) $i['registration_id'], array_filter($welcomeItems, static fn ($i) => $i['provider_type'] === 'tutor'));
$welcomeRoomIds = array_map(static fn ($i) => (int) $i['registration_id'], array_filter($welcomeItems, static fn ($i) => $i['provider_type'] === 'study_room'));

ok('1-1. 정상 등록 환영 통과 (과외쌤 id=1 - 구 단위 지역 dong_name 빈값)', in_array(1, $welcomeTutorIds, true));
ok('1-1. 정상 등록 환영 통과 (공부방 id=10)', in_array(10, $welcomeRoomIds, true));

$welcomeTutor1 = current(array_filter($welcomeItems, static fn ($i) => $i['provider_type'] === 'tutor' && (int) $i['registration_id'] === 1));
ok('1-1. 과외쌤 환영 줄 동네는 sigungu_name(도봉구)', $welcomeTutor1 && ($welcomeTutor1['neighborhood'] ?? '') === '도봉구');
ok('1-1. 과외쌤 환영 줄 문구는 {구·시·군}에 새로 오신 과외쌤', $welcomeTutor1 && ($welcomeTutor1['body'] ?? '') === '도봉구에 새로 오신 과외쌤이에요. 반갑게 맞아 주세요!');

// 자격 2 (7일 이내) 검증: 10일 전 등록은 제외
ok('1-2. 7일 초과 등록 제외 (과외쌤 id=2)', !in_array(2, $welcomeTutorIds, true));
ok('1-2. 7일 초과 등록 제외 (공부방 id=11)', !in_array(11, $welcomeRoomIds, true));

// 자격 3 (카드 팝업 상태): hidden, 삭제, 탈퇴, 1번자리 부재 제외
ok('1-3. hidden 등록 제외 (과외쌤 id=3)', !in_array(3, $welcomeTutorIds, true));
ok('1-3. 삭제된 공부방 제외 (공부방 id=12)', !in_array(12, $welcomeRoomIds, true));
ok('1-3. 탈퇴 회원 등록 제외 (과외쌤 id=4)', !in_array(4, $welcomeTutorIds, true));
ok('1-3. 탈퇴 회원 공부방 제외 (공부방 id=13)', !in_array(13, $welcomeRoomIds, true));
ok('1-3. 대표지역 슬롯1 없는 과외쌤 제외 (과외쌤 id=5)', !in_array(5, $welcomeTutorIds, true));
ok('1-3. 대표지역 슬롯1 없는 공부방 제외 (공부방 id=14)', !in_array(14, $welcomeRoomIds, true));

// 자격 5 (첫 등록): 재등록/후등록 제외
ok('1-5. 이전 등록이 있는 회원의 후등록 제외 (과외쌤 id=7)', !in_array(7, $welcomeTutorIds, true));
ok('1-5. 삭제된 이전 등록이 있는 회원의 재등록 제외 (공부방 id=16)', !in_array(16, $welcomeRoomIds, true));

// 자격 6 (동네 이름): sigungu_name/dong_name 비어있으면 제외
ok('1-6. sigungu_name이 빈 문자열인 등록 제외 (과외쌤 id=8)', !in_array(8, $welcomeTutorIds, true));

// 자격 4 (인사 기록 하나도 없음): 본인이 인사를 올리거나 내리면 환영 줄에서 제외
// 임의의 새 과외쌤 id=20 생성 (독립된 user_id=120)
$pdo->exec("INSERT INTO tutors (id, user_id, tutor_display_name, profile_status, created_at)
    VALUES (20, 120, '기록테스트쌤', 'published', '{$dateRecent}')");
$pdo->exec("INSERT INTO tutor_regions (id, tutor_id, region_id, priority_order, is_primary)
    VALUES (20, 20, 1, 0, 1)");

$itemsBefore = $service->listPublic(true);
$has20Before = array_filter($itemsBefore, static fn ($i) => ($i['origin'] ?? '') === 'welcome' && (int) $i['registration_id'] === 20);
ok('1-4. 인사 기록 없을 때 환영 줄 노출', count($has20Before) === 1);

// 인사를 올림
$service->save(120, 'tutor', [
    'provider_type' => 'tutor',
    'registration_id' => 20,
    'body' => '안녕하세요 반갑습니다',
    'neighborhood' => '방학동',
    'display_name' => '기록테스트쌤',
]);

$itemsAfter = $service->listPublic(true);
$welcome20After = array_filter($itemsAfter, static fn ($i) => ($i['origin'] ?? '') === 'welcome' && (int) $i['registration_id'] === 20);
$member20After = array_filter($itemsAfter, static fn ($i) => ($i['origin'] ?? '') !== 'welcome' && (int) $i['registration_id'] === 20);
ok('1-4. 인사 올린 뒤 환영 줄 제외 (자격 4 탈락)', count($welcome20After) === 0);
ok('1-4. 직접 쓴 인사로 목록에 반영됨', count($member20After) === 1);

// =========================================================================
// 2. 로그인 전후 필드 검증
// =========================================================================
$guestItems = $service->listPublic(false);
$guestTutor1 = null;
foreach ($guestItems as $it) {
    if ($it['provider_type'] === 'tutor' && (int) $it['registration_id'] === 1) {
        $guestTutor1 = $it;
        break;
    }
}
ok('2-1. 비로그인 시 display_name 미포함', isset($guestTutor1) && !isset($guestTutor1['display_name']));
ok('2-1. 비로그인 시 body 미포함', isset($guestTutor1) && !isset($guestTutor1['body']));
ok('2-1. 비로그인 시 masked_name 포함', isset($guestTutor1) && $guestTutor1['masked_name'] === '김○○');
ok('2-1. 비로그인 시 teaser 포함', isset($guestTutor1) && is_string($guestTutor1['teaser']) && $guestTutor1['teaser'] !== '');
ok('2-1. 비로그인 시 origin=welcome', isset($guestTutor1) && $guestTutor1['origin'] === 'welcome');

$authItems = $service->listPublic(true);
$authTutor1 = null;
foreach ($authItems as $it) {
    if ($it['provider_type'] === 'tutor' && (int) $it['registration_id'] === 1) {
        $authTutor1 = $it;
        break;
    }
}
ok('2-2. 로그인 시 display_name 포함', isset($authTutor1) && $authTutor1['display_name'] === '김수학');
ok('2-2. 로그인 시 body 포함', isset($authTutor1) && $authTutor1['body'] === '도봉구에 새로 오신 과외쌤이에요. 반갑게 맞아 주세요!');
ok('2-2. 로그인 시 origin=welcome', isset($authTutor1) && $authTutor1['origin'] === 'welcome');

// 공부방 로그인 시 문구 확인
$authRoom10 = null;
foreach ($authItems as $it) {
    if ($it['provider_type'] === 'study_room' && (int) $it['registration_id'] === 10) {
        $authRoom10 = $it;
        break;
    }
}
ok('2-3. 공부방 로그인 시 body 포함', isset($authRoom10) && $authRoom10['body'] === '쌍문동에 새 공부방이 문을 열었어요. 반갑게 맞아 주세요!');

// =========================================================================
// 3. welcome_off 검증
// =========================================================================
// 과외쌤 id=30 신규 생성 (user_id=109 소유)
$pdo->exec("INSERT INTO tutors (id, user_id, tutor_display_name, profile_status, created_at)
    VALUES (30, 109, '오프테스트쌤', 'published', '{$dateRecent}')");
$pdo->exec("INSERT INTO tutor_regions (id, tutor_id, region_id, priority_order, is_primary)
    VALUES (30, 30, 1, 0, 1)");

// 남의 등록 (user_id=101)으로 welcome_off 시도 -> 거부 (assertOwns 예외)
$blocked = false;
try {
    $service->save(101, 'tutor', [
        'provider_type' => 'tutor',
        'registration_id' => 30,
        'status' => 'welcome_off',
    ]);
} catch (\InvalidArgumentException $e) {
    $blocked = true;
}
ok('3-1. 남의 등록 welcome_off 거부', $blocked);

// 본인 등록(user_id=109)으로 welcome_off 시도 -> 성공
// 브라우저가 neighborhood·display_name을 보내도 저장값은 DB 값이어야 함 (정본 71 레드라인 3)
$offRes = $service->save(109, 'tutor', [
    'provider_type' => 'tutor',
    'registration_id' => 30,
    'status' => 'welcome_off',
    'neighborhood' => '위조동네',
    'display_name' => '위조이름',
]);
ok('3-2. 본인 등록 welcome_off 성공', ($offRes['status'] ?? '') === 'down' && ($offRes['origin'] ?? '') === 'welcome_off' && ($offRes['body'] ?? '') === '');
$mine30 = $service->getMine(109, 'tutor', 'tutor', 30);
ok('3-2. welcome_off 시 브라우저가 neighborhood·display_name을 보내도 저장값은 DB 값',
    ($offRes['neighborhood'] ?? '') === '도봉구' &&
    ($offRes['display_name'] ?? '') === '오프테스트쌤' &&
    ($mine30['neighborhood'] ?? '') === '도봉구' &&
    ($mine30['display_name'] ?? '') === '오프테스트쌤'
);

// 환영 목록에서 id=30 제외 확인
$itemsAfterOff = $service->listPublic(true);
$found30 = array_filter($itemsAfterOff, static fn ($i) => (int) $i['registration_id'] === 30);
ok('3-3. welcome_off 후 환영 줄 제외', count($found30) === 0);

// 이미 기록이 있는 상태에서 다시 welcome_off 호출 시 -> 무변경 성공
$offResAgain = $service->save(109, 'tutor', [
    'provider_type' => 'tutor',
    'registration_id' => 30,
    'status' => 'welcome_off',
]);
ok('3-4. 이미 기록 있는 경우 welcome_off 무변경 성공', $offResAgain['status'] === 'down' && $offResAgain['updated_at'] === $offRes['updated_at']);

// =========================================================================
// 4. GET 후 파일 미변경 검증
// =========================================================================
$fileBefore = file_exists($testJsonFile) ? file_get_contents($testJsonFile) : null;
$mtimeBefore = file_exists($testJsonFile) ? filemtime($testJsonFile) : 0;

$service->listPublic(false);
$service->listPublic(true);

$fileAfter = file_exists($testJsonFile) ? file_get_contents($testJsonFile) : null;
$mtimeAfter = file_exists($testJsonFile) ? filemtime($testJsonFile) : 0;

ok('4-1. GET listPublic() 호출 후 파일 내용 불변', $fileBefore === $fileAfter);
ok('4-2. GET listPublic() 호출 후 파일 mtime 불변', $mtimeBefore === $mtimeAfter);

// =========================================================================
// 5. 문구가 validate() 통과 검증
// =========================================================================
$tutorMsg = "도봉구에 새로 오신 과외쌤이에요. 반갑게 맞아 주세요!";
$roomMsg = "쌍문동에 새 공부방이 문을 열었어요. 반갑게 맞아 주세요!";

ok('5-1. 과외쌤 자동 문구 validate() 통과', NeighborhoodGreetingService::validate($tutorMsg) === '');
ok('5-2. 공부방 자동 문구 validate() 통과', NeighborhoodGreetingService::validate($roomMsg) === '');

// =========================================================================
// 6. R5: basicCard() null 아님 검증 (모든 origin===welcome 항목)
// =========================================================================
$hasWelcomeTutor = false;
$hasWelcomeRoom = false;
foreach ($welcomeItems as $wItem) {
    $pType = (string) ($wItem['provider_type'] ?? '');
    $rId = (int) ($wItem['registration_id'] ?? 0);
    $card = $service->basicCard($pType, $rId);
    ok("6-1. basicCard() null 아님 ({$pType} id={$rId})", $card !== null);
    if ($pType === 'tutor') {
        $hasWelcomeTutor = true;
    }
    if ($pType === 'study_room') {
        $hasWelcomeRoom = true;
    }
}
ok('6-2. 환영 과외쌤 사례 포함', $hasWelcomeTutor);
ok('6-3. 환영 공부방 사례 포함', $hasWelcomeRoom);

// 요약 출력
echo "\n" . ($failed === 0 ? "ALL PASS ({$failed} failed)\n" : "FAILED ({$failed} failures)\n");
exit($failed > 0 ? 1 : 0);
