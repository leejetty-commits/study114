# Stage 5A — 블루 디자인 시스템 잠금 후보안

작성: 2026-09-04 KST  
상태: **5A 잠금 후보안 · 운영 적용 전 · Primary 잠금 후보 · 예시 데이터**  
5B 컴포넌트 구현 아님. ops / GitHub / DB / API / 라우트 / 배포 없음.

---

## 1. 작업 범위

한 일:
- `/workspace/study114-ds/stage5a-blue-system/`에 토큰·컴포넌트·반응형·결정 문서 작성
- `tokens.css` (`.uds-theme` / `[data-theme="uds-proposal"]`) + 참조 화면 6장 + 색 보드
- Chrome headless 스크린샷 + Pillow 하단 여백 자르기
- ZIP `/workspace/stage5a-blue-system.zip`

하지 않은 일 (지킨 금지):
- `plans-ui-v5` 수정 없음 (시각 연속용 **읽기만**)
- `stage4-late` / `stage4-late-blue` 원본 덮어쓰기 없음
- GitHub, ops 레포, DB, API, 라우트, 배포 없음
- 5B 컴포넌트 구현·Cursor PR 없음
- 로그인 게이트·모바일 내비·학생 GNB·지도/거리 최종화 없음
- 새 카드 티어·가격 정책 변경 없음
- 클레이 `#B5402A`·전체폭 Basic 단일 행 미사용

소스: `stage4-late-blue`(승인된 블루 보정), 공개 화면 IA(google-parent 등), plans-ui-v5의 `#266BC4` 연속, 본 프롬프트.

---

## 2. 4단계에서 확정된 것

| 항목 | 내용 |
|------|------|
| 사이트 Primary 계열 | 블루. 클레이 `#B5402A` 미채택 |
| 차용 | 흰 표면, 얇은 보더, 여백, 정돈된 타이포, 이미지 비율, 정렬, 행동 위계 |
| 레이아웃/IA | 우동공과 유지. Prime=설득, Pick=비교, Basic=탐색 |
| Basic 배열 | 데스크톱 **2단 그리드**. 전체폭 단일 행 아님 |
| 가격 | Ink. 적색 가격 미사용(시안) |
| Primary CTA | 블루만. 결정 영역당 하나 |
| d04 데스크톱 | sticky 미니샵 **요약 레일 후보** |
| d04 모바일 | 하단 sticky CTA를 대안으로 제시(4단계에선 A/B 미채택) |
| d06 | 최근/찜/추천 = **같은 Basic 카드**, 새 종류 없음 |
| 증빙 | 있음/없음. 인증·랭킹 아님 |
| GNB 라벨 | 공부방찾기 / 과외쌤찾기 / 학생찾기 유지 |
| 검색 초기 | Basic 통합 목록. 검색 상단에 Prime/Pick 미배치 |
| 타이포 스케일 | 12 / 14 / 16 / 18 / 22 / 28 / 36, Pretendard |

---

## 3. 5A에서 제안한 것

| 항목 | 제안 |
|------|------|
| Primary 잠금 후보 | **`#266BC4`** (A). B `#2B7FFF`는 보드 비교만 |
| 토큰 스코프 | `.uds-theme` / `[data-theme="uds-proposal"]`. 전역 body 브랜드화 안 함 |
| 팔레트 | hover/pressed/subtle/focus/ink/muted/bg/surface/line/success/warning/error/disabled |
| 13 컴포넌트 스펙 | Header~Footer. 필드·상태·금지 표현 포함 |
| 반응형 | 1440/768/430/390/360. Basic 2→1 = **719px** (최소 카드 320) |
| 레일 접힘 | ≤960px static. ≥960 sticky 후보 |
| 모바일 상세 | 하단 sticky CTA를 **워킹 디폴트**로 승격. 대안 A 미채택 |
| 레일 필드 | 이름·역할·지역·가격·공개·찜·비교·쪽지. 선택 썸네일. 본문 비반복 |
| 참조 화면 | guest-home 부분, room-search, detail desktop/mobile, parent-home, color-board |
| 리뷰 배너 | 상단만. 제품 크롬에 검토 주석 혼합 안 함 |

---

## 4. 아직 보류할 것

| 항목 | 이유 |
|------|------|
| Primary의 **ops 전역 최종** | 5A는 후보. 실측·plans 통합 수위 미정 |
| plans 아이보리 캔버스와 공개 쿨 뉴트럴 통합 | 병행 vs 단일 테마 미정 |
| 상세 로그인 게이트 · URL · 팝업 모달 | 4단계부터 미확정 |
| 모바일 내비 형태 | 가로 스크롤은 임시 |
| 학생찾기 GNB 노출 범위·역할 분리 | 현재 메뉴 유지, 변경 없음 |
| 지도 검색·거리 정렬 | 시안 제외 |
| 운영 화면 적색 가격의 Ink 일괄 변경 | 정책·배포 이슈 |
| 증빙 파일 첨부 UX | 보유 여부만 잠금 |
| 비교함 상세 규칙 | 빈 상태만 원칙 |
| 마이페이지 3열의 5A 시각 재작성 | 뼈대만 유지 |
| hover/pressed의 운영 확정값 | 후보안 파생 |

---

## 5. 운영 코드에 반영하면 안 되는 것

| 금지 | 설명 |
|------|------|
| 이 폴더 CSS를 그대로 프로덕션에 올리기 | 잠금 **후보** 시안 |
| `--uds-primary`를 ops 토큰으로 커밋 | 전역 최종이 아님 |
| 5B 없이 컴포넌트 라이브러리화 | 5A는 스펙+정적 HTML |
| 클레이 토큰 재도입 | 닫힌 결정 |
| Basic을 전체폭 1행으로 되돌리기 | 닫힌 결정 |
| 검색에 Prime/Pick을 섞어 유료 1등처럼 보이기 | 4단계 확정 |
| 증빙=인증 뱃지, Hot/SKY/1위 | 정책 |
| 레일을 장바구니로 구현 | 요약 레일 후보일 뿐 |
| 로그인 게이트·모달을 이 HTML 그대로 구현 | 미확정 |
| plans-ui-v5 파일을 이 토큰으로 덮기 | 읽기 전용 연속 |

---

## 6. Cursor에게 넘길 수 있는 항목

| 항목 | 넘기는 형태 |
|------|-------------|
| Primary **후보** `#266BC4`, 흰 글자 5.27:1 | 문서 인용. PR 금지 |
| 가격 Ink / CTA 블루 분리 원칙 | 신규 시안·카피에 적용 검토 |
| Basic 데스크톱 2단, 최소 너비 320, 1열 분기 719 | 프론트 그리드 논의용 |
| 증빙 라벨 있음/없음 | 카피 교정 후보 |
| Prime/Pick/Basic 역할 유지 | IA 확인용 |
| 모바일 상세 하단 CTA를 기본으로 검토 | 구현 착수 전 합의용 |
| 13 컴포넌트 필드 목록 | 5B 착수 전 체크리스트 |

넘길 때도 **운영 반영 지시가 아니라 5A 후보안**임을 명시한다.

---

## 7. Cursor에게 아직 넘기면 안 되는 항목

| 항목 | 이유 |
|------|------|
| ops 레포 PR / 라우트 / API / DB | 금지 |
| plans-ui-v5 수정 | 읽기 전용 |
| 5B 컴포넌트 코드 생성 | 5A에서 정지 |
| 로그인 게이트·모달 구현 | 미확정 |
| 모바일 GNB 최종 구현 | 미확정 |
| 학생찾기 메뉴 변경 | 금지 |
| 지도·거리 | 금지 |
| 전역 토큰 파일을 서비스에 추가 | 후보 단계 |
| 가격 정책·노출 상품 로직 | 비시각 |

---

## 8. Primary 비교 요약

| | `#266BC4` (A) | `#2B7FFF` (B) |
|--|---------------|---------------|
| 흰 글자 대비 | 5.27:1 AA 본문 통과 | 3.76:1 AA 본문 미달 |
| plans 연속 | `--plans-primary`와 동일 | 더 밝음, 불연속 |
| 4단계 블루 보정 | 참고값과 동일 | 신규 |
| 소프트함 | 중간 | 더 밝으나 대비 손실 |
| 5A 권고 | **잠금 후보** | 보드 잔류, 기본값 아님 |

상세: `DECISIONS.md`. 보드: `pages/color-board.html`, `shots/color-board.png`.

---

## 9. 금지 유지 확인

- [x] ops / Cursor PR / plans-ui-v5 편집 없음
- [x] 5B 구현 없음
- [x] 로그인 게이트·모바일 내비·학생 GNB 최종화 없음
- [x] 지도/거리 없음
- [x] 새 카드 티어 없음
- [x] 가격·정책 변경 없음
- [x] 클레이·clay stage4-late 원본·A/B/C·전체폭 Basic 비캐논
- [x] 제품 UI에 `미니샵 상세` 등 검토 라벨 없음
- [x] 리뷰 배너 상단만: 「5A 잠금 후보안 · 운영 적용 전 · Primary 잠금 후보 · 예시 데이터」
- [x] 5A에서 정지

---

## 10. 산출 경로

```
/workspace/study114-ds/stage5a-blue-system/
  TOKENS.md
  COMPONENTS.md
  RESPONSIVE.md
  DECISIONS.md
  REPORT.md
  tokens.css
  assets/ref.css
  fonts/Pretendard-*.woff2
  pages/color-board.html
  pages/ref-guest-home.html
  pages/ref-room-search.html
  pages/ref-detail-desktop.html
  pages/ref-detail-mobile.html
  pages/ref-parent-home.html
  shots/color-board.png
  shots/ref-guest-home.png          @1440
  shots/ref-room-search.png         @1440
  shots/ref-detail-desktop.png      @1440
  shots/ref-detail-mobile.png       @390
  shots/ref-parent-home.png         @1440
  shots/ref-basic-768.png           @768 (선택)
/workspace/stage5a-blue-system.zip
```
