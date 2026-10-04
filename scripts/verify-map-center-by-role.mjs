/**
 * 사이트오류-22 · 로그인한 공부방 지도는 홍보1, 게스트만 대치역.
 * 실행: cd preview/home-ui && npx vite-node ../../scripts/verify-map-center-by-role.mjs
 *
 * 가짜 네이버 지오코더. DB·실 SDK 에 접속하지 않는다.
 * (a) 공부방 dong → promo_label 질의
 * (b) complex → complex_address 질의
 * (c) 주소 없음·미등록 → 안내 문구, 대치 아님
 * (d) 핀이 있어도 공부방은 홍보1 중심
 * (e) 게스트는 대치 고정
 * (f) 학생 경로는 핀 평균·기존 문구 유지
 * 변이: (d)의 핀 무시 한 줄을 되돌리면 (d) 단언이 실패한다.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');

let passed = 0;
let failed = 0;
function ok(name, cond, detail = '') {
  let value = cond;
  try {
    value = typeof cond === 'function' ? cond() : cond;
  } catch (e) {
    value = false;
    detail = `${detail} threw ${e?.message || e}`.trim();
  }
  if (value) {
    passed += 1;
    console.log(`PASS  ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

const PROMO = '경기도 의정부시 민락동';
const PROMO_COMPLEX = '경기도 의정부시 민락동 · 한라비발디';
const ADDR = '경기도 의정부시 민락로 100';
const UNREG = '(주소 미등록) 한라비발디';
const GEO = { lat: 37.74, lng: 127.07 };
const PIN = { lat: 35.1, lng: 129.1 };
const GUEST = { lat: 37.494511, lng: 127.063369 };

/* ══════════════════════ 서버: 허브 saved_regions ══════════════════════ */

const PHP_CODE = String.raw`<?php
declare(strict_types=1);
require_once getcwd() . '/src/bootstrap.php';

use Study114\Database\Connection;
use Study114\Registration\StudyRoomHubRepository;

final class McStmt
{
    private array $rows = [];
    private mixed $column = false;
    private int $cursor = 0;
    public function __construct(private McPdo $pdo, private string $sql) {}
    public function execute(?array $params = null): bool
    {
        $sql = preg_replace('/\s+/', ' ', trim($this->sql));
        $p = array_values($params ?? []);
        $a = $this->pdo->answer($sql, $p);
        $this->rows = $a['rows'] ?? [];
        $this->column = array_key_exists('column', $a) ? $a['column'] : false;
        $this->cursor = 0;
        return true;
    }
    public function fetch(mixed ...$a): mixed { return $this->rows[$this->cursor++] ?? false; }
    public function fetchColumn(mixed ...$a): mixed { return $this->column; }
    public function fetchAll(mixed ...$a): array { return $this->rows; }
    public function rowCount(): int { return count($this->rows); }
}

final class McPdo extends PDO
{
    /** @var list<array<string, mixed>> */
    public array $slots = [];
    /** @var list<array<string, mixed>> */
    public array $rooms = [];
    public function __construct() {}
    #[\ReturnTypeWillChange] public function prepare(string $q, array $o = []): McStmt { return new McStmt($this, $q); }
    /** @param list<mixed> $p */
    public function answer(string $sql, array $p): array
    {
        if (str_contains($sql, 'FROM study_rooms sr') && str_contains($sql, 'user_id')) {
            return ['rows' => $this->rooms];
        }
        if (str_contains($sql, 'c.address AS complex_address')) {
            $id = (int) ($p[0] ?? 0);
            $rows = [];
            foreach ($this->slots as $slot) {
                if ((int) $slot['study_room_id'] === $id) $rows[] = $slot;
            }
            return ['rows' => $rows];
        }
        if (str_contains($sql, 'CONCAT(r.dong_name')) return ['column' => ''];
        if (str_contains($sql, 'SELECT 1 FROM study_room_regions')) return ['column' => 1];
        return ['rows' => [], 'column' => false];
    }
}

function room(int $id): array
{
    return [
        'id' => $id, 'user_id' => 4, 'study_room_name' => '방' . $id, 'profile_status' => 'published',
        'inquiry_status' => 'open', 'detail_completion_status' => 'basic_only',
        'region_id' => null, 'complex_id' => null, 'region_basis_type' => 'dong',
        'main_subject_note' => '', 'price_amount' => null, 'intro_short' => null, 'intro_long' => null,
        'slogan' => null, 'feature_1' => null, 'career_years' => null,
        'education_office_registered' => 0, 'weekend_available' => 0, 'one_on_one_available' => 0,
        'lesson_place_type' => null, 'capacity_per_time' => null,
        'created_at' => '2026-01-01 00:00:00', 'updated_at' => '2026-01-02 00:00:00', 'published_at' => null,
        'deleted_at' => null,
    ];
}

$pdo = new McPdo();
$pdo->rooms = [room(1), room(2), room(3)];
$pdo->slots = [
    [
        'study_room_id' => 1, 'region_id' => 11, 'complex_id' => null, 'region_basis_type' => 'dong',
        'is_primary' => 1, 'dong_name' => '민락동', 'sigungu_name' => '의정부시', 'sido_name' => '경기도',
        'complex_name' => '새면 안 됨', 'complex_address' => 'LEAK',
    ],
    [
        'study_room_id' => 2, 'region_id' => 11, 'complex_id' => 8, 'region_basis_type' => 'complex',
        'is_primary' => 1, 'dong_name' => '민락동', 'sigungu_name' => '의정부시', 'sido_name' => '경기도',
        'complex_name' => '한라비발디', 'complex_address' => '경기도 의정부시 민락로 100',
    ],
    [
        'study_room_id' => 3, 'region_id' => 11, 'complex_id' => 9, 'region_basis_type' => 'complex',
        'is_primary' => 1, 'dong_name' => '민락동', 'sigungu_name' => '의정부시', 'sido_name' => '경기도',
        'complex_name' => '한라비발디', 'complex_address' => '(주소 미등록) 한라비발디',
    ],
];
(new ReflectionProperty(Connection::class, 'pdo'))->setValue(null, $pdo);
$list = (new StudyRoomHubRepository($pdo))->listForOwner(4);
$byId = [];
foreach ($list as $row) { $byId[(int) $row['id']] = $row['saved_regions'][0] ?? null; }
$dong = $byId[1];
$complex = $byId[2];
$unreg = $byId[3];
$ok = static function (string $name, bool $cond, string $detail = ''): void {
    echo ($cond ? 'PASS  ' : 'FAIL  ') . $name . ($cond || $detail === '' ? '' : ' — ' . $detail) . "\n";
};
$ok('M1 동 슬롯 complex_name·complex_address 는 null', is_array($dong) && $dong['complex_name'] === null && $dong['complex_address'] === null, json_encode($dong, JSON_UNESCAPED_UNICODE));
$ok('M1 동 슬롯 promo_label 유지', is_array($dong) && $dong['promo_label'] === '경기도 의정부시 민락동' && $dong['region_basis_type'] === 'dong');
$ok('M1 단지 슬롯 complex_name·complex_address', is_array($complex) && $complex['complex_name'] === '한라비발디' && $complex['complex_address'] === '경기도 의정부시 민락로 100', json_encode($complex, JSON_UNESCAPED_UNICODE));
$ok('M1 단지 promo_label 유지', is_array($complex) && $complex['promo_label'] === '경기도 의정부시 민락동 · 한라비발디');
$ok('M1 미등록 주소는 그대로 전달', is_array($unreg) && $unreg['complex_address'] === '(주소 미등록) 한라비발디');
`;

function phpBin() {
  if (process.env.PHP_BIN) return process.env.PHP_BIN;
  if (existsSync('D:\\php8.2\\php.exe')) return 'D:\\php8.2\\php.exe';
  return 'php';
}

console.log('##### 서버 #####');
const php = spawnSync(phpBin(), [], { cwd: ROOT, input: PHP_CODE, encoding: 'utf8' });
const phpOut = `${php.stdout || ''}`;
for (const line of phpOut.split(/\r?\n/)) {
  if (line.startsWith('PASS  ')) {
    passed += 1;
    console.log(line);
  } else if (line.startsWith('FAIL  ')) {
    failed += 1;
    console.log(line);
  } else if (line.trim()) {
    console.log(line);
  }
}
ok('PHP 검사 프로세스 정상 종료', php.status === 0 && !/Fatal error|Parse error/.test(`${phpOut}\n${php.stderr || ''}`), `${php.status} ${(php.stderr || '').slice(0, 500)}`);

/* ══════════════════════ 프런트 ══════════════════════ */

function makeStorage() {
  const mem = new Map();
  return {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => mem.set(k, String(v)),
    removeItem: (k) => mem.delete(k),
    clear: () => mem.clear(),
    key: (i) => [...mem.keys()][i] ?? null,
    get length() { return mem.size; },
  };
}
globalThis.sessionStorage = makeStorage();
globalThis.localStorage = makeStorage();
globalThis.window = globalThis;
if (typeof globalThis.HTMLElement === 'undefined') {
  globalThis.HTMLElement = class HTMLElement {};
}
if (typeof globalThis.document === 'undefined') {
  globalThis.document = { createElement() { return {}; }, head: { appendChild() {} } };
}

const naverMap = await import(pathToFileURL(join(ROOT, 'preview/shared/naver-map.js')).href);
const seed = await import(pathToFileURL(join(ROOT, 'preview/home-ui/src/study-room-home-seed.js')).href);
const copy = await import(pathToFileURL(join(ROOT, 'preview/home-ui/src/empty-state-copy.js')).href);
const searchMap = await import(pathToFileURL(join(ROOT, 'preview/search-ui/src/search-map.js')).href);

const ROOM_KEY = 'study114-preview-study-rooms-v1';
function seedRoom(slot) {
  sessionStorage.setItem(ROOM_KEY, JSON.stringify({
    rooms: [{
      id: 1,
      profile_status: 'published',
      deleted_at: null,
      study_room_name: '민락공부방',
      saved_regions: [{ is_primary: true, ...slot }],
    }],
  }));
}

function fakeNaver(book) {
  const Status = { OK: 'OK' };
  class LatLng {
    constructor(lat, lng) { this.lat = Number(lat); this.lng = Number(lng); }
  }
  return {
    maps: {
      Service: {
        Status,
        geocode(opts, cb) {
          const query = String(opts?.query || '');
          book.queries.push(query);
          const hit = book.points[query];
          if (!hit) {
            cb('ZERO', {});
            return;
          }
          cb(Status.OK, { v2: { addresses: [{ y: String(hit.lat), x: String(hit.lng) }] } });
        },
      },
      LatLng,
      Size: class { constructor() {} },
      Point: class { constructor() {} },
      Position: { TOP_RIGHT: 1 },
      LatLngBounds: class { constructor() {} extend() {} },
      Event: { addListener() {} },
      Marker: class { setIcon() {} setZIndex() {} setMap() {} },
      Map: class {
        constructor(_el, opts) {
          this.center = opts.center;
          this.zoom = opts.zoom;
          book.maps.push(this);
        }
        setCenter(c) { this.center = c; }
        setZoom(z) { this.zoom = z; }
        fitBounds() { book.fit = true; }
        panTo() {}
      },
    },
  };
}

function makeEl() {
  const el = new globalThis.HTMLElement();
  el.innerHTML = '';
  el.classList = { add() {}, remove() {} };
  return el;
}

async function mount(opts, book) {
  const el = makeEl();
  book.el = el;
  const controller = await naverMap.mountStudyRoomMap(el, { naver: fakeNaver(book), variant: 'search', ...opts });
  return { el, controller, book };
}

function book() {
  return {
    queries: [],
    maps: [],
    points: {
      [PROMO]: GEO,
      [ADDR]: GEO,
      [PROMO_COMPLEX]: { lat: 37.8, lng: 127.08 },
      '경기도 의정부시 신곡동': GEO,
    },
    fit: false,
  };
}

const pinItem = { id: 9, latitude: PIN.lat, longitude: PIN.lng, profile_status: 'published', study_room_name: '다른방' };

function centeredOn(run, lat, lng) {
  const map = run.book.maps[0];
  return Boolean(map) && map.center.lat === lat && map.center.lng === lng;
}

console.log('##### 질의 규칙 #####');
seedRoom({ region_basis_type: 'dong', promo_label: PROMO, complex_name: null, complex_address: null });
const dongSlot = seed.peekStudyRoomPromo1MapSlot();
ok('(a) peek 동 슬롯', dongSlot.basis === 'dong' && dongSlot.promo_label === PROMO && dongSlot.complex_address === null, JSON.stringify(dongSlot));
ok('(a) 동 질의 = promo_label', seed.studyRoomGeocodeQuery(dongSlot).query === PROMO && seed.studyRoomGeocodeQuery(dongSlot).blocked === false);

seedRoom({ region_basis_type: 'complex', promo_label: PROMO_COMPLEX, complex_name: '한라비발디', complex_address: ADDR });
const complexSlot = seed.peekStudyRoomPromo1MapSlot();
ok('(b) peek 단지 슬롯', complexSlot.basis === 'complex' && complexSlot.complex_address === ADDR, JSON.stringify(complexSlot));
ok('(b) 단지 질의 = complex_address', seed.studyRoomGeocodeQuery(complexSlot).query === ADDR);

seedRoom({ region_basis_type: 'complex', promo_label: PROMO_COMPLEX, complex_address: null });
const emptyAddr = seed.peekStudyRoomPromo1MapSlot();
ok('(c) 빈 주소는 라벨로 대체하지 않음', seed.studyRoomGeocodeQuery(emptyAddr).blocked === true && seed.studyRoomGeocodeQuery(emptyAddr).query === '');
seedRoom({ region_basis_type: 'complex', promo_label: PROMO_COMPLEX, complex_address: UNREG });
const unregSlot = seed.peekStudyRoomPromo1MapSlot();
ok('(c) (주소 미등록) 은 질의하지 않음', seed.studyRoomGeocodeQuery(unregSlot).blocked === true && seed.studyRoomGeocodeQuery(unregSlot).query === '');
ok('안내 문구에 위치를 선택해 주세요 없음', !String(copy.STUDY_ROOM_MAP_COPY.unplaced).includes('위치를 선택해 주세요') && !String(copy.STUDY_ROOM_MAP_COPY.notFound).includes('위치를 선택해 주세요'));

ok('찾기 URL 은 고른 라벨', () => {
  seedRoom({ region_basis_type: 'complex', promo_label: PROMO_COMPLEX, complex_address: ADDR });
  const q = seed.resolveStudyRoomMapQuery({
    canonicalLocation: { source: 'url', displayLabel: '서울특별시 송파구 잠실동' },
    activeRegionLabel: '서울특별시 송파구 잠실동',
  }, 'search');
  return q.picked === true && q.query === '서울특별시 송파구 잠실동';
});
ok('홈은 주소 선택이 있어도 대표 슬롯', () => {
  const q = seed.resolveStudyRoomMapQuery({
    canonicalLocation: { source: 'address', displayLabel: '서울특별시 송파구 잠실동' },
    activeRegionLabel: '서울특별시 송파구 잠실동',
  }, 'home');
  return q.picked === false && q.query === ADDR;
});

console.log('##### 가짜 지오코더 #####');
{
  seedRoom({ region_basis_type: 'dong', promo_label: PROMO, complex_address: null });
  const slot = seed.peekStudyRoomPromo1MapSlot();
  const q = seed.studyRoomGeocodeQuery(slot);
  const run = await mount({
    items: [],
    regionLabel: slot.promo_label,
    geocodeQuery: q.query,
    geocodeRegion: true,
    memberMap: true,
    pinAnchorsCenter: false,
  }, book());
  ok('(a) 지오코더 질의 = promo_label', run.book.queries[0] === PROMO && centeredOn(run, GEO.lat, GEO.lng), JSON.stringify(run.book.queries));
  ok('(a) 대치 좌표로 열지 않음', run.book.maps[0]?.center.lat !== GUEST.lat);
}
{
  seedRoom({ region_basis_type: 'complex', promo_label: PROMO_COMPLEX, complex_address: ADDR });
  const slot = seed.peekStudyRoomPromo1MapSlot();
  const q = seed.studyRoomGeocodeQuery(slot);
  const run = await mount({
    items: [],
    regionLabel: slot.promo_label,
    geocodeQuery: q.query,
    geocodeRegion: true,
    memberMap: true,
    pinAnchorsCenter: false,
  }, book());
  ok('(b) 지오코더 질의 = complex_address', run.book.queries.length === 1 && run.book.queries[0] === ADDR && run.book.queries[0] !== PROMO_COMPLEX, JSON.stringify(run.book.queries));
  ok('(b) 중심은 그 질의의 좌표', centeredOn(run, GEO.lat, GEO.lng));
}
{
  const run = await mount({
    items: [pinItem],
    regionLabel: PROMO_COMPLEX,
    geocodeQuery: '',
    geocodeRegion: true,
    memberMap: true,
    pinAnchorsCenter: false,
  }, book());
  const html = run.el.innerHTML;
  ok('(c) 주소 없음 → 안내 문구', html.includes(copy.STUDY_ROOM_MAP_COPY.unplaced), html);
  ok('(c) 지오코더를 부르지 않음', run.book.queries.length === 0, JSON.stringify(run.book.queries));
  ok('(c) 지도를 만들지 않고 대치 아님', run.book.maps.length === 0 && !html.includes(String(GUEST.lat)) && run.controller === null);
}
{
  const run = await mount({
    items: [],
    regionLabel: PROMO,
    geocodeQuery: PROMO,
    geocodeRegion: true,
    memberMap: true,
    pinAnchorsCenter: false,
    pointsNote: true,
  }, { ...book(), points: {} });
  ok('(c) 지오코딩 실패 → 못 찾음 문구, 대치 아님', run.el.innerHTML.includes(copy.STUDY_ROOM_MAP_COPY.notFound) && run.book.maps.length === 0 && !run.el.innerHTML.includes(String(GUEST.lat)));
}
{
  const run = await mount({
    items: [pinItem],
    regionLabel: PROMO,
    geocodeQuery: PROMO,
    geocodeRegion: true,
    memberMap: true,
    pinAnchorsCenter: false,
  }, book());
  const promoCentered = (r) => r.book.queries[0] === PROMO && centeredOn(r, GEO.lat, GEO.lng) && r.book.maps[0]?.center.lat !== PIN.lat;
  ok('(d) 핀이 있어도 중심은 홍보1 지오코딩', promoCentered(run), JSON.stringify({ q: run.book.queries, center: run.book.maps[0]?.center }));
  ok('(d) 핀 맞춤으로 중심을 옮기지 않음', run.book.fit !== true && run.book.maps[0]?.center.lat !== PIN.lat);

  const reverted = await mount({
    items: [pinItem],
    regionLabel: PROMO,
    geocodeQuery: PROMO,
    geocodeRegion: true,
    memberMap: true,
    pinAnchorsCenter: true,
  }, book());
  ok('mutation self-check: usePins 가드를 되돌리면 (d)가 실패한다', promoCentered(reverted) === false && centeredOn(reverted, PIN.lat, PIN.lng) && reverted.book.queries.length === 0, JSON.stringify({ q: reverted.book.queries, center: reverted.book.maps[0]?.center }));
}
{
  const run = await mount({
    items: [pinItem],
    lat: GUEST.lat,
    lng: GUEST.lng,
    fitBounds: false,
    geocodeRegion: false,
    regionLabel: '대치동',
  }, book());
  ok('(e) 게스트 명시 좌표는 대치역', centeredOn(run, GUEST.lat, GUEST.lng) && run.book.queries.length === 0 && run.book.fit !== true);
  ok('(e) 게스트 중심 상수는 대치역', naverMap.GUEST_MAP_CENTER.lat === GUEST.lat && naverMap.GUEST_MAP_CENTER.lng === GUEST.lng);
  const guestHtml = searchMap.renderSearchMapBlock([], {
    regionLabel: '대치동',
    viewerRole: 'guest',
    bannerStyle: 'guest',
  });
  ok('(e) 게스트 찾기 지도 HTML 은 대치 좌표·지오코딩 없음', guestHtml.includes(`data-map-lat="${GUEST.lat}"`) && guestHtml.includes(`data-map-lng="${GUEST.lng}"`) && guestHtml.includes('data-fit-bounds="false"') && !guestHtml.includes('data-geocode-region'));
}
{
  const withPins = await mount({
    items: [pinItem],
    regionLabel: '경기도 의정부시 신곡동',
    geocodeRegion: true,
    regionZoom: 15,
  }, book());
  ok('(f) 학생은 핀이 있으면 핀 중심(지오코딩 안 함)', withPins.book.queries.length === 0 && centeredOn(withPins, PIN.lat, PIN.lng));
  const noPins = await mount({
    items: [],
    regionLabel: '경기도 의정부시 신곡동',
    geocodeRegion: true,
    regionZoom: 15,
  }, book());
  ok('(f) 학생은 핀이 없으면 지역 라벨을 지오코딩', noPins.book.queries[0] === '경기도 의정부시 신곡동' && centeredOn(noPins, GEO.lat, GEO.lng) && noPins.el.innerHTML === '');
  const studentHtml = searchMap.renderSearchMapBlock([], {
    regionLabel: '경기도 의정부시 신곡동',
    viewerRole: 'parent',
    bannerStyle: 'search',
    guestHomeStyle: false,
    regionLevel: 'dong',
  });
  ok('(f) 학생 HTML 은 기존 지오코딩 속성', /data-geocode-region="true" data-map-zoom="15"/.test(studentHtml) && !/data-pin-center/.test(studentHtml) && !/data-member-map/.test(studentHtml) && !/data-map-lat=/.test(studentHtml));
  const naverSrc = read('preview/shared/naver-map.js');
  ok('(f) 학생 분기 조건 줄 유지', /options\.geocodeRegion && center\.source === 'default'/.test(naverSrc));
  ok('(f) 학생 실패 문구 상수 유지', naverSrc.includes("export const REGION_PROMPT_MAP_STATUS = '희망지역을 등록하면 지도가 그 지역으로 이동합니다.'"));
}

console.log('##### 화면 속성 #####');
{
  seedRoom({ region_basis_type: 'complex', promo_label: PROMO_COMPLEX, complex_address: ADDR });
  const q = seed.resolveStudyRoomMapQuery({}, 'home');
  const html = searchMap.renderSearchMapBlock([], {
    regionLabel: q.promo_label,
    viewerRole: 'study_room',
    bannerStyle: 'provider_room',
    providerHome: false,
    geocodeQuery: q.query,
  });
  ok('공부방 지도 HTML 질의 = 도로명', html.includes(`data-geocode-query="${ADDR}"`) && html.includes('data-pin-center="false"') && html.includes('data-member-map="true"') && !html.includes('data-map-lat='));
  ok('공부방 배너 라벨은 promo_label', html.includes(`data-region-label="${PROMO_COMPLEX}"`));
  const detail = read('preview/home-ui/src/detail-decision/studyroom-detail.js');
  ok('상세 지도는 회원 지오코딩, 게스트 문구는 유지', detail.includes('data-geocode-region="true" data-member-map="true"') && detail.includes('위치 핀은 로그인 후'));
  ok('상세 게스트 분기에는 지오코딩 속성이 없다', /isGuest\s*\?\s*`<p class="p24-map-guest-note">위치 핀은 로그인 후/.test(detail));
}
{
  const src = read('preview/shared/naver-map.js');
  const guard = 'if (options.usePins !== false) {';
  const reverted = src.replace(guard, 'if (true) {');
  ok('mutation self-check: 소스의 usePins 가드 한 줄을 지우면 핀 평균이 복구된다', src.includes(guard) && !reverted.includes(guard));
  const surface = read('preview/search-ui/src/search-find-surface.js');
  ok('찾기 화면이 resolveStudyRoomMapQuery 를 지도 질의로 넘긴다', /resolveStudyRoomMapQuery\(state, variant\)/.test(surface) && /geocodeQuery: studyRoomMap \? studyRoomMap\.query : undefined/.test(surface));
}
ok('mutation self-check: 단지를 promo_label 질의로 되돌리면 (b)가 실패한다', () => {
  const slot = { basis: 'complex', promo_label: PROMO_COMPLEX, complex_address: ADDR };
  const real = seed.studyRoomGeocodeQuery(slot).query;
  const reverted = slot.promo_label;
  const passesB = (q) => q === ADDR && q !== PROMO_COMPLEX;
  return passesB(real) && passesB(reverted) === false;
});

const ssot = read('scripts/verify-location-ssot.mjs');
ok('location-ssot 라벨 좌표 고정은 그대로', /라벨만으로는 좌표가 없다/.test(ssot) && /assert\.equal\(coordsFromLabel\(c\.displayLabel\), null\)/.test(ssot));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
