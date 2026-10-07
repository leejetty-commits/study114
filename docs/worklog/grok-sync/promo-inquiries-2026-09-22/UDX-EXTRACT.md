# UDX-EXTRACT · promo exposure + mypage inquiries redesign

작성: 2026-09-22 KST (Asia/Seoul)  
성격: **EXISTING LOCKS ONLY** · 신규 정책 없음 · 인용·발췌  
대상 리디자인:
- **A)** `#/promo/study-room` (paid/promo exposure) — Notion 정본 라우트에서 `#/promo/study-room` 단독 잠금은 **미발견**. 유료·노출 표현은 **`#/plans` / `#/plans/positions`(노출상품)** + Discovery 홈 Prime/Pick 노출 + UDX-50/ M01 홍보 톤으로 매핑.
- **B)** mypage study-room inquiries / 쪽지 수신 설정 UI — 정본 `#/mypage/registrations/study-rooms/:id/inquiries` · 화면명 **쪽지와 문의** (20장 P20-05).

## Sources (fetched / skimmed)

| 문서 | 지위 | ID/path |
|------|------|---------|
| UDX-00 컨트롤타워 | 디자인 정본 허브 | `bee3df09-…` |
| UDX-10 Brand DNA | 타이포·색·형태 잠금 | `b2879f06-…` |
| UDX-20 Shell | Shell·컴포넌트 잠금 | `6c6c3965-…` |
| UDX-30 Discovery | 홈·검색·카드·상세 | `df669748-…` |
| UDX-40 Role Spaces | 역할홈·마이페이지 | `e215a796-…` |
| UDX-50 Growth Media | 배너·광고·홍보 톤 | `301a7270-…` |
| UDX-M01 홍보 랜딩 | “정리” 톤 원문 | `5e7600e4-…` |
| UDX-STD-001 v0.3 | 전역 수치 매뉴얼 | `898f7596-…` |
| 34장 유료상품 IA | 구매 플로우·라우트 | `65b6e0cd-…` |
| 15장 마이페이지 | 쪽지설정 vs 운영문의 분리 | `fa61ab60-…` |
| 쪽지와 문의 리뉴얼 | P20-05 수신 UI | `77d89513-…` |
| local `stage5b-design-standard-v01/TOKENS.md` + `ssot/UDX-STD-001-Button.md` | 5B 보드·버튼 수치 (초안·운영 전) | `/workspace/study114-ds/…` |
| local `paid-layout-v2-canvas-ab/IMPLEMENTATION-GUIDE.md` | paid Shell 치수 FACT | `/workspace/study114-ds/…` |

정본 우선순위 (UDX-00): 종현 님 승인 → 00장 프로세스 → **UDX-10~60 최신 잠금** → 기능·정책 장 → UDX-90.  
기능·정책은 9/15/20/34장 유지, **디자인 표현은 UDX 우선**.

---

## 1. Font ladder (px) — locks only

**서체:** Pretendard 단일. 화면별 별도 폰트·세리프 금지. (UDX-10 / STD-001)

| Token | Size / line | Weight (STD-001) | Use |
|-------|-------------|------------------|-----|
| FS-1 | **12 / 18** | 500·600 | 주석식 안내, 캡션, 배지, 짧은 상태 메모 |
| FS-2 | **14 / 21** | 400·500·600 | 카드 메타, 보조문, 표 값 |
| FS-3 | **16 / 24** | 400·600 | 기본 본문, 버튼, 입력값 |
| FS-4 | **18 / 27** | 600·700 | 카드명, 대표가격 (Prime·Pick) |
| FS-5 | **22 / 31** | 700 | 섹션·블록 제목 |
| FS-6 | **28 / 39** | 700·800 | 페이지 제목, 모바일 히어로 |
| FS-7 | **36 / 47** | 800 | 데스크톱 메인 히어로 |

**고정 운용 (UDX-10 / UDX-30):**
- 중간값 `13·15·17·20px` 및 임의 `clamp()` **금지**.
- 주석식 안내글 = **가장 작은 12px만**. 긴 본문을 12px로 축소 금지.
- 카드 안 **최대 3단계**.
- Prime·Pick: 카드명·가격 **18** / 주요정보·소개 **14** / 주석·배지·상태 **12**.
- Basic: 이름·대표가격 **16** / 주요 비교값 **14** / 주석·배지·상태 **12**.
- 모바일: 히어로·페이지·섹션 제목만 한 단계 내림(36→28, 28→22, 22→18). 본문·카드명·메타·주석·버튼 16 **유지**.
- footer: 링크 **FS-2 14 / 500**, 고지·회사·copyright **FS-1 12**. (UDX-10 2026-09-17)

---

## 2. Primary `#266BC4` and role colors

### Brand (UDX-10 + STD-001 §2)

| Role | HEX | Use |
|------|-----|-----|
| Brand Primary | **`#266BC4`** | 대표 CTA, 링크, 핵심 선택, 포커스 |
| Primary Hover | `#1F5BA8` (STD-001) · local 5B에도 `#1F5AAB` 보드값 존재 — **정본 인용은 STD-001** | hover |
| Primary Pressed | `#184A88` (STD-001) | pressed |
| Primary Soft | `#EAF2FC` (STD-001) · local 5B `#EEF4FB` | 선택 배경, 정보성 강조 |
| Canvas | `#F7F8FA` | 페이지 배경 |
| Surface | `#FFFFFF` | 카드·패널·모달 |
| Line | `#E5E7EB` | 기본 1px 경계 |
| Ink | `#1C1917` | 제목·본문·가격 |
| Secondary Text | `#4B5563` | 메타·설명 |
| Muted Text | `#6B7280` | 보조 안내 |

### Role Accent (STD-001) — CTA 채움 금지 · Soft/아이콘/선택선 등 제한

| Mode | Accent | Soft | Allowed |
|------|--------|------|---------|
| 공부방 | `#266BC4` | `#EAF2FC` | 모드 표시, 상단 배너, 섹션 아이콘, 선택선 |
| 과외쌤 | `#0F766E` | `#E7F6F3` | 동일 범위 |
| 학생·학부모 | `#6D5BD0` | `#F0EDFF` | 동일 범위 |
| 유료상품 문맥 | `#8A5A12` | `#FFF7E6` | 상품 안내·혜택 표면·프리미엄 문맥 |

**잠금 문장:** “대표 CTA는 모든 모드에서 Brand Primary를 유지한다. 역할색은 페이지 전체 배경·본문색·모든 버튼에 확장하지 않는다.” (STD-001)

### Status (STD-001)

| | Solid | Soft |
|--|-------|------|
| Success | `#15803D` | `#ECFDF3` |
| Warning | `#B45309` | `#FFF7ED` |
| Error | `#B42318` | `#FEF3F2` |
| Info | `#266BC4` | `#EAF2FC` |

### Paid skin exception (STD-001 §9 / local 5B)

| Token | HEX |
|-------|-----|
| Paid Canvas | `#F6F1E8` |
| Paid Soft | `#FFF7E6` |
| Paid Line | `#E6DFD4` |
| Paid Muted | `#766F64` |

Paid에서도 CTA = `#266BC4`. 과한 그림자·그라데이션·금색 테두리 반복 금지.

---

## 3. Card radius / border / padding

| Spec | Lock | Source |
|------|------|--------|
| Card radius | **12px** (`R-Surface`) | STD-001 §4·§6 |
| Border | **1px Line** `#E5E7EB` | STD-001 |
| Default shadow | **없음** (hover만 경계색 + 매우 약한 elevation) | STD-001 |
| Padding | mobile **16px** · desktop **20·24px** | STD-001 Card |
| Nested same-radius boxes inside card | **금지** | STD-001 형태 원칙 |
| Radius ladder only | Badge **4** · Tab/Chip **6** · Control **8** · Surface **12** | STD-001 |
| Spacing tokens only | `4 / 8 / 12 / 16 / 24 / 32 / 40 / 48 / 64 / 80` | STD-001 §5 |
| Card inner zones | 16·24px | STD-001 |

Prime·Pick·Basic 차이는 **이미지·폭·여백·정보량**으로만. 폰트·radius 체계를 등급마다 바꾸지 않음. (UDX-30 / STD-001)

---

## 4. Badge / button rules

### Badge (STD-001 §6)

- height **20** (필요 시 22) · padding-inline **6** · gap **4** · radius **4px**
- type **12 / 16 · 600** · icon 12 · 한 줄 · 말줄임
- **pill(999) 텍스트 배지 금지** — 작은 라운드 사각형만
- 한 카드 동시 강조 배지 **최대 2개**
- 유료 홍보 배지: 역할별 종류 중 서로 다른 것 **max 2**, Prime/Pick 기간 종속, 최초 구매·연장 시에만 (UDX-00 / 34장 / STD-001)
- 근거 없는 `1위·대표·추천·인기·SKY·Hot` 신뢰·랭킹 배지 **금지** (표시용 Hot/SKY 상품 배지와 가짜 신뢰 배지를 구분 — SKY는 “인증이 아니라 광고 표현”(UDX-00 handoff))
- Role은 Badge가 아니라 **Role Tab** (r6 · h32–36)

### Button (STD-001 + local UDX-STD-001-Button)

- 기본 h **44** · desktop compact만 **40** · radius **8** · type 16/24 · 600 · pad-inline 16 (큰 CTA 20)
- 위계: Primary / Secondary / Tertiary / Danger / Disabled only
- **페이지·주요 영역 대표 CTA 1개만** Primary fill
- 검색 Primary: 카피「검색」· desktop **≥72×40** · mobile **≥72×44** · 64px FAIL · no square aspect
- 카드 행동: 카피 **「상세 보기」만** · **Secondary** (흰 bg + primary text/border) · desktop h40 · mobile h44 · min-width 84 · pad-inline 16
- 「상세」단독·「자세히 보기」혼용 금지 · 카드 전폭 Primary 버튼 금지
- 터치 목표 44×44 (버튼·탭·닫기)

---

## 5. Shell — promo / paid exposure vs mypage

### Common Shell (UDX-20 / STD-001 / paid IMPLEMENTATION-GUIDE)

- 외곽 max **1280** border-box · gutter desktop **32** / tablet **24** / mobile **16**
- 검증폭: 360 / 390 / 430 / 768 / 1440
- 배경 시작선 ≠ 콘텐츠 시작선. warm/tinted는 **좌측 bleed 가능**, **우측은 body right에서 끝**. rail·footer는 white.

**Two published Shell families:**

| Family | Structure | Typical screens |
|--------|-----------|-----------------|
| Type A (no left nav) | body + gap + right rail | 홈·찾기 Discovery |
| Type B (left nav) | left nav + gap + body + gap + right rail | 유료상품·커뮤니티·고객센터·마이페이지 운영 |

**Static axis PASS (UDX-30 / 5B):**  
Shell 1280 · gutter 32 · common gap 24 · Type A body **892** + rail **300** · Type B nav **220** + body **648** + rail **300**.  
추정값 잠금 금지 — 화면별 computed px를 STD-001에 기록해야 잠금.

**Paid storefront live FACT (IMPLEMENTATION-GUIDE B안 · 2026-09-18):**  
`32+160+24+800+8+224+32=1280` · warm = nav+gap+body만 (**984**) · rail/footer white · 상품홈만 full-width cinema hero · positions/access는 cinema 없음 + compact intro.

**UDX-00 paid exception:** `#/plans`, `#/plans/positions`, `#/plans/access`는 전역 white shell 안 **예외 섹션**; warm 좌측 bleed · 우측 body right 마감 · hero/intro/main start line family 통일.

### A) Paid / promo exposure (maps to `#/plans*` + Discovery paid slots)

- IA (34장): `#/plans` 홈 · `#/plans/positions` 노출상품 · `#/plans/access` 쪽지권 · mypage plans는 이용현황/내상품/결제내역
- 톤: **마이페이지 설정이 아니라 독립 스토어프론트** (UDX-00). 노출상품·쪽지권 **페이지 분리**. 상품 먼저 → 적용 대상 후행.
- 공부방 Prime 3칸 점유·대기 · Pick 5×2=10 · 과외쌤은 순환형(공부방 점유 UI 재사용 금지)
- 홈 Discovery 노출 밀도: Prime 3 → Pick 10 → Basic 20 (UDX-30)
- 광고·유료 노출은 **라벨로 유기적 결과와 구분** (UDX-20 / UDX-50)
- 우측 레일: 보조 · Hero Anchor · Slot2 Signal · Quiet Rails · 한 화면 강한 기억 포인트 **1개** (UDX-20/50)
- `#/promo/study-room` 문자열 자체는 이번 Notion 검색에서 **라우트 잠금으로 미확인** → redesign 시 기존 `#/plans/positions` / 홍보 랜딩(UDX-M01) 중 어느 축인지 상위 확인 필요. **새 라우트·정책 발명 금지.**

### B) Mypage · 쪽지 수신 설정 (`#/mypage/registrations/study-rooms/:id/inquiries`)

- Shell: 공부방 마이페이지 Type B 준용 (UDX-40 / 15장) — 좌메뉴·본문 시작선·depth 표시 유지
- 화면명 **쪽지와 문의** · 레거시 `…/exposure` → 본 경로 redirect (P20-05)
- **운영 스위치만** 담당. 공개·쪽지·유료 축 혼합 금지.
- 구성 잠금: (A) 현재 상태 요약 (B) 메인 스위치「쪽지 받는 중」기본 ON (C) OFF 시 닫힘 사유 2개 — 정원 마감 / 잠시 쉼 (D) 카드 CTA 미리보기 (E) 저장=쪽지 상태만
- CTA 매핑: open→「쪽지하기」 · paused/capacity_full→「지금은 쪽지 안 받음」
- **운영문의 내역**은 이 화면이 아님 → 마이페이지「내 문의 내역」(15장). 상품 진입·유료 자격·노출 매트릭스·공개 게이트 비배치.
- 쪽지설정 ≠ 번호 변경/본인확인 (계정설정 담당) (15장)
- UDX-40: 마이페이지는 검수판이 아니라 **운영 허브** · 쪽지설정은 **심사표가 아니라 운영 정리 화면**처럼 읽혀야 함 · 다음 행동 1~2개 · 잔소리형 부족 n개 금지

---

## 6. Basic card + annotation constraints

### Basic (UDX-30 / STD-001)

- Desktop **2단 균등** · 20개 = 10행 + 숫자형 페이지네이션 · 홀수 마지막 카드 전폭 금지 · ≤719 Basic 1단
- 정보구조: 신원 · 설명 · 판단/행동 유지. 항목이 줄어도 카드 과도 축소 금지 → 정렬·여백·구분선.
- Typo: 이름·가격 **16** / 비교값 **14** / 주석·배지 **12**
- 행동: Secondary「상세 보기」
- Basic 카드 표시값은 **기본등록**에서 수집 (UDX-30 카드–등록 연결 / STD-002 참조)
- 증빙: 탐색 화면에 원본·검수 상태 비표시 · **있음/없음만** · `자료 있음`≠플랫폼 인증 (UDX-30)

### Annotation / 주석식 안내 (UDX-10 / STD-001)

- 주석·캡션·짧은 상태 = **FS-1 12px only**
- Disabled 사유는 버튼 라벨에 길게 넣지 말고 **버튼 밖 12·14px**로 분리
- 사용자 화면에 enum·내부 화면번호·프리뷰 개발 문구 비노출 (UDX-30; 15장도 개발용 주석 제거 잠금)
- 가짜 후기·통계·근거 없는 신뢰배지 금지 (UDX-00/10/30)

---

## 7. What 「정리」 means in this system (existing language)

인용만 — 새 정의 없음.

1. **UDX-M01:** 홍보 풀페이지 톤 = **「광고판보다 “잘 정리된 서비스 소개 페이지”에 더 가까운 톤」**. 과장 광고·올드 포털 배너·문장 과밀·버튼 과다·기업 소개서 금지. 시각 키워드에 **「카드형 정보 정리」**.
2. **UDX-50:** 오래된 포털 배너·번쩍이는 광고·장문 기업소개서 회피. 홈 우측 배너열은 **「광고판처럼 시끄럽지 않아야」** 하되 **밋밋해서도 안 됨** → soft variant + Quiet Rails. visual refresh는 허용하되 **광고형 과장**과 **반복 장식 피로** 동시 금지.
3. **UDX-00:** 가짜 후기·통계·근거 없는 배지·**광고 위장 표현** 금지. 정책 변경과 시각 개선을 한 작업에 섞지 않음. 공통 80% + 역할 20%.
4. **UDX-10 브랜드:** 모던함 · 따뜻함 · 지역생활감 · **과장 없는 신뢰** · **비교하기 쉬운 질서감**. 화면 장식보다 **정보 계층·읽는 순서** 우선.
5. **UDX-40 / 15장:** 「정리」= 마이페이지·쪽지설정을 **검수·잔소리·감점표가 아닌 운영 상태 정리 + 다음 행동**으로 보이게 하는 것. 공개·쪽지·유료 축을 섞어 노이즈를 만들지 않음 (P20-05).
6. **UDX-20:** 한 화면 대표 CTA 원칙 1(+보조 1). 카드/리스트 액션이 상세보다 먼저 튀지 않게. GNB 강한 pill/색띠/배너형 active 금지 — 강렬함은 **대비·타이포·여백·CTA 집중**.

**리디자인 함의 (기존 언어만):** A·B 모두 “더 화려하게”가 아니라 **정보 위계·여백·단일 CTA·광고 라벨 분리·카드형 질서**로 노이즈를 줄이는 방향. 새 색·새 라우트·새 수신 정책 발명 금지.

---

## 8. Scope notes for A / B (no new policy)

| Target | Use these locks | Do not invent |
|--------|-----------------|---------------|
| A paid/promo exposure | UDX-20/30/50 + STD-001 paid §9 + 34장 IA + paid Shell FACT | New `#/promo/*` policy, UP product, tutor occupancy UI, badge mid-term swap |
| B inquiries / 쪽지 수신 | P20-05 layout + 15장 분리 + UDX-40 운영허브 + STD-001 controls | waiting_only, 쪽지↔공개 연동 복구, 번호검증을 쪽지설정에 재배치, 운영문의 내역 합침 |

---

## 9. Local board caveat

`stage5b-design-standard-v01` / `stage5a-*-locked-candidate`는 Notion UDX-STD-001·UDX-10과 수치가 대부분 일치하나, 문서 자체에 **「5B 초안 · 최종 승인 아님 · 운영 적용 전」** / **「전역 캐논 아님」** 명시. Primary hover 등 HEX 미소차는 **Notion STD-001 / UDX-10을 디자인 인용 우선**으로 두고, local은 구현 보드 참고로만 표기함.
