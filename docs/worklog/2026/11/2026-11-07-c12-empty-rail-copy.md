# C-12 · 빈 상태·우측 레일·「—」 과다 카피

> 작성 2026-11-07 · 브랜치 `c12-empty-rail-copy` · PR #89 · **머지·배포 완료**

## 지시서 원문

`study114-mode-sec-audit/cursor-handoff/C-12-빈상태-레일-카피.md`

## 커밋 (3건)

| 커밋 | 요약 |
|---|---|
| `ca86c04c` | 초기 7파일 수정 (빈상태·레일·카피·필드오류·배너) |
| `54088381` | 워크로그 |
| `8724572c` | 셀프검수 오류 수정 + 플레이스홀더→로고 통일 + 자카드 라벨 추가 |

## 수정 내역 (8파일)

| # | 항목 | 파일 | 변경 |
|---|---|---|---|
| 1 | 빈상태 CTA 맞춤 | empty-state-copy.js | wishlist body 개선 + CTA "최근 본 목록" (동작 일치). compare body 개선 + CTA "탐색하기" (ctaHref 일치) |
| 2 | 「지금 필요한 안내」 역할 짝 | right-rail.js | actionGuideCopy에 ctx 전달, navRole별 eyebrow/title (study_room→운영안내, tutor→활동안내, parent→탐색안내) |
| 3 | 카드 「—」 과다 | exposure-render.js | slotOptional / renderHcardSlotOptional 추가. 학생 카드 6필드·과외쌤 카드 3필드를 선택으로 변경 (빈이면 칸 숨김) |
| 4 | 고민방 레일 빈 문구 통일 | concern/copy.js | roomEmpty/hotEmpty/bestEmpty 간결화 |
| 5 | 프라임/픽 빈칸 카피 | exposure-rules.js | 학부모 빈칸에 방향 안내 body ("이 지역 … 전체 목록은 아래에서") |
| 6 | 필드별 오류 표시 | signup-account-contact.js | 휴대폰 필드 아래 data-phone-error 추가, 제출 시 초기화 포함 |
| 7 | 배너 링크 | home-marketing-banner.js | search_student CTA → 원복 (external + 절대URL). 검색SPA에서 홈SPA hash nav 불가 문제 해결 |
| 8 | 플레이스홀더→로고 통일 | exposure-render.js | 이미지 없을 때 이니셜 한 글자 대신 브랜드 로고 SVG 통일 |
| 9 | 자카드 식별 | exposure-render.js, search-visily.css | isOwnProviderCard → data-own-card 속성 + 「내 카드」 라벨. 프라임·픽·베이직 전 카드 적용. CSS expo-own-label 스타일 추가 |

## 셀프검수에서 발견·수정한 오류 (3건)

| 발견 | 문제 | 수정 |
|---|---|---|
| CTA "공부방·과외쌤 찾아보기" | mypage에서 버튼 동작은 "최근 본 목록 열기"인데 문구 불일치 | CTA를 "최근 본 목록"으로 원복 (body 개선은 유지) |
| CTA "찜 목록 보기" | ctaHref가 `#/parent`(홈)인데 문구 불일치 | CTA를 "탐색하기"로 원복 (body 개선은 유지) |
| 배너 hash nav | 검색SPA에서 `#/mypage/messages`는 다른 SPA 경로라 동작 불가 | `external: true` + 절대URL로 원복 |

## 자카드 첫번째 고정 정책

- 사용자가 "로그인하면 자기 카드를 첫번째에 두라"는 규칙 언급
- 노션(9장·11장·18장·정책결정기록·작업기록) + 그록봇 문서 + 코드 전체 조사 → **해당 규칙 미발견**
- 기존: `isOwnProviderCard`로 찜·비교·쪽지 차단만 구현됨, 정렬(pin-to-top) 로직 없음
- **사용자 결정 대기**: 정책으로 입안할지 추후 결정 예정

## 검수

- [x] 빌드 `npm run build:dothome` 성공
- [x] `npm run verify:shop-page` 71 pass / 0 fail
- [x] CI 전 체크 pass (8건)
- [x] CTA 문구-동작 일치 확인
- [x] 보호 필드 (선생님만 보기 등) 정상 표시 확인
- [x] 배너 cross-SPA 내비게이션 정상 동작 확인
- [x] PR #89 머지 → main `c5752158`
- [x] Deploy to dothome 성공
- [x] 사용자 승인 (배포 지시)
