# UDX-05 · 과거 실패 사례 및 재발 방지표

| # | 사례 | 재발 방지 규칙 |
|---|---|---|
| 1 | 검색 버튼 64px PASS 오판 | 정본 최소 72px ↔ computed 직접 대조 |
| 2 | 390 보고·clientWidth 불일치 | viewport·innerWidth·clientWidth·scrollWidth 동시 기록, 불일치 시 측정 무효 |
| 3 | ZIP 내부 자기해시 ≠ 최종 ZIP | 체크섬은 ZIP 밖, `<hash><2spaces><name>` |
| 4 | 모바일 GNB 가로스크롤·잘림을 임시 정상 | 해당 게이트 PASS 금지; scroll_disclosure≠PASS |
| 5 | Basic@768 1열을 전체 반응형 통과로 확대 | 폭별 열 수 개별 판정 |
| 6 | Prime@960 2열 vs 승인 3열 | 문서 ↔ grid-template-columns 대조 |
| 7 | Type B Pick 5열·가독성 FAIL | 열/폭 + 긴데이터·가격·overflow |
| 8 | 전후·구버전 ZIP 혼재 | 빌드 시점 명시·최신 정본만 |
| 9 | 2px 카드·overflow0 PASS | 최소폭·가시성 게이트 |
| 10 | 채팅 첨부 실패 후 다운로드 미확보 | 동일 바이트 PC 복사 |
