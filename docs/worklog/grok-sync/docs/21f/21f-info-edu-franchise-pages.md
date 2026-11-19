# 21f — /info/ 정보 페이지 2개 추가 (교육청 바로가기, 프랜차이즈 안내)

## 목표
서비스 소개(/info/)처럼 홈과 떨어진 정적 HTML 페이지 2개를 새로 만든다.
- `public/info/edu-office/index.html` — 공부방·교습소 신고·설립 안내, 시·도별 교육청 바로가기
- `public/info/franchise/index.html` — 공부방·교습소 프랜차이즈 안내

본문 정본(그대로 옮김, 문장 수정 금지):
- `docs/worklog/grok-sync/docs/21f/edu-office-content.md`
- `docs/worklog/grok-sync/docs/21f/franchise-content.md`

## 0단계 — 먼저 진단만 하고 보고
1. `public/info/study-room/index.html`의 head, 헤더(심벌+워드마크), 푸터, 인라인 style 구조를 확인한다.
2. 아래 허용 파일 밖을 건드려야 하면 고치지 말고 멈추고 보고한다.

## 허용 파일 (이것만 추가)
- `public/info/edu-office/index.html` (신규)
- `public/info/franchise/index.html` (신규)
- `docs/worklog/2026/11/2026-11-20-21f-info-edu-franchise.md` (신규 작업기록)

기존 파일은 하나도 수정하지 않는다. home-ui, preview/, 공통 CSS·JS, 다른 /info/ 페이지, 라우팅, 사이트맵 모두 손대지 않는다.

## 만드는 방법
- 껍데기: `public/info/study-room/index.html`의 head 구성(charset, viewport, canonical, og, 인라인 `<style>`), 헤더, 푸터를 그대로 복사해 쓴다. title·description·canonical·og:url만 각 페이지에 맞게 바꾼다.
  - edu-office: title 「공부방·교습소 신고·설립 안내 — 시·도별 교육청 바로가기 | 우동공과」, canonical `https://study114.net/info/edu-office/`
  - franchise: title 「공부방·교습소 프랜차이즈 안내 | 우동공과」, canonical `https://study114.net/info/franchise/`
- 펼치기: `<details><summary>` 만 쓴다. 자바스크립트 0줄. 외부 폰트·외부 CSS·이미지 추가 없음(헤더 로고 2개는 기존과 같음).
  - edu-office: 맨 위에 「먼저 알아 두실 점」과 공통 링크(나이스·정부24 2개)는 펼치지 않고 보인다. 「시·도교육청 바로가기」 아래 16개 시·도는 각각 `<details>` 하나, `<summary>`는 시·도 이름. 처음에는 모두 접힘.
  - franchise: 시장 통계는 펼치지 않고 보인다. 분야(교과 / 유아·저학년 / 영어 / 독서·논술 / 미술)는 소제목(h2), 그 아래 브랜드마다 `<details>` 하나, `<summary>`는 브랜드명(본사명). 처음에는 모두 접힘.
  - 정본 md의 `###` 단위가 `<details>` 하나다. 그 안 내용은 md 그대로(문단·목록·굵게·링크).
- 꾸미기(인라인 style에 추가, 이 페이지 안에서만):
  - summary: 흰 카드, 둥근 모서리 12px, 테두리 #e5e7eb, 패딩 14px 16px, 굵게, 오른쪽에 ▾ 표시(열리면 ▴), 터치 영역 높이 48px 이상, 커서 pointer.
  - 카드 사이 간격 8px. 열린 카드 본문은 패딩 4px 16px 16px.
  - franchise 카드 본문의 「소개·대상·과목·운영 형태·본사 안내 혜택·공식 홈페이지」 라벨은 굵게, 항목 사이 간격 균등.
  - 기준일·면책 문단은 회색 작은 글씨(#6b7280, 14px) 박스로.
- 링크: 외부 링크는 모두 `target="_blank" rel="noopener noreferrer"`. URL 글자 자체가 링크 텍스트인 곳은 그대로 둔다.
- 금액 표기는 정본 문장 그대로(원 단위 문장이므로 천원 변환하지 않음).

## 수락 기준 (Cursor 셀프검수)
1. 바뀐 파일 목록이 허용 파일 3개와 정확히 같다(`git diff --name-only origin/main`).
2. 두 페이지에 `<script` 가 없다.
3. 정본 md의 모든 링크 URL이 HTML에 그대로 있다(개수 일치 보고: edu-office, franchise 각각).
4. 375px·1440px 스크린샷: 접힌 상태, 한 개 펼친 상태 각 1장씩, 페이지마다 4장.
5. 헤더·푸터가 study-room 페이지와 같다(심벌 포함).
6. PR 생성 → 머지 → 배포 → 운영 `https://study114.net/info/edu-office/`, `https://study114.net/info/franchise/` 200 확인, 홈 `https://study114.net/` 응답·파일이 이 PR로 바뀌지 않았음을 보고.

## 보고
PR 번호, 머지 커밋, 배포 run, 바뀐 파일 목록, 링크 개수, 스크린샷 경로.
