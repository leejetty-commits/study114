# 공개 마이샵 — 라우팅·복귀·문맥 유지 정책

**대상:** `#/myshop/study-room/:id` **공개 열람용 공통 본편**  
**비대상:** 원장 마이페이지 「내 등록 → 마이샵」탭(내 공부방 결과물 미리보기). 라우트·셸 분리. 비주얼은 이후 공유 가능.  
**기준일:** 2026-08-21  
**관련:** [47-study-room-home-card-map.md](./47-study-room-home-card-map.md) · `preview/home-ui/src/myshop/*` · `detail-decision/`

---

## 0. 역할 정리

| 화면 | 누구 | 무엇 |
| --- | --- | --- |
| 내 등록 안의 마이샵 | 원장(본인) | **내** 공부방 결과물 미리보기 |
| `#/myshop/study-room/:id` | 학부모·공부방·과외쌤·게스트 등 | **공개된** 공부방 공통 본편 |

공개된 공부방이면 학생(학부모)모드뿐 아니라 **공부방모드에서도 다른 공부방** 마이샵을 볼 수 있다.  
복귀 버튼 라벨·문맥 복원은 **진입한 역할/직전 화면** 기준으로 다르게 처리한다.

---

## 1. 위치 / 플로우

| 해야 함 | 하지 말 것 |
| --- | --- |
| 바디 **전체**를 쓰는 **독립 상세 페이지** | 좌측 서랍형 |
| 탐색 흐름의 **최종 본편** | 인라인 확장만으로 본편 대체 |
| | 부분 팝업·모달만으로 본편 대체 |
| | 리스트 안 보조 패널로 취급 |

핵심 의도: 마이샵은 **충분히 깊게 보는 본편**. 복귀는 **가볍고 명확**. 비교·탐색 중 길을 잃지 않게.

---

## 2. 진입 단계 (3단)

```
미니카드 → 확대카드 → 마이샵(공개 쇼케이스)
```

| 단계 | 역할 | 문맥 |
| --- | --- | --- |
| **미니카드** | 첫 입구 (목록·노출 카드) | 검색/홈 리스트 |
| **확대카드** | 같은 문맥에서 조금 더 읽기 | 리스트·검색 화면 위 (모달) |
| **마이샵** | 최종 본편 | **독립 풀페이지** `#/myshop/study-room/:id` |

확대카드 ≠ 마이샵. 확대는 “중간 단계”, 마이샵만 “본편”.

---

## 3. 클릭 규칙 (역할 분리)

| 입력 | 결과 |
| --- | --- |
| 대표 배너 / 이미지 / 카드 본문 클릭 | **확대카드**만 |
| 「공부방 둘러보기」 등 **명시적 CTA** (확대카드 푸터) | **마이샵** 진입 |
| 미니카드에서 마이샵 직행 | 금지 |

---

## 4. 복귀 정책

1. 공개 마이샵 **상단**에 명시적 복귀 버튼 필수.  
2. 브라우저 뒤로가기만 믿지 않음.  
3. 라벨·목적지는 진입 문맥에 맞게 (`myshopReturnLabel`).

---

## 5. 문맥 유지 — 스냅샷 계약

`sessionStorage` 키: `study114:myshop-return-snapshot` (v1)

| 필드 | 설명 |
| --- | --- |
| `listKey` | 화면/리스트 문맥 (`parent:study_room` 등) |
| `returnHash` | 복귀 해시 |
| `sourceRoute` | 진입 문맥 |
| `viewerRole` | 진입 역할 |
| `activeTab` | 탭 |
| `scrollY` | 스크롤 |
| `focusId` | 직전 study-room id |
| `listPages` | 페이지네이션 |
| `find` | 검색 상태 요약 + `formFilters` |

구현: `preview/home-ui/src/myshop/return-snapshot.js` · `navigate.js` · `public-shell.js`

### 본문 1차 (2026-08-21)

- 모듈: `myshop/public-model.js` · `myshop/public-body.js`
- SSOT: **기본정보 + 상세정보1 + 상세정보2** 입력 필드만 매핑
- 제외: 쪽지설정·등록점검·공개상태·노출등급·진행률·문의상태 등
- 빈 섹션 숨김. placeholder 제거.

---

## 6. 라우트

| 구분 | 경로 |
| --- | --- |
| 공개 본편 | `#/myshop/study-room/:id` (`?from=` 복귀 라벨용) |
| 원장 미리보기 | `#/mypage/registrations/study-rooms/:id` 허브 탭 |

셸: 홈 SPA 메인 바디 전체. **마이페이지 레일·상세 모달로 본편을 열지 않음.**

---

## 7. 코드 맵

| 모듈 | 역할 |
| --- | --- |
| `myshop/router.js` | 경로 파싱 |
| `myshop/return-snapshot.js` | 스냅샷 저장·복원 |
| `myshop/navigate.js` | `openPublicMyshop` / `returnFromPublicMyshop` |
| `myshop/public-shell.js` | 풀페이지 셸 + 복귀 버튼 (본문 placeholder) |
| `detail-decision/detail-shell.js` | 확대카드 「공부방 둘러보기」 CTA만 진입 |
| `state.js` / `main.js` | `isMyshopRoute` · 풀바디 분기 |

---

## 8. 수용 기준

- [x] 확대카드 CTA로만 공개 마이샵 진입
- [x] 배너/카드 클릭은 확대카드
- [x] 공개 마이샵 = 독립 풀페이지
- [x] 상단 복귀 버튼
- [x] 복귀 시 스냅샷으로 조건·스크롤·문맥 복원
- [x] 원장 미리보기와 라우트/셸 분리
- [x] 학부모·공부방 등 역할 공통 열람 (복귀만 문맥별)
- [x] 본문 1차 · 문의는 읽기 전용 상태 문구만 (짧은 상태형 톤)
- [x] API 재료 보강 (`GET /api/study-room/public.php` · 검색 list 필드·갤러리 · mapper 패스스루)
- [x] 수업정보 카드 구조 정리
- [x] 사진/공간감 polish (모자이크 갤러리)
- [ ] 문의 CTA 정교화 (본편과 분리, 행동 유발은 별도 라운드)

---

## 9. 라우팅·API 재점검 (2026-08-21)

### 통과

| 항목 | 결과 |
| --- | --- |
| 해시 `#/myshop/study-room/:id` + pathname 딥링크 → hash 정규화 | OK (`bootstrapMyshopRoute`) |
| `.htaccess` — 실파일·`/api/` 제외 SPA fallback | OK |
| CTA만 진입 (`open-myshop`) · 배너/카드는 확대카드 | OK |
| 복귀 스냅샷 → 역할별 list bind `restoreMyshopScrollAndFocusIfPending` | OK |
| `GET /api/study-room/public.php?id=` · `src/` FTP 배포 | OK |
| Vite `/api` proxy (로컬 5174→8080) | OK |

### 이번 수정

| 이슈 | 조치 |
| --- | --- |
| 미인증 로그인이 공개 마이샵까지 이메일 인증 대기로 가로챔 | `main.js` — `isMyshopRoute()` 예외 |
| 로그인 직후 딥링크를 역할홈이 덮을 수 있음 | `onDeep`에 `isMyshopRoute` 포함 |
| `isMyshopRoute`가 `/myshop/*` 전부 true | `normalizeMyshopPath`만 true |
| `id=0` 경로 파싱·생성 | `parseMyshopPath` 거부 · `myshopStudyRoomPath` → `''` |
| Public API가 lat/lng 고정 SELECT · 검색과 노출 조건 불일치 | lat/lng 조건부 · `expanded_complete` 정렬 |
