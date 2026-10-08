# 194 · Cursor — 고객센터 FAQ 분류 탭 (약관·정책과 같은 방식)

- 작성: 2026-09-29 · 우동공과2
- 근거: 종현 — FAQ를 약관·정책처럼 분류 탭으로. 탭 잠금 5개.
- 선행: **192·193 수락 후** 착수 (지금은 지시문만). 그다음 178.
- push · build:dothome · Notion · commit **금지**

## 탭 잠금 (화면 문구 그대로)

1. 가입·로그인  
2. 등록·카드  
3. 검색·쪽지  
4. 결제·상품  
5. 안전·신고  

## Must

1. `#/support/faq`에 약관·정책과 **같은 톤의 탭 UI** (`tab-pill` 패턴 재사용 권장).
2. 탭마다 FAQ 목록이 바뀜. 한 질문에 탭 하나(중복 배치 지양). 기존 FAQ를 위 5분류에 **전부 배정**.
3. URL로 탭 유지: 예 `#/support/faq/join` 등 슬러그. 기본 `#/support/faq` → 첫 탭(가입·로그인).
4. 아코디언(Q 펼침) 동작 유지. 「더 없나요? → 운영문의」 팁 유지.
5. 손님·회원 모두 동일. 관리자 FAQ 편집 API가 있으면 분류 필드 최소 연동(없으면 시드/로컬 분류 맵으로).

## 슬러그 제안

| 탭 | slug |
|---|---|
| 가입·로그인 | `join` |
| 등록·카드 | `register` |
| 검색·쪽지 | `search` |
| 결제·상품 | `plans` |
| 안전·신고 | `safety` |

## Allowlist

- `preview/home-ui/src/support/screens.js`
- `preview/home-ui/src/support/router.js` · `nav.js` (경로만)
- FAQ 데이터/시드: `operational-board-store.js` 또는 FAQ 소스 파일
- 스타일: support/info CSS에서 `tab-pill` 재사용 최소

## Forbid

- 약관·정책 본문 수정 · 192 공개블록 · 193 좌측메뉴 · 대학
- commit / push / `build:dothome`

## 스모크

1. FAQ에 5탭 · 약관·정책과 비슷한 탭 모양
2. 탭 전환 시 목록 변경 · URL 반영 · 새로고침 유지
3. 기존 FAQ가 한 탭에라도 모두 보임(유실 0)
4. Q 펼침·운영문의 CTA 정상

## 커밋 예 (수락·배포 지시 후)

`feat(support): FAQ category tabs like policies`
로컬만.
