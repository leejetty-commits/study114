# 370 — 푸터 사업자정보 표기

**브랜치:** `work/370-footer-bizinfo`  
**워크트리:** `.wt/work-370-footer-bizinfo`  
**base:** `origin/main` (`8f0672d7`)

## 지시 원문 요지

- 회사정보 상수 1곳 → 전 SPA 푸터 동일 노출
- 링크 라벨: 이용약관 · 개인정보 처리방침(굵게)
- 고지: 통신판매중개자 한 문장으로 대체
- 데스크톱 `|` 흐름 2~3줄 · ≤959 자연 줄바꿈 · 12px
- 전화 빈값 숨김 · 호스팅 「닷홈」
- 확인: 홈 푸터 1280·390 · FTC 새 창
- 금지: 다른 레이아웃·잠금 파일·force push·main·PR

## 승인 (지시 확인)

1. 고지: 제안 문구로 기존 탐색·접촉 고지 대체
2. 호스팅: 「닷홈」. 운영사 상호는 확인 후 상수만 변경
3. 노션 스킵 · 370만 진행

## 구현

| 파일 | 내용 |
|------|------|
| `preview/shared/site-footer.js` | `SITE_FOOTER_COMPANY` · 고지·라벨 · 흐름 렌더 · FTC/mailto |
| `preview/home-ui/src/styles/udx-std-apply.css` | 회사정보 인라인 흐름·링크·≤959 |
| 호출부 | 변경 없음 — `renderSiteFooter` 기본값이 상수 사용 (admin 포함 기존 방식 유지) |

## 확인

- 캡처: `docs/worklog/2026/11/shots-370/home-footer-1280.png`, `home-footer-390.png`
- FTC: `target="_blank"` + `rel="noopener noreferrer"`

## 호스팅 운영사 상호

닷홈 메인 하단 실측 미확정 → **「닷홈」**만 표기. 확인되면 `SITE_FOOTER_COMPANY.hosting`만 수정.

## 370-보완1

1. 상호 괄호 앞 공백 제거
2. ≥960 `company-item` nowrap · ≤959 자연 줄바꿈
3. `layouts/auth.php` **사용 중** (`/auth/login|find-id|find-password`) → `SiteFooterCopy` + partial로 동일 문구 반영
4. tip hash를 실제 tip으로 갱신
5. 홈 푸터 1280·390 재캡처

## 커밋

- tip: (보완1 커밋 후 기입)
- 이전: `167231d9` docs · `87d34c51` 370 본문
- push: `167231d9`까지 완료 · 보완1 후 재push
