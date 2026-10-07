# 102 · 101 배포 수락 — 과외쌤 로그인 홈 UI

- 작성일: 2026-09-25 (KST)
- 대상: [101](101-tutor-home-098-deploy-ticket.md) (=로컬 [098](098-tutor-home-login-ui-fix-ticket.md) · [100](100-tutor-home-login-ui-098-acceptance.md))
- 판정: **운영 수락**
- SHA: `0456459b66d312d4b459a96f7a0f98c84664e70c` (짧은 `0456459`)
- base: `353d616` → `0456459` on `origin/main`
- Actions: Deploy to dothome **#333** 성공. 로컬 `build:dothome` 미실행(허용)
- 쪽지 기본값: **받음**

---

## 1. Allowlist

커밋 파일 **6개만**:

- `preview/home-ui/src/home-marketing-banner.js`
- `preview/home-ui/src/screens/tutor.js`
- `preview/home-ui/src/provider-home.js`
- `preview/home-ui/src/exposure-render.js`
- `preview/search-ui/src/search-tier-render.js`
- `preview/search-ui/src/search-find-surface.js`

커밋 후 index 비움. C(provider-status · study-room-reg · location-display · ProviderUsage · teaser · .tmp · _verify · docs)는 **unstaged 유지** → 101 게이트 충족.

---

## 2. 스모크 (보고 · 로컬 프리뷰, 인천시 탭 연 상태)

| 항목 | 결과 |
|------|------|
| 히어로 | 2줄 · 둘째 「우리동네 교육플랫폼」 |
| 과외쌤 박스 | 쪽지 후기함 · 마이페이지 · 쪽지 받음 · 3개 미확인 · 조회→등록 |
| 활동형 | 없음 |
| 프라임 | 3칸 (실1+빈2) |
| 픽 | 샘플1+빈4 |
| 현재위치 | 서울시(대표) · 탭은 인천시 |
| 우리동네 학생 | 스냅샷 「서울시 학생」 · 검색폼 없음 |
| 게스트 | 히어로가 과외쌤 문구로 **안 바뀜** |
| 공부방 | 「동네 교육 플랫폼」제목 **유지**(과외만 분기) |

운영 로그인 창 직접 스모크는 보고에 없음 → **프리뷰+allowlist+Actions로 수락.** 운영에서 깨지면 별도 보완.

---

## 3. 잔여 dirty (이번 배치 밖)

101에 안 넣은 C는 **그대로 PC에 남음.** 별도 정리 대상(조회수 헬퍼 미연결 · 공부방등록 빈줄 · 좌표·ROI 조각 · teaser/tmp).

---

## 4. 결론

과외쌤 로그인 홈 UI가 `0456459` / 닷홈 #333으로 올라갔다. **101 닫음.**
