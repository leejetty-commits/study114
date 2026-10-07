# 100 · 098 로컬 수락 — 과외쌤 로그인 홈 UI

- 작성일: 2026-09-25 (KST)
- 대상: [098](098-tutor-home-login-ui-fix-ticket.md)
- 판정: **로컬 수락** (배포 시 allowlist만 · 잔여 dirty 분리)
- push / `build:dothome`: **안 함** (배포는 별도 지시 전까지 금지)
- 확인: Cursor 보고 + 워킹트리 코드 대조 (미리보기 `renderTutor` · `#/tutor` 실로그인 스모크는 미실시)

---

## 1. 수정 파일 (본선)

보고·코드 일치:

- `preview/home-ui/src/home-marketing-banner.js`
- `preview/home-ui/src/screens/tutor.js`
- `preview/home-ui/src/provider-home.js`
- `preview/home-ui/src/exposure-render.js`
- `preview/search-ui/src/search-tier-render.js`
- `preview/search-ui/src/search-find-surface.js`

티켓 allowlist 중 미변경(스킵 OK): `data.js` · `presets.js` · `tutor-activity-chart.js` · `search-schema.js`

저장소에 `docs/098` 없음 → 박스 SSOT만 사용. 정상.

---

## 2. 잠금 ①~⑦ 대조

| # | 화면 | 판정 | 근거 |
|---|------|------|------|
| 1 | 히어로 | **PASS** | 둘째 줄 「우리동네 교육플랫폼」(플랫폼 앞 공백 없음) · 줄바꿈 |
| 2 | 과외쌤 박스 | **PASS** | 과외등록 제거 · 쪽지 후기함∥마이페이지 · 조회→등록 · 메모/보낸메모 없음. 쪽지 기본값=「받음」(사용자 확인 2026-09-25). 「안받음」분기는 필요 시 후속 |
| 3 | 활동형 | **PASS** | 배지 제거 · 막대·지역 클릭 유지 |
| 4 | 프라임 | **PASS** | 항상 3칸 · 실1+빈2 · 실0이면 샘플1+EMPTY2 |
| 5 | 픽 | **PASS** | 샘플1+EMPTY4 · 「후보 없습니다」만/샘플5 아님 |
| 6 | 현재위치 | **PASS(약)** | 화면 라벨은 대표 활동지역(인천 탭→서울시 유지). 내부 일부 경로에 클릭 탭 잔여 |
| 7 | 우리동네 학생 | **PASS** | 검색폼 없음 · 동네 스냅샷 · 제목 「서울시 학생」류(대표 기준) |

---

## 3. 워킹트리 주의 (배포 시)

098 본선 6파일 **외** dirty가 남아 있음. 예:

- `provider-status.js` (조회수 헬퍼 추가·멤버박스 미연결)
- `location-display.js` (좌표)
- `ProviderUsageService.php` (ROI)
- `study-room-reg/screens.js` (공백)

→ **배포 커밋에 이들과 섞지 말 것.** 098 allowlist만 스테이징.

---

## 4. 잔여 (이번 재오픈 안 함 · 선택)

1. (선택) 「쪽지 안받음」분기 — 기본값은 받음으로 잠금. 지금은 필수 아님
2. (선택) 현재위치 내부 경로를 대표 한 줄로 더 통일
3. 배포 전 스모크: 픽 실≥1 · 대표 변경 후 라벨 · 공부방 홈 · 게스트 회귀

---

## 5. 결론

주석 스크린샷 ①~⑦ 화면 목표는 로컬에서 맞춰졌다. **098 로컬 수락.** 「조건부」는 재작업이 아니라 **배포 전 allowlist·잔여 dirty 주의**만 뜻한다.  
배포 지시: [101](101-tutor-home-098-deploy-ticket.md) (사용자 허가 2026-09-25).
