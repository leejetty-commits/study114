# 332 우측 레일 YouTube 홍보 배너·제목 (2026-11-10 완료)

정본 요약. 상세 작업기록: `docs/worklog/2026/11/2026-11-10-332-yt-rail-promo-title.md`.

## 결과

- 홈·찾기 `full`+`sidebar` 레일 맨 위 study_room 슬롯 라이브.
- ID `op-Cudsweew`, 제목 `우동공과 공부방이 뭐에요?` (`공부방` 볼드).
- 브랜드: 기존 `udong-pin.png` + `logo-wordmark.png` 분리 (잠금 PNG 시도는 폐기).
- 팝업: 560 · titlebar `0.65rem` · 닫기 컴팩트 · 영상 둘레 흰 6px.
- main HEAD(당시): `918fac12`. CSP 스모크 0.

## 관련 PR

#136 ~ #144 (일반 merge). Deploy rerun 포함 최종 success.

## 다음과의 관계

- **334** 전역 로고 파일 교체와 별개. 332는 레일 홍보 제목 UI만.
- 배너 CSP 스모크는 332에서 반복 통과 → 보안 잔여는 **후속 B** · **unsafe-inline** 후순위.
