# 019 · 학생 마이페이지 리뉴얼 E — 보완지시문

- 작성일: 2026-09-24 (KST)
- 선행: [018](018-student-mypage-renewal-ticket-e-legacy-cleanup.md)
- 대상: Cursor E 보고 (미커밋) — 자녀·대표·게이트 청소
- 상태: **보완 반영·수락** → [020](020-student-mypage-renewal-ticket-e-acceptance.md)

---

## 0. 한 줄 결론

학생 마이페이지·내 등록에서 **자녀 / 대표학생 / 공개 게이트 / 스테퍼 / hope-dual** 문법은 걷어졌다.  
라우팅·basic/detail 필드 분리·저장 스모크 보고도 018 목적에 맞다.

다만 **공식 변경 파일 목록이 실제 diff보다 좁고**, 같은 워킹트리에 **auth/PHP WIP가 섞여 있다.**  
018 제외 #9(auth WIP와 E 커밋 혼합)에 걸린다.  
코드로 새 기능을 더 만들지 말고, **목록·분리·추적 파일**만 정리해 다시 보고하라. F는 열지 않는다.

---

## 1. 통과한 것 (건드리지 말 것)

| 항목 | 상태 |
|------|------|
| `student-reg/**` · `empty-state-copy.js` 사용자 금지어 **0건** | 코드 검토 확인 |
| list / tab / draft / publish → `#/mypage/registrations/students/{activeId}` | 예 |
| 없는 학생 「학생 정보를 찾을 수 없습니다」 | 예 |
| 활성 학생 있으면 `student_import`로 추가 생성 안 함 | 예 |
| 스테퍼·자녀목록·공개 체크리스트·detail hope-dual 분기 제거 | 예 |
| `hope-regions-ui.js` 삭제 · import 잔존 없음 | 예 |
| basic=`request_summary` / detail=`special_request_note` 분리 유지 | 예 |
| 계정설정 「대표 지역」·유료 「대표 노출」 유지 | **의도적 OK** (학생 내 등록 금지어 아님) |
| 쪽지설정 저장·스키마·push/빌드/커밋 없음 | 예 |
| A~D 폼·카드 **재설계 없음** | 예 |

식별자 `GUARDIAN_PLANS_COPY` / 유료 학부모 카피 심볼은 **화면 문자열 “guardian/자녀”가 아니면** E 실패로 보지 않는다. 이름 정리는 F/chore.

---

## 2. 반드시 고칠 것 (수락 차단)

### 2-1. 공식 E 변경 목록을 실제와 맞출 것

보고에 적힌 8개만으로는 부족하다. **이미 손댄 E 필요 파일**을 목록에 넣고, 한 줄 이유를 붙여라.

| 경로 | 이유 (보고용) |
|------|----------------|
| `preview/home-ui/src/student-reg/screens.js` | 스테퍼·목록·게이트·카피 |
| `preview/home-ui/src/student-reg/student-reg-copy.js` | 자녀/공개 카피 |
| `preview/home-ui/src/student-reg/store.js` | draft 추가·import 1명 가드 |
| `preview/home-ui/src/student-reg/hope-regions-ui.js` | **삭제** (호출 0) |
| `preview/home-ui/src/student-reg/router.js` | **누락 보고** — 레거시 path·탭 타이틀 |
| `preview/home-ui/src/mypage/screens.js` | 자녀 카피·허브 리다이렉트 |
| `preview/home-ui/src/mypage/router.js` | 자녀 목록 카피 |
| `preview/home-ui/src/mypage/preview-data.js` | 자녀/공개 미리보기 카피 |
| `preview/home-ui/src/mypage/index.js` | **누락 보고** — `#/mypage` → 프로필 |
| `preview/home-ui/src/mypage/shell.js` | **누락 보고** — 내 등록 → 허브 |
| `preview/home-ui/src/empty-state-copy.js` | 빈상태 자녀 카피 |
| `preview/home-ui/src/exposure-render.js` | **누락 보고** — selfView/마이프로필 카드 연동 (B 회귀 방지 범위) |
| `preview/home-ui/src/student-reg/format.js` | **누락 보고** — exposure row 필드 |
| `preview/home-ui/src/student-reg/profile-read.js` | **누락·미추적** — hub import. E 산출물에 **포함·추적** |

위 표 밖 파일을 E로 새로 건드리지 말 것. 이미 손댄 것이 더 있으면 **전부 목록에 올리고** 018 제외에 걸리면 2-2로.

### 2-2. auth · PHP · StudentHub를 E 묶음에서 분리

같은 워킹트리에 아래가 dirty면 **E 수락 불가** (커밋·푸시 전에 반드시 분리):

- `preview/auth-ui/**`
- `public/assets/css/auth/**`
- `src/Auth/**` · `src/Views/auth/**` · auth 관련 `helpers`
- `src/Registration/StudentHubRepository.php` (C/D 저장 보강이면 **E 변경 목록에서 제외**하고 “선행 C/D WIP”로만 표기. E 이유로 새로 고치지 말 것)
- `study-room-reg/**` 공백·티저·`.tmp-*`·`_verify/` 노이즈

**잠금:**

1. E 재보고에 `git status --short`를 붙여, **E 파일만** staged/관련로 보이게 하라 (또는 “E 파일 목록 / 그 외 WIP 목록” 두 덩어리).
2. auth·StudentHub·노이즈는 **이번 E에서 수정하지 말고**, 손대지 않은 채 두거나 stash. “E에 포함”이라고 쓰지 말 것.
3. push / `build:dothome` / 커밋 **요청 전 금지** (기존과 동일).

### 2-3. 저장 스모크를 재보고에 한 줄로 재확인

이미 했다고 했으나 수락 문서용으로 **재확인 1회**만:

- basic `request_summary` update → 확인 → 원복
- detail `special_request_note` update → 확인 → 원복
- 새로고침 마이프로필이 원문과 같음

새 API·스키마 변경 없음.

---

## 3. 하지 말 것

- 기본정보·상세·마이프로필 카드 재설계
- 쪽지설정 저장 / `memo_status`
- `guardian_user_id` 물리 삭제·스키마 drop
- `GUARDIAN_PLANS_COPY` 심볼 개명 (→ F/chore)
- store의 `getPublishReadiness` / `publishStudent` 강제 삭제 (호출 0이면 남겨도 됨 → F 선택)
- 공부방·과외쌤·가입 14장·학생찾기
- Stage5B (F)
- Notion 자동 기록 (우동공과2가 수락 후만)

---

## 4. 재보고 형식 (이 형식 아니면 반려)

1. **E 최종 변경 파일 표** (§2-1 전부 + 한 줄 이유; 삭제 파일 명시)
2. **WIP 분리 표** — auth / StudentHub / 기타 (E 아님)
3. `git status --short` 요약 (E vs non-E)
4. 금지어 재검색 0건 (키워드 + 범위: student-reg + empty-state + E mypage 경로)
5. 라우팅 한 줄 + 저장 스모크 한 줄
6. 「안 한 것」「F에서 할 일」

코드 diff가 §1과 같고 §2만 정리된 보고면 **수락 → F 개방**.  
§2를 코드로 더 넓히면 다시 보완.

---

## 5. Cursor 복사용

```
018 E 기능은 대체로 통과. 019 보완만. F·수락 아직.

【한 줄】
새 기능 금지. (1) E 변경 파일 목록을 실제 diff에 맞게 확대·추적 (router/index/shell/exposure-render/format/profile-read + hope-regions 삭제 포함)
(2) auth-ui·Auth PHP·StudentHubRepository·노이즈는 E 묶음에서 분리·미포함
(3) basic/detail 저장 스모크 재확인 한 줄
재보고 형식: E 파일표 + WIP 분리표 + git status + 금지어0 + 라우팅/스모크.

【건드리지 말 것】
A~D 폼/카드, 쪽지설정 저장, 스키마, GUARDIAN_* 개명, push/빌드/커밋, Stage5B.
계정설정 대표 지역·유료 대표 노출 유지 OK.
```
