# 5B 초안 — Exceptions / Unresolved

상태: **최종 승인 아님**. 보드가 따른 것과 미해결을 구분한다.

## 보드가 따른 결정 (브리프 기준)

1. **뱃지 반지름**: 상태/증빙/유료 = rounded rect **4px만** (`--r-badge-a`). **NO pill on badges**.
2. **Role Tab**: 구 `.mode-chip` → `.role-tab` (radius 6, h 32–36, px 12). selected = soft bg + role border; unselected = white + `--uds-line`.
3. **Filter chip**: radius 6 (`--r-chip`), min-height 32 (desktop), **mobile ≤768 touch min-height 44**, px 12, icon + `aria-pressed`. **999 pill FORBIDDEN** for text chips.
4. **텍스트 999 pill**: sitewide deprecate. `--r-pill` may remain **only** for toggle track / icon-only special.
5. **카드 「상세 보기」**: 카피 통일. Secondary lowered (white + primary text/border). Desktop h 40 / mobile 44. 페이지 대표 CTA(공부방찾기·구매하기 등)만 Primary fill.
6. **가격 공란**: 가격 영역 **숨김**. 「가격 문의」 등 대체 카피 **미발명**.
7. **역할 색**: Primary CTA는 역할과 무관하게 `#266BC4`. 역할은 soft/Role Tab/아이콘/선택선만.
8. **Paid**: 구매 맥락 아이보리 권장안을 B열로 제시. 공통 쿨 시스템과 병치.

## EXCEPTIONS — `--r-pill` 잔존 허용

| 허용 | 금지 |
|------|------|
| 토글 트랙 (on/off track) | Role Tab 라벨 |
| 아이콘 전용 컨트롤 (텍스트 없음) | Filter chip (텍스트) |
| | 상태/증빙/유료 뱃지 |

## 미해결 / 본 런에서 다루지 않음

| 항목 | 메모 |
|------|------|
| 가격 미입력 시 공개·노출·상태문구 | ops 정책 TBD |
| Notion UDX 문서 | 본 런에서 fetch하지 않음 |
| 모바일 GNB/햄버거/하단탭 | 5A와 동일 미확정 · 셸은 임시 가로 스크롤 |
| 로그인 게이트·쪽지 disabled 사유 카피 확정 | 예시 힌트만 |
| ops / GitHub / DB / API / routes / stage5a 팩 | **미수정** |
| plans-ui-v5 소스 | 읽기·ivory 토큰 참조만 |
| 금색·프로모 배지·Hot/SKY/1위 | 금지 유지 · 미도입 |

## 캡처 시 주의

- file:// 대신 로컬 `http.server`로 상대경로·폰트 로드.
- 모바일 CTA / 「상세 보기」 `min-height: 44px` (@max-width 768).
