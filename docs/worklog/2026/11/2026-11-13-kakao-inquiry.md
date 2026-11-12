# 카카오톡 문의 — 플로팅 문의하기

**브랜치:** `work/kakao-inquiry`  
**워크트리:** `.wt/work-kakao-inquiry`  
**base:** `origin/main` (`addd72d3`)  
**지시서:** `docs/worklog/grok-sync/docs/kakao-inquiry-2026-11-13.md`

## 지시 원문 요지

- 플로팅 「문의하기」: FAQ · 이메일 · 카카오톡 채팅 링크 3항
- 카카오 JS/위젯 금지 · `https://pf.kakao.com/_xkeMNX/chat` 상수 1곳
- 「맨 위로」위치 불변 · 「맨 아래로」모바일만 · 모달 시 숨김 · 스크롤 무관 표시
- 커밋·push·PR · **머지 금지**
- dirty: `D:\work\study114` · `.wt/work-368-photo-autofit` 미터치

## 승인 (지시 확인)

- 노션 동기화 보류 · 카카오 문의만 진행

## 구현

| 파일 | 내용 |
|------|------|
| `preview/shared/inquiry-contact.js` | FAQ hash · mailto · `KAKAO_CHAT_URL` 상수 |
| `preview/shared/back-to-top.js` | 문의하기 FAB·패널 · 모달 동기화 재사용 · 바깥클릭/Esc 닫기 |
| `preview/home-ui/src/styles/design-system.css` | FAB 위치(맨 위 자리 위 고정 · 모바일은 맨 아래 위) · 패널 |

## 셀프검수 체크리스트

| # | 항목 | 결과 | 근거 |
|---|------|------|------|
| 1 | 문의하기에 FAQ·메일·카카오톡 문의 세 항목 | PASS | Playwright DOM + 캡처 |
| 2 | 카카오톡 문의 URL이 https://pf.kakao.com/_xkeMNX/chat | PASS | `inquiry-contact.js` · DOM href |
| 3 | 카카오 JS·외부 위젯 없음 | PASS | 페이지 HTML 검사 |
| 4 | 맨 위로 위치·크기 불변, 맨 아래로는 모바일만 | PASS | top `bottom:20px` · desktop bottom `display:none` · mobile `flex` |
| 5 | 모달 열림 때 숨김, 스크롤과 무관하게 문의하기 보임 | PASS | `syncInquiry` = `isModalOpen` · `is-visible` 스크롤 무관 |
| 6 | 푸터·프로모 미변경 | PASS | 해당 파일 미수정 |
| 7 | 캡처 1280·390 (테스트 계정·실명 없음) | PASS | `shots-kakao-inquiry/` |

## 캡처

- `docs/worklog/2026/11/shots-kakao-inquiry/home-closed-1280.png`
- `docs/worklog/2026/11/shots-kakao-inquiry/home-open-1280.png`
- `docs/worklog/2026/11/shots-kakao-inquiry/home-open-390.png`
- `docs/worklog/2026/11/shots-kakao-inquiry/support-faq-open-1280.png`
- `docs/worklog/2026/11/shots-kakao-inquiry/support-faq-open-390.png`

## 발견 목록 (범위 밖)

없음

## 커밋·PR

- tip: `c63316cc` — feat(ui): 플로팅 문의하기에 카카오톡·FAQ·메일 추가
- push·PR: 진행 (머지 안 함)
