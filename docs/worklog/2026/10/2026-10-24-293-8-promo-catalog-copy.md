# 293-8 · 홍보 카탈로그·배너·진입 문구 v2 정리

- **과제**: 293-8-promo-catalog-copy
- **브랜치**: cursor/293-8-promo-catalog-copy-20261024
- **기준**: origin/main @ 791e63ee (293-6-1 머지 포함)
- **작업자**: Cursor 메인 에이전트
- **날짜**: 2026-10-24

---

## 지시서 원문 경로

`D:\work\study114\_local\directives\293-8-promo-catalog-copy.md`

---

## 목적

홍보 카탈로그·배너·진입 문구를 v2 랜딩과 맞게 정리. 학생 페이지 명칭을 「우리동네 학생」으로 통일. 공부방 카탈로그 대상을 원장 전용으로.

---

## 0단계 grep 결과

**개인정보/공개된 정보 promo 내 0건** ✅ (293-6-1 머지 후 확인)

**카탈로그/학부모 전수 grep:**
```
home-marketing-banner.js:38:  /** 1안 — 정석·비교 (학부모·공부방찾기) */   ← 주석(이번 미수정)
home-marketing-banner.js:96:  '학생·학부모 과금 없이...'                  ← 이번 범위 밖
home-marketing-banner.js:99:  imageAlt: '학생·학부모 연결 분위기'           ← 이번 범위 밖
home-marketing-banner.js:206: eyebrow: '공부방 카탈로그'                   ← 유지
home-marketing-banner.js:213: eyebrow: '과외쌤 카탈로그'                   ← 유지
catalog.js:21: title: '공부방 카탈로그'                                    ← 유지
catalog.js:22: audience: '학부모 · 원장' → '원장' 변경
catalog.js:30: title: '과외쌤 카탈로그'                                    ← 유지
catalog.js:39: title: '학생 카탈로그' → '우리동네 학생' 변경
catalog.js:40: audience: '학생 · 학부모(보조)' → '학생' 변경
parent-content.js:8: title: '학생 카탈로그' → '우리동네 학생' 변경
parent-content.js:52: '학생·학부모 고민방'                                 ← 유지(게시판 이름)
study-room-content.js:9: title: '공부방 카탈로그'                          ← 유지(meta.title)
study-room-content.js:14: eyebrow '원장님 시선 · 공부방 카탈로그'           ← 유지
study-room-content.js:76: '학생·학부모 고민방'                              ← 유지(게시판 이름)
tutor-content.js:8,13: '과외쌤 카탈로그'                                   ← 유지
```

---

## 변경 파일 및 줄 diff 요약

### 1. `preview/home-ui/src/promo/catalog.js`

```
-  audience: '학부모 · 원장',      →  audience: '원장',
-  shareText: '우리동네 공부방, 더 쉽게 찾고 비교해보세요 — 우동공과'
+  shareText: '우리 공부방, 동네 지도 위에 먼저 보이게 — 우동공과'
-  title: '학생 카탈로그',          →  title: '우리동네 학생',
-  audience: '학생 · 학부모(보조)' →  audience: '학생',
```

### 2. `preview/home-ui/src/promo/parent-content.js`

```
-  title: '학생 카탈로그',  →  title: '우리동네 학생',
```

### 3. `preview/home-ui/src/promo/study-room-content.js`

```
-  title: '우리동네 공부방, 더 쉽게 찾고 비교해보세요'
+  title: '우리 공부방, 동네 지도 위에 먼저 보이게'
-  desc: '지역 기준으로 찾고, 비교하고, 가볍게 시작할 수 있도록 정리했습니다.'
+  desc: '베이직카드 등록과 노출은 무료. 학생이 지도를 열면 핀으로 보여요.'
```

### 4. `preview/home-ui/src/home-marketing-banner.js`

```
HOME_PROMO_TRIO study 칸:
-  title: '내가 찾는 공부방'  →  title: '우리 공부방, 지도 위에'
-  sub: '가까운 곳부터 비교하고, 등록은 가볍게 시작하세요'
+  sub: '베이직카드 등록과 노출은 무료로 시작하세요'

HOME_PROMO_TRIO parent 칸:
-  title: '학생, 인재로 만들기'  →  title: '집 앞에 이런 곳이 있었어?'
   sub: '가까운 곳부터 비교하고, 쪽지로 시작하세요'  ← 유지
```

---

## 검증 결과

| 항목 | 결과 |
|---|---|
| 빌드 | ✅ 9.78s |
| 학생 h1 "우리동네 학생" (1440/420) | ✅ 스냅샷·스크린샷 확인 |
| 배너 3칸: "우리 공부방, 지도 위에" | ✅ 스냅샷 확인 |
| 배너 3칸: "집 앞에 이런 곳이 있었어?" | ✅ 스냅샷 확인 |
| 배너 3칸: 과외쌤 칸 유지 | ✅ |
| 공부방 promo h1 "공부방 카탈로그" 유지 | ✅ |
| 빵부스러기: "홈 › 홍보" 표시 | ✅ |
| 가로 넘침 0 (1440px: scrollW 1425) | ✅ |
| 가로 넘침 0 (420px: scrollW === 420) | ✅ |
| 관리자 런치 데스크 | ⚠️ 비로그인 접근 불가. 코드 확인: `a28-screens.js:725` `STUDY_ROOM_PROMO.railCard.title` = "우리 공부방, 동네 지도 위에 먼저 보이게" 반영됨 |

---

## 남은 '학부모' 표기 목록 (이번 미수정)

| 위치 | 현재 표기 | 비고 |
|---|---|---|
| `home-marketing-banner.js` 38행 | 주석 `(학부모·공부방찾기)` | 주석, 지시서에서 이번 수정 범위 밖 |
| `home-marketing-banner.js` 96행 | `'학생·학부모 과금 없이...'` | 38·96·99행 상단 마케팅 배너 — 다음 차수 |
| `home-marketing-banner.js` 99행 | `imageAlt: '학생·학부모 연결 분위기'` | 동일 |

---

## 스크린샷 경로 (`D:\work\study114\_local\shots\293-8\`)

| 파일 | 설명 |
|---|---|
| `1440-home-trio.png` | 홈 배너 3칸 (1440px) |
| `1440-C-h1-banner.png` | C h1 "우리동네 학생" + 배너 (1440px) |
| `1440-A-promo-top.png` | A promo h1 + 배너 (1440px) |
| `420-C-h1.png` | C h1 "우리동네 학생" (420px) |

---

## 남은 일

- 노션 반영: 마지막 반영 2026-10-12, 3일 초과. 다음 작업 시작 전 선행 필요.
- `_local/directives/293-copy-final.md` 갱신 (Cursor 범위 밖).
