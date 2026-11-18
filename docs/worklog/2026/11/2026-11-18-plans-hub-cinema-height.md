# 요금제 허브 시네마 719px 높이

기준: `origin/main` `140bc16e` (PR #258).  
브랜치: `work/plans-hub-cinema-height`  
작업 트리: `D:\work\study114\.wt\work-plans-hub-cinema-height`

## 지시

`preview/home-ui/src/styles/screen/plans-theme.css`의 `@media (max-width: 719px)` 안 `.home-app--plans-hub .plans-hub-cinema`(약 1778~1785행)에서 아래 세 줄만 바꾼다.

```css
height: auto;
min-height: 208px;
max-height: none;
```

720px 이상 미디어쿼리와 다른 파일은 그대로 둔다. 허용 파일은 이 CSS와 작업 기록 1개다.

## 진단

`origin/main` `140bc16e`에서 1771행 `@media (max-width: 719px)` 안 1778행 규칙은 아래와 같았다. 지시와 같아서 그 세 줄만 바꿨다.

```css
.home-app--plans-hub .plans-hub-cinema {
  grid-column: 1 / -1;
  grid-row: 1;
  height: 208px;
  min-height: 208px;
  max-height: 208px;
  margin: 0 0 var(--plans-hub-hero-gap);
}
```

같은 선택자의 다른 높이는 그대로다. 기본 1191행은 280px, `@media (max-width: 1024px)` 1755행은 240px.

## 고친 곳

719px 블록의 `height`, `min-height`, `max-height` 세 줄.
