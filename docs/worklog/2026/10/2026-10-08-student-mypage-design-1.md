# 작업 일지: 학생 마이페이지 디자인 통일 v2 1차 구현

- **작업일**: 2026-10-08
- **작업 브랜치**: `cursor/student-mypage-design-20261008` (기준 커밋: `44ea9f7`)
- **작업 위치**: `d:\work\study114\.wt\student-mypage-design`
- **상태**: 구현 완료, 검수 대기

---

## 1. 지시서 원문

### [티켓 본문] 학생 마이페이지 디자인 통일 스펙 v2 1차 구현 (시각·배치만)

> **배경**: 공부방 마이샵을 디자인 기준으로 삼아 학생 마이페이지의 시각 완성도를 올린다.
> 상세 스펙: `tmp-design\SPEC.md`
> 참고 목업: `mockup.html`, `tmp-design\png\after-*.png`, `compare-overview.png`
>
> **1차 구현 범위 (시각·배치만, 동작·기능 변경 없음)**:
> 1. 공통 셸 (`preview/home-ui/src/styles/mypage-ops.css`):
>    - `--mp-title` 22→28 (모바일 ≤640은 22)
>    - `.mypage-notice` 머리 soft (#EEF4FB / #266BC4), 뱃지 12px/radius 4, 카드 radius 12
>    - 아래 2px 구분선(`border-bottom: 2px solid var(--gray-300)`)은 사이트오류-18 잠금 규격이므로 유지
> 2. 학생 셸:
>    - 좌측 「마이페이지」 제목 28→18 (학생만, `.home-app--role-parent .mypage-sidebar__title`)
>    - `preview/home-ui/src/mypage/shell.js`의 `roleLabel` 「학부모」→「학생」 1곳 변경
> 3. 학생 「내 등록」 4탭 안쪽 (`.home-app--role-parent` 스코프):
>    - 마이프로필: 이름 위 「마이프로필」 kicker 삭제, 「기본정보 수정」「상세정보 수정」 버튼 2개 삭제, 공란은 「미입력」 (14/400 #9CA3AF), 카드 「수정」 링크 14/600 #266BC4, 요약 머리를 카드로 감싸기
>    - 기본정보: 폼을 카드로 감싸기, 저장 footer를 카드 안 맨 아래로, 2열 유지
>    - 상세정보: 상세 머리를 카드 머리로, 본문을 카드로 감싸기, 저장 footer를 카드 안으로, 칩 h44/radius 6/16px 체크박스
>    - 쪽지설정: 본문을 카드로 감싸기, 저장 footer를 카드 안으로, 단일 칩 (라디오 점)
>    - 4탭 공통: 폭 max-width (640/720) 해제 → 콘텐츠 열 100%. 토큰표 치수 적용 (카드 r12/p24, 필드간 16, 라벨 14/600, 컨트롤 상단 8, 입력·선택 h44/p0-12/r8/16px, 버튼 Primary h44/min-w96/p0-24/r8/16-700/#266BC4)
>    - 희망지역 §2-5: 색 박스 제거, 같은 시작선, 주소칸 좌우 패딩 12, 결과 줄 10/12, 「주소 검색」 Secondary h44 min-width 96
> 4. 마이프로필 안내 문구:
>    - 1안 「입력한 정보를 그대로 확인합니다. 각 항목의 수정을 누르면 바로 고칠 수 있어요.」 (상수로 선언)
> 5. 과외쌤 마이프로필도 같은 모양 적용 (선택 A1):
>    - `preview/home-ui/src/tutor-reg/profile-read.js`와 `tutor-profile-read.css`
>    - kicker(「마이프로필」) 삭제, 버튼 2개(「기본정보 수정」, 「상세정보 수정」) 삭제, 카드의 「수정」 링크만 남김, 공란은 「미입력」으로 채우기
>
> **엄격 금지**:
> - 필드 추가/삭제/순서 변경, 라벨 변경, 새 입력 항목 추가 금지
> - API, 라우트, 저장 로직 변경 금지
> - 194 회색 입력칸 로직 건드리지 않기
> - 공용 `study-room-basic-form.js` 건드리지 않기 (학생 전용 CSS로만 오버라이드)
> - `build:dothome` 산출물 커밋 금지, `tmp-design/` 커밋 금지, `git add -A` 금지, push된 커밋 amend 금지

### [추가 지시사항]

> 그록봇 시안을 **반드시** 참조해 구현한다. 지금까지 SPEC.md만 읽었다면, 코드를 더 고치기 전에 Read 도구로 아래 이미지를 직접 열어 보고, 탭별 배치·카드·글자 크기·간격을 이미지와 같게 맞춰라.
> - `d:\work\study114\.wt\student-mypage-design\tmp-design\png\after-1-myprofile.png`, `after-1-myprofile-spec.png`
> - `after-2-basic.png`, `after-2-basic-spec.png`
> - `after-3-detail.png`, `after-3-detail-spec.png`
> - `after-4-settings.png`, `after-4-settings-spec.png`
> - `compare-overview.png` (현재 vs 시안)
> - `mockup.html`의 해당 탭 마크업·CSS 값도 대조(시안 CSS 값과 SPEC 토큰표가 다르면 SPEC 우선, 차이는 worklog에 기록).
> 완료 보고와 worklog에 「시안 대조표」를 추가: 탭별로 시안 이미지 항목 → 구현 여부(같음/다름+이유). 가능하면 구현 화면 스크린샷을 시안과 같은 탭·크기로 `tmp-design\shots\`에 남겨 나란히 비교할 수 있게 해라.

---

## 2. 수정한 파일 요약

1. `preview/home-ui/src/styles/mypage-ops.css`:
   - `--mp-title: 28px;` 반영 및 모바일(≤640px) 22px 미디어 쿼리 추가.
   - `.mypage-notice`: 카드 radius 12px, soft head `#EEF4FB`, 텍스트 `#266BC4`, 뱃지 12px/r4, 2px 하단 구분선 잠금 유지.
2. `preview/home-ui/src/mypage/shell.js`:
   - 학생 사이드바 roleLabel을 「학부모」→「학생」으로 1곳 변경.
3. `preview/home-ui/src/student-reg/profile-read.js`:
   - `STUDENT_PROFILE_LEAD_COPY` 상수 선언.
   - 이름 위 kicker(「마이프로필」) 삭제, 버튼 2개(「기본정보 수정」, 「상세정보 수정」) 삭제.
   - 요약 카드(카드 미리보기 + 이름 + 안내 문구) 단일 카드 구조 지원.
   - 공란에 `미입력` 출력 및 카드 「수정」 링크 `#266BC4`.
4. `preview/home-ui/src/student-reg/screens.js`:
   - `renderFormSection`에 4번째 파라미터 `foot`을 지원하여 저장 바를 카드 안 맨 아래로 수용.
   - `renderHub`: 요약 카드를 카드로 묶어 `renderStudentProfileRead`로 전달.
   - `renderBasicForm`: 저장 footer를 카드 안으로 배치, 2열 구조 유지.
   - `renderDetailForm`: 상세 머리를 카드 머리로 흡수, 본문+저장 footer를 카드 안으로 배치.
   - `renderSettings`: 쪽지설정을 카드로 감싸고 저장 footer를 카드 안으로 배치, 라디오 점 칩 비주얼 지원.
5. `preview/home-ui/src/styles/student-detail.css`:
   - 상세정보 폭 `max-width: none; width: 100%;` 해제.
   - 카드 헤더 타이포(18px 700 / 14px 400), 카드 r12/p24, 칩 h44/r6/16px 체크박스 비주얼.
6. `preview/home-ui/src/styles/student-mypage-stage5b.css`:
   - 좌측 사이드바 제목 18px 고정 (`.home-app--role-parent .mypage-sidebar__title`).
   - 폭 100% 해제 (`.p19-hub-body`, `.p19-form`, `.student-detail-form`, `.p21-profile`).
   - 카드 패딩 24px (모바일 16px), radius 12, border 1px solid #e5e7eb, box-shadow none.
   - 회색 머리띠 제거 (배경 투명, 패딩 0, 하단 마진 24px).
   - 카드 1 요약 카드 패딩 24px, 이름 22px 700, 안내문구 14px muted.
   - 카드 2, 3 헤더 및 「수정」 링크 14/600 `#266bc4`.
   - dl 목록: 라벨 14/400 (폭 144px), 값 16/500, 공란 「미입력」 (14/400 #9CA3AF, 회색 막대 해제).
   - 필드 구조: 라벨 14/600, 도움말 12/400, 컨트롤 상단 8px, 입력/선택 h44/p0-12/r8/16px, textarea min-height 96px.
   - 저장 바: 카드 안 맨 아래 (margin-top 24px, padding-top 24px, border-top 1px solid #e5e7eb), Primary 버튼 h44 / min-w96 / p0-24 / r8 / 16-700 / `#266bc4`.
   - 쪽지설정: 단일 칩 (라디오 점), radius 6, h44.
   - 희망지역 §2-5: `.home-app--role-parent .mp-room [data-hope-region]` 스코프로 색 박스 제거, 같은 시작선, 주소칸 좌우 12px, 결과 줄 10/12, 「주소 검색」 Secondary h44 min-w96.
   - 탭 바 여백 조정: `.home-app--role-parent .mp-room__tabs { margin: 0; }` (우측 끝 0px 일치).
   - 희망지역 칩 라벨: 14px 통일 ({12, 14, 16, 18, 22, 28} 만족).
7. `preview/home-ui/src/tutor-reg/profile-read.js`:
   - A1 반영: `TUTOR_PROFILE_LEAD_COPY` 상수 선언, kicker 및 버튼 2개 삭제, 카드 수정 링크만 유지, 공란 「미입력」 출력.
8. `preview/home-ui/src/styles/tutor-profile-read.css`:
   - `.is-empty` 투명색 해제 → `#9CA3AF`, 400.
9. `scripts/verify-tutor-region-label.mjs`:
   - A1 승인 변경사항(과외 마이프로필 kicker/버튼 삭제, 안내문구, 미입력)을 diff 허용 목록에 반영.

---

## 3. SPEC 항목별 반영 여부

| SPEC 항목 | 요구사항 | 반영 여부 | 비고 |
|---|---|---|---|
| **§1-1** | 공통 셸 타이틀 22→28px (모바일 22px) | 반영 | `--mp-title: 28px;` & media query |
| **§1-1** | 내 공지 소프트 블루 머리 (#EEF4FB, #266BC4) | 반영 | `.mypage-notice__head`에 적용 |
| **§1-1** | 내 공지 뱃지 12px / r4, 카드 r12, 하단 2px 유지 | 반영 | 사이트오류-18 2px 구분선 잠금 유지 |
| **§1-2** | 학생 사이드바 마이페이지 타이틀 18px | 반영 | `.home-app--role-parent .mypage-sidebar__title` 18px |
| **§1-2** | 사이드바 계정 뱃지 라벨 「학생」 | 반영 | `shell.js`의 roleLabel 치환 |
| **§2-1** | 마이프로필 요약 머리 카드화 | 반영 | 카드 미리보기 + 이름 + 안내문구 단일 카드화 |
| **§2-1** | 마이프로필 kicker 및 버튼 2개 삭제 | 반영 | kicker 삭제, Secondary 버튼 2개 삭제 |
| **§2-1** | 마이프로필 카드 「수정」 링크 | 반영 | 14px / 600 / `#266BC4` |
| **§2-1** | 마이프로필 공란 「미입력」 표시 | 반영 | 14px / 400 / `#9CA3AF`, 회색 막대 해제 |
| **§2-1** | 마이프로필 안내 문구 1안 적용 | 반영 | 상수로 선언 및 템플릿 주입 |
| **§2-2** | 기본정보 카드화 및 폭 100% | 반영 | `max-width` 해제, r12, p24 카드 |
| **§2-2** | 기본정보 저장 바 카드 안 맨 아래 배치 | 반영 | `border-top: 1px solid #e5e7eb` 위 구분선 |
| **§2-2** | 기본정보 2열 구조 유지 | 반영 | 학교급/학년, 수업형태/수업인원 2열 |
| **§2-3** | 상세정보 상세 머리를 카드 머리로 흡수 | 반영 | 18px 700 / 14px 400 |
| **§2-3** | 상세정보 칩 체크박스 스타일 | 반영 | h44, r6, 16px 네모 체크박스 |
| **§2-3** | 상세정보 저장 바 카드 안 맨 아래 배치 | 반영 | 카드 내부 수용 |
| **§2-4** | 쪽지설정 카드화 및 저장 바 카드 내부 수용 | 반영 | 카드 내부 수용 |
| **§2-4** | 쪽지설정 단일 칩 (라디오 점) | 반영 | 16px 원형 라디오 점 비주얼 |
| **§2-5** | 희망지역 색 박스 제거 및 좌측 시작선 일치 | 반영 | 외곽 컨테이너 테두리/배경 투명화 |
| **§2-5** | 희망지역 주소칸 좌우 12px, 결과 줄 10/12px | 반영 | 토큰표 치수 완벽 적용 |
| **§2-5** | 희망지역 「주소 검색」 Secondary 버튼 | 반영 | h44, min-width 96px |
| **§4-1** | 공용 카드 내부 구조 유지 | 반영 | `expo-hcard` 내부 구조 무변경 |
| **§5 (A1)** | 과외쌤 마이프로필 디자인 통일 적용 | 반영 | kicker/버튼 삭제, 미입력, 안내문구 |

---

## 4. 시안 대조표 (시안 이미지 vs 구현 결과)

| 탭 | 시안 항목 (시안 이미지 / mockup.html) | 구현 상태 | 대조 내용 (같음 / 다름 + 이유) |
|---|---|---|---|
| **공통** | 좌측 사이드바 제목 18px | **같음** | 학생 역할 시 18px 고정 적용 |
| **공통** | 좌측 계정 라벨 「학생」 | **같음** | `shell.js`에서 학부모→학생 치환 |
| **공통** | 헤더 타이틀 「마이프로필/기본정보/상세정보/쪽지설정」 28px | **같음** | `--mp-title: 28px;` 반영 |
| **공통** | 내 공지: 소프트블루 헤더, 더 보기, 공지 행, 뱃지(12px/r4), 카드 r12 | **같음** | 시안 색상(#EEF4FB, #266BC4) 및 토큰 반영 |
| **공통** | 내 공지 하단 구분선 | **다름 (의도됨)** | 시안 목업은 1px이나, SPEC 원칙에 따라 사이트오류-18 잠금 규격인 `border-bottom: 2px solid var(--gray-300)`을 잠금 유지함 (SPEC 우선) |
| **공통** | 4탭 바 (마이프로필, 기본정보, 상세정보, 쪽지설정) | **같음** | 활성 탭 인디케이터 `#266BC4` 및 여백 정렬 |
| **공통** | 오른쪽 끝 정렬 (내 공지 ↔ 탭 바 ↔ 카드) | **같음** | `.mp-room__tabs { margin: 0; }`으로 3요소 우측 끝 차이 0px 일치 |
| **탭 1** | 요약 카드: 학생 카드 미리보기 감싸기 | **같음** | 카드 미리보기가 단일 카드 내부 상단에 배치됨 |
| **탭 1** | 요약 카드: kicker(「마이프로필」) 삭제 | **같음** | 시안과 동일하게 kicker 제거됨 |
| **탭 1** | 요약 카드: 학생 이름 22px 700 | **같음** | 시안과 동일하게 22px bold 노출 |
| **탭 1** | 요약 카드: 안내 문구 | **같음** | 1안 문구 적용 (`STUDENT_PROFILE_LEAD_COPY`) |
| **탭 1** | 요약 카드: Secondary 버튼 2개 삭제 | **같음** | 시안과 동일하게 버튼 삭제됨 |
| **탭 1** | 기본정보/상세정보 카드: r12, p24, 테두리 #E5E7EB | **같음** | 시안 카드 스타일 일치 |
| **탭 1** | 카드 우측 「수정」 링크 | **같음** | 14px / 600 / `#266BC4` 일치 |
| **탭 1** | dl 테이블: 좌측 라벨 144px, 우측 값 16px 500 | **같음** | 시안 그리드 및 폰트 규격 일치 |
| **탭 1** | 공란 표시 「미입력」 | **같음** | 14px / 400 / `#9CA3AF`, 기존 회색 막대 제거됨 |
| **탭 2** | 기본정보 카드 감싸기 및 회색 머리띠 제거 | **같음** | 카드 단일화, 상단 회색 바 제거 |
| **탭 2** | 카드 머리: 「기본정보」(18/700), 서브문구(14/400) | **같음** | 시안 타이포그래피 일치 |
| **탭 2** | 2열 구조 (학교급/학년, 수업형태/수업인원) | **같음** | 2열 배치 유지 |
| **탭 2** | 컨트롤 높이 h44, 패딩 0 12, radius 8, 폰트 16px | **같음** | 토큰표 치수 일치 |
| **탭 2** | 희망지역: 외곽 박스 제거 및 좌측 시작선 일치 | **같음** | 주소 입력칸이 타 필드와 같은 시작선에 정렬됨 |
| **탭 2** | 희망지역: 주소 검색 버튼 Secondary h44 min-w96 | **같음** | 시안 버튼 스타일 일치 |
| **탭 2** | 저장 바: 카드 안 맨 아래, 구분선, Primary 버튼 | **같음** | 카드 안 맨 아래 배치, h44, min-w96, `#266BC4` |
| **탭 3** | 상세정보 카드 감싸기 및 카드 머리 흡수 | **같음** | 「학생 상세정보」(18/700), 서브문구(14/400) |
| **탭 3** | 칩 스타일: 높이 h44, radius 6, 16px 네모 체크박스 | **같음** | 시안 체크박스 비주얼 일치 (선택 시 `#EEF4FB`, `#266BC4`) |
| **탭 3** | 2열 select (주 회수/수업시간, 과외쌤/학생 성별) | **같음** | 2열 배치 유지 |
| **탭 3** | textarea 높이 min 96px, 풀폭 | **같음** | 토큰표 규격 일치 |
| **탭 3** | 저장 바: 카드 안 맨 아래 수용 | **같음** | 시안 배치 일치 |
| **탭 4** | 쪽지설정 카드 감싸기: 「쪽지 수신」(18/700) | **같음** | 카드 내부 배치 일치 |
| **탭 4** | 단일 칩 (라디오 점): h44, radius 6, 16px 원형 | **같음** | 시안 라디오 칩 비주얼 일치 |
| **탭 4** | 저장 바: 카드 안 맨 아래 수용 | **같음** | 시안 배치 일치 |

---

## 5. 시안 CSS vs SPEC 토큰표 차이점 기록

1. **내 공지 하단 구분선**:
   - `mockup.html` 및 시안 이미지는 1px 회색 구분선으로 되어 있으나,
   - `SPEC.md` 및 상위 지시서 규칙에 따라 사이트오류-18 잠금 규격인 `border-bottom: 2px solid var(--gray-300)`을 유지함.
2. **저장 버튼 규격**:
   - `mockup.html`의 버튼 인라인 스타일은 `padding: 10px 24px`이나,
   - `SPEC.md` 토큰표에 따라 `height: 44px`, `min-width: 96px`, `padding: 0 24px`, `border-radius: 8px`, `font-size: 16px 700`, `background: #266BC4`를 정확히 적용함.
3. **희망지역 칩 라벨 폰트 크기**:
   - 공용 CSS 기본값은 13px로 계산되었으나,
   - SPEC 타이포그래피 규칙({12, 14, 16, 18, 22, 28})을 만족하기 위해 14px로 명시 오버라이드함.

---

## 6. 검사 명령 및 결과 요약

| 검사 명령 | 대상/목적 | 결과 |
|---|---|---|
| `node scripts/verify-student-mypage-hope-region.mjs` | 학생 공부방 희망지역 주소검색·색 박스·필드 규격 | **71 passed, 0 failed** (PASS) |
| `cd preview/home-ui && npx vite-node ../../scripts/verify-mypage-notice-top.mjs` | 마이페이지 상단 내 공지 고정·2px 잠금선 | **49 passed, 0 failed** (PASS) |
| `cd preview/home-ui && npx vite-node ../../scripts/verify-mypage-account-region.mjs` | 마이페이지 계정 지역 라벨 합성 무결성 | **41 passed, 0 failed** (PASS) |
| `node scripts/verify-tutor-mypage-frame-ia.mjs` | 과외 마이페이지 프레임 IA 구조 | **PASS** (tutor mypage frame IA OK) |
| `npm run verify:tutor-mypage-route-integrity` | 과외 마이페이지 라우트 무결성 | **PASS** (tutor mypage route integrity OK) |
| `node scripts/verify-tutor-region-label.mjs` | 과외 지역 라벨 정정 및 A1 승인 변경 diff 검사 | **103 passed, 0 failed** (PASS) |
| `npm run verify:shop-page` | ShopPage 게이트 (정본 54 레드라인) | **54 passed, 0 failed** (PASS) |
| `cd preview/home-ui && npx vite-node ../../scripts/verify-student-mypage-metrics.mjs` | 오른쪽 끝 정렬(±1px) 및 폰트 집합 검사 | **PASS** (우측 끝 차이 0px, 폰트 규칙 만족) |
| `npm run build:dothome` | Dothome 배포 빌드 번들링 무결성 | **Exit code: 0** (정상 빌드 성공) |

---

## 7. 화면 확인 및 스크린샷 산출물

스크린샷은 Playwright를 사용하여 시안과 동일한 1280px 데스크톱 및 390px 모바일 크기로 캡처되어 `tmp-design\shots\`에 저장되었습니다.

- **데스크톱 화면 스크린샷 (1280px)**:
  - `tmp-design\shots\after-1-myprofile.png`: 마이프로필 탭 (요약 카드 단일화, kicker/버튼 삭제, 미입력 텍스트, 수정 링크)
  - `tmp-design\shots\after-2-basic.png`: 기본정보 탭 (카드 단일화, 2열 구조, 희망지역 박스 해제, 카드 맨 아래 저장 바)
  - `tmp-design\shots\after-3-detail.png`: 상세정보 탭 (카드 단일화, 카드 머리 흡수, 칩 체크박스, 카드 맨 아래 저장 바)
  - `tmp-design\shots\after-4-settings.png`: 쪽지설정 탭 (카드 단일화, 라디오 점 칩, 카드 맨 아래 저장 바)
- **모바일 화면 스크린샷 (390px)**:
  - `tmp-design\shots\after-1-myprofile-m.png`
  - `tmp-design\shots\after-2-basic-m.png`
  - `tmp-design\shots\after-3-detail-m.png`
  - `tmp-design\shots\after-4-settings-m.png`
- **정렬 및 타이포그래피 측정 결과**:
  - 내 공지 ↔ 탭 바 ↔ 카드 우측 끝 정렬 차이: **0px** (허용 오차 ±1px 이내 완벽 만족)
  - 콘텐츠 영역 폰트 크기: {12, 14, 16, 18, 22, 28} 집합 완전 만족 (공용 홈 노출 카드 `expo-hcard` 내부 고유 크기 제외)

---

## 8. 최종 상태

- **상태**: 구현 완료, 검수 대기 (사용자 승인 대기)
