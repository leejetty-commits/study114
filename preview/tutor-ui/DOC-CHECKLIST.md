# 과외쌤 등록 UI — SSOT 8장 검증

**SSOT:** [docs/ssot/08-tutor-registration-db.md](../../docs/ssot/08-tutor-registration-db.md)

## 프리뷰

http://localhost:5177 · `cd preview/tutor-ui && npm install && npm run dev`

Dev 로그인: `tutor-owner1@dev.local` / `password`

## 6화면

| # | 화면 | 라우트 | 상태 |
|---|------|--------|------|
| 1 | 기본정보 | `#/register/basic` | ✅ |
| 2 | 활동지역 | `#/register/regions` | ✅ |
| 3 | 과목·가격 | `#/register/lesson` | ✅ |
| 4 | 학력·경력 | `#/register/career` | ✅ |
| 5 | 연락·사진 | `#/register/contact` | ✅ |
| 6 | 등록완료 | `#/register/complete` | ✅ |

## API

- `POST /api/tutor/register.php` — masters | load | save
- 단계별 저장 · `draft`/`pending` 프로필만 load

## 연동

- auth-ui 가입완료 CTA → localhost:5177
- home-ui 과외쌤 메인 → localhost:5174/#/tutor
