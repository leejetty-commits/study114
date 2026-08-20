# 우동공과 브랜드 자산

## 카드 기본 이미지 (실사진 전)

원본 심벌(`logo-full` 핀) + 원본 우동공과 PNG + 벡터 서브카피「우리동네 / 공부방 과외」.

재생성: `node scripts/compose-room-card-defaults.mjs`

| 파일 | 크기 | 용도 |
|------|------|------|
| `room-card-default-basic.svg` / `.png` · `…-S.png` | 480×480 | 소 · 베이직 |
| `room-card-default-pick.svg` / `.png` · `…-M.png` | 720×720 | 중 · 픽 |
| `room-card-default-prime.svg` / `.png` · `…-L.png` | 1280×720 | 대 · 프라임 |

코드·DB 경로는 `.svg`(PNG 내장)를 가리킵니다. 직접 쓰실 때는 `.png` / `S·M·L` 별칭을 받으세요.

## 기타

| 파일 | 설명 |
|------|------|
| `logo-full.png` | 핀 심벌 + 「우리동네 공부방과외」 풀 로고 |
| `logo-wordmark.png` | 워드마크 |
| `src/udong-pin.png` | 합성용으로 분리한 심벌 |
| `src/udong-wordmark.png` | 합성용으로 분리한 우동공과 |

## 로고 색상 (참고)

| 글자 | 색상 |
|------|------|
| 우 | 코랄 `#e85d75` |
| 동 | 오렌지 `#f57c00` |
| 공 | 블루 `#2b7fff` |
| 과 | 퍼플 `#8b5cf6` |
