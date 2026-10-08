# KEEP / CHANGE / DELETE / FORBIDDEN — Mobile GNB A/B/C

## KEEP
| 요소 | 이유 | 회귀 확인 | 변경 금지 범위 |
|------|------|-----------|----------------|
| Primary `#266BC4` 및 stage5b tokens spirit | 5A/5B 연속성 | 샷·CSS 변수 | 색 재발명 금지 |
| Pretendard 폰트 파일 | UDX 타이포 | `@font-face` 로드 | 시스템 폰트 단독 대체 금지 |
| 기존 IA 라벨(홈·공부방찾기·과외쌤찾기·학생찾기·유료상품·커뮤니티·고객센터) | 정책 발명 금지 | 메뉴 문자열 | 신규 메뉴/역할 발명 금지 |
| Baseline FAIL 원본 샷 | 증거 보존 | `shots/baseline-fail/` 복사본 | 원본 gate-audit 삭제 금지 |
| 배지 PASS / Type B body PASS / Prime·Pick 샘플 / Basic free notice | 범위 밖 보존 | 미수정 | 본 팩에서 재작업 금지 |
| 상세 sticky CTA 패턴(존재) | C 충돌 관찰용 | `state=detail-cta` | CTA 숨김·수정 정책 발명 금지 |

## CHANGE (본 팩에서만)
| 대상 | 현재 문제 | 변경 범위 | 기대 | 완료 조건 |
|------|-----------|-----------|------|-----------|
| 모바일 GNB 셸 | h-scroll/clip FAIL | A/B/C 정적 방향 비교 HTML/CSS | 각 방향이 430/390/360에서 no h-scroll | `documentElement.scrollWidth <= clientWidth` · 샷 |
| 터치 타깃 | 일부 <44 위험 | 메뉴/닫기/탭 ≥44 | touch44_pass | computed JSON |
| C 상세+CTA | 하단 내비 충돌 미문서화 | 충돌을 RISK로 노출 | HOLD 기록, 정책 미발명 | `ctaClash=true` 측정 |

## DELETE
| 대상 | 이유 | 종속성 | 대체 |
|------|------|--------|------|
| 본 팩 내 임시 h-scroll GNB 패턴 | FAIL 재현을 정답처럼 제출하지 않음 | 없음(비교 팩 신규) | A/B/C 방향 |
| (없음) stage5b 원본 파일 | 원본 보존 | — | — |

## FORBIDDEN
| 금지 | 이유 | 허용되지 않는 부수 작업 |
|------|------|-------------------------|
| Stage 5B 완료 선언 | 지시 범위 | 게이트 전체 PASS 선언 |
| 디자인 매뉴얼 v1.0 / 최종 GNB 잠금 | 비교만 | IA 정책 잠금 |
| Notion / ops / GitHub / DB / API / Cursor 구현 | 범위 밖 | 배포·PR |
| 로그인·역할·메뉴 기능 정책 발명 | stress capacity만 | 신규 역할/피처 |
| 배지·Type B body·Prime/Pick·Basic free 재디자인 | 범위 밖 | 샘플 교체 |
| 이모지 아이콘 / 999px 텍스트 필 / 무거운 gradient·shadow | UDX-05 | — |
| CTA 숨김으로 C 충돌 “해결” 위장 | 위험 은폐 금지 | 수정 정책 발명 |
| 본 팩을 `stage5b-design-standard-v01`에 최종 병합 | 별도 비교 폴더 | — |
