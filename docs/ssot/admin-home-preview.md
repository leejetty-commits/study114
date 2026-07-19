# 관리자 · 서비스 홈 미리보기

**범위:** `#/admin/home-preview` 검수용 seed만  
**금지:** 실사용자 가입 주소 · 역할 저장지역 · `GUEST_DEFAULT_REGIONS` 오염

## Seed (이번 라운드)

| 모드 | 기준지역 |
|------|----------|
| 공부방 | 1 대치1동(행정동) · 2 래미안대치팰리스1단지(단지) · 3 대치2동(행정동) |
| 과외쌤 | 1 서울시 · 2 남양주시 · 3 광명시 |
| 학생 | 서울시 1개 |
| 비로그인 | 공부방 슬롯 3 + 과외 시 3 + 학생 서울시 |

## 상태 키

- `sessionStorage` `study114.adminHomePreview.v1` 만 사용
- find 오버라이드: `adminPreviewActiveRegion` / `adminPreviewTutorRegions` (미리보기 find state에만)
