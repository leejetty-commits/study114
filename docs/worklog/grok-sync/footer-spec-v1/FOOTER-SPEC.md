# Footer 상세 규격안 v1 (단일안)

작성: 2026-09-17 KST  
범위: **footer 전용** · 헤더/GNB/본문/좌측메뉴/유료·마이페이지 본문 비대상  
성격: 운영 이식용 규격안 1개 · 새 브랜드 시안 아님 · 정책 문구·링크 구조 변경 없음  
근거 SSOT (로컬 잠금 / Notion MCP 미연결 세션):
- 5A locked `TOKENS.md` · `COMPONENTS.md` §13 Footer
- 5B `TOKENS.md` (동일 FS·색 축)
- 사용자 브리프: Pretendard 단일 · FS 12/14/16/18/22/28/36만 · Shell 공통 문법 · 26장 정책 페이지 문맥

> Notion UDX-10/20/STD-001/26장 원문은 이 세션에서 MCP 미연결. 위 로컬 잠금 토큰과 브리프 전제를 동일 축으로 채택. 원문과 충돌 시 원문 우선 재대조.
>
> **v1.1 패치:** 라이브 guest footer 라벨·고지·© 반영. 회사정보 슬롯은 라이브 미노출 → 조건부.

---

## 1) footer 최종 구조안 요약

1. **상단** `.site-footer__links` — 정책·고지 링크 묶음 (클릭 1순위).
2. **중단** `.site-footer__notice` — 짧은 플랫폼 고지 1~2문장 (설명 위계).
3. **하단** `.site-footer__company` — 회사/운영 정보 (법정·운영 메타).
4. **최하단** `.site-footer__legal` — copyright · 브랜드 보조 한 줄.
5. 배경 Surface/Bg, 상단 1px Line만. CTA·카드·배지·아이콘 나열 없음.
6. 데스크톱(1440): 링크 1행(넘치면 2행 wrap) · 회사정보 block.
7. 모바일(390): 전 영역 세로 스택 · 링크 wrap · 터치 ≥44px 행.

---

## 2) 전역 디자인 통일 매뉴얼과의 정합

| 잠금 전제 | 본안 반영 |
|-----------|-----------|
| Pretendard 단일 | `font-family: Pretendard, …` only |
| FS 토큰 12/14/16/18/22/28/36만 | footer는 **14(링크) + 12(고지·회사·©)** 만. 13/15/17/20·clamp 금지 |
| 헤더·푸터 = 공통 Shell 문법 | max-width shell wrap, 좌우 padding `--s-4`(32) @1440, 상단 border Line |
| footer = 정책/약관/플랫폼 고지/회사정보 | 링크군 → 고지 → 회사 → © 위계 고정 |
| 5A Footer 위계 “12 muted, 링크 hover 잉크” | **고지·회사·© = FS-1 12 muted**. 링크만 가독·클릭을 위해 **FS-2 14** + muted, hover/focus Ink·Primary underline |
| 본문(16)보다 약하게 | footer에 16+ 금지 · Primary fill CTA 금지 |
| 간격 토큰 | 영역 간 `--s-3`(24), footer 하단 `--s-6`(48), 링크 갭 `--s-2`(16) / `--s-1`(8) |

**정책 링크 FS 선택 근거 (14 vs 12):**  
잠금 표는 “푸터=12”를 캡션 묶음으로 두지만, 브리프는 클릭 가능한 정책 링크를 FS-2(14) 또는 FS-1(12) 중 택1하라 함. **택: FS-2 14px.** 이유: (1) 본문 16보다 한 단계만 낮아 보조 정보로 읽히면서도 링크임을 잃치지 않음 (2) 390에서 12px 전면 적용 시 터치·가독이 동시에 약해짐 (3) 고지/회사/©를 12로 내려 **링크 > 고지 ≥ 회사** 위계를 크기만으로도 만듦. 12를 링크에 쓰면 위계가 평탄화되고, 저대비 회색과 겹치면 법무 링크가 묻힘.

**짧은 고지 12px 근거:** 설명 문장이라 링크보다 약해야 함. Muted `#4B5563` on Surface/Bg 근사 대비 **~7.56:1** (5A GATE)로 AA 본문 충족. `line-height: 1.5`, 최대 2줄 권장. 3줄 이상이면 26장 정적 페이지로 유도(문구 발명 금지).

---

## 3) 영역별 규격표

### 3.1 컨테이너

| selector / 영역 | font family | font size token | font weight | line-height | text color | letter-spacing | row/col gap | 위·아래 간격 |
|-----------------|-------------|-----------------|-------------|-------------|------------|----------------|-------------|--------------|
| `.site-footer` | — | — | — | — | — | — | — | `padding-top: --s-3` (24) · `padding-bottom: --s-6` (48) · `margin-top: --s-6` (48) |
| `.site-footer` 배경 | — | — | — | — | bg: `--uds-bg` 또는 `--uds-surface` (페이지와 동일 계열 1택, **현란 배경 금지**) | — | — | `border-top: 1px solid --uds-line` |
| `.site-footer__inner` | — | — | — | — | — | — | 세로 stack gap `--s-3` (24) | max-width = Shell wrap **1280** · 좌우 pad `--s-4` (32) @≥960 · ≤719 pad `--s-2`(16) |

### 3.2 상단 링크

| selector / 영역 | font family | font size token | font weight | line-height | text color | letter-spacing | row/col gap | 위·아래 간격 |
|-----------------|-------------|-----------------|-------------|-------------|------------|----------------|-------------|--------------|
| `.site-footer__links` | Pretendard | — | — | — | — | — | col/row gap `--s-2` (16) desktop · `--s-1`(8) + row `--s-1-5`(12) mobile | 영역 아래 `--s-3` |
| `.site-footer__links a` | Pretendard | **FS-2 `--fs-14`** | 500 | 1.45 | `--uds-muted` | 0 | — | min-height **44px** hit (padding으로 확보: 세로 pad ≥12) |
| `a:hover` / `:focus-visible` | 동일 | 14 | 500 | 1.45 | `--uds-ink` · underline 1px `--uds-primary` | 0 | — | focus: 2px `--uds-focus` outline, offset 2px |
| 구분 기호(선택) | Pretendard | 14 | 400 | 1.45 | `--uds-line` 또는 muted 40% | 0 | 좌우 `--s-1` | **·** 또는 `|` 중 1택. 모바일에서는 기호 숨기고 wrap만 |

**링크 라벨 (라이브 guest home 2026-09-17 실측 · 구조·문구 변경 금지):**
1. 약관  
2. 개인정보  
3. 플랫폼 고지  
4. 고객센터  

※ 라이브에 「안전과외/학생정보/분쟁」 단독 링크는 **없음**. 26장·운영에 별도 URL이 생기면 링크군에만 추가하고 라벨은 운영 표기를 따름. **새 정책 문구 발명 금지.**  
소스: `/workspace/study114-ds/live-footer-inventory-2026-09-17/`

### 3.3 중단 짧은 고지

| selector / 영역 | font family | font size token | font weight | line-height | text color | letter-spacing | row/col gap | 위·아래 간격 |
|-----------------|-------------|-----------------|-------------|-------------|------------|----------------|-------------|--------------|
| `.site-footer__notice` | Pretendard | **FS-1 `--fs-12`** | 400 | **1.50** | `--uds-muted` | 0.01em | — | 아래 `--s-3` |
| 내용 | — | — | — | — | — | — | — | **라이브 고지 고정:** 「우동공과는 회원 간 정보 탐색과 접촉을 돕는 플랫폼이며, 수업 계약이나 과외비 지급을 직접 중개하지 않습니다.」 (창작 금지). max-width 720 |

### 3.4 하단 회사정보

| selector / 영역 | font family | font size token | font weight | line-height | text color | letter-spacing | row/col gap | 위·아래 간격 |
|-----------------|-------------|-----------------|-------------|-------------|------------|----------------|-------------|--------------|
| `.site-footer__company` | Pretendard | FS-1 12 | — | 1.50 | — | 0.01em | 행간 `--s-1` (8) | 아래 `--s-2` (16) |
| `.site-footer__company-label` | Pretendard | 12 | **500** | 1.50 | `--uds-muted` | 0.01em | — | — |
| `.site-footer__company-value` | Pretendard | 12 | **400** | 1.50 | `--uds-ink` | 0 | — | 라벨과 값 사이 gap 4px (`--s-0-5`) · **본문 16처럼 세게 만들지 말 것** |
| 구분 | — | — | — | — | — | — | desktop: 항목 사이 ` · ` 또는 줄바꿈 block | **숨김 금지** — 법정 정보는 12 유지하되 muted만으로 죽이지 말고 value는 Ink |

배치: 상호 / 대표 / 사업자등록번호 / 주소 / 연락처 등 **기존 운영 표기 순서·문구 유지**. 라벨·값 위계는 **색+weight**만 (크기 동일 12).

**라이브 FACT (guest home):** 회사/사업자 정보 블록 **미노출**. 본안의 `__company`는 운영에 넣을 때 쓸 슬롯 규격이며, 라이브에 값이 생길 때까지 빈 영역으로 두거나 숨김(`:empty` / 조건부 렌더). **가짜 사업자 정보 채우기 금지.**

### 3.5 최하단 copyright / 브랜드 보조

| selector / 영역 | font family | font size token | font weight | line-height | text color | letter-spacing | row/col gap | 위·아래 간격 |
|-----------------|-------------|-----------------|-------------|-------------|------------|----------------|-------------|--------------|
| `.site-footer__legal` | Pretendard | FS-1 12 | 400 | 1.40 | `--uds-muted` | 0.01em | — | padding-top `--s-2` · 상단 hairline 1px `--uds-line` optional |
| 라이브: `© 2026 우동공과 · study114` | — | — | — | — | — | — | — | 표기 유지 · study114.net으로 임의 확장 금지(라이브는 `study114`) |

---

## 4) 데스크톱 footer 배치안 (1440 기준)

| 항목 | 규격 |
|------|------|
| Viewport | 1440 |
| Outer / content | Shell과 동일: content max **1280**, 좌우 여백 (1440−1280)/2, inner pad L/R **32** (`--s-4`) |
| 링크군 | **1행** 기본. `flex-wrap: wrap`. 항목 수·라벨 길이로 넘치면 **자연 2행** (강제 2열 그리드 금지) |
| 링크 정렬 | **가운데 정렬** (라이브 guest FACT). 회사정보 블록이 나중에 길어지면 좌측 block으로만 완화 검토 — 지금은 라이브와 동일 center |
| 고지 | block, max-width **720**, 좌측 |
| 회사정보 | **block** (항목별 1행 또는 `라벨 값` inline 후 줄바꿈). 긴 주소를 1행 강제 금지 |
| 내부 세로 | links →24→ notice →24→ company →16→ legal |
| 구분선 | footer 최상단 1px Line만. 영역마다 카드/박스 분리 금지 |

ASCII (개념 · 라이브 = center):

```
|←32→[======== 1280 shell wrap ========]←32→|
|     약관   개인정보   플랫폼 고지   고객센터   |
|   (short notice centered, max 720)         |
|   [회사정보 — 라이브 미노출 / 조건부]        |
|   © 2026 우동공과 · study114               |
```

---

## 5) 모바일 footer 배치안 (390 기준)

| 항목 | 규격 |
|------|------|
| Viewport | 390 |
| 전체 | **세로 스택** (links → notice → company → legal) |
| 좌우 pad | **16** (`--s-2`) |
| 링크 | wrap. 구분 기호 숨김. 각 링크 **min-height 44**, 가로 여유 pad 8. 한 줄에 2~3개까지 허용, 답답하면 1열에 가깝게 wrap |
| 고지 | 12 / lh 1.5 / muted. 가로 풀폭. 읽기 쉬운지 = 대비·줄간격으로 확보 (크기 올리지 않음) |
| 회사 | 항목 **1행 1항목** block. 라벨·값 같은 줄 가능하되 줄바꿈 허용 |
| 길이 | 링크 6개 초과로 세로가 과도하면 그룹만 유지하고 **문구·IA 추가 금지**. 필요 시 26장으로의 기존 링크만 |
| 금지 | 12 미만, 본문 CTA를 footer에 복제, sticky 하단바와 시각 충돌하는 강한 배경 |

**390 체크 (판단):**
1. **읽힘:** 링크 14 + 고지/회사 12 + muted 대비 ≥4.5:1 → PASS 설계  
2. **누르기:** 링크 행 min 44 → PASS  
3. **길이:** 4블록 + gap 24*2 + pad → 통상 280–360px 높이대. 회사 항목이 많으면 늘어나나 카드 분리 없이 block 유지가 덜 답답함

---

## 6) 금지안 / 비채택안

### footer에서 쓰지 말 것
- 본문보다 큰 CTA 버튼 · Primary fill
- 현란한 배경 · 그라데이션 · glass
- 영역별 카드/배지형 박스 3단 이상 분리
- 강조색 3개 이상 (Ink / Muted / Primary-on-focus 외)
- 아이콘·SNS·인증마크·어워드 나열
- 배지형 법무 문구 (pill, “필수”, 빨간 경고 박스)
- 저대비 회색 (`--uds-disabled-fg` `#9CA3AF` 등) 로 본문급 텍스트
- FS 토큰 밖 크기 (13/15/17/20…) · `clamp()` · 임의 중간값
- 정책 링크 구조·카피 신설/재작성
- 헤더/GNB/좌메뉴 동시 수정

### 비채택 (검토했으나 버림)
| 안 | 이유 |
|----|------|
| 링크·고지·회사 전부 12 | 위계 평탄, 모바일 링크 식별↓ |
| 링크 16 | 본문과 동급 → footer 정보형 원칙 위반 |
| 회사정보 14 bold | 본문 메타와 경쟁, “세게” 금지 |
| 회사정보 있는 상태에서 강제 전체 center | 긴 법정 정보 스캔성↓ → 회사 블록만 좌측 block 검토. **링크·고지·©는 라이브대로 center 유지** |
| 2열(링크|회사) 데스크톱 | Shell 단순 정보형보다 복잡, 모바일 재배치 비용↑ |

---

## 7) 구현용 selector / 토큰 매핑

```text
.site-footer
  border-top: 1px solid var(--uds-line)
  background: var(--uds-bg)          /* or --uds-surface — 페이지와 통일 */
  padding: var(--s-3) 0 var(--s-6)
  margin-top: var(--s-6)

.site-footer__inner
  max-width: 1280px                  /* Shell wrap FACT와 동일 */
  margin-inline: auto
  padding-inline: var(--s-4)         /* ≤719: var(--s-2) */
  display: flex
  flex-direction: column
  gap: var(--s-3)

.site-footer__links                 /* nav aria-label="정책" */
  display: flex
  flex-wrap: wrap
  gap: var(--s-2)                    /* mobile: column-gap var(--s-1); row-gap var(--s-1-5) */
  a: font: 500 var(--fs-14)/1.45 Pretendard
     color: var(--uds-muted)
     min-height: 44px
     display: inline-flex; align-items: center
  a:hover, a:focus-visible → color: var(--uds-ink); text-decoration-color: var(--uds-primary)

.site-footer__notice
  font: 400 var(--fs-12)/1.5 Pretendard
  color: var(--uds-muted)
  letter-spacing: 0.01em
  max-width: 720px

.site-footer__company
  font: 400 var(--fs-12)/1.5 Pretendard
  .label { font-weight: 500; color: var(--uds-muted) }
  .value { font-weight: 400; color: var(--uds-ink) }

.site-footer__legal
  font: 400 var(--fs-12)/1.4 Pretendard
  color: var(--uds-muted)
  letter-spacing: 0.01em
  padding-top: var(--s-2)
  border-top: 1px solid var(--uds-line)   /* optional hairline */
```

### 접근성 체크리스트
- [ ] 텍스트 대비: muted on bg/surface ≥ 4.5:1 (잠금 muted 사용 시 PASS)
- [ ] 링크 `:focus-visible` 2px Primary
- [ ] 모바일 터치 높이 ≥ 44px
- [ ] 링크 vs 고지 시각 구분 (14/500 vs 12/400)
- [ ] `nav` + `aria-label="정책"` · 비링크 텍스트는 `nav` 밖
- [ ] 줄간격 고지/회사 1.5

### 구현 시 주의
- **카피·URL은 운영/26장 기존 값 그대로** 꽂을 것. 본 문서는 타이포·간격·위계만 잠근다.
- 코드 수정 전제 없음 — 이 문서가 단일 규격안.

---

## 출처·한계

- 로컬: `stage5a-blue-system-locked-candidate/{TOKENS,COMPONENTS}.md`, `stage5b-design-standard-v01/TOKENS.md`, stage4-late footer 뼈대
- Notion UDX-10/20/STD-001/26장: 세션 내 MCP 미연결 → 연결 후 재대조 권장
- **라이브 footer 인벤토리 (적용됨):** guest home desktop 2026-09-17  
  - 링크: 약관 · 개인정보 · 플랫폼 고지 · 고객센터  
  - 고지: 중개 아님 문구 (위 고정)  
  - 회사정보: 없음  
  - ©: `© 2026 우동공과 · study114`  
  - 샷: `live-footer-inventory-2026-09-17/footer-desktop-region.png`  
  - 모바일 390 미측정 → 스택 규격은 설계안, 실측 패치 여지
