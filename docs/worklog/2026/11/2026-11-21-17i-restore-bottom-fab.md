# 17i 모바일 맨 아래로 버튼 복구

- 기준: `origin/main` `ca71da6b` (PR #291)
- 2026-11-21. 커밋 `32f51fc`(PR #263)에서 지운 모바일 규칙 두 개만 되돌린다.

## 지시

`@media (max-width: 768px)` 안에서 `.back-to-bottom`을 다시 보이게 하고, `.inquiry-fab`를 맨 아래로 버튼 위로 올린다. `back-to-top.js`와 데스크톱 규칙은 그대로 둔다.

허용 파일: `preview/home-ui/src/styles/design-system.css`, 이 worklog.

## 수정

- `.back-to-bottom { display: inline-flex; }`
- `.inquiry-fab { bottom: calc(1.25rem + 2 * (2.75rem + 8px)); }` 와 주석 「모바일: 맨 아래로 자리 위」
