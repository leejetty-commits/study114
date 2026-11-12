/**
 * 희망지역 추가: 상세 칸은 본 희망지역 위젯, 찾기는 본 지역 OR 같은 유형의 추가 지역.
 * preferred_region_note 는 지우거나 추가 지역으로 옮기지 않는다.
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

let failed = 0;
function ok(name, pass) {
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`);
  if (!pass) failed += 1;
}

const screens = read('preview/home-ui/src/student-reg/screens.js');
const profile = read('preview/home-ui/src/student-reg/profile-read.js');
const search = read('src/Search/SearchService.php');
const hub = read('src/Registration/StudentHubRepository.php');
const store = read('preview/home-ui/src/student-reg/store.js');
const completeness = read('src/Registration/StudentBasicCompleteness.php');
const sql = read('sql/schema/087_student_hope_region_extra.sql');
const rollback = read('sql/schema/087_student_hope_region_extra_rollback.sql');

ok('상세 입력에 옛 메모 칸이 없다', !screens.includes("renderTextInput('preferred_region_note'"));
ok('라벨은 희망지역 추가', screens.includes("'희망지역 추가'") && profile.includes("label: '희망지역 추가'"));
ok('과외 추가는 기존 시·도·시·군 위젯', screens.includes("hiddenName: 'preferred_tutor_region_extra_id'") && screens.includes('renderTutorUnitCascade('));
ok('공부방 추가는 기존 주소검색 위젯', screens.includes('renderStudentHopeRegion(extraHopeRegionValues(student))'));
ok('본 과외 희망지역 칸 이름은 그대로', screens.includes("field.hiddenName || 'preferred_tutor_region_id'"));
ok('다른 유형 추가 값은 화면에 채우지 않는다', screens.includes("student.preferred_lesson_type !== 'study_room'"));
ok('저장은 메모를 추가 지역으로 쓰지 않는다', screens.includes('delete patch.preferred_region_note'));
ok('읽기는 추가 지역 라벨', profile.includes('display(extraHopeLabel(s))') && !profile.includes('preferred_region_note'));

ok(
  '과외 찾기는 본 지역과 추가 지역 OR',
  search.includes("'s.preferred_tutor_region_id = :preferred_tutor_unit_id'") &&
    search.includes("'s.preferred_tutor_region_extra_id = :preferred_tutor_unit_extra_id'") &&
    search.includes("studentHopeOr("),
);
ok(
  '공부방 동 찾기는 본 지역과 추가 지역 OR',
  search.includes("'s.preferred_studyroom_region_id = :preferred_studyroom_region_id'") &&
    search.includes("'s.preferred_studyroom_region_extra_id = :preferred_studyroom_region_extra_id'"),
);
ok(
  '공부방 단지 찾기는 본 지역과 추가 지역 OR',
  search.includes("'s.preferred_studyroom_complex_id = :preferred_studyroom_complex_id'") &&
    search.includes("'s.preferred_studyroom_complex_extra_id = :preferred_studyroom_complex_extra_id'"),
);
ok(
  '게스트 수도 같은 OR',
  search.includes("'s.preferred_tutor_region_extra_id = :guest_tutor_unit_extra_id'") &&
    search.includes('preferred_studyroom_region_extra_id IN'),
);
ok(
  '다른 유형의 추가 지역은 찾기 조건에 없다',
  search.includes("s.preferred_lesson_type = '\\'' + $lesson . '\\''") ||
    search.includes("s.preferred_lesson_type = \\'' . $lesson . '\\'"),
);

const hopeOr = search.slice(search.indexOf('function studentHopeOr'), search.indexOf('function studentHopeOr') + 500);
ok('추가 지역 OR는 같은 희망 유형만', hopeOr.includes('preferred_lesson_type') && hopeOr.includes('$lesson'));

ok('메모 컬럼 저장은 남긴다', hub.includes("'preferred_region_note'"));
ok('메모를 추가 지역 id에 넣지 않는다', !/preferred_region_note[^\n]{0,120}extra_id/.test(hub));
ok('추가 단지 이름은 본 단지 이름과 분리', hub.includes('extra_complex_name') && hub.includes("patch['complex_name']"));
ok('기본정보 완료는 본 지역만', !completeness.includes('extra_id') && !/isId\(student\.preferred_[a-z_]*extra_id\)/.test(store));

const columns = [
  'preferred_tutor_region_extra_id',
  'preferred_studyroom_region_extra_id',
  'preferred_studyroom_complex_extra_id',
  'preferred_studyroom_region_extra_basis',
];
ok('087이 추가 칸 4개를 만든다', columns.every((col) => sql.includes(`COLUMN_NAME = '${col}'`) && sql.includes(`ADD COLUMN ${col}`)));
ok('087은 메모를 지우거나 옮기지 않는다', sql.includes('preferred_region_note 는 지우지 않고') && !/UPDATE\s+students/i.test(sql) && !/DROP\s+COLUMN/i.test(sql));
ok('롤백은 추가 칸만 지운다', columns.every((col) => rollback.includes(`DROP COLUMN ${col}`)) && !/preferred_region_note/i.test(rollback.replace('preferred_region_note 는 지우지 않는다.', '')));

console.log(failed === 0 ? 'OK' : `FAIL ${failed}`);
process.exit(failed === 0 ? 0 : 1);
