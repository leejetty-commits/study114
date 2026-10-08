# 098 · Cursor — 과외쌤 로그인 홈 UI 고침 (로컬)

- 작성일: 2026-09-25 (KST)
- 화면: **과외쌤 로그인 홈**
- 사용자 잠금: 첨부 주석 스크린샷 ①~⑥ · **픽 = 샘플1+EMPTY4**(공부방 홈 079/080과 동일) · **로컬만** · push / `build:dothome` **금지**
- 선행 패턴: 공부방 멤버박스·홍보1 [044](044-studyroom-home-promo1-memberbox-ticket.md) · 우리동네학생≠찾기 [049](049-home-neighborhood-students-vs-find-planning.md)/[050](050-home-neighborhood-students-find-ticket.md)/[059](059-home-neighborhood-students-050-acceptance.md) · 프라임/픽 vacant [063](063-home-memberbox-prime-pick-sample-ticket.md)/[075](075-home-prime-pick-vacant-bypass-empty-fixup.md)/[079](079-home-pick-vacant-sample1-empty4-fixup.md)/[080](080-home-pick-vacant-079-acceptance.md)
- **097 cities 배포와 축 분리** — 섞지 말 것 · `SidoRegionEnsure`·가입 시군 손대지 말 것
- 상태: **로컬 수락** → [100](100-tutor-home-login-ui-098-acceptance.md) · push 금지(배포 시 allowlist만)
- 기준 HEAD: 워킹트리 `feat/student-mypage-a-g` · Cursor가 `git log -1` 재확인 (097과 커밋·stage 분리)
- **스크린샷(필수):** Cursor 채팅에 주석 PNG를 **반드시 첨부**. 박스 경로  
  `/home/box/agent-data/agents/966ddbe5-e420-48f6-a5f7-2a22d181312a/attachments/cde36b6157bba9b31c5822945046f4d42d14f2ce6541155f92a48e67298b8b8d.png`  
  (없으면 사용자 첨부본 사용)

---

## 0. 한 줄 (화면 이름)

**과외쌤 로그인 홈**에서 히어로 줄바꿈·띄어쓰기, 과외쌤 박스 배지·쪽지칸, 「활동형」배지 제거, 프라임 빈칸 채움, **픽 = 샘플1+EMPTY4**, 현재위치=대표 활동지역, 「우리동네 학생」탭=동네 스냅샷(학생찾기 아님)을 맞춘다.  
로컬만. 097·가입·공부방등록·teaser와 섞지 않는다.

---

## 1. 잠금 정책 (화면 언어)

1. **히어로**  
   - 지금: 「…비교하고 판단하는 **동네 교육 플랫폼**」(한 줄)  
   - 목표: 마지막 구절 **앞에서 줄바꿈** + 문구 **「우리동네 교육플랫폼」**(플랫폼 앞 공백 **없음**).  
   - 사용자: 줄바꿈 + 띄어쓰기 반영.

2. **과외쌤 박스**  
   2.1 「과외등록」배지 **제거**. 그 자리에 「마이페이지」. 왼쪽(또는 나란히 앞)에 「쪽지 후기함」배지 추가 (공부방 홈과 같은 톤·링크 `#/mypage/messages/reviews`).  
   2.2 「상태」(예: 프로필공개) → **「쪽지 받음」또는「쪽지 안받음」** + **「N개 미확인」** (수신 on/off + 미읽음).  
   2.3 메타 순서: **조회 → 등록** (조회가 등록보다 앞).  
   2.4 「메모」「보낸메모」칸 **전부 제거**.

3. **활동지역 분포** 옆 「활동형」배지  
   - 장식/카피만이면 **제거**. (기획 판정 → §3.1)

4. **프라임** (우동공과 프라임과외쌤)  
   - 실카드가 3개 미만이면 **빈 박스(EMPTY)**로 채워 **항상 3칸**이 보이게.  
   - 예: 실 1 → 실1 + 빈박스 2 (스크린샷 ④).  
   - 실 0 + vacant 적용 시: 공부방과 같이 **샘플1 + EMPTY2** (샘플≠실점유·「샘플」표시·inert).

5. **픽** (우동공과 픽과외쌤)  
   - 잠금: **샘플1 + EMPTY4** (한 줄 5칸). 공부방 079/080과 **동일 정책**.  
   - 「픽 노출 후보가 없습니다」만으로 섹션 비우기 **금지**.  
   - 샘플 5장 전면 채움 **금지**. 실 픽 ≥1이면 vacant 샘플/EMPTY 채움 없음.

6. **현재위치** (프라임·픽·베이직 라벨)  
   - **활동지역 대표(지역대표 / 활동지역 1)** 가 정해지면 그 라벨로 갱신되어야 함.  
   - 깨져 있으면 **같은 티켓에서 고침**. 이미 맞으면 스모크로 증명. (판정 → §3.2)

7. **탭 「우리동네 학생」**  
   - 공부방 로그인 홈의 동네 학생 스냅샷과 **같은 모드** (049/050/059).  
   - 상단 메뉴 「학생찾기」검색 화면과 **같지 않게**. 상세검색 없음 · 대표 활동지역 기준 자동 목록 · 「학생찾기에서 더 찾아보기」CTA.

---

## 2. 코드 조사 결과 (경로 · 재확인 후 수정)

조사일 2026-09-25, `D:\work\study114` (사용자 머신).

| # | 화면 구간 | 주요 파일 | 현재 |
|---|-----------|-----------|------|
| 1 | 히어로 | `preview/home-ui/src/home-marketing-banner.js` | `trust` 카피 `headline: '…동네 교육 플랫폼'` (한 줄). 과외/공부방 공급자 홈이 **같은 trust** 사용. `headlineLines`로 줄바꿈 가능(렌더러 이미 지원). |
| 2 | 과외쌤 박스 | `preview/home-ui/src/screens/tutor.js` · `preview/home-ui/src/data.js` `MY_TUTOR` | 배지: 마이페이지+**과외등록**. 상태=`프로필공개`. 메모/보낸메모 하드코드. 공부방 박스는 `screens/study-room.js`+`study-room-home-seed.js`가 쪽지 후기함·받음/미확인 실데이터. |
| 2.2 | 쪽지 수신 표기 | `preview/home-ui/src/tutor-reg/inquiries-pref.js` | `inquiry_status` open→받음, paused/not_accepting→안받음. 미읽음: `messages/thread-store` `getUnreadCount` (공부방 시드와 동일 재사용 가능). |
| 3 | 「활동형」 | `preview/home-ui/src/screens/tutor.js` `renderTutorActivityPanel` | 제목 옆 `<span class="my-box__badge">활동형</span>` **장식만**. 막대 로직은 `tutor-activity-chart.js`(지역 클릭=`data-tutor-region`). 배지 유무로 분기 **없음**. |
| 4 | 프라임 칸 | `preview/home-ui/src/exposure-render.js` `renderPrimeSlotGrid` | `kind==='tutor'`는 페이지 아이템만 그리고 **3칸 패딩 없음**(실1→카드1). 공부방만 `buildPrimeSlotArray`+vacantSamples. |
| 5 | 픽 vacant | 동 파일 `renderPickPaginatedBlock` · `preview/search-ui/src/search-tier-render.js` | `vacantSamples`가 **공부방+viewerRole study_room만** true. 픽 vacant도 `kind==='study_room'`만. 과외는 풀0이면 「픽 노출 후보가 없습니다」. 샘플 헬퍼는 `vacantStudyRoomSample`만 (`buildStudyRoomSampleItem`). 과외용 `buildTutorSampleItem`은 `home-card-samples/presets.js`에 있음. |
| 5b | 목록0 early-return | `search-tier-render.js` | `if (!items.length) return zero-state` — vacantSamples 우회 **없음**(075 취지와 불일치 가능). vacant 켤 때 **우회 필수**. |
| 6 | 현재위치 | `search-find-surface.js` `resolveActiveRegionLabel` · `section-headings.js` · tier `sectionTag` | 과외 탭: `getTutorRegionLabel(tutorRegionIndex)`(=**클릭한 탭**). 대표(`MOCK_TUTOR_REGIONS[].primary` / 실 `saved_regions.is_primary`)와 **직접 연결 없음**. 공부방은 `peekStudyRoomPromo1()`(=홍보1) 고정. |
| 7 | 우리동네 학생 | `preview/home-ui/src/provider-home.js` | `studentSnap = role==='study_room' && tab==='student'`만. **과외쌤은 스냅샷 없음** → 찾기형 상세검색 노출. |

---

## 3. 기획 답 (활동형 · 현재위치)

### 3.1 「활동형」의미 → **제거**

- 코드 주석: 「활동형 시각 박스 (지도 대체)」— 활동지역 분포 **차트 패널의 장식 배지**.
- 클릭·필터·저장·권한 게이트 **없음**. 배지 문자열로 분기하는 로직 **없음**.
- **잠금: 배지 마크업 제거.** 차트·지역 클릭은 유지.

### 3.2 현재위치 판정 → **깨짐(대표와 미연결) · 같은 티켓에서 고침**

- 지금: 활성 `tutorRegionIndex` 라벨만 반영. 대표 설정과 동기화 경로 없음. 홈이 `MY_TUTOR`+`MOCK_TUTOR_REGIONS`에 묶여 실 `saved_regions` 대표를 안 읽음.
- 목표(공부방 홍보1과 동형): 과외쌤 로그인 홈 티어·「우리동네 학생」스냅샷의 **현재위치 SSOT = 대표 활동지역(활동지역 1 / is_primary)**.
- 대표를 바꾸면 프라임/픽/베이직·학생탭 라벨이 **그 대표**로 바뀌어야 함.
- 멤버박스 필로 **탐색 지역만** 바꾸는 UX를 유지할 경우, 탐색용 인덱스와 **섹션 현재위치(대표)** 를 문서화해 섞지 말 것. 사용자 잠금 우선순위는 **대표 → 현재위치**.

---

## 4. 수정 잠금 (구현 지시)

1. **히어로** — `trust` 카피를 `headlineLines`로 분리.  
   - 예: `['광고만 보는 곳이 아니라, 비교하고 판단하는', '우리동네 교육플랫폼']`  
   - 「우리동네 교육플랫폼」앞 공백 없음.  
   - trust는 공부방 홈과 공유 → **동일 카피 적용 OK**(공급자 홈 통일). 과외만 분리해야 하면 보고 후 최소 분기.

2. **과외쌤 박스** — `screens/tutor.js` (+필요 시 시드 헬퍼).  
   - 액션: `쪽지 후기함` + `마이페이지`만. 과외등록 링크 제거.  
   - 상태칸 → 쪽지 받음/안받음 + N개 미확인 (`inquiry_status` + unread).  
   - 과목 · (쪽지 줄) · **조회** · **등록**. 메모/보낸메모 삭제.  
   - 가능하면 공부방 `readStudyRoomMemberBox`처럼 실데이터 시드(하드코드 `MY_TUTOR` 상태/메모 폐기). 미리보기만이면 시드 구조를 맞추고 보고.

3. **활동형** — 배지 span 제거만.

4. **프라임** — tutor 경로도 **항상 3슬롯**.  
   - 실 n(0~2): 실 + EMPTY로 3칸.  
   - 실 0 + vacantSamples: 샘플1 + EMPTY2.  
   - 페이지네이션을 쓰더라도 **현재 페이지 표시 칸은 3**.

5. **픽 vacant** — tutor에도 vacantSamples.  
   - `vacantPick`: 슬롯0=과외 샘플1, 1~4=`renderEmptyPickPromo('tutor')`.  
   - `vacantTutorSample`(가칭) 또는 공통 vacant 헬퍼. `buildTutorSampleItem` 재사용 우선.  
   - `search-tier-render`:  
     `vacantSamples = !guest && ((study_room&&viewer study_room)||(tutor&&viewer tutor))`  
   - `items.length===0`이어도 vacantSamples면 early zero **금지**(075와 동일).

6. **현재위치** — 대표 활동지역 SSOT를 find state / sectionTag에 시드. 대표 변경·재진입 스모크 포함.

7. **우리동네 학생** — `provider-home.js`에 tutor용 `studentSnap`(또는 동등).  
   - 상세검색 숨김 · 대표 지역 라벨 · 희망유형=과외 · CTA→학생찾기.  
   - 050 카피를 과외 축에 맞게(동 대신 **시·군 대표 라벨**).

8. 게스트·찾기 플랫·공부방 홈 vacant **회귀 금지**.

---

## 5. Allowlist (B)

```
preview/home-ui/src/screens/tutor.js
preview/home-ui/src/home-marketing-banner.js
preview/home-ui/src/data.js
preview/home-ui/src/provider-home.js
preview/home-ui/src/exposure-render.js
preview/home-ui/src/home-card-samples/presets.js
preview/home-ui/src/tutor-activity-chart.js
preview/search-ui/src/search-tier-render.js
preview/search-ui/src/search-find-surface.js
preview/search-ui/src/search-schema.js
```

필요 시에만(최소·보고):

```
preview/home-ui/src/study-room-home-seed.js     # 패턴 참고만 — 공부방 로직 회귀 없이
preview/home-ui/src/tutor-home-seed.js          # 신설 시 (대표·inquiry·unread 시드)
preview/home-ui/src/tutor-reg/inquiries-pref.js # import만
preview/home-ui/src/messages/thread-store.js    # unread 재사용
preview/home-ui/src/styles/home-listings.css
preview/home-ui/src/styles/home-marketing-banner.css
preview/home-ui/src/empty-state-copy.js
```

unchanged면 skip·보고. allowlist 밖 필수면 **중단·보고**(몰래 넓히지 말 것).

---

## 6. Forbidden (C)

```
src/Region/SidoRegionEnsure.php          # 097 축
preview/auth-ui/** · signup*
preview/home-ui/src/study-room-reg/**
preview/shared/korea-sidos.js
public/assets/teaser-*
preview/home-ui/src/provider-status.js   # dirty 타축 — 이번 목적 아니면 제외
.git add -A · git commit -a
push · build:dothome · Deploy to dothome
가입·cities·공부방개설·맵067 단독 이슈
```

097 배포 티켓·cities 시드와 **커밋·stage 섞지 말 것**.

---

## 7. 스모크 체크리스트

1. 과외쌤 로그인 홈 히어로: 두 줄 · 둘째 줄 「우리동네 교육플랫폼」(앞 공백 없음).  
2. 과외쌤 박스: 「쪽지 후기함」∥「마이페이지」 · 「과외등록」없음 · 쪽지 받음/안받음+N개 미확인 · 조회 다음 등록 · 메모/보낸메모 없음.  
3. 활동지역 분포: 「활동형」배지 **없음** · 막대·지역 클릭 동작 유지.  
4. 프라임: 실1이면 칸3(실1+빈2). 실0+vacant면 샘플1+EMPTY2.  
5. 픽 실0: **샘플1+EMPTY4**. 「후보 없습니다」만 아님. 샘플5 아님.  
6. 픽 실≥1: vacant 샘플/EMPTY 없음.  
7. 대표 활동지역 변경(또는 시드) 후 프라임/픽/베이직 **현재위치** = 그 대표.  
8. 「우리동네 학생」: 상세검색 없음 · 동네 스냅샷 · 학생찾기와 화면 다름 · CTA로 찾기 이동.  
9. 공부방 로그인 홈 프라임/픽 vacant·멤버박스 **회귀 없음**.  
10. 게스트 홈 회귀.  
11. `git status`: B만 · push 안 함 · 097 파일 미포함.  
12. 보고에 **첨부 스크린샷 대조** 언급.

---

## 8. 완료 보고 (Cursor → 기획)

1. diff 파일 목록(=B)  
2. 활동형: 제거 확인(게이트 없었음)  
3. 현재위치: 수정 내용 · 대표→라벨 증거  
4. vacant: 프라임/픽 슬롯 구성(전후)  
5. 우리동네 학생: 공부방 스냅샷과 맞춘 점 / 차이  
6. push 안 함 · 097 미포함  
7. 스크린샷(가능하면 고침 후)

---

## 9. Cursor 붙여넣기

```
[티켓 098 · 과외쌤 로그인 홈 UI · 로컬만 · push/build 금지]

※ Cursor 채팅에 주석 스크린샷(①~⑥) 반드시 첨부.
097 cities 배포·가입·공부방등록과 섞지 말 것. git add -A 거부.

화면: 과외쌤 로그인 홈

잠금:
1) 히어로: 「동네 교육 플랫폼」→ 줄바꿈 후 「우리동네 교육플랫폼」(플랫폼 앞 공백 없음)
2) 과외쌤 박스: 「과외등록」삭제 · 「마이페이지」그 자리 · 왼쪽 「쪽지 후기함」
   「상태」→ 쪽지 받음/안받음 + N개 미확인 · 조회 다음 등록 · 메모/보낸메모 삭제
3) 활동지역 분포 「활동형」배지 제거(장식만·로직 게이트 없음)
4) 프라임: 3칸 고정 — 실<3이면 빈박스로 채움(실1→빈2). 실0이면 샘플1+EMPTY2
5) 픽: 샘플1+EMPTY4 (공부방 079와 동일). 후보없음만/샘플5 금지
6) 현재위치 = 대표 활동지역(활동지역1). 지금 코드는 클릭 탭 인덱스만 봄 → 같은 티켓에서 고침
7) 탭 「우리동네 학생」= 공부방 홈 동네 스냅샷 모드(049/050). 메뉴 학생찾기 아님

파일 단서: screens/tutor.js · home-marketing-banner.js · provider-home.js · exposure-render.js · search-tier-render.js · search-find-surface.js
Allowlist·금지는 docs/098. 스모크·보고 후 push 금지.
```
