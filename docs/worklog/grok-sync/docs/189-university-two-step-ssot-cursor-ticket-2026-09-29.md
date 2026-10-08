# 189 · Cursor — 대학/대학원 2단 SSOT 피커 (시·도 → 지역 대학 전체)

- 작성: 2026-09-29 · 우동공과2
- 근거: 187 감사 + 종현 잠금(2단·전문대·라벨·대학원=기타)
- 선행: **188 재선택 수락됨** — 재선택(비우기→목록·blur 복원) 회귀 금지
- push · build:dothome · Notion · commit **금지** (로컬만)

## Must

1. **입력·검색·결과 같은 SSOT 하나.** `preview/shared/korean-universities.js`를 평탄 37개 datalist에서  
   **① 광역시/도 → ② 그 지역 대학 목록** 구조로 교체. 4년제 + **전문대 포함** 「해당 지역 전체」.
2. 등록(과외쌤·공부방)과 검색 필터가 **같은 목록**을 씀. 지금 빠진 예(명지대·광운대 등)와 전문대가 해당 시·도 2단에 나와야 함.
3. 화면 라벨 전역 **「대학/대학원」** (등록의 「출신대학」·검색의 「학교명」 제거). 코드명(`university_name` 등) 화면 노출 금지.
4. **대학원**: 등록은 **서술형(자유 입력)** 가능. 검색에서는 대학원을 **「기타」**로 취급(별도 대학원 목록 강제 금지).
5. 목록에 없는 학교·서술형은 **「기타」**(+필요 시 자유 텍스트)로 저장·검색 가능.
6. **188 유지**: 이미 고른 뒤에도 다시 눌러 다른 학교 선택 가능(저장 후 재진입 포함). readonly/disabled 잠금 금지.
7. UX는 **2단 선택**(시·도 고른 뒤 그 지역 대학). 평탄 전국 datalist만 두고 끝내지 말 것.

## Allowlist

- `preview/shared/korean-universities.js` (**이번 티켓 핵심·쓰기 허용**)
- 대학 필드 쓰는 등록/검색 화면만 최소 수정  
  (188에서 손댄: `tutor-reg/screens.js`, `study-room-reg/embedded-panels.js`, `study-room-ui/.../step-facility.js`, `tutor-ui/.../step-detail.js`, `tutor-ui/.../step-contact.js` + 검색 UI에서 `renderUniversityNameField` / 동등 호출부)
- 목록 데이터는 **정적 JS 모듈**로 번들(외부 API 런타임 호출 금지)

## Forbid

- 188 재선택 동작 깨기
- 동네인사 · 등록점검 「공개」블록 · 마이페이지 좌측메뉴
- 기본정보·과외지역 탭에 대학 칸 새로 넣기
- commit / push / `build:dothome` / Notion
- 교육부 API를 매 요청 호출하는 구현

## 스모크

1. 등록: 시·도 → 대학 고르기 · 명지대/광운대/전문대 중 해당 지역에 존재
2. 저장 후 다시 열어 **다른 학교로 재선택** (188)
3. 「기타」·대학원 서술형 입력 후 저장
4. 검색 라벨 「대학/대학원」 · 같은 SSOT · 대학원≈기타
5. 기본정보·과외지역 탭에 대학 입력 없음

## 커밋 예 (수락·배포 지시 후)

`feat(university): two-step sido→school SSOT picker; label 대학/대학원`
로컬만.
