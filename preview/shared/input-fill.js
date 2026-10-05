/**
 * 회원 입력 폼 칸 채움 표시. 값이 있으면 data-fill="filled", 비었거나 공백뿐이면 "empty".
 * 색은 input-fill.css 한곳. 포커스 중 흰색은 :focus, disabled 제외도 CSS 가 맡는다.
 * 적용 폼에만 data-input-fill 을 단다(bindInputFill). 찾기·관리자·글쓰기 화면은 달지 않는다.
 * 코드로 값을 넣으면 input·change 이벤트가 없으므로 refreshInputFill 을 부른다.
 */

export const INPUT_FILL_ATTR = 'data-input-fill';

const SKIP_TYPES = new Set(['hidden', 'radio', 'checkbox', 'button', 'submit', 'reset', 'file', 'image', 'range', 'color']);

/** text·number·select·textarea 등. 라디오·체크·파일·숨김은 제외. */
export function isInputFillControl(el) {
  const tag = String(el?.tagName || '').toUpperCase();
  if (tag === 'SELECT' || tag === 'TEXTAREA') return true;
  if (tag !== 'INPUT') return false;
  const type = String(el.type || 'text').toLowerCase();
  return !SKIP_TYPES.has(type);
}

function fillState(el) {
  return String(el.value ?? '').trim() !== '' ? 'filled' : 'empty';
}

function paintControl(el) {
  if (!isInputFillControl(el)) {
    el.removeAttribute?.('data-fill');
    return;
  }
  el.setAttribute('data-fill', fillState(el));
}

/** root 안 모든 칸의 data-fill 을 다시 매긴다. */
export function paintInputFill(root) {
  if (!root || typeof root.querySelectorAll !== 'function') return;
  root.querySelectorAll('input, select, textarea').forEach(paintControl);
}

const boundRoots = new WeakSet();

/**
 * 입력은 해당 칸만, change(선택·연쇄 갱신)는 폼 전체를 다시 칠한다.
 * 대상 요소의 change 리스너(분기 교체, 시·도 연쇄)가 먼저 값을 바꾼 뒤 이 버블이 돈다.
 * reset 은 값이 바뀌기 전에 오므로 마이크로태스크 뒤에 칠한다.
 */
export function bindInputFill(root) {
  if (!root || typeof root.addEventListener !== 'function') return;
  root.setAttribute(INPUT_FILL_ATTR, '');
  if (!boundRoots.has(root)) {
    boundRoots.add(root);
    root.addEventListener('input', (e) => {
      if (isInputFillControl(e.target)) paintControl(e.target);
    });
    root.addEventListener('change', () => paintInputFill(root));
    root.addEventListener('reset', () => queueMicrotask(() => paintInputFill(root)));
  }
  paintInputFill(root);
}

/** 코드로 값을 넣은 뒤 호출. node 가 적용 폼 안이면 그 폼을, node 가 폼을 감싸면 안의 적용 폼을 칠한다. */
export function refreshInputFill(node) {
  if (!node) return;
  const scope = typeof node.closest === 'function' ? node.closest(`[${INPUT_FILL_ATTR}]`) : null;
  if (scope) {
    paintInputFill(scope);
    return;
  }
  if (typeof node.querySelectorAll === 'function') {
    node.querySelectorAll(`[${INPUT_FILL_ATTR}]`).forEach(paintInputFill);
  }
}
