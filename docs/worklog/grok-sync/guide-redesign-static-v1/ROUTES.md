# 이용안내 리디자인 v1 · 라우트

## 정본 (공식 해시)

| 라벨 (고정) | 해시 | 시안 파일 |
|-------------|------|-----------|
| 이용안내 홈 | `#/guide` | `01-hub.html` |
| 찾기·첫 이용 | `#/guide/start` | `02-start.html` |
| 등록·공개 | `#/guide/register` | `03-register.html` |
| 비교·찜·쪽지 | `#/guide/compare` | `04-compare.html` |
| 안전이용 | `#/guide/safe` | `05-safe.html` |

GNB `이용안내` → `#/guide` (이름·구조 변경 없음)

## Alias (구주소 → 정본)

| 레거시 | → | 정본 |
|--------|---|------|
| `#/guide/getting-started` | → | `#/guide/start` |
| `#/guide/registration` | → | `#/guide/register` |
| `#/guide/saved-contact` | → | `#/guide/compare` |
| `#/guide/safety` | → | `#/guide/safe` |
| `#/guide/connect` *(제안 초안)* | → | `#/guide/compare` |

## 고객센터 연결 (가이드가 반복하지 않음)

| 용도 | 정본 |
|------|------|
| 고객센터 홈 | `#/support` |
| 운영문의 | `#/support/contact` |
| 안전과외 정책 | `#/support/policies/safety` |
| 신고·도움 | `#/support/policies/reporting` |

## Policy 리다이렉트

| 레거시 | → |
|--------|---|
| `#/policy/*` | `#/support/policies/*` |
| `#/policy/reporting` | `#/support/policies/reporting` |

가이드 CTA의 신고 링크는 **정본만** 사용.

## document.title

`이용안내 · {H1} | 우동공과`  
(전역「메인 화면 프리뷰」금지)
