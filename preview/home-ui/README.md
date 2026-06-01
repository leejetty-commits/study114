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
| 2 | 학부모 | `#/parent` | 우리동네 공부방/과외쌤 전환 (기본 공부방) |
| 3 | 공부방 | `#/study-room` | 내 공부방 박스 + 리스트 + 지도 |
| 4 | 과외쌤 | `#/tutor` | 내 과외쌤 박스 + 리스트 + 학생 리스트 |

상단 툴바에서 화면 전환 · **비회원은 대치동 고정**(로그인 화면만 단지/동 전환).

## 구조 (공통)

```
상단 고정 3박스
중단 고정 5박스
하단 전체 리스트 (최근 등록순)
```

- 데스크톱: 우측 광고 슬롯
- 모바일: 인라인 광고

## 검증

[DOC-CHECKLIST.md](./DOC-CHECKLIST.md)
