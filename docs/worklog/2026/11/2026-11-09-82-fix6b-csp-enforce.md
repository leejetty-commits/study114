# 2026-11-09 — 6순위 CSP Enforce (2단계)

## 지시

유튜브 우측 레일 스모크는 **보류**한 채 Enforce 진행 승인(「1 제외하고 2」·「ㅇㅋ」).

## 조치

| 항목 | 값 |
|------|-----|
| CF ruleset | `132970d7…` · rule `857266f3…` (ref 유지 `study114_csp_report_only`) |
| 헤더 | **`Content-Security-Policy`** (강제) · Report-Only **제거** |
| 정책 | Report-Only와 동일 허용 목록 (맵·다음·유튜브 frame 포함) |
| 유튜브 | 배너 전이라 실측 보류 → 배너 단 뒤 **재생 한 번** 확인 |

## 검증

```
curl -sI https://study114.net/
→ Content-Security-Policy: default-src 'self'; …
→ Content-Security-Policy-Report-Only 없음
```

## 승인자 확인

- 홈·지도·로그인·주소검색이 **안 깨지는지** (이제 위반은 진짜로 막힘)
- 저녁 유튜브 배너 후 임베드/재생

## 핫픽스 (같은 날 · Enforce 직후)

**증상:** 네이버 로그인 후 「지도에서 이 동네를 아직 찾지 못했어요…」  
**원인:** `connect-src`가 지오코딩 API `https://maps.apigw.ntruss.com` 을 차단 (CSP violation enforce).  
**조치:** CF CSP에 `maps.apigw.ntruss.com` · `*.apigw.ntruss.com` 추가, `nrbe.pstatic.net` 을 script-src에 추가.  
**재실측:** 브라우저에서 대치동 geocode status 200 · violation 0.  
**사용자:** 강력 새로고침(Ctrl+F5) 후 로그인 홈 지도 재확인.
