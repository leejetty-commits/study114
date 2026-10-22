# 240 지시서 (2026-10-22 다시 씀) — 고민방 글쓰기 사진 올리기 (옛 브랜치를 새 main 위로 옮겨 마무리)

- 기준: origin/main **f068ecb8** (Merge 278). 줄 번호는 2026-10-22에 이 코드로 확인함.
- 옛 브랜치: `origin/cursor/240-concern-photo-upload-20261017` (시작 3e9ebff9, 커밋 2개: 97613811 사진 올리기, 4b7e2d66 글 지울 때 사진도 지움). main보다 164커밋 뒤.
- 새 브랜치: **cursor/240-concern-photo-upload-20261022**. **이 브랜치에만 push. main 병합 금지. force push 금지.**
- 순서: 275 → 283 → 283-1 → 278 → **240** → 279 → 276 → 277-1 → 277-2 → 281 → 282 → 280

## 0. 앞 지시서 결과 확인 (먼저)
- 아래가 **main에 들어 있는지** 확인: `git merge-base --is-ancestor <커밋> origin/main`
  - 275 `0b7c7bde`, 283 `de553125`, 283-1 `43b85a6c`, 278 `f068ecb8`. 하나라도 아니면 멈추고 보고.
- 옛 240 커밋 97613811·4b7e2d66이 **main에 들어 있지 않은지** 확인(들어 있으면 멈추고 보고).
- main f068ecb8의 「Verify bundle」이 초록인지 확인. 아니면 시작하지 말고 보고.
- 아래 1장 「지금 코드」 줄이 그대로인지 확인. 다르면 멈추고 보고.

## 쉬운 말 요약 (종현 확인용)
- 고민방 글쓰기에 「이미지 1~3장까지 가능」이라고 쓰여 있는데 사진 칸이 없다. 2주 전에 Cursor가 만든 작업(아직 main에 안 들어감, 라이브 `concern-photos.php` 404)을 새 main 위로 옮겨 마무리한다.
- 규칙은 그대로다(아래 2장). 278이 고민방 문구 몇 개를 바꿨지만 글쓰기 부분과는 안 겹친다(미리 합쳐 보니 충돌 없음).

## 1. 지금 코드 (f068ecb8)
| 곳 | 줄 | 지금 |
|---|---|---|
| preview/home-ui/src/concern/copy.js | 192-193 | 「이미지 1~3장까지 가능 · 개인정보…」 안내 |
| preview/home-ui/src/concern/screens.js | 768 renderCompose(새 글), 672-690 글 수정 폼 | 글 종류·제목·본문만 |
| preview/home-ui/src/concern/store.js | 308 saveConcernPost | 제목·본문·종류만 보냄 |
| src/Board/BoardAttachmentService.php | 12 | `BOARD_KEY = 'submission'` 고정(제출자료 전용) |
| config/storage.php | 7, 12 | 첨부 폴더, submission 규칙만 |
| sql/schema/025_board_post_attachments.sql | 8 | 첨부 표(새 표 만들지 않음) |
| src/Media/PromoImageProcessor.php | 140 | WebP 품질 82 |
| public/api/board/concern-photos.php | — | 없음(옛 브랜치가 새로 만듦) |
- 278이 바꾼 고민방 줄(copy.js roomEmpty·bestEmpty, screens.js 게스트 안내 :275 근처·빈 목록 :509-513)은 **그대로 둔다.**

## 2. 규칙 (종현 확정 2026-10-15, 정본: Notion 「공부방 모드 점검 보고서 (2026-10-15)」 E5, 저장소 docs/design/room-audit-2026-10-15/REPORT-공부방모드-점검.md — 바뀐 것 없음)
- 최대 3장, JPG·PNG·WebP만, 장당 10MB까지.
- 긴 쪽 1600px로 줄이고 약 1MB로 압축, WebP 품질 82. 작은 사진은 키우지 않는다. 원본은 저장하지 않는다.
- 긴 쪽 400px 미만도 막지 않고 안내만.
- 개인정보 주의 문구 그대로 + 한 줄 추가: 「사진은 최대 3장, 장당 10MB까지 올릴 수 있어요. 작은 사진은 흐리게 보일 수 있으니, 더 또렷한 사진이 있으면 그 사진으로 올려 주세요.」
- 남의 글에는 사진을 못 올림(글쓴이 확인).

## 3. 진행 방법
1. f068ecb8에서 새 브랜치 `cursor/240-concern-photo-upload-20261022`를 만든다.
2. 옛 커밋 **97613811과 4b7e2d66 둘 다** 이 순서로 `git cherry-pick`한다(필수).
3. 충돌이 나면: 278 줄은 main 그대로 두고 240 줄만 얹는다. 둘이 같은 문장을 다르게 바꾸면 멈추고 보고.
4. 옮긴 뒤 아래 4장 허용 파일 밖이 바뀌었는지 `git diff origin/main --stat`로 확인.
5. 옛 작업은 리뷰를 받은 적이 없으므로, 5장 확인을 전부 새로 한다.

## 0-1. 정해진 것 (2026-10-22 종현 확정)
- 옛 커밋 4b7e2d66 「글을 지울 때 사진 파일과 첨부 기록도 삭제」를 **넣는다**(src/Board/ConcernService.php +5줄, src/Board/BoardAttachmentService.php +25줄).

## 4. 허용 파일 (이 밖은 안 됨)
- preview/home-ui/src/concern/screens.js (사진 고르기·미리보기·지우기·글 화면 사진 표시)
- preview/home-ui/src/concern/store.js (글 저장 뒤 사진 올리기)
- preview/home-ui/src/concern/copy.js (안내 한 줄)
- preview/home-ui/src/styles/home-community.css (꼭 필요할 때만)
- public/api/board/concern-photos.php (새 받는 곳)
- src/Board/BoardAttachmentService.php, src/Board/BoardAttachmentRepository.php (고민방에도 쓰게 넓힘 + 글 지울 때 사진 지우기. 제출자료 동작은 그대로)
- config/storage.php (고민방 규칙)
- src/Media/PromoImageProcessor.php (**새 함수 추가만.** 기존 공부방 홍보사진 함수 동작은 그대로)
- src/Board/ConcernService.php (글 지울 때 사진 지우기, 4b7e2d66)
- **범위 밖이 필요하면 멈추고 보고.**

## 5. 하지 않는 것
- 제출자료·쪽지 첨부 규칙, 글 본문 저장 방식, 다른 게시판 동작, 관리자 설정, DB 표 추가·변경, 공부방 홍보사진 업로드 동작, 278이 바꾼 문구.
- 검사 끄기·skip·continue-on-error, 워크플로 파일.

## 6. 확인 (로컬, 새 테스트 계정만. 운영·라이브 쓰기 금지)
1. 사진 3장(가로가 큰 것 1, 긴 쪽 400px 미만 1)으로 글쓰기: 미리보기·한 장씩 지우기, 작은 사진 안내, 저장 파일 긴 쪽 ≤1600px·약 1MB·원본 없음, 글 화면에 3장.
2. 4장째 막힘 + 쉬운 말 이유. 3. 사진 아닌 파일 막힘. 4. 10MB 넘는 사진 막힘.
5. 사진 올리기 실패해도 글은 남고 안내. 6. 남의 글에 사진 올리기 거절(API 직접 호출).
7. 제출자료 첨부·쪽지 첨부·공부방 홍보사진 업로드가 전과 같음.
8. 사진이 있는 글을 지운 뒤: 서버의 사진 파일이 없어지고, DB board_post_attachments에 그 글 기록이 0건인지 확인.
9. 278 문구(게스트 안내는 비회원만, 못 쓰면 「첫 글」 없음)가 그대로.
10. 1280·390 스크린샷: 글쓰기(사진 3장), 글 화면.

## 7. 합격 기준
- 브랜치 push 후 이 push로 도는 GitHub Actions(「Verify bundle」 포함)가 **전부 초록**. 하나라도 빨가면 고치지 말고 보고(240 때문인지 먼저 확인).

## 8. 커밋·push
- 커밋: cherry-pick한 커밋(메시지 그대로) + 필요하면 `240 fix(concern): 새 main에 맞춤` 1개.
- 파일 이름으로 add(`git add -A` 금지) → `git push origin cursor/240-concern-photo-upload-20261022` → **멈춤.**

## 9. 보고
- 새 커밋 해시, cherry-pick 충돌 여부, 바뀐 파일·줄 수, 6장 1~10 결과, Actions run 번호와 결과, 멈춤 조건에 걸린 것(없으면 「없었다」). 쉬운 말로.
