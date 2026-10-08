# 085 · 소견 — 가입「학생 기본정보」를 마이페이지 아홉 칸과 맞추기

- 작성일: 2026-09-24 (KST)
- 사용자: 「학생 기본정보를 새로 짜는 초안 … 이거 하자」
- 정본 필드: [014](014-student-mypage-renewal-ticket-c-basic.md) 노션 §3-1 (마이페이지 C에서 **이미 로컬 수락**)
- 상태: 소견 · Cursor 작업 → [086](086-signup-student-basic-nine-fields-ticket.md)
- 참고 시안: 레포 `.tmp-student-basic/desktop.png` · `mobile-390.png` (Cursor 채팅 첨부로도 가능)

---

## 0. 쉬운 말

마이페이지「기본정보」에는 이미 아래 **아홉 가지**가 들어가 있다(014·015).  
**가입** 화면의 학생 기본정보는 아직 예전 칸 구성에 가깝고, 로컬 컴퓨터에만 **새 화면 초안**이 있다.  
이번 작업은 그 초안을 **끝마치고 가입도 같은 아홉 칸**으로 맞추는 것이다. (사이트 배포는 수락 후 「배포」할 때만.)

---

## 1. 아홉 칸 (가입·마이페이지 공통)

1. 표시명  
2. 학교급 / 학년  
3. 희망 유형 (과외쌤 찾기 / 공부방 찾기)  
4. 희망지역 (공부방이면 **주소 검색** — 이미 운영 `f6b5400`)  
5. 희망과목  
6. 수업형태  
7. 수업인원  
8. 예산 (희망 유형에 따라 과외/공부방 금액 칸)  
9. 한 줄 요청문 (`request_summary`)

넣지 않음: 상세정보 전용(출생연도·성별·주횟수 등), 「대표*」「부족 n개」「공개 전 완료」 같은 가입 게이트 카피.

---

## 2. 로컬에 이미 있는 초안 (2026-09-24 dirty)

| 파일 | 역할 |
|------|------|
| `preview/auth-ui/src/screens/signup-basic.js` | 학생 폼 UI (희망지역 + 위 칸들) |
| `preview/auth-ui/src/styles/student-basic.css` | 전용 스타일 (untracked) |
| `preview/auth-ui/src/main.js` | css import |
| `preview/auth-ui/src/layout.js` | `cardClass` |
| `public/assets/css/auth/mvc.css` | PHP 폼 쪽 스타일 |
| `src/Views/auth/partials/basic-student.php` | 서버 렌더 폼 |
| `src/Views/auth/signup-basic.php` | 래퍼 |
| `src/Auth/BasicRegisterService.php` | 저장 필드 수신 |

**제외(다른 일):** `provider-status.js` · `study-room-reg` · `location-display.js` · `ProviderUsageService.php` · `helpers.php` · teaser · tmp

주의: `signup-basic.js`는 운영에 **희망지역만** 올린 뒤(`f6b5400`) 로컬에 초안을 다시 얹은 상태. 작업 시 **은마 폴백으로 되돌리면 안 됨.**

---

## 3. 닷홈 CS 회신 (같은 날, 축 분리)

닷홈: 공유 호스팅이라 서버 상세 로그 제한 · 해당 시각 **프로세스 재시작·SSL 오류·동시접속 제한·자원 급증·CF IP 차단 없음**. 웹로그는 `아이디.dothome.co.kr` FTP.  
→ 앱「기본정보」작업과 **무관**. 접속 불안정은 [076](076-cloudflare-525-ssl-handshake-incident.md) · [078](078-hosting-migrate-candidates-dev-stage.md) 트랙.

---

## 변경 이력

| 일시 (KST) | 내용 |
|------------|------|
| 2026-09-24 22:03 | 사용자 착수 · 014 아홉 칸 = 가입 목표로 소견 |
