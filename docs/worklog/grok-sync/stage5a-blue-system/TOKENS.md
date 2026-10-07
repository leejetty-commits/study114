# 5A 토큰 — 우동공과 블루 잠금 후보안

작성: 2026-09-04 KST  
상태: **5A 잠금 후보안 · 운영 적용 전 · Primary 잠금 후보 · 전역 캐논 아님**  
파일: `tokens.css` (스코프 `.uds-theme` / `[data-theme="uds-proposal"]`)

본 파일은 운영 토큰이 아니다. 5B 구현·ops 반영 전에 검토용으로만 쓴다.

---

## 1. 색 — 역할

| 역할 | 변수 | 값 | 쓰는 곳 |
|------|------|-----|---------|
| Primary A (권고) | `--uds-primary-a` | `#266BC4` | plans-ui-v5와 연속. 5A 권고 후보 |
| Primary B (비교) | `--uds-primary-b` | `#2B7FFF` | 보드 비교만. 본문 흰 글자 AA 미달 |
| Primary (잠금 후보) | `--uds-primary` | `#266BC4` | A를 가리킴. **운영 전역 확정 아님** |
| Primary hover | `--uds-primary-hover` | `#1F5AAB` | Primary 채움 호버 |
| Primary pressed | `--uds-primary-pressed` | `#1A4F96` | Primary 채움 눌림 |
| Primary subtle | `--uds-primary-subtle` | `#EEF4FB` | 활성 칩·공개 뱃지 배경 |
| Primary 위 글자 | `--uds-primary-fg` | `#FFFFFF` | Primary CTA 텍스트만 |
| Focus | `--uds-focus` | `#266BC4` | `:focus-visible` 2px 아웃라인 |
| Ink | `--uds-ink` | `#1C1917` | 제목, 본문, **가격** |
| Muted | `--uds-muted` | `#4B5563` | 메타, 보조, 비활성 메뉴 |
| Background | `--uds-bg` | `#F7F8FA` | 쿨 뉴트럴 페이지 |
| Surface | `--uds-surface` | `#FFFFFF` | 카드·헤더·레일·하단 바 |
| Line | `--uds-line` | `#E5E7EB` | 1px 보더 |
| Success | `--uds-success` / `-bg` / `-line` | `#2F6F4E` / `#EEF4F0` / `#C5D9CC` | `증빙자료 보유 있음` 상태. 인증 아님 |
| Warning | `--uds-warning` / `-bg` / `-line` | `#B45309` / `#FFF6EB` / `#E4C9A0` | 경고 문구. 가격·Hot 뱃지 아님 |
| Error | `--uds-error` / `-bg` / `-line` | `#B42318` / `#FEF3F2` / `#F0C7C3` | 오류 문구. 가격 강조 아님 |
| Disabled | `--uds-disabled-fg` / `-bg` / `-line` | `#9CA3AF` / `#F3F4F6` / `#E5E7EB` | 비활성 컨트롤 |

클레이 브릭 `#B5402A`는 역할에 없다. 적색 가격도 역할에 없다.

### 1.1 Primary 흰 글자 대비 (근사, WCAG 상대휘도)

| 배경 | 흰 글자 대비 | AA 본문 4.5:1 | AA 큰글 3:1 | AAA 본문 7:1 |
|------|-------------|----------------|-------------|----------------|
| `#266BC4` | **5.27:1** | 통과 | 통과 | 미달 |
| `#2B7FFF` | **3.76:1** | **미달** | 통과 | 미달 |

큰 글자 = 18px bold 또는 24px 이상. 본문 버튼 16px/600은 본문 기준으로 본다.

### 1.2 금지 색 사용

- 가격에 Primary·Error·Warning을 쓰지 않는다. 가격은 Ink.
- Primary는 CTA 채움, 활성 메뉴 밑줄, 링크, 포커스, subtle 배경에만.
- Success를 “인증 완료 / 검증 통과 / 보증”처럼 쓰지 않는다.

---

## 2. 타이포그래피

폰트: **Pretendard만**. 크기 **12 / 14 / 16 / 18 / 22 / 28 / 36**만. 중간 크기·clamp로 새 단계를 만들지 않는다.

| 크기 | 역할 | Weight | Line-height | Letter-spacing |
|------|------|--------|-------------|----------------|
| 12 | 캡션, 뱃지, 통계, 리뷰 배너, 푸터 | 400 / 500 | 1.40 | 0.01em |
| 14 | 메타, GNB, 필터, Ghost, 섹션 리드, 하단바 이름 | 400 / 500 / 600(활성 메뉴) | 1.45 | 0 |
| 16 | 본문, Primary/Secondary 버튼, Basic 이름·가격, 하단바 가격 | 400 / 600 / 700(이름·가격) | 본문 1.55 · 이름 1.30 | 이름 −0.01em |
| 18 | Prime·Pick 이름·가격, 레일 이름·가격, 로고, 상세 소제목 | 700 | 1.30 | −0.02em |
| 22 | 섹션 제목 | 700 | 1.30 | −0.02em |
| 28 | 페이지 제목 | 700 | 1.30 | −0.02em |
| 36 | 데스크톱 히어로 | 700 | 1.25 | −0.03em |

카드 안 크기는 최대 3단(이름/가격 · 메타 · 캡션).  
모바일은 **큰 제목만 한 토큰 내림**(36→28, 28→22, 22→18). 본문·메타·캡션·버튼 16은 유지. `RESPONSIVE.md` 참고.

---

## 3. 간격 — 8pt 스케일

| 변수 | 값 | 쓰는 곳 |
|------|-----|---------|
| `--s-1` | 8px | 칩 간격, 카드 내부 밀집 갭, 버튼 사이 |
| `--s-2` | 16px | 카드 패딩, 섹션 헤드 아래, 필터 패딩 |
| `--s-3` | 24px | 레일 갭, 히어로 리드 아래, 푸터 |
| `--s-4` | 32px | 페이지 좌우(1440), 페이지 헤드 |
| `--s-5` | 40px | 섹션 상단, 히어로 그리드 갭 |
| `--s-6` | 48px | 히어로 상단, 푸터 하단 |
| `--s-8` | 64px | 상세 하단, 넓은 섹션 분리 |

Basic 카드 내부: 패딩 12, 썸네일 갭 12, 필드 갭 4. 그리드 갭 12.  
결정 영역당 Primary CTA는 하나.

---

## 4. 반지름 · 보더 · 그림자

| 항목 | 값 | 규칙 |
|------|-----|------|
| 카드 반지름 | 12px (`--r-card`) | 카드, 레일, 필터 패널, 히어로 이미지 |
| 컨트롤 반지름 | 8px (`--r-ctl`) | 버튼, 입력, 셀렉트, 썸네일 |
| 뱃지 | 999px (`--r-pill`) | 상태 칩만 |
| 보더 | 1px `var(--uds-line)` | 기본. 2px는 포커스 아웃라인만 |
| 그림자 기본 | 없음 | 카드에 드롭섀도 금지 |
| 허용 그림자 | `--shadow-sticky: 0 1px 2px rgba(15,23,42,.06)` | sticky 레일·하단 CTA만 |
| 금지 | 강한 그림자, 유리(glass), 브랜드 그라데이션, 뉴모픽 | |

이미지 비율: **4:3** (히어로·Prime·Pick·상세). Basic 썸네일은 88×88 (1:1)로 2단 밀도에 맞춘다. 얼굴 생활 사진 없음.

---

## 5. Disabled 상태

| 요소 | 표현 |
|------|------|
| Primary 버튼 | 배경 `--uds-disabled-bg`, 글자 `--uds-disabled-fg`, 보더 `--uds-disabled-line`, `cursor: not-allowed` |
| Secondary 버튼 | 동일 비활성 팔레트. 보더를 Primary로 올리지 않음 |
| 입력·셀렉트 | 배경 disabled-bg, 글자 disabled-fg |
| 링크 | muted + 클릭 불가. Primary로 남기지 않음 |
| 대비율 | 의도적으로 AA 미달(약 2.3:1). 비활성은 읽히는 CTA가 아님 |

Disabled를 회색 Primary 채움으로 흉내 내지 않는다. Opacity만으로  suffocate하지 않고 토큰 색을 쓴다.

---

## 6. 스코프

- 토큰은 `.uds-theme` / `[data-theme="uds-proposal"]` 안에만 산다.
- 전역 `body`는 제네릭 리셋(`#f5f5f5`)이며 사이트 브랜드가 아니다.
- `--uds-primary`를 ops CSS 변수로 복사하지 말 것. 5A 잠금 **후보**다.
