# community-support visual refresh v2 — REPORT

작성일: 2026-09-17 (Asia/Seoul)  
대상: 우동공과 커뮤니티 + 고객센터 **정적 시안 팩 v2**

## 무엇을 만들었는가

`/workspace/study114-ds/community-support-visual-refresh/` (v1)을 기반으로, 코너 브라켓을 제거하고 **제품형 카드 문법**으로 다듬은 v2 정적 HTML/CSS 시안.

경로:

```
/workspace/study114-ds/community-support-visual-refresh-v2/
```

ZIP:

```
/workspace/study114-ds/community-support-visual-refresh-v2.zip
/workspace/study114-ds/community-support-visual-refresh-v2.zip.sha256
```

## 보드 (6 + index)

| 파일 | 역할 |
|------|------|
| `index.html` | 갤러리 · 6보드 링크 + 썸네일 |
| `c01-hub.html` | 커뮤니티 허브 · 4보드 축 |
| `c02-board-guest.html` | 게스트 로그인 벽 + 고스트 프리뷰 |
| `c05-solved.html` | 해결후기 · 문제→결과 카드 |
| `s01-home.html` | 고객센터 홈 · 기하 히어로 + 퀵링크 |
| `s02-faq.html` | FAQ · 검색/칩/아코디언 |
| `s05-policies-library.html` | 약관·정책 + 자료실 통합 문서 허브 |

캡처 (Playwright viewport width **1440**, full-page):

- `shots/c01-hub.png`
- `shots/c02-board-guest.png`
- `shots/c05-solved.png`
- `shots/s01-home.png`
- `shots/s02-faq.png`
- `shots/s05-policies-library.png`

공유 자산:

- `tokens.css` (v1 복사 · Primary `#266BC4`)
- `board.css` (셸 · GNB · Type B)
- `visual-v2.css` (**브라켓 없음**)
- `fonts/` Pretendard woff2
- `assets/` 모티프 SVG (v1 재사용)

문서:

- `REPORT.md` (본 파일)
- `CHANGELOG-v1-to-v2.md`
- `OPINION.md`

## 유지한 제품 방향 (v1에서 채택)

1. 커뮤니티 허브 → 보드 점프 전
2. 게스트 로그인 벽 = 일러스트 + 고스트 프리뷰
3. 해결후기 = 짧은 맥락 + 결과 카드
4. 고객센터 홈 = 짧은 카피 + 기하 히어로 (포토 슬랩 아님)
5. FAQ/문의/정책/자료 퀵엔트리 타일
6. 관리자 UI보다 약간 풍부한 밀도
7. GNB 라벨/순서 유지 (바디만)
8. 토큰·폰트·Type B 셸 (nav ~220 / body / rail ~300, shell 1280, gap 24, gutter 32)
9. 모든 페이지 disclaimer + `가상` 칩

## 비청구 (Non-claims)

- **운영 화면 아님** · GitHub/DB/배포 변경 없음
- **IA/라우트/기능/정책 문구 신설 없음** (법적 전문·새 약관 텍스트 미포함)
- **GNB 구조 재설계 아님**
- **최종 승인 / v1.0 아님**
- 데이터·카피·CTA는 **가상 시안**
- v1 폴더는 **수정하지 않음**

## 기술 메모

- FAQ 아코디언만 최소 JS (`s02-faq.html`)
- 캡처용 `.venv`는 ZIP에서 제외
