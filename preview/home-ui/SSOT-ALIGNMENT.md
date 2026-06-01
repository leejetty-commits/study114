# 새 잠금 기준 ↔ preview 반영 정리

**기준일:** 2026-06-01  
**SSOT:** [6장](../docs/ssot/06-phase1-menu-structure.md) · [5장](../docs/ssot/05-study-room-db.md) · [8장](../docs/ssot/08-tutor-registration-db.md) · [9장](../docs/ssot/09-main-screen-roles.md)  
**코드:** `src/policy.js` · `src/nav-config.js`

---

## A. 새 기준 반영 체크

| 항목 | 잠금 내용 | 반영 상태 |
|------|-----------|-----------|
| **메뉴 구조** | 퀵매칭·앱다운·자료실/포털 **1차 제외** · 유틸+GNB **2층** · GNB 예시 7항목 | ✅ `nav-config.js` · `layout.js` 헤더 |
| **표기** | 가입 **학생/학부모** · 내부 카피 **학생** 중심 | △ GNB `학생/학부모` · 학생 리스트 섹션 카피는 「학생」 |
| **등록 2단계** | 기본→리스트 / 상세→누구나 이어서 | ✅ `study-room-ui` phase · `policy.js` |
| **Pick/Prime** | **상세등록 완료 필수** · 구매자만 상세 막지 않음 | ✅ 문구·`EXPOSURE_TIERS` · complete 화면 |
| **유튜브** | 상세 1개 · 외부 URL · 썸네일+버튼(1차) | ✅ `study-room-ui` facility `youtube_url` 필드 |
| **과외 비교** | 경량 · 최소 7필드 | ✅ `TUTOR_COMPARE_FIELDS` (UI 미구현) |
| **열람권** | 과외쌤 후보 · 건수+기간 · 1차 미구현 | ✅ `TUTOR_VIEW_PASS_CANDIDATE` 메모만 |

---

## B. preview/home-ui 충돌 점검

### 이미 맞는 것

- 비회원 대치동 데모 · 공부방 지도만 (9장)
- Prime/Pick 박스 + 학생 리스트 완급 (비회원 메인)
- 광고/프로모 사이드바 (과다 적층 지양)
- 역할별 4종 메인 프리뷰 라우트
- 로그인 유도 (찜·비교·문의·상세)
- 1차 제외 메뉴 **미노출** (퀵매칭 등 `MENU_EXCLUDED_PHASE1`)

### 아직 안 맞거나 부분인 것

| 항목 | 이전/현재 | 조치 |
|------|-----------|------|
| 헤더 1층 + 구 GNB 6항목 | 홈·마이페이지 GNB 혼재 | ✅ **이번 턴 2층으로 수정** |
| 「과외 찾기」 명칭 | 과외쌤찾기 아님 | ✅ **과외쌤찾기** |
| 학생/학부모 GNB | 없음 | ✅ 추가 |
| 안전과외·고객센터 GNB | 없음 | ✅ 추가 |
| 유틸 메뉴 | 로그인만 헤더 우측 | ✅ 유틸 줄 분리 |
| 비회원 Prime/Pick | 상세등록 조건 문구 없음 | ✅ 티어 설명 추가 |
| 공부방 비교검색 UI | 버튼만(login-gate) | ⏳ 리스트 화면 2순위 |
| 과외쌤 비교검색 UI | 없음 | ⏳ 경량 정의만 |
| 학부모 메인 | 구 구조·구 헤더 | ⏳ 1순위 다음 화면 |
| 과외쌤 등록 UI | 패키지 없음 | ⏳ tutor-ui 후순위 |
| 내부 카피 「학생」 통일 | 학부모 화면에 자녀/학부모 혼재 | ⏳ 학부모 메인 작업 시 |

### 바로 손본 것 (이번 턴)

1. `nav-config.js` + `policy.js` 신설  
2. `layout.js` — 유틸 2층 · GNB 6장 기준  
3. `guest-sections.js` — Prime/Pick 상세등록 전제 문구  
4. `docs/ssot/06-phase1-menu-structure.md` · `08-tutor-registration-db.md` · 5장 §15  
5. `study-room-ui` — 기본/상세 phase · `youtube_url`

---

## C. 다음 구현 우선순위

### 1순위

1. **학부모 메인** (`#/parent`) — 9장 §5-1 · 학생 중심 카피 · 새 헤더 유지 · 공부방/과외 탭  
2. **공부방 비교검색** — 1차 필수 · 리스트/카드에서 진입 · home-ui 또는 별도 라우트  
3. **기본등록 완료 UX** — location 끝에서 「일반 리스트 노출 가능」 안내 + 상세 CTA  

### 2순위

4. **과외쌤 등록 프리뷰** — 8장 2단계 · `youtube_url` · 기본/상세 분리  
5. **과외쌤 비교검색 경량** — `TUTOR_COMPARE_FIELDS` 7열 테이블  
6. **auth-ui ↔ 등록 연동** — 가입 완료 → 기본등록 진입  

### 3순위

7. 학생 열람권 UI 스케치 (과외쌤 마이페이지 후보, 결제 없음)  
8. Prime/Pick 구매·노출권 연동 (DB 분리)  
9. PHP/API 실저장  

---

## 당장 손대지 않은 것 (확인)

- 퀵매칭 · 앱다운로드 · 자료실/포털 GNB/배너 **없음**
- 열람권 결제 · 영상 업로드 · 내부 플레이어
- Pick/Prime 결제 상품 확장 UI

---

## 프리뷰 확인

```bash
cd preview/home-ui && npm run dev    # :5174
cd preview/study-room-ui && npm run dev  # :5175
```

- 헤더: 상단 유틸 줄 + 하단 GNB  
- 공부방등록 GNB → `localhost:5175`  
- facility 단계: YouTube URL 필드 · phase 표시
