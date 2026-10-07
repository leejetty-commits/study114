# CHANGELOG-final · vs guide-redesign-static-v1.1

기준: `guide-redesign-static-v1.1` (카피·IA 유지) → **데스크톱 전용 최종 패키지**로 재포장.

## 변경

| 변경 | 이유 |
|------|------|
| 상태 배너 → `정적 디자인 시안 · 운영 아님 · 최종 승인 아님` | 「최종 승인/v1.0 아님」어색한 이중 부정·버전 혼선 제거. 운영 승인 오해 방지. |
| 폴더 구조 `html/` · `css/` · `assets/` · `shots-desktop/` | 보드/스타일/자산/샷 분리 · 상대경로 `../css/`·`../assets/` |
| 샷: @1440 ×5만 (`01-hub`…`05-safe`). `*-390*` 제외 | 데스크톱 전용 패키지 범위 |
| 문서: `COPY-final` · `NOTES-final` · `CHANGELOG-final` · `README` · `css/README` | 모바일 캡처/체크리스트 서술 제거 · 필수 답변 고정 |
| CSS 주석·`css/README` 섹션 맵 | tokens / layout / components 가독성 |
| `index.html` 데스크톱 갤러리 문구 | 모바일 샷 링크·서술 제거 |
| footer 표기 `데스크톱 패키지` | v1.1 승인 뉘앙스 완화 |

## 유지 (의도적 무변경)

- v1.1 카피 결정: 문안A, 궁금해요, (선택) 유료상품, 로그인 후 쪽지, 안전 배너(거래 회피)
- IA·라우트·5메뉴·역할 분리·GNB·일러스트 SVG
- Primary `#266BC4` · Pretendard · 노브라켓 · Type B 셸
- `guide.css` + `board.css` + `tokens.css` 파일 단위 유지 (분할 없음)

## 제외

- `*-390.png` 및 모바일 캡처 스크립트/서술
- v1.1의 모바일 밀도 체크 에세이·모바일 갤러리 강조
