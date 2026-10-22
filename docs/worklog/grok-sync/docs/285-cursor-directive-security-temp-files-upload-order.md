# 285 지시서 — 보안: 임시 점검 파일 삭제 + 사진 올리기 순서 고치기 + uploads 폴더 PHP 실행 막기

- 기준(base): origin/main `171dd476` 또는 그보다 새것 (`git fetch` 후 확인)
- 새 브랜치: `cursor/285-security-upload-order-20261022`
- 순서: 종현 승인 — **276보다 먼저**. 276이 다른 브랜치에서 동시에 진행될 수 있음(아래 6번 꼭 읽기)
- 배경: 2026-10-22 PHP 보안 점검 결과. 라이브 `https://study114.net/api/health/db.php`가 누구에게나 DB 이름·MySQL 버전·표 구조를 보여 줌. 사진 업로드가 "먼저 저장, 나중에 검사"라서 사진이 아닌 파일이 웹 폴더에 남을 수 있음.

---

## 0. 앞 지시서 결과 확인 (시작 전에 꼭)

아래가 모두 **main에 들어 있는지** 확인한다. 하나라도 아니면 멈추고 보고.

```bash
git fetch origin
for c in 0b7c7bde de553125 43b85a6c f068ecb8 620cad0e b7164bf6; do
  git merge-base --is-ancestor $c origin/main && echo "OK $c" || echo "MISSING $c"
done
```

| 커밋 | 내용 |
|---|---|
| 0b7c7bde | Merge 275 마이샵 사진 칸 고정 |
| de553125 | Merge 283 CI 점검 정리 |
| 43b85a6c | Merge 283-1 CI 점검 정리 2 |
| f068ecb8 | Merge 278 공부방 모드 문구 |
| 620cad0e | Merge 240 고민방 사진 올리기 |
| b7164bf6 | Merge 279 상세 단계 버튼 |

- main 최신 커밋의 **Verify bundle**이 초록인지 확인한다. 빨강이면 시작하지 말고 보고.
- 276 브랜치(`cursor/276-card-photo-logo-20261022`)가 이미 main에 들어갔는지도 확인한다(`git log origin/main --oneline --grep="Merge 276"`).
  - 들어갔으면 아래 줄 번호가 밀렸을 수 있다. 함수 이름 기준으로 다시 찾고, 바뀐 줄 번호를 보고에 적는다.

---

## 1. 할 일 ① — 임시 점검 파일 삭제

### 1-1. 지울 파일 (확인된 것)

| 파일 | 이유 |
|---|---|
| `public/api/health/db.php` | 파일 안 5-8줄에 "임시 DB 연결 테스트 — 확인 후 반드시 삭제하세요"라고 적혀 있음. 라이브에서 열쇠 없이 200, DB 정보가 보임 |
| `public/api/health/room-account.php` | 5-8줄 "one-shot after deploy" 진단용. 열쇠(STUDY114_MAIL_PROBE_KEY)가 있어야 열리지만, 한 번 쓰고 끝난 파일임 |

- 둘을 지우면 `public/api/health/` 폴더가 빈다. 폴더째 지운다.

### 1-2. 다른 임시 파일 찾기

```bash
rg -l "임시|삭제하세요|반드시 삭제|one-shot|삭제 대상|DELETE ME" public --glob '*.php'
```

- 2026-10-22 기준 결과는 `public/api/health/db.php` 하나뿐이었다(room-account.php는 영어로 "one-shot"이라 위 단어로 걸림).
- 새로 나온 파일이 있으면 **각각** 아래 1-3을 확인하고, 안 쓰이는 것만 지운다. 지운 것과 남긴 것을 모두 이유와 함께 보고에 적는다.
- 확신이 없는 파일은 지우지 말고 보고만 한다.

### 1-3. 아무도 안 쓰는지 확인

```bash
rg -n "health/db|room-account|api/health" --glob '!node_modules' . | rg -v "^./public/api/health/"
```

2026-10-22에 확인한 결과:

- **배포 워크플로(`.github/workflows/*.yml`)와 CI는 이 파일들을 쓰지 않는다.** 배포에 필요한 파일이 아님.
  - 만약 지금 다시 봤을 때 워크플로나 스크립트가 쓰고 있으면 → **지우지 말고 멈추고 보고.**
- `src/Site/SiteSettingsService.php:485` 에 `'/api/health/'` 문자열이 있다. 사이트 점검 중에도 열어 두는 경로 목록일 뿐이라 파일이 없어도 문제없다. **이 파일은 고치지 않는다.**
- 문서에 이름이 나오는 곳(고치지 않음, 보고에만 적기):
  - `docs/internal/01-dothome-deploy.md:59, 394, 430`
  - `docs/internal/00-project-tree-and-key-files.md:95`
  - `docs/internal/core-flow-audit-checklist.md:190, 227`
  - `docs/internal/README.md:81`
  - `docs/internal/69-publish-inquiry-region-address-fix.md:38`
  - `docs/internal/02-dothome-server-cleanup-checklist.md:61, 155, 197, 263, 357`

### 1-4. 라이브에서도 지워지는지

- 배포(FTP-Deploy-Action)는 저장소에서 지운 파일을 서버에서도 지운다.
- 배포 후 라이브에서 `/api/health/db.php`가 404가 아니면 → 직접 FTP로 지우지 말고 **멈추고 보고**(종현이 결정).

---

## 2. 할 일 ② — 사진 올리기 순서 고치기

### 2-1. 지금 문제

두 파일 모두 같은 모양이다.

| 파일 | 줄 | 지금 하는 일 |
|---|---|---|
| `src/Media/PromoImageService.php` (공부방 홍보사진, `uploadForRoom`) | 53-56 | 사용자가 준 **파일 이름**에서 확장자를 그대로 가져옴 |
| 〃 | 63-69 | 그 확장자로 `public/uploads/promo/rooms/{id}/{token}_orig.{ext}`에 **먼저 저장** |
| 〃 | 71 | 그다음에 `assertUpload`로 사진인지 검사. 떨어져도 저장된 파일을 지우지 않음 |
| `src/Media/TutorProfileImageService.php` (과외쌤 프로필사진, `upload`) | 46-49 | 같은 문제(파일 이름 확장자) |
| 〃 | 60-66 | 먼저 저장 |
| 〃 | 68 | 그다음 검사. 떨어져도 안 지움 |

### 2-2. 바꿀 순서 (두 파일 똑같이)

1. **임시 파일(`$tmp`, PHP가 받은 업로드 임시 파일) 상태에서 먼저 검사한다.** 웹 폴더에는 아직 아무것도 저장하지 않는다.
   - 진짜 사진인지 읽기: `PromoImageProcessor::inspect($tmp)` (getimagesize). 실패하면 거절.
   - 용량: 지금처럼 `PromoImageSpec::MAX_BYTES`(4MB).
   - MIME: 읽어 낸 MIME(`inspect` 결과)이 `image/jpeg`, `image/png`, `image/webp` 중 하나여야 함. **사용자가 보낸 MIME(`$clientMime`)으로 대신하지 않는다.**
   - 크기 한도는 **240과 똑같이**: 긴 변 12000 넘으면 거절, 가로×세로 4천만(40M) 픽셀 넘으면 거절.
     - 240 코드: `src/Board/BoardAttachmentService.php:350-355`
       ```php
       max($width, $height) > 12000
       || ($width > 0 && $height > intdiv(40000000, $width))
       ```
   - 최소 크기(`PromoImageSpec::MIN_WIDTH`·`MIN_HEIGHT`)는 지금처럼 유지.
   - 파일 이름 확장자 검사(`ALLOWED_EXT`)는 남겨도 된다(이중 확인). 단 **저장 확장자를 정하는 데는 쓰지 않는다.**
2. **확장자는 서버가 정한다.** 읽어 낸 MIME → `image/jpeg`→`jpg`, `image/png`→`png`, `image/webp`→`webp`. 그 밖은 거절. 사용자 파일 이름은 절대 쓰지 않는다.
3. 검사를 통과한 뒤에만 `{token}_orig.{서버가 정한 확장자}`로 저장(move_uploaded_file)한다.
4. **실패하면 지운다.**
   - 검사 실패: 웹 폴더에 아무것도 없어야 한다.
   - 저장 뒤 WebP 만들기(`writeVariants`)나 DB 저장이 실패하면: 그 업로드에서 만든 `_orig.*`와 `.webp` 파일을 모두 지우고 원래 오류를 그대로 던진다(try/catch 후 unlink, 그리고 다시 throw).
   - 업로드 임시 파일(`$tmp`)도 남지 않게 한다(PHP가 요청 끝에 지우지만, rename/copy로 옮겼다 실패한 경우를 챙긴다).
5. **잘 되는 경우는 지금과 똑같아야 한다.** 바뀌면 안 되는 것:
   - 저장 폴더·파일 이름 모양(`uploads/promo/rooms/{roomId}/{token}_orig.jpg`, `_{variant}.webp`, 과외쌤은 `_basic_720.webp`·`_prime_1280.webp`)
   - WebP 크기와 종류(`PromoImageSpec::VARIANTS`), 크롭 동작
   - DB에 넣는 값(`study_room_images`, `tutor_images`의 경로·종류·순서)과 API 응답 모양
   - 오류 문구: 지금 쓰는 문구를 그대로 쓴다. 새 한도(12000 / 40M)에서만 240 문구 "사진이 너무 커요. 더 작은 사진을 올려 주세요."를 쓴다.
   - 예전 `.jpeg` 이름 파일 → 이제 MIME으로 `jpg`가 된다(지금 결과와 같음).

### 2-3. 공통 코드를 어디에 둘지

- 검사 + 확장자 정하기는 `src/Media/PromoImageProcessor.php`에 함수 하나로 둔다. 예: `assertUploadTmp(string $tmp, int $size): array{width,height,mime,ext}`.
  - 기존 `assertUpload`는 다른 곳에서 쓰는지 `rg -n "assertUpload" src public`로 확인한다. 쓰는 곳이 이 두 파일뿐이면 새 함수로 바꿔도 되고, 남겨 둬도 된다. 다른 곳이 쓰면 **건드리지 않는다.**
- `src/Board/BoardAttachmentService.php`(240)는 **고치지 않는다.** 같은 숫자를 쓰기만 한다.

---

## 3. 할 일 ③ — uploads 폴더에서 PHP 실행 막기

### 3-1. 지금 상황 (2026-10-22 확인)

- `.gitignore:27` 이 `/public/uploads/` 를 통째로 빼고 있다. 그래서 지금은 `public/uploads/` 안의 파일이 저장소에도, 배포에도 없다.
- 배포: `.github/workflows/deploy.yml` 의 "Deploy public/ via FTP" 단계가 `./public/` → 서버 `/hosting/study114/html/` 로 올린다. 제외 설정(exclude)은 없고, 기본값만 쓴다(.git 등만 뺌). 그래서 `public/uploads/.htaccess`를 저장소에 넣으면 같이 올라간다.
- `scripts/build-dothome.sh` 는 SPA 폴더만 지우고 다시 만들며, `public/uploads/`는 건드리지 않는다. 다시 확인한다.
- 서버의 PHP 방식(mod_php인지 FPM/CGI인지)은 **모른다.** 그래서 `php_flag`는 반드시 `<IfModule>` 안에 넣는다(FPM에서 맨몸 `php_flag`는 500 오류가 난다).

### 3-2. 할 일

1. 새 파일 `public/uploads/.htaccess`:
   ```apache
   # 285: 올린 파일 폴더에서는 PHP를 실행하지 않는다. 사진은 그대로 보인다.
   <IfModule mod_php.c>
     php_flag engine off
   </IfModule>
   <IfModule mod_php7.c>
     php_flag engine off
   </IfModule>
   <IfModule mod_php8.c>
     php_flag engine off
   </IfModule>
   RemoveHandler .php .phtml .phar .php3 .php4 .php5 .php7 .php8 .pht .phps
   RemoveType .php .phtml .phar .php3 .php4 .php5 .php7 .php8 .pht .phps
   <FilesMatch "(?i)\.(php\d?|phtml|phar|pht|phps)$">
     <IfModule mod_authz_core.c>
       Require all denied
     </IfModule>
     <IfModule !mod_authz_core.c>
       Order allow,deny
       Deny from all
     </IfModule>
   </FilesMatch>
   Options -ExecCGI -Indexes
   ```
   - `Options`가 닷홈에서 500을 내면 그 줄만 빼고 보고한다(AllowOverride 제한 가능성).
2. `.gitignore` 를 이 파일 하나만 저장소에 들어가게 바꾼다:
   ```
   /public/uploads/*
   !/public/uploads/.htaccess
   ```
   - 다른 업로드 파일이 저장소에 들어오면 안 된다. `git status`로 `.htaccess` 하나만 잡히는지 확인.
3. **배포가 이 파일을 못 올리면(제외되거나, 서버에서 덮어써지거나, 올라갔는데 사진이 안 보이면) 멈추고 보고.** 다른 방법(`public/.htaccess`에 규칙 넣기 등)으로 바꾸지 않는다 — 그건 범위 밖이고, `public/.htaccess`는 배포 때 비밀값을 넣는 파일이라 건드리지 않는다.

---

## 4. 바꿔도 되는 파일 (이것만)

| 파일 | 바꾸는 곳 |
|---|---|
| `public/api/health/db.php` | 삭제 |
| `public/api/health/room-account.php` | 삭제 |
| (1-2에서 새로 찾은 임시 파일) | 삭제 — 보고에 이유와 함께 |
| `src/Media/PromoImageService.php` | `uploadForRoom` 안의 업로드 부분만 (지금 53-71줄 근처, 실패 시 지우기 위한 try/catch 포함) |
| `src/Media/TutorProfileImageService.php` | `upload` 안의 업로드 부분만 — **지금 46-68줄** (확장자·저장·검사), 실패 시 지우기 try/catch |
| `src/Media/PromoImageProcessor.php` | 검사 함수 추가(2-3) |
| `public/uploads/.htaccess` | 새로 만듦 |
| `.gitignore` | 27줄 근처 uploads 두 줄만 |
| `scripts/verify-*.mjs` 또는 `scripts/*` 새 점검 스크립트 | 필요하면 새 점검 1개 추가 가능(기존 점검은 끄거나 약하게 하지 않음) |

**그 밖의 파일은 고치지 않는다. 범위 밖이 필요하면 멈추고 보고.**

---

## 5. 하지 않는 것

- 문서(docs/) 고치기 — 보고에만 적기
- `src/Board/BoardAttachmentService.php`, `public/.htaccess`, `src/Site/SiteSettingsService.php`, 배포 워크플로 고치기
- 쪽지 첨부(`MessageAttachmentService`), 제출자료(`submission-attachments.php`) 등 다른 업로드 고치기 — 다음 보안 검사 단계에서 따로 함
- 예전에 올라간 사진 파일 옮기기·이름 바꾸기·지우기
- 화면(preview/) 코드 고치기
- 점검(CI) 끄기, 건너뛰기, 기대값 약하게 하기

---

## 6. ⚠ 276과 겹치는 부분 (꼭 읽기)

276이 다른 브랜치(`cursor/276-card-photo-logo-20261022`)에서 동시에 진행될 수 있다.

### 285가 절대 건드리지 않는 276 파일

- `preview/home-ui/src/exposure-render.js`
- `preview/home-ui/src/styles/home-listings.css`, `preview/search-ui/src/styles/search-visily.css` (CSS 전부)
- `src/Search/SearchService.php`
- `src/Registration/TutorHubRepository.php`

### `src/Media/TutorProfileImageService.php` 는 둘이 같이 고친다

| 누가 | 줄 (main 171dd476 기준) | 내용 |
|---|---|---|
| **285** | **46-68** | 확장자 정하기(46-49), 저장(60-66), 검사(68) → 순서 바꾸기 + 실패 시 지우기 |
| **276** | **71-72** | 만들 WebP 목록(`$dests`)에 `_basic_360.webp` 추가 |
| **276** | **88-90** | DB INSERT에 `basic_360_path`·`basic_720_path` 넣기 (기본 이미지·표시용) |

- 285는 **71-72줄 `$dests` 목록과 88-90줄 INSERT 문을 고치지 않는다.** 글자 하나도 바꾸지 않는다.
- 실패 시 지우기를 위해 try/catch로 감쌀 때, 71-90줄을 들여쓰기만 바꿔도 276과 **merge 충돌이 난다.** 그래서:
  - 71-90줄은 **들여쓰기도 바꾸지 않는다.** 감싸야 하면, 실패 시 지우는 코드를 따로 작은 함수(예: `cleanupFailedUpload(string $relDir, string $token)`)로 만들고, `writeVariants` 호출 한 줄과 그 뒤 처리를 최소로 감싼다.
  - 그래도 71-90줄을 건드려야 한다면 **멈추고 보고.**
- `PromoImageService.php`는 276이 건드리지 않는다(276 지시서 44행 표 기준). 그래도 시작 전에 `git diff origin/main origin/cursor/276-card-photo-logo-20261022 --stat`(브랜치가 있으면)로 확인하고, 겹치는 파일이 위 표 밖에 있으면 보고.
- 먼저 merge되는 쪽 뒤에, 나중 쪽은 rebase가 필요할 수 있다. **충돌이 나면 고치지 말고 보고**(force-push 금지).

---

## 7. 점검

### 7-1. 로컬 (/tmp/s114)

1. 공부방 홍보사진 올리기(새 테스트 공부방 계정): jpg, png, webp 각 1장 → 지금처럼 저장되고 화면에 보인다. 파일 이름 모양·WebP 종류·DB 행이 바꾸기 전과 같은지 비교.
2. 과외쌤 프로필사진 올리기: 같은 확인.
3. 거절되고 **파일이 하나도 안 남는지**(폴더를 올리기 전·후로 `ls` 비교):
   - 글자 파일을 `photo.jpg`로 이름만 바꿔 올리기 → 거절
   - PHP 코드 파일 `x.php`, 그리고 `x.php`를 `x.jpg`로 바꾼 것 → 거절
   - 진짜 jpg인데 이름이 `x.php`인 파일 → 통과한다면 저장 이름이 `_orig.jpg`여야 함(`.php` 파일이 생기면 실패)
   - 긴 변 12001px 사진, 40M 픽셀 넘는 사진 → 거절("사진이 너무 커요…")
4. 예전에 올라가 있던 사진(공부방·과외쌤)이 그대로 보인다.
5. 로컬 Apache가 있으면 `public/uploads/` 안에 테스트용 `t.php`를 손으로 두고 열어 본다 → 실행되면 안 됨(403 또는 글자만). 확인 뒤 지운다. 로컬이 Apache가 아니면 "로컬 확인 못함"이라고 적는다.
6. `/api/health/db.php` → 404.

### 7-2. CI (브랜치 push 뒤)

- **Verify bundle** 전부 초록
- **Board ACL gate** 초록
- 그 밖에 이 push로 돈 점검도 모두 초록. 빨강이 있으면 고치기 전에 원인 보고(이 지시서 때문이 아니면 손대지 말고 보고).

### 7-3. 배포 뒤 라이브 (종현이 merge·배포한 다음, GET만)

- `https://study114.net/api/health/db.php` → **404**
- `https://study114.net/api/health/room-account.php` → 404
- `/uploads/` 아래 기존 사진 주소 하나(예: 공개 마이샵에 보이는 사진) → **200**, 사진이 보임
- 공개 마이샵·카드 사진이 그대로 보임
- 사이트 전체가 500이 나면 바로 보고(`.htaccess` 문제 가능성).

---

## 8. 합격 기준

- 위 1~3만 바뀌었고, 4번 표 밖의 파일 변경 없음
- 7번 점검 모두 통과, CI 모두 초록
- 276 줄(71-72, 88-90) 그대로

## 9. push

- 브랜치 `cursor/285-security-upload-order-20261022` 에만 push
- **merge 금지, force-push 금지**
- 보고: 바꾼 파일과 줄, 지운 파일 목록(이유), 문서에 남은 이름 목록, 점검 결과, 276과의 충돌 예상 여부

**범위 밖이 필요하면 멈추고 보고.**
