# 우동공과 · 메인 화면 UI 프리뷰 (9장)

SSOT: [docs/ssot/09-main-screen-roles.md](../../docs/ssot/09-main-screen-roles.md)

## 실행

```bash
cd preview/home-ui
npm install
npm run dev
```

**URL (외부 브라우저):** http://127.0.0.1:5174/#/guest

한 번에 서버 + 브라우저:

```bash
npm run start
```

## 브라우저에서 안 열릴 때

| 원인 | 해결 |
|------|------|
| **index.html 더블클릭** | 동작 안 함. 반드시 `npm run dev` 후 **http://127.0.0.1:5174/#/guest** |
| **서버 미실행** | 터미널에 `VITE ready`가 보여야 함. `npm run dev` 창을 닫지 말 것 |
| **Cursor 미리보기만 됨** | Cursor 안 Simple Browser ≠ Chrome. 주소창에 **127.0.0.1** 직접 입력 |
| **연결 거부** | 5174 사용 중인지 확인. `npm run dev` 재시작 |

## 화면 (4종)

| # | 화면 | URL | 설명 |
|---|------|-----|------|
| 1 | 비회원 | `#/guest` | **대치동** 고정 데모 · 공부방·과외 박스 + 학생 리스트 ([상세](./GUEST-REDESIGN.md)) |
| 2 | 학부모 | `#/parent` | **우리동네 공부방 / 우리동네 과외쌤** 2탭 · 지도(공부방) · 지역 피드 + 검색 |
| 3 | 공부방 | `#/study-room` | **우리동네 공부방**(내 노출) / **우리동네 학생** · GNB 검색과 목적 분리 |
| 4 | 과외쌤 | `#/tutor` | **우리동네 과외쌤**(활동 3지역·내 노출) / **우리동네 학생** · 경쟁 확인은 GNB 검색 |

상단 툴바에서 화면 전환 · **비회원은 대치동 고정**(로그인 화면만 단지/동 전환).

역할별 홈·검색 통합: [DOC-CHECKLIST.md §역할별 홈·검색](./DOC-CHECKLIST.md) · 모듈 `src/provider-home.js`

## 구조 (역할 홈 — 2026-07-07)

학부모·공부방·과외쌤 홈은 동일 패턴:

```
2탭 (목적형)
  → 지역 바 / 3지역 탭(과외)
  → [공부방만] 지도
  → 컴팩트 검색 (과외 홈 탭1은 생략)
  → Prime / Pick / Basic 피드 또는 검색 결과
```

구형 「상단 3박스 + 중단 5박스 + 하단 리스트」 단일 화면은 **공급자 홈에서 제거**됨. 비회원 `#/guest`는 기존 슬롯 그리드 유지.

- 데스크톱: 우측 광고 슬롯
- 모바일: 인라인 광고

## 검증

[DOC-CHECKLIST.md](./DOC-CHECKLIST.md)
