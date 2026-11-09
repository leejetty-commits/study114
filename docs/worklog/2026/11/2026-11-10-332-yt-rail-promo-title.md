# 2026-11-10 · 332 우측 레일 유튜브 홍보 배너·팝업 제목

## 지시 (요지)

- 홈/찾기 full+sidebar 레일에 YouTube 홍보 슬롯 추가 후, study_room 영상 ID·제목·로고·팝업 크롬을 반복 조정.
- 최종: 분리 심벌+워드마크, 제목 `우동공과 공부방이 뭐에요?`(`공부방` 볼드), 따옴표 없음, 팝업 titlebar 세로 여백 확대.
- 운영 `#/guest` 확인 · CSP 위반 0 · 일반 merge · force push 금지.

## 최종 상태 (main `918fac12`)

| 항목 | 값 |
|------|-----|
| 영상 ID | `op-Cudsweew` |
| title (iframe/aria) | `우동공과 공부방이 뭐에요?` |
| UI 브랜드 | `/assets/brand/src/udong-pin.png` + `/assets/brand/logo-wordmark.png` (0.95em / 1.125em) |
| 배너 | 슬롯 외곽선·패딩 없음, 제목 가운데, `공부방` bold |
| 팝업 | 560폭, titlebar padding `0.65rem`, 닫기 1.5rem, 패널 흰 여백 6px(좌·우·아래) |
| 주요 파일 | `promo-video-config.js` · `right-rail.js` · `home-right-rail.css` |

## PR·머지·Deploy

| PR | 머지 | 요지 | Deploy |
|----|------|------|--------|
| #136 | `d19adf98` | 레일 슬롯+영상 ID | 1차 secret 문서 문구로 실패 → `fe164cd0` sanitize 후 dispatch 성공 |
| #137 | `e862f131` | 제목 `우동공과가 뭐에요?` | [42660064203](https://github.com/leejetty-commits/study114/actions/runs/42660064203) success |
| #138 | `a1b8695a` | 워드마크·팝업 크롬 1차 | [42662376687](https://github.com/leejetty-commits/study114/actions/runs/42662376687) success |
| #139 | `e2f82e9a` | 심벌+간격·닫기 축소·배너 외곽 제거 | [42664887943](https://github.com/leejetty-commits/study114/actions/runs/42664887943) success |
| #140 | `649292c4` | titlebar 0.25→0.4rem | [42666370657](https://github.com/leejetty-commits/study114/actions/runs/42666370657) success |
| #141 | `4eaddd57` | 잠금 PNG 시도 + 문구·볼드 | [42667464453](https://github.com/leejetty-commits/study114/actions/runs/42667464453) success |
| #142 | `1a196214` | 잠금 크기 보정(실패 체감) | [42668857225](https://github.com/leejetty-commits/study114/actions/runs/42668857225) success |
| #143 | `7d351371` | **잠금 폐기**, 분리 로고 복구(문구·볼드 유지) | [42670246335](https://github.com/leejetty-commits/study114/actions/runs/42670246335) success |
| #144 | `918fac12` | 따옴표 제거 · titlebar 0.65rem | [42671578072](https://github.com/leejetty-commits/study114/actions/runs/42671578072) 1차 flake 후 **rerun success** |

## 결정·교훈

1. **잠금 한 장 PNG(1024×576, 흰 여백 큼)** 를 글자 `em` 높이에 맞추면 실제 로고가 과도하게 작아진다. → **분리 심벌+워드마크로 원복**(#143). 사이트 전역 로고 교체는 티켓 **334**에서 파일 교체·비율로 별도 진행.
2. CSP Enforce는 youtube-nocookie / i.ytimg / 브랜드 `/assets/brand/*` 허용 상태. 배너·팝업 스모크 시 위반 **0건** 반복 확인.
3. Deploy 1차 실패가 잡 누락 형태로 나오면 `gh run rerun`으로 재시도(코드 문제 아님).

## 증거

로컬·운영 스크린샷: `tmp/332-evidence/` (title-change · promo-logo · promo-logo-tweak · lockup-title · lockup-size · dialog-pad 등). git 미추적.

## 검수

- [x] 로컬 빌드
- [x] 운영 `#/guest` 배너·팝업
- [x] CSP 0
- [x] PR 일반 merge
- [ ] 사용자 승인(커밋 단위 — 본 세션은 작업 기록만)
