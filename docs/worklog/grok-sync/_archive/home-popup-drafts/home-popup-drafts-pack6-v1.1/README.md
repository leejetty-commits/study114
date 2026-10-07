# 우동공과 홈 팝업 드래프트 팩 6종 · pack6-v1.1

작성: 2026-09-23 (KST) · 우동공과(study114)

디자이너·개발 핸드오프용 **HTML 보드 + PNG 샷 + 스펙 메모** 묶음입니다.  
Figma는 필수가 아니며, 이 HTML 보드가 구현 레퍼런스입니다.

**v1.1:** 제목 아래 배지·칩(EVENT, 기간 칩 등)도 본문과 동일하게 `.popup-body-indent` (~14px)로 맞춤.

## 한눈에

| 패밀리 | 출처 | 차이 |
|--------|------|------|
| **set-a** | v1 레이아웃 기반 | 실로고 PNG lockup + **제목 아래 들여쓰기**(본문+배지) · watermark 없음 (비교용) |
| **set-b** | v1.2 brand-imprint | lockup + **faded wordmark watermark** + **제목 아래 들여쓰기**(본문+배지) |

유형 3종 × 2 패밀리 = **6 목업**.

| 유형 | 파일 | 크기 | 팔레트 |
|------|------|------|--------|
| A 공지 | `*/a-notice.html` | 420×480 | cream+amber |
| B 이벤트 | `*/b-event.html` | 400×560 | coral/peach |
| C 광고 | `*/c-promo.html` | 560×360 | mint+teal |

## pack 구성

```
README.md / HANDOFF.md / NOTES.md
tokens.css · board.css · brand.css
assets/          # pencil+우동공과 lockup PNG + wordmark
set-a/ · set-b/  # HTML 보드
shots/           # 1440×900 보드 + 카드 크롭
index.html       # 6종 갤러리
capture.sh
```

## 빠른 열기

1. `index.html`을 브라우저로 연다.
2. set-a vs set-b를 나란히 비교한다 (로고 각인·들여쓰기).
3. 상세 스펙은 `NOTES.md`, 디자인↔구현 역할은 `HANDOFF.md`.

## 핵심 규칙 (요약)

- **로고**: 연필+「우동공과」 합본 PNG 한 `<img>` (아이콘/워드 분리 금지). orphan 「우」 텍스트 마크 금지.
- **들여쓰기**: `.popup-title` 아래 본문·리스트·피치 **및 제목 아래 배지·칩**을 `margin-left ≈ 14px` (`.popup-body-indent`). 헤더 카테고리 배지(공지/안내)·제목·CTA·푸터는 flush.
- **bright-only**: 팝업 카테고리 색은 앰버/코랄/민트·틸. 사이트 블루 `#266BC4`와 분리. 네이비·차콜 패널 금지.

구버전 `home-popup-drafts-pack6-v1` 및 `home-popup-drafts-v1` / `v1.1` / `v1.2` 폴더는 **수정하지 않음** (소스만 참조·복사).
