# 홈 팝업 팩 6종 · NOTES (pack6-v1.1)

작성: 2026-09-23 (KST) · 우동공과(study114)  
기반: pack6-v1 → **v1.1** (제목 아래 배지·칩도 본문과 동일 들여쓰기)

## 0. 이 팩의 목적

두 패밀리 × 세 유형 = **6 목업**을 한 ZIP에 묶어 비교·핸드오프한다.

| 패밀리 | 기반 | 로고 | 워터마크 | 들여쓰기 |
|--------|------|------|----------|----------|
| **set-a** | v1 레이아웃 | 실로고 PNG lockup | **없음** (차이 유지) | **있음** (본문+제목 아래 배지) |
| **set-b** | v1.2 imprint | 실로고 PNG lockup | faded wordmark | **있음** (본문+제목 아래 배지) |

pack6-v1 및 구버전 폴더·ZIP은 **수정하지 않음**.

---

## 1. 제목 아래 들여쓰기 (필수 · v1.1)

**규칙:** `.popup-title`(h2) 아래에 오는 콘텐츠를 왼쪽 들여쓰기 ≈ **12–16px** (`--popup-body-indent: 14px`, 클래스 `.popup-body-indent`).

| 들여씀 (제목 아래) | 들여쓰지 않음 (flush) |
|--------------------|------------------------|
| lead / `.popup-body` | `.popup-title` |
| bullets / `.popup-list` | 헤더 카테고리 배지 「공지」/「안내」(로고·닫기와 같은 축) |
| pitch / `.promo-pitch` · `.event-benefit` | brand lockup |
| **제목 아래 배지·칩** (EVENT, 「기간 …」 date chip 등) | CTA 행 · 「오늘 하루 보지 않기」 |
| fine print | |

```html
<!-- 이벤트: 제목 flush → 들여쓰기 블록에 EVENT + 본문 + 기간 칩 -->
<h2 class="popup-title">…</h2>
<div class="popup-body-indent">
  <span class="popup-badge">EVENT</span>
  <p class="event-benefit">…</p>
  <span class="event-chip">기간 9.23 – 10.7</span>
  <p class="popup-body">…</p>
</div>
```

- **공지:** 제목 flush → 들여쓰기: lead + bullets. 「공지」 배지·meta는 제목 **앞**(flush).
- **이벤트:** 제목 flush → 들여쓰기: **EVENT 배지** + lead + date chip + fine print. (v1.1: EVENT를 제목 위에서 들여쓰기 구역으로 이동)
- **광고:** 제목 flush → 들여쓰기: pitch. 「안내」는 제목 앞 flush.

---

## 2. 로고 lockup (필수 · 6장 모두)

```html
<img class="brand-lockup …"
     src="../assets/logo-lockup-pencil-wordmark-h40.png"
     alt="우동공과" />
```

- 연필 아이콘 **앞** + 「우동공과」 wordmark **한 장 PNG**.
- 이동·스케일은 이 `<img>` 하나. orphan 「우」 텍스트 마크 금지.
- full 2줄(`logo-full.png`)은 1차 lockup으로 사용하지 않음.

| 유형 | set-a | set-b |
|------|-------|-------|
| A | 우상단 lockup h≈28 | 동일 + body BR watermark |
| B | 히어로 lockup h≈48 + Autumn Offer | 동일 + cream body watermark |
| C | 좌측 민트 패널 lockup h≈64 | 동일 + 우측 faint watermark |

---

## 3. 고정 사이즈 / 색 (변경 없음)

| 유형 | 레이아웃 | 크기 | 팔레트 |
|------|----------|------|--------|
| A | `layout-stack` | 420×480 | cream `#FFFBF5` + amber |
| B | `layout-hero-stack` | 400×560 | coral/peach hero + cream |
| C | `layout-split` | 560×360 | mint 좌 + white 우 + teal CTA |

사이트 셸 = UDX 블루 `#266BC4`. 팝업에 네이비·차콜·사이트 블루 fill 금지.

모바일: `max-width: min(100vw−32px, card)` · `max-height: 80vh` · 내부 스크롤 · C≤768 세로 스택.

---

## 4. 에셋

`assets/` (원본: `study114-ds/brand-assets/`)

| 파일 | 용도 |
|------|------|
| `logo-lockup-pencil-wordmark.png` | 마스터 |
| `…-h40.png` / `…-h64.png` / `…-h80.png` | 코너·히어로·패널 |
| `logo-wordmark.png` | set-b soft watermark |
| `logo-icon-pencil.png` | 아이콘 단독(참고) |

---

## 5. 샷 / 캡처

- 보드: Chromium headless `--disable-dev-shm-usage` · 1440×900
- `./capture.sh` → `shots/set-{a,b}-{a-notice,b-event,c-promo}.png` (+ `-card.png` 크롭)
- 갤러리: `index.html`

## 6. v1 → v1.1 변경

- 이벤트: EVENT 배지를 제목 **위**에서 제목 **아래** `.popup-body-indent`로 이동 (기간 칩·본문과 동일 ~14px indent).
- 스펙·핸드오프 문구: 「제목 아래 배지·칩도 본문과 같이 들여쓰기」로 갱신.
