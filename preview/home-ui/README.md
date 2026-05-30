# 우동공과 · 메인 화면 UI 프리뷰 (9장)

SSOT: [docs/ssot/09-main-screen-roles.md](../../docs/ssot/09-main-screen-roles.md)

## 실행

```bash
cd preview/home-ui
npm install
npm run dev
```

**URL:** http://localhost:5174

## 화면 (4종)

| # | 화면 | URL | 설명 |
|---|------|-----|------|
| 1 | 비회원 | `#/guest` | 샘플 지역 데모 · 공부방 중심 |
| 2 | 학부모 | `#/parent` | 우리동네 공부방/과외쌤 전환 (기본 공부방) |
| 3 | 공부방 | `#/study-room` | 내 공부방 박스 + 리스트 + 지도 |
| 4 | 과외쌤 | `#/tutor` | 내 과외쌤 박스 + 리스트 + 학생 리스트 |

상단 툴바에서 화면·지역(단지/동) 전환.

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
