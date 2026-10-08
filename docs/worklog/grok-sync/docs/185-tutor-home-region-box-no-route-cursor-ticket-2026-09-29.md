# 185 · Cursor — 과외쌤 홈 활동지역 박스 no-route + 안내 (로컬)

- 작성: 2026-09-29 · 우동공과2
- 근거: 종현 스샷(과외쌤 로그인 홈) 1·2·3·4
- push · build:dothome · Notion **금지**
- **기본정보 저장·cities·홈 sync는 186.** 이 티켓은 홈 UI만.

## Must

1. 과외쌤박스 「활동지역」필 클릭 시 **라우팅·화면 전환 없음** (공부방 홈 포함). 디스플레이 전용.
2. 그 옆/아래 소가이드(고정 문구):  
   **활동지역 수정하려면 '마이페이지-내 등록-기본등록'에서 해 주세요**
3. 쪽지 상태 줄 근처 소가이드(고정 문구):  
   **쪽지설정을 수정하려면 마이페이지-내 등록-쪽지설정에서 해 주세요. 쪽지는 '쪽지 후기함'에서 확인하세요**
4. 「활동지역 분포」서울시·부산시·인천시(동일 패턴) 클릭도 **라우팅 없음**.
5. 분포 수치: 지금 코드는 **시드/예시**(푸터도 「예시 지역」). live API 위장 금지.  
   - 예시 고지 유지 **또는** 오해 소지 숫자 숨김/「준비중」 대체 중 **하나를 택해** 일관되게. (실수 연동은 후속)
6. 「현재위치」·칩·탭 라벨 정본은 **186 `saved_regions`/대표**. 이 티켓에서 MOCK 3도시를 실데이터인 척 확장 금지.
7. 과외쌤 역할 홈 「마이페이지」 버튼이 `#/mypage/home`이면 `getDefaultMypagePath('tutor')`(내 등록 허브)로 교체 (183 잔여).
8. 대표지역은 기본등록 **필수**. 비어 있으면(계정만 만들고 이탈) 표시 폴백은 **「서울시」**만. 「우리동네」폴백 제거 (`tutorHomePrimaryLabel() || '서울시'` 및 provider-home 동일).

## Allowlist

- `preview/home-ui/src/screens/tutor.js` (활동지역 no-route + 「마이페이지」 버튼을 `getDefaultMypagePath('tutor')`로)
- `preview/home-ui/src/tutor-activity-chart.js`
- `preview/home-ui/src/styles/home-listings.css` (가이드·non-interactive만)
- 필요 시: `preview/search-ui/src/search-find-surface.js` (홈 self에서 `data-tutor-region` 클릭 무력화만)
- 폴백: `preview/home-ui/src/tutor-home-seed.js` · `preview/search-ui/src/search-tier-render.js` · `preview/home-ui/src/provider-home.js` (「우리동네」→「서울시」만)

## Forbid

- 필·분포에 `#/study-room` 등 href/navigate 추가
- 클릭으로 find 지역 전환을 “수정 UX”처럼 유지
- tutor-reg 저장 로직 재작업 · cities API (186 유지)
- 「우리동네」를 빈 대표 폴백으로 유지
- 183 mypage · commit / push / build:dothome
- 하드코딩 카운트를 실수치처럼 보이게 하기

## 스모크

1. 과외쌤 로그인 홈: 활동지역 필·분포 지역 클릭해도 해시/화면 안 바뀜
2. 안내 문구 2종 보임
3. 푸터/숫자 표시가 「예시」와 모순 없음

## 커밋 예 (수락 후)

`fix(tutor-home): disable region box navigation; add edit/message guides`
로컬만.
