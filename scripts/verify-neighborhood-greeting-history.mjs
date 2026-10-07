/**
 * 동네 인사 3개 이력 및 불러와 고치기 검증 스크립트.
 *
 * 요구사항:
 * (a) listPublic 에 history 없음
 * (b) 소유자 외 history 조회 차단 코드 존재
 * (c) history 최대 3·중복 방지·맨 위 교체·삭제 시 공개 내림 로직
 * (d) 화면: 올리기 버튼이 제목줄, 입력칸 아래 목록, 클릭 불러오기, × 삭제, 성공 시 입력칸 비움, textarea padding 규칙.
 *
 * * 이 PC에는 PHP가 없으므로 서버 검사는 소스 assert로 하고 '실행 검증 미실시(php 없음)'를 명시한다.
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

// Global mock 환경 설정 (모듈 로딩 전 필수)
function makeStorage() {
  const store = new Map();
  return {
    getItem(k) { return store.has(k) ? store.get(k) : null; },
    setItem(k, v) { store.set(k, String(v)); },
    removeItem(k) { store.delete(k); },
    clear() { store.clear(); },
    key(i) { return Array.from(store.keys())[i] || null; },
    get length() { return store.size; },
  };
}
globalThis.sessionStorage = makeStorage();
globalThis.localStorage = makeStorage();
globalThis.window = globalThis;
if (!globalThis.location) {
  globalThis.location = {
    hash: '#/guest',
    pathname: '/',
    search: '',
    replaceState() {},
  };
}
if (!globalThis.document) {
  globalThis.document = {
    cookie: '',
    addEventListener() {},
    removeEventListener() {},
  };
}

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${message}`);
  } else {
    failedTests++;
    console.error(`  [FAIL] ${message}`);
  }
}

console.log('=== 동네 인사 이력(Neighborhood Greeting History) 종합 검증 ===\n');

// --------------------------------------------------------------------------
// 1. 서버 소스 정적 검증 (PHP 소스 assert)
// --------------------------------------------------------------------------
console.log('1. 서버 소스 검증 (PHP 정적 assert)');
console.log('   [안내] 실행 검증 미실시(php 없음) - 소스 코드 구조 및 보안 규칙 assert 수행\n');

const servicePhp = readFileSync(resolve(ROOT, 'src/Neighborhood/NeighborhoodGreetingService.php'), 'utf8');
const apiPhp = readFileSync(resolve(ROOT, 'public/api/neighborhood-greetings.php'), 'utf8');

// (a) listPublic 에 history 없음
const listPublicBodyMatch = servicePhp.match(/public function listPublic\(bool \$full\): array\s*\{([\s\S]*?)return \$items;\s*\}/);
assert(listPublicBodyMatch !== null, 'listPublic 메서드가 존재한다');
if (listPublicBodyMatch) {
  const listPublicCode = listPublicBodyMatch[1];
  assert(!listPublicCode.includes("'history'"), 'listPublic 항목에 history 키가 포함되지 않는다');
  assert(listPublicCode.includes("'status' => 'up'"), 'listPublic 은 status up 인 항목만 포함한다');
}

// (b) 소유자 외 history 조회 차단 코드 존재
assert(apiPhp.includes("$_GET['mine'] === '1'"), 'GET mine=1 파라미터 분기가 존재한다');
assert(apiPhp.includes('AuthSession::userIfActive()'), 'mine=1 조회 시 세션 확인(로그인 필수)을 수행한다');
assert(apiPhp.includes('$service->getMine('), '본인 조회 시 getMine 메서드를 호출한다');

const getMineMatch = servicePhp.match(/public function getMine\([^\)]*\): \?array\s*\{([\s\S]*?)\n    \}/);
assert(getMineMatch !== null, 'NeighborhoodGreetingService 에 getMine 메서드가 존재한다');
if (getMineMatch) {
  const getMineCode = getMineMatch[1];
  assert(getMineCode.includes('$this->assertOwns($userId, $providerType, $registrationId)'), 'getMine 에 assertOwns 소유자 검증이 존재한다');
  assert(getMineCode.includes('$roleType !== $expected'), 'getMine 에 roleType 역할 검증이 존재한다');
}

// (c) history 최대 3 · 중복 방지 · 맨 위 교체 · 삭제 시 공개 내림 로직
assert(servicePhp.includes('extractHistory'), '기존 데이터 하위 호환을 위한 extractHistory 메서드가 존재한다');
assert(servicePhp.includes('array_slice($history, 0, 3)'), 'history 최대 3개 유지를 위한 array_slice 가 존재한다');

const saveMatch = servicePhp.match(/public function save\([^\)]*\): array\s*\{([\s\S]*?)\n    \}/);
assert(saveMatch !== null, 'save 메서드가 존재한다');
if (saveMatch) {
  const saveCode = saveMatch[1];
  assert(saveCode.includes('$action === \'delete\''), 'save 입력에 delete 액션 라우팅이 존재한다');
  assert(saveCode.includes('history_id'), 'save 에 history_id 처리 로직이 존재한다');
  assert(saveCode.includes('$item[\'body\'] === $body'), 'save 에 본문 중복 방지 로직이 존재한다');
  assert(saveCode.includes('array_unshift($history,'), '새/수정된 인사를 history 맨 앞에 삽입한다');
  assert(saveCode.includes('$row = [') && saveCode.includes('\'body\' => $history[0][\'body\']'), '행의 body는 항상 history[0] 기준으로 동기화된다');
}

const deleteMatch = servicePhp.match(/public function delete\([^\)]*\): array\s*\{([\s\S]*?)\n    \}/);
assert(deleteMatch !== null, 'delete 메서드가 존재한다');
if (deleteMatch) {
  const delCode = deleteMatch[1];
  assert(delCode.includes('$this->assertOwns'), 'delete 에 assertOwns 소유자 검증이 존재한다');
  assert(delCode.includes('$wasTop && $wasUp'), '삭제된 항목이 history[0]이고 공개 중(up)이었는지 검사한다');
  assert(delCode.includes('\'down\''), 'history[0] 공개 항목 삭제 시 status 를 down 으로 내려 자동 공개를 차단한다');
  assert(delCode.includes('array_splice($history,'), 'history 에서 대상 항목을 제거한다');
}

// --------------------------------------------------------------------------
// 2. CSS 스타일 규칙 검증
// --------------------------------------------------------------------------
console.log('\n2. CSS 스타일 규칙 검증');
const css = readFileSync(resolve(ROOT, 'preview/home-ui/src/styles/neighborhood-greeting.css'), 'utf8');

assert(css.includes('.ng-editor__head'), '.ng-editor__head 제목줄 클래스가 존재한다');
assert(css.includes('.ng-editor__submit-btn'), '.ng-editor__submit-btn 올리기 버튼 클래스가 존재한다');
assert(css.includes('.ng-editor__editing-hint'), '.ng-editor__editing-hint 편집 중 안내 문구 클래스가 존재한다');
assert(css.includes('.ng-editor__input') && (css.includes('var(--space-2') || css.includes('padding: 0.5rem') || css.includes('padding: var(--space-2')), 'textarea(.ng-editor__input) 안쪽 들여쓰기 여백(padding var(--space-2)...) 규칙이 존재한다');
assert(css.includes('.ng-editor__history-list'), '.ng-editor__history-list 이력 목록 클래스가 존재한다');
assert(css.includes('.ng-editor__history-loading'), '.ng-editor__history-loading 클래스가 존재한다');
assert(css.includes('.ng-editor__history-fallback'), '.ng-editor__history-fallback 클래스가 존재한다');
assert(css.includes('.ng-editor__badge'), '.ng-editor__badge 게시 중 배지 클래스가 존재한다');
assert(css.includes('.ng-editor__down-btn'), '.ng-editor__down-btn 내리기 버튼 클래스가 존재한다');
assert(css.includes('.ng-editor__del-btn'), '.ng-editor__del-btn 삭제 버튼 클래스가 존재한다');

// --------------------------------------------------------------------------
// 3. JS 클라이언트 Store 및 UI 모듈 검증
// --------------------------------------------------------------------------
console.log('\n3. 클라이언트 모듈(Store & UI) 검증');

const uiSource = readFileSync(resolve(ROOT, 'preview/home-ui/src/neighborhood-greeting-ui.js'), 'utf8');
const storeSource = readFileSync(resolve(ROOT, 'preview/shared/neighborhood-greeting-store.js'), 'utf8');
assert(!uiSource.includes("'init'") && !uiSource.includes('"init"'), 'UI 소스에 가짜 id("init")가 존재하지 않는다');
assert(!storeSource.includes("'init'") && !storeSource.includes('"init"'), 'Store 소스에 가짜 id("init")가 존재하지 않는다');

const store = await import('../preview/shared/neighborhood-greeting-store.js');
const greetingHelper = await import('../preview/shared/neighborhood-greeting.js');
const ui = await import('../preview/home-ui/src/neighborhood-greeting-ui.js');

// (a) buildGreetingRecord
const built = greetingHelper.buildGreetingRecord({
  providerType: 'tutor',
  registrationId: 42,
  body: '안녕하세요 반갑습니다!',
  neighborhood: '역삼동',
  displayName: '수학쌤',
  historyId: 'h_test_123',
});
assert(built.ok === true, 'buildGreetingRecord 유효 입력 성공');
assert(built.record.historyId === 'h_test_123', 'historyId 가 record 에 전달된다');

// (b) renderNeighborhoodGreetingEditor 레이아웃 검증
const htmlEmpty = ui.renderNeighborhoodGreetingEditor({
  providerType: 'tutor',
  registrationId: 42,
  neighborhood: '역삼동',
  displayName: '수학쌤',
});

assert(htmlEmpty.includes('class="ng-editor__head"'), '제목줄 컨테이너 ng-editor__head 가 렌더링된다');
assert(htmlEmpty.includes('동네 인사</h3>'), '동네 인사 제목이 포함된다');
assert(htmlEmpty.includes('data-ng-save>올리기</button>'), '제목줄에 [올리기] 버튼이 렌더링된다');
assert(htmlEmpty.includes('<textarea class="form-input ng-editor__input"'), '입력창(textarea)이 렌더링된다');
assert(htmlEmpty.includes('data-ng-editing-hint'), '편집 중 안내문 컨테이너가 렌더링된다');
assert(htmlEmpty.includes('data-ng-history-wrap'), '입력창 아래에 이력 목록 컨테이너가 렌더링된다');
assert(htmlEmpty.includes('불러오는 중…') || htmlEmpty.includes('ng-editor__history-loading'), '서버 이력 동기화 전에는 "불러오는 중…"이 표시된다');
assert(ui.renderGreetingHistoryList([], false).includes('아직 올린 인사가 없어요'), '이력이 빈 배열일 때 안내 문구가 표시된다');

// (c) renderGreetingHistoryList 렌더링 검증
const mockHistory = [
  { id: 'h1', body: '첫 번째 인사글입니다', updated_at: 1728345600000 },
  { id: 'h2', body: '두 번째 인사글입니다', updated_at: 1728259200000 },
  { id: 'h3', body: '세 번째 인사글입니다', updated_at: 1728172800000 },
];

const listHtmlUp = ui.renderGreetingHistoryList(mockHistory, true);
assert(listHtmlUp.includes('첫 번째 인사글입니다'), '이력 본문이 표시된다');
assert(listHtmlUp.includes('두 번째 인사글입니다'), '두 번째 이력 본문이 표시된다');
assert(listHtmlUp.includes('세 번째 인사글입니다'), '세 번째 이력 본문이 표시된다');
assert(listHtmlUp.includes('게시 중</span>'), '공개 중일 때 첫 항목에 [게시 중] 배지가 표시된다');
assert(listHtmlUp.includes('data-ng-down>내리기</button>'), '공개 중일 때 [내리기] 버튼이 표시된다');
assert((listHtmlUp.match(/게시 중<\/span>/g) || []).length === 1, '[게시 중] 배지는 최신 1개에만 표시된다');
assert((listHtmlUp.match(/aria-label="인사 지우기"/g) || []).length === 3, '각 항목마다 [인사 지우기] (×) 버튼이 존재한다');
assert(listHtmlUp.includes('data-ng-pick-history="h1"'), '항목 본문 클릭 시 불러오기를 위한 data-ng-pick-history 속성이 있다');

const listHtmlDown = ui.renderGreetingHistoryList(mockHistory, false);
assert(!listHtmlDown.includes('게시 중</span>'), 'status가 down일 때는 [게시 중] 배지가 표시되지 않는다');
assert(!listHtmlDown.includes('data-ng-down>내리기</button>'), 'status가 down일 때는 [내리기] 버튼이 표시되지 않는다');

// --------------------------------------------------------------------------
// 4. 모의 DOM 상호작용 검증 (클릭 불러오기, 취소, 삭제, 올리기)
// --------------------------------------------------------------------------
console.log('\n4. 모의 DOM 상호작용 검증');

// 간단한 이벤트 및 DOM 요소 모의체 구현
class MockElement {
  constructor(tagName = 'div', attrs = {}) {
    this.tagName = tagName.toUpperCase();
    this.attributes = { ...attrs };
    this.children = [];
    this.parentNode = null;
    this.listeners = {};
    this.value = '';
    this.hidden = false;
    this.textContent = '';
    this.innerHTMLText = '';
  }
  setAttribute(k, v) { this.attributes[k] = String(v); }
  getAttribute(k) { return this.attributes[k] ?? null; }
  hasAttribute(k) { return k in this.attributes; }
  addEventListener(type, fn) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(fn);
  }
  async dispatch(event) {
    const list = this.listeners[event.type] || [];
    for (const fn of list) await fn(event);
    if (this.parentNode) await this.parentNode.dispatch(event);
  }
  querySelector(sel) {
    if (sel.startsWith('[') && sel.endsWith(']')) {
      const attr = sel.slice(1, -1);
      return this.find((el) => el.hasAttribute(attr));
    }
    if (sel.startsWith('.')) {
      const cls = sel.slice(1);
      return this.find((el) => (el.getAttribute('class') || '').split(' ').includes(cls));
    }
    return this.find((el) => el.tagName.toLowerCase() === sel.toLowerCase());
  }
  find(predicate) {
    for (const child of this.children) {
      if (predicate(child)) return child;
      const res = child.find(predicate);
      if (res) return res;
    }
    return null;
  }
  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
  }
  closest(sel) {
    if (sel.startsWith('[') && sel.endsWith(']')) {
      const attr = sel.slice(1, -1);
      if (this.hasAttribute(attr)) return this;
    }
    return this.parentNode ? this.parentNode.closest(sel) : null;
  }
  focus() {}
  get isConnected() { return true; }
  set innerHTML(val) { this.innerHTMLText = val; }
  get innerHTML() { return this.innerHTMLText; }
}

globalThis.Element = MockElement;
globalThis.HTMLTextAreaElement = class extends MockElement {};

// Editor container 구조 구성
const editorEl = new MockElement('section', {
  'data-ng-editor': '',
  'data-ng-type': 'tutor',
  'data-ng-id': '42',
  'data-ng-area': '역삼동',
  'data-ng-name': '수학쌤',
});

const saveBtn = new MockElement('button', { 'data-ng-save': '' });
const bodyTextarea = new HTMLTextAreaElement('textarea', { 'data-ng-body': '' });
const hintP = new MockElement('p', { 'data-ng-editing-hint': '' });
hintP.hidden = true;
const cancelBtn = new MockElement('button', { 'data-ng-cancel-edit': '' });
hintP.appendChild(cancelBtn);
const statusP = new MockElement('p', { 'data-ng-status': '' });
const errorP = new MockElement('p', { 'data-ng-error': '' });
const historyWrap = new MockElement('div', { 'data-ng-history-wrap': '' });

const pickBtn = new MockElement('button', { 'data-ng-pick-history': 'h2' });
const delBtn = new MockElement('button', { 'data-ng-del-history': 'h3' });
historyWrap.appendChild(pickBtn);
historyWrap.appendChild(delBtn);

editorEl.appendChild(saveBtn);
editorEl.appendChild(hintP);
editorEl.appendChild(bodyTextarea);
editorEl.appendChild(statusP);
editorEl.appendChild(errorP);
editorEl.appendChild(historyWrap);

const root = new MockElement('div');
root.appendChild(editorEl);

// Local storage 에 샘플 저장
localStorage.setItem('study114-neighborhood-greetings-v1', JSON.stringify([
  {
    id: 'tutor:42',
    providerType: 'tutor',
    registrationId: 42,
    body: '첫 번째 글',
    neighborhood: '역삼동',
    displayName: '수학쌤',
    status: 'up',
    updatedAt: 1000,
    history: mockHistory,
  },
]));

// Mock fetch
let lastPost = null;
globalThis.fetch = async (url, opts = {}) => {
  const method = opts.method || 'GET';
  if (method === 'GET' && url.includes('mine=1')) {
    return {
      ok: true,
      json: async () => ({
        ok: true,
        item: {
          provider_type: 'tutor',
          registration_id: 42,
          status: 'up',
          body: '첫 번째 글',
          history: mockHistory,
        },
      }),
    };
  }
  if (method === 'POST') {
    const body = JSON.parse(opts.body || '{}');
    lastPost = body;
    if (body.action === 'delete') {
      const remaining = mockHistory.filter((h) => h.id !== body.history_id);
      return {
        ok: true,
        json: async () => ({
          ok: true,
          item: {
            provider_type: 'tutor',
            registration_id: 42,
            status: 'up',
            body: remaining[0]?.body || '',
            history: remaining,
            updated_at: Date.now(),
          },
        }),
      };
    }
    const newHistory = [
      { id: body.history_id || 'h_new', body: body.body, updated_at: Date.now() },
      ...mockHistory.filter((h) => h.id !== body.history_id && h.body !== body.body),
    ].slice(0, 3);
    return {
      ok: true,
      json: async () => ({
        ok: true,
        item: {
          provider_type: 'tutor',
          registration_id: 42,
          status: 'up',
          body: body.body,
          history: newHistory,
          updated_at: Date.now(),
        },
      }),
    };
  }
  return { ok: true, json: async () => ({ ok: true, items: [] }) };
};

// 바인딩 테스트
ui.bindNeighborhoodGreetingEditor(root);

// 1) 항목 클릭 -> 입력창 불러오기 및 편집 모드
await editorEl.dispatch({ type: 'click', target: pickBtn });
assert(bodyTextarea.value === '두 번째 인사글입니다', '목록 클릭 시 해당 본문이 textarea에 불러와진다');
assert(hintP.hidden === false, '편집 모드 힌트 문구가 나타난다');

// 2) 취소 클릭 -> 입력창 비움 및 편집 모드 해제
await editorEl.dispatch({ type: 'click', target: cancelBtn });
assert(bodyTextarea.value === '', '취소 클릭 시 textarea가 비워진다');
assert(hintP.hidden === true, '편집 모드 힌트가 숨겨진다');

// 3) 다시 항목 클릭 후 올리기 -> textarea 비워지고 상태 문구 '올렸어요' 표시
await editorEl.dispatch({ type: 'click', target: pickBtn });
bodyTextarea.value = '두 번째 인사글 수정본';
await editorEl.dispatch({ type: 'click', target: saveBtn });
assert(lastPost !== null && lastPost.history_id === 'h2', '수정 시 기존 history_id가 서버로 전송된다');
assert(bodyTextarea.value === '', '올리기 성공 후 textarea가 비워진다');
assert(statusP.textContent === '올렸어요', '올리기 성공 후 상태 문구 "올렸어요"가 표시된다');
assert(hintP.hidden === true, '올리기 성공 후 편집 힌트가 숨겨진다');

// 4) 삭제 버튼 클릭 (confirm = true)
globalThis.window.confirm = (msg) => {
  assert(msg === '이 인사를 지울까요?', '삭제 시 confirm 문구가 일치한다');
  return true;
};
await editorEl.dispatch({ type: 'click', target: delBtn });
assert(lastPost !== null && lastPost.action === 'delete' && lastPost.history_id === 'h3', '삭제 요청이 서버로 전송된다');
assert(statusP.textContent === '지웠어요', '삭제 성공 후 상태 문구 "지웠어요"가 표시된다');

// --------------------------------------------------------------------------
// 최종 결과 요약
// --------------------------------------------------------------------------
console.log(`\n==================================================`);
console.log(`검증 결과: 총 ${totalTests}개 중 통과 ${passedTests}개, 실패 ${failedTests}개`);
console.log(`==================================================\n`);

if (failedTests > 0) {
  process.exit(1);
}
