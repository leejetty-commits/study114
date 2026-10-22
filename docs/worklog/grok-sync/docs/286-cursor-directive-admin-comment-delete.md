# 286 지시서 — 슈퍼관리자가 사이트 화면에서 남의 댓글·답글 삭제

- 결정: 종현 확정 2026-10-22
- 기준(base): origin/main `93b5fba3`(Merge 276) 또는 그보다 새것 (`git fetch` 후 확인)
- 새 브랜치: `cursor/286-admin-comment-delete-20261022`
- 순서: **285 다음**

## 목표

슈퍼관리자(화면 기준 `isAdminUser(user)` = `role_type === 'admin' || admin_level`)가 **관리자 페이지가 아닌 사이트 화면**(고민방 글 상세)에서 남이 쓴 댓글과 답글에 「삭제」 버튼을 보고 지울 수 있게 한다.

---

## 0. 앞 지시서 결과 확인 (시작 전에 꼭)

아래가 모두 **main에 들어 있는지** 확인한다. 하나라도 아니면 멈추고 보고.

```bash
git fetch origin
for c in 0b7c7bde de553125 43b85a6c f068ecb8 620cad0e b7164bf6 93b5fba3; do
  git merge-base --is-ancestor $c origin/main && echo "OK $c" || echo "MISSING $c"
done
git log origin/main --oneline --grep="Merge 285"
```

| 커밋 | 내용 |
|---|---|
| 0b7c7bde | Merge 275 |
| de553125 | Merge 283 |
| 43b85a6c | Merge 283-1 |
| f068ecb8 | Merge 278 |
| 620cad0e | Merge 240 |
| b7164bf6 | Merge 279 |
| 93b5fba3 | Merge 276 |
| (Merge 285) | 285 보안 — main에 들어 있어야 시작. 없으면 멈추고 보고 |

- main 최신 커밋의 **Verify bundle**이 초록인지 확인. 빨강이면 시작하지 말고 보고.

---

## 1. 확인된 사실 (main 93b5fba3 기준 — 276 병합 뒤에도 이 파일들은 안 바뀜)

### 서버 — 이미 관리자 허용, 고치지 않음
- `public/api/board/comments.php:38-45` DELETE → `ConcernService::deleteComment` 호출. 이 API는 `ConcernService`만 쓴다.
- `src/Board/ConcernService.php:372-386` `deleteComment`
  - `:380` `$isAdmin = role_type === 'admin' || !empty(admin_level)`
  - `:381-383` 관리자가 아니고 본인 댓글도 아니면 403
  - `:385` `softDelete` → 상태를 `deleted`로 바꿈(진짜로 지우지 않음)
- 로그인 정보에 `admin_level`이 들어 있다: `src/Auth/AuthSession.php:118` (반환 모양에 `admin_level`), `BoardApi::requireAuth`(`src/Board/BoardApi.php:41-49`)가 그대로 넘김.
- 고칠 것: `ConcernService.php:368` 주석 「본인 댓글 삭제.」 → 「본인 댓글 삭제(관리자는 남의 댓글도).」 **주석 한 줄만**(선택). 코드 동작은 바꾸지 않는다.

### 화면 — 여기만 막혀 있음
- `preview/home-ui/src/concern/screens.js:88-90` `isAdminUser(user)` 이미 있음(글 삭제 `:628`에서 쓰는 중).
- `:726-730` `renderCommentItem`
  - `:729` `isOwner = currentUserId && Number(comment.authorUserId) === currentUserId`
  - `:730` `canDeleteComment = isOwner && !isDeleted && !isHidden` ← **관리자는 버튼이 안 보임**
- user 전달 방식: 지금은 `user`가 아니라 숫자 `currentUserId`만 넘어간다.
  - `:1106-1107` `const user = getAuthUser(); const currentUserId = ...`
  - `:1115` `renderCommentsTree(comments, access, currentUserId, numericId, boardKey)`
  - `:717` `renderCommentsTree(...)` → `:723` `renderCommentItem(...)`
- **답글**: 같은 `renderCommentItem`이 자기 자신을 다시 불러 답글을 그린다(`:747-748` `comment.replies.map(r => renderCommentItem(...))`). 그래서 `:730`을 고치면 답글도 같이 해결된다. 2단계 트리.
- 삭제 버튼 동작: `:1389-1405` `[data-concern-delete-comment]` → 화면 안 확인창(「이 댓글을 삭제할까요?」 / 「삭제하면 「삭제된 댓글입니다」로 바뀌고 되돌릴 수 없어요.」) → `deleteComment(commentId)`(`preview/home-ui/src/concern/store.js:478`). **문구·동작 그대로.**

### 정보글 — 댓글 기능 없음 → 범위 밖
- `src/Board/BoardChannelAcl.php:282-293` `COMMENT_DISABLED`에 `info-room`, `info-tutor`, `info-student`(+ notice, faq, library 등)가 들어 있다. `:295-303` `canComment`가 이 채널은 항상 false.
- `src/Board/InfoBoardService.php`에는 댓글 코드가 없다(반응 「응원해요」만, `:363`).
- 화면에서 `/api/board/comments.php`를 부르는 곳은 `preview/home-ui/src/concern/store.js:433-478` 하나뿐.
- 그래서 정보글 댓글·답글은 **범위 밖**. 고치지 않는다.

---

## 2. 할 일 (이것만)

| 파일 | 줄 | 할 일 |
|---|---|---|
| `preview/home-ui/src/concern/screens.js` | 717, 723 (`renderCommentsTree`) | 마지막 인자로 `isAdmin`(true/false)을 받아 `renderCommentItem`에 넘긴다 |
| 〃 | 726, 747-748 (`renderCommentItem` + 답글 재귀) | `isAdmin` 인자를 받고, 답글 그릴 때도 그대로 넘긴다 |
| 〃 | 730 | `const canDeleteComment = (isOwner \|\| isAdmin) && !isDeleted && !isHidden;` |
| 〃 | 1115 | `renderCommentsTree(comments, access, currentUserId, numericId, boardKey, isAdminUser(user))` (`user`는 `:1106`에 이미 있음) |
| 〃 | 1389 주석 | 「본인 댓글」 → 「본인 댓글(관리자는 남의 댓글도)」 (선택) |
| `src/Board/ConcernService.php` | 368 주석 | 위 1번대로 (선택, 코드 변경 없음) |

- 주의: **`isOwner`를 바꾸지 않는다.** `isOwner`는 반응 버튼(`:738` 본인 댓글엔 반응 못 함)과 신고 버튼(`:743`)에도 쓰인다. 관리자도 남의 댓글엔 지금처럼 반응·신고가 보여야 한다. 새 `isAdmin`은 **삭제 버튼에만** 쓴다.
- `renderCommentsTree`·`renderCommentItem`을 다른 곳이 부르는지 `rg -n "renderCommentsTree\(|renderCommentItem\(" preview` 로 확인. 2026-10-22에는 이 파일 안 3곳(`:717`, `:723`, `:748`)과 `:1115`뿐. 다른 곳이 있으면 인자를 빠뜨려도 지금과 같게(기본값 `false`) 두고 보고.
- 이미 삭제됐거나 숨김인 댓글에는 관리자도 버튼이 안 나온다(지금 그대로).
- 「삭제된 댓글입니다」 표시는 지금 그대로.

**그 밖의 파일은 고치지 않는다. 범위 밖이 필요하면 멈추고 보고.**

## 3. 하지 않는 것

- 서버 권한 코드 바꾸기(이미 됨). 다른 게시판 서비스(InfoBoardService 등)·ACL 고치기
- 정보글에 댓글 만들기
- 관리자 페이지(admin 화면) 고치기
- 확인창 문구, 성공 알림(「댓글을 삭제했어요.」), 삭제된 댓글 표시 바꾸기
- 관리자에게 반응·신고 버튼 규칙 바꾸기
- 점검(CI) 끄기·약하게 하기

## 4. 다른 지시서와 겹치는지 (2026-10-22 확인)

- **276** (main에 병합됨 `93b5fba3`) 바꾼 파일: `exposure-render.js`, `home-listings.css`, `search-visily.css`, `TutorProfileImageService.php`, `TutorHubRepository.php`, `SearchService.php` → **286과 겹치지 않음.**
- **285** 바꾸는 파일: health 임시 파일, `PromoImageService.php`, `TutorProfileImageService.php`, `PromoImageProcessor.php`, `public/uploads/.htaccess`, `.gitignore` → **겹치지 않음.**
- **284**(학생 출생연도 제거), 280·281·282 지시서에도 `concern/screens.js`·`ConcernService.php`는 없음.
- 시작할 때 다시 확인: `git log origin/main --oneline -- preview/home-ui/src/concern/screens.js src/Board/ConcernService.php` 로 이 지시서 이후 바뀐 게 있으면 줄 번호를 함수 이름 기준으로 다시 찾고 보고에 적는다.

## 5. 점검

### 5-1. 로컬 (/tmp/s114) — 새 테스트 계정만
- **기존 데이터는 지우지 않는다.** 테스트로 지우는 댓글은 **새로 만든 테스트 계정이 쓴 것**만.
1. 새 테스트 계정 A(학생 등 일반)를 만든다. A로 고민방 글 하나(또는 새 테스트 글)에 댓글 1개 + 그 댓글에 답글 1개를 쓴다. 테스트 글도 새 계정이 쓴 것을 쓴다.
2. 새 테스트 계정 B(일반)로 로그인 → A의 댓글·답글에 「삭제」 버튼 **없음**. B가 DELETE API를 직접 불러도 403(지금 그대로).
3. 관리자 계정(로컬 테스트 관리자. 없으면 새 테스트 계정에 로컬 DB로만 `admin_level` 부여)으로 로그인 → A의 댓글·답글에 「삭제」 버튼 **있음**. 신고·반응 버튼은 지금처럼 보임.
4. 관리자가 A의 **답글** 삭제 → 확인창 문구 그대로 → 「삭제된 댓글입니다」로 바뀜. 그다음 A의 **댓글** 삭제 → 같은 결과. 다른 사람 댓글은 그대로.
5. A로 다시 로그인 → 본인 댓글 삭제가 지금처럼 됨(다른 새 댓글로 확인).
6. 손님(로그아웃) → 삭제 버튼 없음.
7. 정보글(info-room 등) 상세 → 댓글 칸이 없는 것이 지금과 같음.

### 5-2. CI (브랜치 push 뒤)
- **Verify bundle** 전부 초록, **Board ACL gate** 초록, 그 밖에 이 push로 돈 점검 모두 초록.
- 빨강이 있으면 이 지시서 때문인지 먼저 확인하고, 아니면 손대지 말고 보고.

## 6. 합격 기준
- 2번 표의 파일·줄만 바뀜(`git diff --stat`으로 확인)
- 5번 점검 모두 통과, CI 모두 초록

## 7. push
- 커밋할 때 **`git add -A` 금지.** 바꾼 파일을 이름으로 하나씩 `git add`.
- 브랜치 `cursor/286-admin-comment-delete-20261022` 에만 push
- **merge 금지, force-push 금지**
- 보고: 바꾼 파일과 줄, 점검 결과(계정은 새로 만든 것만 썼는지 포함), CI 결과

**범위 밖이 필요하면 멈추고 보고.**
