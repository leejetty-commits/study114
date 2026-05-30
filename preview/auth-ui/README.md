# 우동공과 · 인증/가입 UI 프리뷰

브라우저에서 바로 확인할 수 있는 반응형 인증/가입 화면 프리뷰 패키지입니다.

## 포함 화면

| 화면 | URL |
|------|-----|
| 로그인 | `#/login` |
| 회원가입 · 약관동의 | `#/signup/terms` |
| 회원 구분 선택 | `#/signup/role` |
| 공통 회원가입 폼 | `#/signup/form` |
| 회원가입 완료 | `#/signup/complete` |
| 아이디 찾기 | `#/find-id` |
| 비밀번호 찾기 | `#/find-password` |

## 테마 (스타일 2안)

상단 프리뷰 툴바에서 전환:

- **1안 · 안정형** — 오렌지 포인트, 부드러운 카드·그림자, 따뜻한 그라데이션 배경
- **2안 · 세련형** — 블루 포인트, 미니멀 보더, 넓은 여백, SaaS형 타이포

레이아웃 구조는 동일하고 CSS 변수·테마만 다릅니다.

## 로컬 실행

```bash
cd preview/auth-ui
npm install
npm run dev
```

브라우저: **http://localhost:5173**

## 빌드 (정적 배포용)

```bash
npm run build
npm run preview   # http://localhost:4173
```

## SSOT · 검증

- SSOT 2장: [docs/ssot/02-registration-and-member-db.md](../../docs/ssot/02-registration-and-member-db.md)
- 검증: [DOC-CHECKLIST.md](./DOC-CHECKLIST.md)

## 가입 플로우

```
로그인 ←→ 아이디/비밀번호 찾기
  ↓
약관동의 → 회원구분(학생·학부모 / 공부방 / 과외쌤) → 가입폼 → 가입완료
```

## 이후 확장

- `src/styles/base.css` — 공통 디자인 토큰
- `src/layout.js` — AuthShell 레이아웃 (역할별 홈 4종 확장 기반)
- PHP MVC 연동 시 `src/Views/auth/` + `public/assets/css/`로 이전 가능
