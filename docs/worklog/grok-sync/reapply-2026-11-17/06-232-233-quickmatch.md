# 06. #232·#233 다시 넣기 — 퀵매칭 소개

대기 가능. 05 뒤. #233은 #232 위 손질이라 한 PR에 순서대로 둘 다 넣는다.

## 목적

#232(`3693e6fc`): 퀵매칭 소개를 카탈로그·공개 `#/promo/quick-match`에 두고, 비프라임은 마이페이지 퀵매칭 본문에서 소개를 연다(그때 우측 레일 숨김). 메뉴에 NEW.
#233(`87962b39`): 소개 상단 여백, 후기함 알약 위치.

## 명령

```
git fetch origin
git switch -c work/reapply-232-233 origin/main
git revert --no-edit e3af6dca
git revert --no-edit f1242b39
npm run build:dothome
```
박스 확인: 둘 다 충돌 없음.

## 허용 파일

`preview/home-ui/src/mypage/{index.js,quick-match-screen.js,screens.js,shell.js}`, `preview/home-ui/src/promo/{catalog.js,quick-match-content.js,quick-match-view.js,quick-match.css,screens.js,study-room-content.js,tutor-content.js}`, `preview/home-ui/src/styles/mypage-quick-match.css`, `preview/home-ui/src/provider-reviews/inbox.js`, 두 PR의 worklog·shots. 기록 1개 `docs/worklog/2026/11/2026-11-17-reapply-232-233.md`.

## 위험 점검

- `quick-match-screen.js bindQuickMatchScreen`: 서버 응답의 `prime_active`가 화면 판단과 다르면 rerender 1번. 다시 그린 뒤엔 값이 같아 멈춘다(fetch 최대 2번). 반복 없음.
- `quick-match-view.js bindQuickMatchIntroLinks`: 소개 안 링크만 `preventDefault` 후 해시 이동. 버블 단계, 그 링크에만. capture 아님.
- CSS는 `.qm-*` 전용 클래스. 전역 아님.
- 우측 레일 숨김은 `/mypage/quick-match` + 소개일 때만.

## 수락(추가)

1. 공부방·과외쌤(프라임 없음): 마이페이지 → 퀵매칭 → 소개 화면, 우측 레일 없음, 소개 안 링크가 유료상품으로.
2. 프라임 있는 계정이 있으면: 설정 화면 그대로.
3. 마이페이지 다른 메뉴로 이동 → 우측 레일 다시 보임.
4. 비로그인 `#/promo/quick-match` 열림. 공부방·과외쌤 홍보 카탈로그에 퀵매칭 블록.
5. 후기함 알약이 카드 위.

## 공통

- 빌드: `npm run build:dothome`.
- 수락: 00-INDEX 「공통 수락 점검」 전부(공부방·과외쌤·학생 메뉴 실클릭, 멈춤 계측) + 아래 항목.
- 금지: 허용 파일 밖 수정, revert 결과 손질, 충돌 손으로 풀기(나면 멈추고 보고). `main.js` 수정 금지.
- 되돌리기: `git revert -m 1 <이 PR merge 커밋>`으로 새 PR.
