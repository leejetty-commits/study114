# 161 Member Card Hide Retire — ACCEPTANCE

- **Verdict:** ACCEPT
- **Date:** 2026-09-28 (KST)
- **Planner:** 종현
- **Machine:** ljh_work (`6aa2b772-d71e-4241-bcd4-3c985bf73991`)
- **Repo:** `D:\work\study114` · `git -c safe.directory=D:/work/study114`
- **Inspector:** PC files via Shell + box copy `/workspace/161-review/` (not Cursor report)
- **Ticket:** [161](161-member-card-hide-retire-ticket.md)
- **Next after deploy batch:** 163
- **Deploy note:** batch **150 + 151 + 161** ready for user 「배포」 (no push/commit this turn)

## Verdict summary

Uncommitted WIP on HEAD `5570243` retires member self-hide for study-room / tutor / student: list-tab `hidden` copy gone, `data-p19|p20|p21-hide` handlers gone, store `hide*` wrappers gone, Hub `hide` actions removed from `StudyRoomHubService` / `TutorHubService` / `StudentHubService`. Old `#/.../tab/hidden` redirects (study-room→hub/BASE, tutor→hub/BASE, student P19-01 legacy→마이프로필). Tutor exposure danger-zone keep soft-delete only; registration-check drops republish CTA and shows admin-only 비공개 copy when `profile_status === 'hidden'`. AdminExposure hide/publish, Search `hidden` filters, soft delete, and DB `hidden` enum path untouched. `format.js` unchanged (still used). No guide/support edits. 150+151 WIP hashes preserved. No push / no Notion.

## Claim vs actual

| Claim | Actual | Result |
| --- | --- | --- |
| HEAD `5570243` | `git rev-parse HEAD` = `55702430525bed6751b932e039f289be2eb53bb9` = `origin/main` | OK |
| no push / no commit | Branch `feat/student-mypage-a-g` tracks `origin/main` @ same SHA; 161 changes unstaged | OK |
| Allowlist: study-room-reg router/copy/screens/store (+format ok); tutor-reg router/copy/screens/store/registration-check-*; student-reg router/screens/store; lifecycle-copy; 3 HubServices | `git diff --stat` = those 17 files, **41/122**; `format.js` **no diff** | OK |
| Admin / Search / guide / support untouched | `git diff --name-only` for AdminExposure/Search/guide/support empty | OK |
| 150 WIP hashes | guest `be1191ba…` · naver `896fdf05…` | OK preserved |
| 151 WIP hashes | render `dcaad2e1…` · edit `a5d0c2f8…` · css `681b04c5…` | OK preserved |
| Box copy | `/workspace/161-review/` byte-copied from PC; SHA256 lifecycle `3bc5bbad…` · TutorHub `1b4925e0…` | OK |

Untracked pre-existing: `docs/046…`, `docs/047…`, `docs/README.md`, `teaser-*.js` — not 161.

## Must matrix

| # | Must | Result | Evidence |
| --- | --- | --- | --- |
| 1 | Member hide tabs / buttons / handlers / Hub hide gone | **PASS** | `P20_LIST_TABS` / `P21_LIST_TABS` drop `{ key:'hidden' }`. Titles P19-06/P20-06/P21-07 → `삭제`. Handlers `data-p19|p20|p21-hide` removed. `hideStudent` / `hideStudyRoom` / `hideTutor` removed from stores. Hub match arms drop `'hide'` + private `hide()` methods. Box copies: zero matches for hide helpers / hide data-attrs / `republishCta`. |
| 2 | `tab/hidden` redirects | **PASS** | Study-room `listTab==='hidden'` → `studyRoomHubPath` or `STUDY_ROOM_BASE` via `location.replace`. Tutor same → `tutorHubPath` / `TUTOR_REG_BASE`. Student `/tab/hidden` parses as P19-01 → `renderSingleProfileEntry` → `isStudentLegacyEntryPath` → `getParentStudentProfilePath()` (마이프로필). Routers still *parse* `hidden` so redirect can fire. |
| 3 | Exposure hide CTA gone | **PASS** | Tutor `renderExposure` danger-zone: title/lead `삭제` only; `data-p21-hide` button removed; soft-delete `data-p21-delete` kept. |
| 4 | Republish CTA none for members | **PASS** | Tutor RC: `republishCta` deleted from copy; `renderPublishActions` sets `publishBtn=''` when `profileStatus==='hidden'`; next row is static (`href:''`) with 「관리자가 비공개로 두었습니다…」. Study-room RC has no publish/republish CTA (checklist-only `nextAction`). |
| 5 | AdminExposure + Search hidden filters + soft delete kept | **PASS** | `AdminExposureService` still `hide`→`setProfileStatus(...,'hidden')` / `publish`. `SearchService` still `sr.profile_status <> 'hidden'` · `t.profile_status <> 'hidden'`; students `exposure_status = 'published'`. Hub `softDelete` retained on all three. No Admin/Search file diffs. |
| 6 | `format.js` ok if used | **PASS** | No WIP diff. Still imported by study-room `screens.js` for `profileStatusLabel` / exposure rows (reads `hidden` for visibility reasons only — not a self-hide CTA). |
| 7 | No guide/support edits | **PASS** | Diff name-only excludes guide/support. |
| 8 | Reject gate: Admin/Search touched **or** member can re-show | **PASS (not triggered)** | Admin/Search clean. When admin-hidden, tutor UI offers no publish/republish control; Hub member `hide` gone so member cannot self-hide then self-unhide via that path. |

## Scope / forbidden

| Forbidden | Result |
| --- | --- |
| Touch `AdminExposure*` / weaken admin hide·publish | **Clean** |
| Remove Search `hidden` filters | **Clean** |
| Drop DB `hidden` enum | **Not touched** |
| Retreat 153 withdraw→unlist | **Not touched** |
| Guide/support rework | **Clean** |
| push / `build:dothome` | **Not done** |

## Code quotes — tab/hidden redirect (study-room)

```js
if (route.listTab === 'hidden') {
  const dest = rooms.length ? studyRoomHubPath(rooms[0].id) : STUDY_ROOM_BASE;
  queueMicrotask(() => {
    const hashPath = stripHashQuery(window.location.hash.slice(1) || '');
    if (parseStudyRoomRegPath(hashPath)?.listTab === 'hidden') {
      window.location.replace(`#${dest}`);
    }
  });
}
```

## Code quotes — tutor exposure + RC no re-show

```js
// exposure danger-zone
<h3 class="p19-danger-zone__title">삭제</h3>
<p class="p19-danger-zone__lead">삭제는 복구 불가(soft delete)</p>
<button … data-p21-delete>삭제</button>
// (no data-p21-hide)

// registration-check-render
const publishBtn = hidden
  ? ''
  : `<div class="p19-form-actions…"><button … data-p21-publish …>공개하기</button></div>`;
```

```js
// registration-check-copy
publishHidden: '비공개 · 관리자 설정',
hidden: '관리자가 비공개로 두었습니다. 회원은 직접 다시 켤 수 없습니다',
summaryHidden: '관리자가 비공개로 두었습니다. 회원은 직접 다시 켤 수 없습니다.',
// republishCta removed
```

## Code quotes — Hub hide removed

```php
return match ($action) {
    'publish' => $this->publish(...),
    'delete'  => $this->delete(...),
    // 'hide' removed — StudyRoom / Tutor / Student HubServices
    default   => throw new InvalidArgumentException('action: publish | delete | …'),
};
```

## lifecycle-copy

Member badge label `hidden: '비공개'` (was `숨김`). Comment: admin UI label stays in AdminExposure·a28 copy (`숨김`). Guest home/search still never list `hidden` rows (Search filter).

## Leftovers (non-blocking)

- Routers / `get*ByTab` still type-accept `'hidden'` for redirect/count compatibility — no list tab UI.
- `data-p19-delete` / `data-p20-delete` handlers remain; study-room/student markup for those buttons was already absent on HEAD (tutor delete markup kept). Soft-delete policy unchanged.
- Ticket §2 일일결산 「오늘 노출 변경」 not in this WIP allowlist / parent Must — out of claimed coding scope; not used as reject.

## SHA256 (PC = box `/workspace/161-review/`)

| File | SHA256 | Bytes |
| --- | --- | --- |
| lifecycle-copy.js | `3bc5bbadcbaa39078ebf0f0899d8e48289a7d516de0cf05628afd96258aa34e3` | 4244 |
| student-reg/router.js | `89fb0ffc9cc9d22327baa04bbfd6b0800c14cd812308409fd0090d91643e4473` | 3594 |
| student-reg/screens.js | `fe87d1d3754129172252111473e202fe24deb89e04dc54d330391b8dfa379574` | 25407 |
| student-reg/store.js | `73ec07a28e48e6966b49cbfedfc655e9e6eac8c665b5d79c114eb008b1dac9df` | 12602 |
| study-room-reg/router.js | `be338a73825abec4f6ad6d9c76ea5afd12d0004ba28e689bdfd18775ef5a7de0` | 4323 |
| study-room-reg/screens.js | `fc5223881d71db8f73dff6ec601609d75a2ded3c34761e83308000f7d360fe10` | 33103 |
| study-room-reg/store.js | `23babcca75feb9e7c7590f8cc432d6fd1813a5897a2e5ce7d3da3a7470d43c96` | 8935 |
| study-room-reg-copy.js | `290bc3af24e0ff8a5afb11f4434808baa7cbe1a06529f69d4c93871c4b2ae7f6` | 5130 |
| study-room-reg/format.js (unchanged) | `474259ce3cdb1b0d68ad76e2dcf096b11f06a4178a5d71c85d3689a75cefc9f6` | 6915 |
| tutor registration-check-copy.js | `70c322468cd1e80fd0e650396df77870b95756736185397b10d97777f412e9e5` | 8856 |
| tutor registration-check-render.js | `14c366c2f00a7e201e2d52ac48d57d7e065d7156ad2efd003cc2f31544bed8ed` | 10543 |
| tutor-reg/router.js | `c5a08bd01633339615107663fac20dde1bed3d45410854431656a07a36f61878` | 4427 |
| tutor-reg/screens.js | `cfb7dbb3313e53433d15f5e9714e00b989b1f4d12a16ad505076ddc0178d63d8` | 32768 |
| tutor-reg/store.js | `3a032556e60a0e0fffe2fe01a4424ead713f8260828f30b776331df4d33b7d07` | 13476 |
| tutor-reg-copy.js | `103423b88b7b3dacca995cb27554b2a272e81f697bf46e81620a317bd01da910` | 1876 |
| StudentHubService.php | `f707d1b2ddfc32e6fa8c3aba34c717de529082d367274a65b6c27c52abdc040c` | 5875 |
| StudyRoomHubService.php | `c88aa439b3ccee6ecb6a9c9726fbcf2d9f775645b72e628fd59c52a3ead0b46e` | 2796 |
| TutorHubService.php | `1b4925e036cb00c5f536538409e9ae1f64aa8e10db03a4338416a1bd710882bf` | 4341 |

## Deploy / next

- **ACCEPT** → this file.
- Batch **150 + 151 + 161** ready when user says 「배포」.
- **Next ticket:** 163.
- No Notion write this turn.
