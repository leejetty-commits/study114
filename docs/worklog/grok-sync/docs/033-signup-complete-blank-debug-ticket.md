# 033 · 가입 티켓 2 — 완료 화면 「—」/ 디버그 칸

- 작성일: 2026-09-24 (KST)
- 선행: [029](029-signup-ops-findings-notion-vs-bugs.md) · [032](032-signup-tutor-region-city-mapping-acceptance.md)
- 상태: **로컬 수락** → [034](034-signup-complete-blank-debug-acceptance.md)
- 재현 역할: 공부방(및 과외쌤) 「가입 · 기본등록 완료」 화면

---

## 0. 한 줄 목적

완료 화면에 `회원 ID (DB): —` · `역할 (DB role_type): —`처럼 **빈 디버그 칸**이 보이지 않게 한다.  
가입 실패로 오해되지 않게, 회원용 요약만 남기거나 `fetchMe`로 채운다.

---

## 1. 현상 (잠금)

- 화면: 「가입 · 기본등록 완료」
- `회원 ID (DB): —` / `역할 (DB role_type): —`
- 동시에 `기본등록 프로필: study_room #8` · seed 값 있음 → **기본등록은 된 상태**
- 원인 축: `signupState.lastSignup.userId` / `roleType` 유실(역할 선택 직후에만 세팅). 이메일 확인·새 창·SPA 상태 유실 후 `—`
- 학생 완료 화면은 DB 칸을 안 보여 더 정상적

**첨부:** 사용자가 Cursor에 스크린샷 직접 첨부.

---

## 2. 포함

1. `preview/auth-ui/src/screens/signup-complete.js` (주 대상)
2. 공부방·과외쌤 완료 UI에서 **회원에게 DB id / role_type raw 디버그 dl 제거**가 1순위.
3. 운영·검수용으로 id가 꼭 필요하면: 완료 진입 시 `fetchMeApi()`(또는 기존 me)로 채워 `—` 금지. 그래도 라벨은 「회원 ID (DB)」같은 개발자 톤 지양.
4. `lastSignup` 하이드레이션이 깨지는 경로가 있으면 **최소**로 보강 가능. 티켓 3(새 창) 전체 수정은 **하지 말 것.**

---

## 3. 제외

- 030 시·군 매핑 재작업
- `window.open` / 게스트 플래시 (→ 티켓 3)
- 상세 빈 저장·카피 (→ 티켓 4)
- 031 개설주소→홍보1
- 공부방 동·단지 축 변경, mypage, 학생찾기
- push / `build:dothome` / 030 외 dirty와 한 커밋

---

## 4. 완료 전 점검

1. 공부방(및 가능하면 과외쌤) 기본등록 완료 화면: `—` 디버그 칸 없음(또는 me로 채워진 회원용 문구만).
2. 프로필/seed 요약이 깨지지 않음.
3. 라우팅: 완료 화면 진입·새로고침 후 동작 명시.
4. diff allowlist: 완료 화면(+ 불가피 시 lastSignup 최소). mypage/PHP 스키마 없음.

## 5. Cursor 붙여넣기

```
[티켓 033 · 가입 완료 화면 — / 디버그 칸만]

목적: 「가입 · 기본등록 완료」에서 회원 ID (DB): — · 역할 (DB role_type): — 가
나오지 않게 한다. 기본등록 성공인데 디버그 칸이 비어 실패처럼 보이는 문제.

운동: signupState.lastSignup.userId/roleType 유실. signup-complete.js가
saved?.userId ?? '—' 로 찍음. 학생 완료 화면은 이 칸 없음.

할 일 (최소):
1) 공부방·과외쌤 완료 UI에서 DB id / role_type 디버그 dl 제거가 우선
2) 꼭 보여야 하면 fetchMeApi(또는 기존 me)로 채우고 — 금지. 개발자 톤 라벨 지양
3) lastSignup 하이드레이션 최소 보강은 가능. window.open/새 창 전체는 티켓3 — 금지
4) 030 매핑·상세저장·mypage·031·push·build:dothome 금지. dirty와 커밋 섞지 말 것

첨부: 사용자가 넣은 완료 화면 스크린샷 근거.

완료 보고: 원인 한 줄, 파일 목록, 전후(— 유무), push 안 함.
```
