# 200. 관리자 1차 정비 · 읽기 전용 감사 결과 (2026-10-06)

- **기준:** HEAD `80ee85c` (브랜치 feat/student-mypage-a-g, origin/main 추적). 코드 수정 없음.
- **워킹트리:** 문서·스크립트 수정, `_164~_177`·`tmp/` 미추적 남아 있음(이번 감사와 무관).
- **근거 계획:** [154](154-admin-main-menu-priority-order.md) · [155](155-admin-ops-direction-beginner.md) · [157](157-admin-p2-board-settings-plan.md) · [158](158-admin-p3-preview-menus-plan.md) · [159](159-admin-p4-ops-home-logs-plan.md) · [160](160-admin-planning-ladder-accepted.md)
- **범위 기본값(막지 않음):** 162는 1차에서 감사만·구현 후순위 / 「학부모」는 관리자 우선 / 가이드·FAQ 전면은 최종검수로.
- **결론:** **관리자-158 ACCEPT**(로컬 미배포). 다음 구현 = **관리자-159** `#/admin` 오늘 할 일 4카드 → 관리자 「학부모」 카피.

---

## 1. 갱신 갭표

| 우선 | 항목 | 상태 |
|------|------|------|
| High | 158 마켓·문자·부가·홍보: 「미리보기」 접두 + 상단 연습용 안내 | **ACCEPT** (로컬 미배포, 2026-10-06) |
| High | 159 `#/admin` 「오늘 할 일」 4카드(회원정리·홈노출·문의신고·홈팝업) | TODO |
| Med | 학부모→학생, 관리자 화면 카피(역할 라벨·가입 행렬) | TODO |
| Med | 159 등록목록(방/과외/학생, 최근 1주, 등록일) | TODO |
| Low | 157 grp-config 순서가 a28-copy.js:6 주석 순서(환경설정→회원→게시판→상품·결제→고객응대→로그)와 다름(홍보·부가·문자가 사이에 끼어 있음) | PARTIAL |
| Low | 학부모 시드·더미(회원 샘플, 문자 주소록, 후기 작성자, FAQ/이용안내 마이그레이션 시드) | TODO (화면 카피와 분리) |
| — | 159 운영로그에 탈퇴·삭제·노출 기록 경로 | DONE |
| — | 162 관리자 트리 settlement/정산 문자열·라우트·API | DONE (0건) |
| — | 157 관리자 화면 「상품센터」·「가입받기」 UI | DONE (0건) |

---

## 2. 사이드바 A28_MENU (실연동 추정)

- 접힘: `shell.js:79–89` (현재 경로 그룹만 open) — **이미 동작, 158에서 손대지 않음.**

| 그룹 | 라벨 | path | 실연동(추정) | 158 대상 |
|------|------|------|--------------|----------|
| (단독) | 운영 홈 | /admin | 정적 허브 | 허브 카드만 |
| 홍보 런치 | 홍보 런치 데스크 | /admin/promo | 정적 카탈로그 + 우측배너(API right-rails, 없으면 sessionStorage) | **Y** |
| 사이트 기본 | 사이트 기본 / 가입·등록 / 운영 알림 / 약관·개인정보 | /admin/settings/{basic,join,notify,legal} | API site-settings.php | N |
| 사이트 기본 | 팝업 관리 | /admin/settings/popups | API home-popups.php | N |
| 사이트 기본 | 권한·계정 | /admin/permissions | API operators.php | N |
| 회원관리 | 회원 목록 | /admin/members | API members.php | N |
| 공지·안내 글 | 게시판 채널 · 우측 배너 · 공지사항 · 자주 묻는 질문 · 이용안내 | /admin/notices/* | API(channels·right-rails·support/notices·board/posts) | N |
| 마켓·결제 | 마켓 현황 | /admin/market/overview | lab · sessionStorage | **Y** |
| 마켓·결제 | 공부방·과외 목록 | /admin/market/listings | lab | **Y** |
| 마켓·결제 | 결제·주문 | /admin/commerce | API commerce.php | N (실도구) |
| 마켓·결제 | 홈·찾기 노출 | /admin/exposure | API exposure.php | N (실도구) |
| 마켓·결제 | 매출·순위 | /admin/market/stats | lab | **Y** |
| 마켓·결제 | 이용 후기 | /admin/market/reviews | lab | **Y** |
| 마켓·결제 | 미완료 결제 | /admin/market/incomplete | lab | **Y** |
| 고객응대 | 신고 처리 · 문의 · 제출자료 확인 | /admin/reports · /admin/tickets · /admin/submission-docs | API | N |
| 부가서비스 | 부가서비스 홈 · 카드·전자결제 · 문자·메시징 · 본인인증 | /admin/addons{,/pg,/sms,/identity} | 정적 | **Y** (4) |
| 알림·문자 | 문자 기본설정 ~ 전송내역(번호별) 7개 | /admin/notify/settings … /logs-phone | lab · sessionStorage, 실발송 없음 | **Y** (7) |
| (단독) | 운영 로그 | /admin/logs | API operation-logs.php | N |

158 대상 합계 **17화면**(마켓 5 · 문자 7 · 부가 4 · 홍보 1).

---

## 3. 158 대조 (감사 시점 TODO → **구현 ACCEPT 2026-10-06**, 아래 §10)

| 대상 | 「미리보기」 접두 | 기본접힘 | 상단 연습용 | 근거 |
|------|------|------|------|------|
| 마켓 현황 | N | Y | N | 제목 a28-screens-labs.js:36, 메뉴 a28-copy.js:211 |
| 공부방·과외 목록 | N | Y | N | :66 / :219 |
| 매출·순위 | N | Y | N | :86 (본문에만 「미리보기용 예시 숫자」 :89) |
| 이용 후기 | N | Y | N | :115 / :251 |
| 미완료 결제 | N | Y | N | :139 / :259 |
| 문자 7화면 | N | Y | N | 예: 문자 기본설정 :275, 문자 보내기 :618. 본문 「미리보기」 문장만(:280, :624, :730) |
| 부가 4화면 | N | Y | N | 제목 :211–214. 문자 탭만 미리보기 안내 :241 |
| 홍보 런치 데스크 | N | Y | N | :717 / 메뉴 :69 |

- 관리자 트리 「연습용」 0건.
- 허브 `#/admin`의 「마켓·결제」 카드 → 첫 하위 `/admin/market/overview`(lab)로 이동하는데 미리보기 표시 없음.

---

## 4. 159 대조

- `#/admin` = `renderHub()`(a28-screens.js:609–642): 그룹 바로가기 카드 + 「할 수 있는 일 / 하지 않는 일」 + 홍보 바로가기. **「오늘 할 일」 4카드 아님, 미리보기 안내 없음 → TODO.**
- 운영로그 경로 **DONE**:
  - 탈퇴 `src/Admin/AdminMemberService.php:188–199` → account_withdraw
  - 삭제 `src/Admin/AdminMemberDeleteService.php:170–179` → account_delete
  - 노출 `src/Admin/AdminExposureService.php` 공부방 :121–153 / 과외 :178–205 / 학생 :231–263 → hide_profile·exposure_correction
  - 화면 라벨 a28-copy.js:523–536, 목록 a28-screens.js:1524–1566
- 등록목록(방/과외/학생, 최근 1주, 등록일) **없음 → TODO.** 노출 화면은 updated_at 내림차순 200건(AdminExposureRepository.php:50,77,109), 등록일·1주 필터 없음.

## 5. 162

- preview/home-ui/src/admin/**, public/api/admin/**, src/Admin/**, 관리자 라우트에 settlement/정산 **0건**. 1차는 감사만, 구현 후순위.

## 6. 「학부모」 (관리자)

- public/api/admin: 0건.
- **화면 카피(Med, 158 다음 후보):** a28-copy.js:471 `guardian_student: '학부모'` · site-settings-store.js:21 「자녀 정보(학부모)」 · :27 가입 역할 라벨 「학부모」.
- **시드·더미(Low):** a28-screens-state.js:46 「김학부모」 · sms-lab-store.js:83 주소록 · marketplace-lab-store.js:53, :63 「학부모A/B」.
- 내부 키 `guardian_student`는 유지(값은 한글 아님, 라벨만 대상).
- src/Admin: ContentSchemaMigrateService.php 시드만(:641, :642, :644, :682, :702, :704, :708) — 관리자 크롬 카피 아님.
- 범위 밖이지만 채널 화면 렌더: preview/home-ui/src/board-channel-store.js:26 `guardian_student` 라벨 「학부모」.
- 가이드·support(건수만, 최종검수): guide/copy.js 13 · guide/screens.js 10 · support/support-copy.js 10.

## 7. 157 잔여

- 저장소에 157 계획 문서 없음(정본은 이 저장소 docs/157). 대조 기준 a28-copy.js:6 주석.
- grp-config(「사이트 기본」) 자식: 사이트 기본 · 가입·등록 · 운영 알림 · 팝업 관리 · 약관·개인정보 · 권한·계정. 홍보 런치가 앞에, 부가서비스·알림·문자가 고객응대와 로그 사이에 있음 → **PARTIAL(Low)**.
- 「상품센터」 0건 · 「가입받기」 UI 0건(가입 화면은 차단 메일·금지어·항목 행렬, a28-screens.js:1774–1785) → **DONE**.

---

## 8. 다음 구현 순서 (제안)

1. ~~관리자-158~~ **ACCEPT** (로컬 미배포, HEAD `80ee85c` 위 미커밋). §10.
2. 159 `#/admin` 「오늘 할 일」 4카드 + 하단 「아래쪽 미리보기는 연습용이에요. 실운영은 위 네 가지만.」(docs/159 §1) ← **다음**
3. 관리자 「학부모」→「학생」 화면 카피(역할 라벨·가입 행렬, 채널 라벨 포함 여부는 그때 결정)
4. 159 등록목록(최근 1주·등록일)
5. Low: 157 메뉴 순서 · 학부모 시드/더미 · 162 구현(후순위)

## 9. 158 카피 정본 (docs/158 §2 기준으로 잠금 제안)

- 접두: 「미리보기 · 」 + 기존 라벨 (예: 「미리보기 · 마켓 현황」). docs/158 §1 묶음 표기 「미리보기 · 마켓」의 가운뎃점 형식을 화면 단위로 적용.
- 상단 안내(공통): 「연습용 화면이에요. 이 화면은 아직 사이트와 완전히 연결되어 있지 않을 수 있어요. 여기 보이는 숫자·내용으로 운영 판단을 하지 마세요.」 (docs/158 §2 문장 + 「실데이터로 의사결정하지 말 것」)
- 문자 7화면 추가 한 줄: 「실제 문자는 나가지 않아요.」 (docs/158 §1-1)
- 실도구(결제·주문, 홈·찾기 노출, 회원, 사이트 기본, 공지·안내, 고객응대, 운영 로그, 운영 홈)에는 접두·안내 **금지**.

---

## 10. 관리자-158 ACCEPT (2026-10-06)

- **상태:** ACCEPT · **앱 커밋/푸시/배포 대기** (study114 워킹트리 미커밋, 기준 HEAD `80ee85c`).
- **범위:** 미연동 17화면 — 메뉴 라벨·패널 제목 「미리보기 · 」 접두 + 상단 연습용 안내 + `#/admin` 허브 카드 표시. 사이드바 그룹명·접힘·실도구 화면·159/162/학부모 미포함.
- **단일출처:** `preview/home-ui/src/admin/a28-copy.js` (접두·17 path·안내·문자 추가 문장).
- **verify:** `npx vite-node scripts/verify-admin-preview-labels.mjs` → **pass=198 / fail=0**, 미리보기 17, 실도구 위반 0.
- **빌드:** `preview/home-ui` `npm run build` 성공. `build:dothome` 미실행.
- **부수:** 문자 기본설정 `checked`/`selected` import 누락 수정(렌더 중단 해소만, 폼 동작 불변).
- **배포:** 종현 「배포」 후 커밋·푸시·Deploy to dothome.
- **다음:** 관리자-159 (`#/admin` 오늘 할 일 4카드).


## 11. 관리자-158 배포 보류 (2026-10-06)

- **푸시:** `1d48c2c` → `origin/main` (allowlist 7파일). 메시지 `fix(admin): 관리자-158 미리보기 표시`.
- **Actions:** Deploy #391 run `37364093708` — verify 3잡 성공, `ftp-deploy`만 GitHub hosted runner 할당 장애로 미실행(attempt 취소·queued). 코드 문제 아님([GitHub Status](https://www.githubstatus.com/) Actions 러너 지연).
- **종현 지시:** 보류. 장애 해소 후 Re-run failed jobs / `gh run rerun 37364093708 --failed`.
- **운영:** 아직 #390 (`80ee85c`). FTP 미실행.
- **다음 코딩:** 159 가능(158 라이브 확인은 재배포 성공 후).


## 12. 관리자-162 큐 고정 (2026-10-06)
- 종현(t1450): 후순위라도 예정 작업에 명시.
- 정본 docs/162. 관리자 1차(158·159·학부모→학생) 뒤 구현.
