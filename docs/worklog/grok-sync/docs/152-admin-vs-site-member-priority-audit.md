# 152 — Admin UI vs current product · member priority · deletion cascade audit

**Repo:** `leejetty-commits/study114` only (main)  
**Date:** 2026-09-25 (KST)  
**Scope:** read-only code audit — no code changes, no push, no deploy  
**Priority focus:** 회원/계정 관리 + 테스트 회원 삭제 시 연관 데이터(고아) 영향

---

## 0. Executive answer (delete impact)

| Question | Answer |
|----------|--------|
| Does admin “delete member / 탈퇴 처리” cleanly remove related cards & orphans? | **No — partial only** |
| Soft vs hard? | **Soft withdraw** on `users` (`status=withdrawn`, `deleted_at`, email tombstone, OAuth unlink, token invalidate) |
| Cascades study-room / tutor / student registrations? | **No** — rows stay; published rooms/tutors/students can still appear on guest home/search |
| Hard `DELETE FROM users`? | **Not implemented** in admin. Would **CASCADE** messages/favorites/views/payments/… but **RESTRICT-block** on `study_rooms`, `tutors`, `students`, `user_profiles`, `user_roles` |
| Owner hub registration delete? | Soft only (rooms/students stronger; **tutor delete weaker**) |

**Bottom line for test/dummy members:** admin 탈퇴 alone does **not** remove home cards. You need an explicit profile soft-hide/delete pass (or a new admin cascade) after withdraw.

---

## 1. Admin menus / screens (code inventory)

**Source of truth:** `preview/home-ui/src/admin/a28-copy.js` → `A28_MENU`  
**Router:** `preview/home-ui/src/admin/router.js` (`#/admin/*`)  
**Shell:** Youngcart-style sidebar — `shell.js`  
**Screen switch:** `a28-screens.js` `renderA28Screen()`

Legacy redirects: `#/admin/notices` → `/admin/notices/channels`, `#/admin/settings` → `/admin/settings/basic`.

| Group | Label | Route | Purpose | Backend maturity |
|-------|-------|-------|---------|------------------|
| — | 운영 홈 | `#/admin` | Hub + shortcuts | UI |
| 홍보 런치 | 홍보 런치 데스크 | `#/admin/promo` | Promo landing URL / share / banner status | Mostly UI/link hub |
| 환경설정 | 사이트 기본 | `#/admin/settings/basic` | Service name, contact, maintenance, guest banner | `site-settings-store` (local + ops) · **masterOnly** |
| 환경설정 | 가입·등록 | `#/admin/settings/join` | Signup/register intake toggles, banned emails | local store · **masterOnly** |
| 환경설정 | 운영 알림 | `#/admin/settings/notify` | Email notify on report/ticket/new provider | local store · **masterOnly** |
| 환경설정 | 팝업 관리 | `#/admin/settings/popups` | Home popups CRUD + preview | **Live** `/api/admin/home-popups.php` (Phase4) · **masterOnly** |
| 환경설정 | 약관·개인정보 | `#/admin/settings/legal` | Terms / privacy copy | local/legal store · **masterOnly** |
| 환경설정 | 권한·계정 | `#/admin/permissions` | Operator accounts (not public signup) | **Live** `/api/admin/operators.php` · **masterOnly** |
| 회원관리 | 회원 목록 | `#/admin/members` | Search, status chips, block/restore/withdraw, detail | **Live** `/api/admin/members.php` |
| 게시판관리 | 게시판 채널 | `#/admin/notices/channels` | Board channel ACL / routing | **Live** `/api/admin/content/channels.php` |
| 게시판관리 | 우측 배너 | `#/admin/notices/rails` | Right-rail slots | **Live** `/api/admin/content/right-rails.php` |
| 게시판관리 | 공지사항 | `#/admin/notices/posts` | Site notices | Board/support API + session fallback |
| 게시판관리 | 자주 묻는 질문 | `#/admin/notices/faq` | FAQ CMS | operational board / support path |
| 게시판관리 | 안전과외 가이드 | `#/admin/notices/guide` | Guide CMS (legacy label; product “이용안내” evolved) | operational board path |
| 마켓·결제 | 마켓 현황 | `#/admin/market/overview` | Payments/inquiries/reviews snapshot | **Lab** (`marketplace-lab-store`) |
| 마켓·결제 | 공부방·과외 목록 | `#/admin/market/listings` | Listing browser → exposure | **Lab** |
| 마켓·결제 | 결제·주문 | `#/admin/commerce` | Subscriptions / ticket packs / corrections | **Live** `/api/admin/commerce.php` |
| 마켓·결제 | 노출 보정 | `#/admin/exposure` | Hide/publish/inquiry_status for room/tutor/submission | **Live** `/api/admin/exposure.php` |
| 마켓·결제 | 매출·순위 | `#/admin/market/stats` | Revenue / rank | **Lab** |
| 마켓·결제 | 이용 후기 | `#/admin/market/reviews` | Review publish/hide | **Lab** |
| 마켓·결제 | 미완료 결제 | `#/admin/market/incomplete` | Incomplete orders | **Lab** |
| 고객응대 | 신고 처리 | `#/admin/reports` | Report workflow | **Live** `/api/admin/reports.php` (+ seed fallback) |
| 고객응대 | 문의 | `#/admin/tickets` | Support tickets + admin reply | support API / sessionStorage fallback (`ticket-store.js`) |
| 고객응대 | 제출자료 확인 | `#/admin/submission-docs` | Submission queue expose/hide | **Live** `/api/admin/submission-queue.php` |
| 부가서비스 | 홈 / PG / SMS / 본인인증 | `#/admin/addons`… | Vendor contact hub | Static/lab (pre-integration) |
| 알림·문자 | 기본설정~전송내역 | `#/admin/notify/*` | SMS templates/phones/preview send | **Lab** (`sms-lab-store`, no real send) |
| — | 운영 로그 | `#/admin/logs` | Immutable ops log view | **Live** `/api/admin/operation-logs.php` |

**PHP admin API surface (`public/api/admin/`):**  
`session.php`, `members.php`, `operators.php`, `exposure.php`, `commerce.php`, `reports.php`, `submission-queue.php`, `operation-logs.php`, `home-popups.php`, `content/channels.php`, `content/right-rails.php`, `content/migrate.php`.

---

## 2. Match vs current product (guest home / regs / memo / popups / guide / plans)

**Current product GNB** (`preview/shared/site-nav-config.js`):  
홈 · 공부방찾기 · 과외쌤찾기 · 학생찾기 · 공부방상세정보 · 과외쌤상세등록 · 유료상품 · 커뮤니티 · 고객센터  
Util: 이용안내 · 쪽지·후기함 · 최근열람 · 마이페이지 · (게스트: 로그인/회원가입)

| Product area | Admin coverage today | Gap |
|--------------|----------------------|-----|
| Guest home cards / map / region-stats | Indirect via **노출 보정** + search filters; no “home card QA” screen | No bulk purge of dummy published cards; no join on `users.status` |
| Study-room / tutor / student registrations | Exposure list + market lab listings; **no dedicated student admin list** | Student requests only via exposure/submission paths; no member→registrations cascade UI |
| 쪽지·후기함 (messages/reviews) | Commerce lab reviews; no message-thread admin | Orphan threads after soft-withdraw if not hard-deleted |
| Home popups (audience: guest/room/tutor/student) | **Aligned** — `#/admin/settings/popups` + live API | Audience JSON not FK to users — withdraw does not affect popup rows |
| 이용안내 / 고객센터 | Notices FAQ/guide + tickets | Menu label still “안전과외 가이드”; product copy moved to 이용안내/CS (docs 142–148) |
| 유료상품 / plans | `commerce` live + market lab | Lab stats/reviews/incomplete not wired to ROI tables |
| 마이페이지 memo settings | Not admin-managed (owner hub) | Admin cannot bulk-reset memo prefs for test users |
| SMS / PG / identity | Addon + notify labs | Intentional pre-integration stubs — **stale as “ops tools” if mistaken for live** |

**Stale / early-admin smell:** Youngcart-shaped IA (환경설정→회원→게시판→마켓→부가→SMS Lab) still dominant; several screens are **preview labs** while product has real rooms/tutors/students/home/plans. Highest mismatch for operators cleaning test data: **회원 탈퇴 ≠ 카드 제거**.

---

## 3. Member-related admin (list / filters / delete semantics)

### Screens
- **Primary:** `#/admin/members` — `renderMembers()` / `a28-screens-bind.js` members block  
- **Related (not account delete):** `#/admin/exposure` (profile hide/publish), `#/admin/commerce` (paid snapshot), `#/admin/permissions` (operators only), `#/admin/notify/sync` (lab phone sync from members)

### Listing (`AdminMemberRepository::listMembers`)
- Filters: `q` (email / real_name / phone / exact id), `status` (`all|active|pending|blocked|withdrawn`), `role_type` (active `user_roles`), `limit` (1–200, default 50)
- Status chips with counts (`countByStatus`)
- Columns: id, name/email, phone, primary role, status, paid tier, OAuth, last login; detail drawer shows roles, OAuth, paid positions/tickets/orders, profile counts (study_room / tutor / student)
- Bulk: **block / restore only** (max 50); **withdraw is single-user + master-only**

### Soft vs hard
| Action | Who | Effect |
|--------|-----|--------|
| `block` | admin | `users.status=blocked` |
| `restore` | admin | → `active` (not from withdrawn) |
| `withdraw` | **master only** | `status=withdrawn`, `deleted_at=NOW()`, `AccountWithdrawService::releaseLoginIdentifiers` (email → `withdrawn.{id}.{rand}@users.study114.local`, delete `user_oauth_accounts`, invalidate tokens) |
| Self-service withdraw | user | Same soft path via `AccountWithdrawService::withdraw` + confirm text `탈퇴합니다` |
| Hard row delete | — | **Not exposed** |

There is **no** admin UI to soft-delete or hard-delete child `study_rooms` / `tutors` / `students` from the member drawer (counts are display-only).

---

## 4. Deletion cascade impact (detail)

### 4.1 Admin / self withdraw (what actually runs)

```
PATCH /api/admin/members.php
  action=withdraw
  → AdminMemberService::applyAction
    → UPDATE users SET status='withdrawn', deleted_at=...
    → AccountWithdrawService::releaseLoginIdentifiers
    → admin_operation_logs insert (account_withdraw)
```

**Does not run:** softDelete on rooms/tutors/students; hide profiles; clear favorites pointing *at* those targets; message thread cleanup; payment archival; support_tickets by email; home_popups.

### 4.2 Registration soft-delete (owner hubs — separate from member withdraw)

| Entity | Service | SQL effect | Search visibility after |
|--------|---------|------------|-------------------------|
| Student | `StudentHubService` `delete` | `exposure_status='deleted'`, `deleted_at=NOW()` | Excluded (`exposure_status=published` AND `deleted_at IS NULL`) |
| Study room | `StudyRoomHubService` `delete` | `deleted_at=NOW()`, `profile_status='hidden'` | Excluded (`profile_status <> 'hidden'` AND `deleted_at IS NULL`) |
| Tutor | `TutorHubService` `delete` | **`profile_status='hidden'` only** | Excluded by `profile_status <> 'hidden'`; **no `deleted_at` on tutors**; weaker than room/student |

`hide` ≠ `delete`: hide sets hidden/published flags without deleted_at (students/rooms).

Admin **노출 보정** (`AdminExposureService`) can hide/publish room/tutor/submission but does not set room `deleted_at` / student deleted status the same way as hub delete.

### 4.3 FK map (hard DELETE users — hypothetical)

**ON DELETE CASCADE (would wipe if hard-deleted):**  
`user_favorites`, `user_compare_items`, `user_recent_views`, `user_recommendations`, message threads/messages/reads/participant_state, `provider_entitlements`, ticket packs, position subscriptions, payment orders, request unlocks, provider reviews (author paths), reminders, etc.  
`provider_profile_views.viewer_user_id` → **ON DELETE SET NULL**.

**NO ACTION / RESTRICT (would block hard delete):**  
`study_rooms.user_id`, `tutors.user_id`, `students.guardian_user_id`, `user_profiles.user_id`, `user_roles.user_id`.

**No user FK:** `home_popups` (audience string only), most board content, support_tickets (email-keyed, not user_id).

### 4.4 Orphan / visibility gap matrix (after soft withdraw)

| Related data | Cleaned by soft withdraw? | Notes |
|--------------|---------------------------|-------|
| Login email / OAuth / sessions | **Yes** | Tombstone + unlink + tokens |
| `user_roles` / `user_profiles` | **No** | Rows remain |
| `study_rooms` (incl. images/regions/facilities children) | **No** | Still searchable if not hidden/deleted |
| `tutors` (+ subjects/regions/images) | **No** | Same |
| `students` (+ subjects) | **No** | Same if still `published` |
| Messages / threads | **No** (soft) | Would CASCADE only on hard delete |
| Favorites / recent views / recommendations (as actor) | **No** (soft) | CASCADE on hard delete; **targets** of others’ favorites remain |
| Provider profile views / ROI counters | **No** | Views rows may SET NULL viewer; lifetime counters on profiles stay |
| Reviews authored / about provider | **No** (soft) | Author CASCADE on hard delete; target profile reviews orphan visually |
| Paid orders / tickets / positions | **No** (soft) | CASCADE on hard delete |
| Support tickets | **No** | Email-based; may still list old tickets |
| Home popup audience | N/A | Not per-user |
| Inquiry status on profiles | **No** | Unchanged |

**Search gap:** `SearchService` filters profile/deleted flags only — **does not join `users.status`**. Withdrawn owners’ published cards remain on guest home / find.

### 4.5 Hard delete without prep
Attempting `DELETE FROM users` with live rooms/tutors/students → **FK error (blocked)**. Cascading child tables first would be required; admin has no such procedure.

---

## 5. Prioritized backlog (회원 first)

### P0 — Member purge / test-dummy cleanup (do first)

1. **Withdraw cascade (or explicit “탈퇴 + 등록 숨김”)**  
   - Extend `AdminMemberService::applyAction(withdraw)` (or new `purge_profiles` action) to soft-hide/delete all owned `study_rooms` / `tutors` / `students` (reuse hub repository softDelete semantics).  
   - Files: `src/Admin/AdminMemberService.php`, `src/Registration/*HubRepository.php`, `public/api/admin/members.php`, member detail UI in `a28-screens.js` / bind (confirm copy: “카드도 목록에서 빠집니다”).

2. **Search / public read: exclude withdrawn owners**  
   - Add `EXISTS`/`JOIN users u … u.status NOT IN ('withdrawn','blocked')` (policy choice) on room/tutor/student search and public shop detail.  
   - Files: `src/Search/SearchService.php`, `StudyRoomPublicReadService.php` (+ tutor/student public readers if any).

3. **Tutor softDelete parity**  
   - Align `TutorHubRepository::softDelete` with rooms (add `deleted_at` column migration + set it; keep `profile_status=hidden`).  
   - Files: new `sql/schema/0xx_tutor_deleted_at.sql`, `TutorHubRepository.php`, SearchService tutor `deleted_at IS NULL` if column exists.

4. **Admin member drawer: linked registrations + one-click hide**  
   - Show room/tutor/student IDs with links to exposure actions; avoid silent orphan counts.  
   - Files: `AdminMemberRepository`/`Service` detail payload, `a28-screens.js` member drawer, optionally reuse `exposure.php`.

5. **Ops runbook for existing test members** (no code): query list of `status=withdrawn` still owning `profile_status<>'hidden'` / `exposure_status='published'` rows; batch hide via exposure API or SQL allowlist.

### P1 — Restructure admin to match product

6. Collapse / label **Lab** menus (`market/*` except commerce+exposure, entire `notify/*`, addons) as “미리보기·미연동” so ops don’t treat them as live.  
7. Rename/route **안전과외 가이드** admin to match product **이용안내**; keep FAQ under 고객센터 IA (align with docs 142–148).  
8. Add **학생 등록 목록** admin view (naming lock 2026-09-25: not 「의뢰」; basic cards = 베이직카드) (filter exposure_status, guardian, region) — currently under-served vs room/tutor exposure.  
9. Tickets: ensure production path always uses DB + `068` reply columns (not sessionStorage) in admin.

### P2 — Later / hygiene

10. Optional hard-purge tool (master-only): ordered child soft-delete → optional anonymize → never silent hard delete without checklist.  
11. Wire market reviews/stats labs to `provider_reviews` / ROI tables or remove from sidebar.  
12. Message-thread admin for abuse (reports already exist).  
13. Favorites/wishlist target cleanup when target soft-deleted (filter at read time).  
14. `support_tickets` orphan policy on withdraw (close + redact email).

---

## 6. Top 5 actionable items (for planner)

1. **Treat admin 탈퇴 as login kill only** — do not use it alone to clear dummy home cards.  
2. **Implement P0 withdraw→profile soft-hide cascade** (`AdminMemberService` + hub repos).  
3. **Patch SearchService** to ignore withdrawn/blocked owners so guest home stops showing ghost cards even before cascade backfill.  
4. **Fix tutor softDelete** (`deleted_at` parity).  
5. **Add member-drawer registration actions** + one-time SQL/API cleanup for existing test users.

---

## 7. Key file index

| Area | Paths |
|------|-------|
| Menu / copy | `preview/home-ui/src/admin/a28-copy.js`, `router.js`, `shell.js` |
| Screens | `a28-screens.js`, `a28-screens-bind.js`, `a28-screens-labs.js` |
| Member API | `public/api/admin/members.php`, `src/Admin/AdminMemberService.php`, `AdminMemberRepository.php` |
| Withdraw | `src/Auth/AccountWithdrawService.php` |
| Reg soft-delete | `src/Registration/{Student,StudyRoom,Tutor}Hub{Service,Repository}.php` |
| Exposure | `public/api/admin/exposure.php`, `AdminExposureService.php` |
| Search | `src/Search/SearchService.php` |
| Schema | `sql/schema/001_init.sql`, `008_tutors.sql`, `014/015_messages.sql`, `rest-schema.sql`, `069_home_popups.sql` |
| Product nav | `preview/shared/site-nav-config.js` |
| Policy SSOT | `docs/ssot/28-admin-console-red-line.md` |

---

## 8. Out of scope / not done

- No code changes, commits, push, or deploy  
- No live DB queries against dothome (schema from repo + `sql/verify/schema_audit_output.txt`)  
- Other GitHub `study114` forks not inspected
