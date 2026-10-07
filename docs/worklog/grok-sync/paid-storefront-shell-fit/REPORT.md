# REPORT — paid-storefront-shell-fit

정적 Shell 보정 시안 · 운영 아님 · 정책/가격 변경 없음 · 승인 시안(plans-ui-v5) 적응 · v1.0 아님

> Notion MCP unavailable this session · local Stage5B layout SSOT는 **1차 후보**로만 참조 · **live study114.net 실측/CSS를 우선 반영**

---

## 0) Stage5B 후보 vs Live 실측 vs Adopted

| 항목 | Stage5B Type B 후보 | Live (mypage @1440 CSS) | **Adopted** |
|------|--------------------:|------------------------:|------------:|
| shell | 1280 | **1280** | **1280** |
| gutter | 32 | **32** (row 1216) | **32** |
| left nav | 220 | **160** | **160** |
| nav→body gap | 24 | **24** | **24** |
| body | 648 | 736 (보고) / 800 (행 함의) | **800** |
| body→rail gap | 24 | **8** | **8** |
| right rail | 300 | **224** | **224** |
| 공식 | `32+220+24+648+24+300+32` | `160+24+body+8+224=1216` | `32+160+24+800+8+224+32=1280` |

**선언:** Stage5B 220/648/300은 ops 최종 아님. Adopted는 Live 축(160/24/8/224/1280/1216)에 맞춤.

**바디 800 vs 보고 736:** `1216−160−24−8−224=800`. 보고된 736·home-main 984는 서로/행 공식과 불일치(736+8+224=968). 센터 **트랙**은 `1fr=800`으로 채택(+64 vs 보고 736, 의도적·문서화).

**소스:** logged-in mypage home computerUse 2026-09-17 · `live-measure/mypage-shell-1440x900-full.png`. `#/plans*` 로그인 벽.



## 1) 기존안 문제

승인 스토어프론트(`plans-ui-v5`)는 독립 full-bleed 스토어 헤더(노출상품|쪽지권 탭)만 있고, 마이페이지 **좌측 세로 메뉴가 없는** 전체화면 스토어로 읽힌다. ops Shell(좌측 내비 + 본문 + 레일)과 단절된다.

## 2) 보정 원칙

- 신규 디자인·정책/가격/기간/할인/환불/라우트/IA 변경 없음.
- v5 승인 시안 본문을 **center body**에 이식.
- Ivory 톤은 body에만 스코프 (left nav에 ivory 금지).
- Shell 수치는 **live 우선**, Stage5B는 출발 가설.
- 3열(nav+body+rail) Shell-fit 유지 (시안 목적). live mypage는 2열이므로 REPORT에 명시.

## 3) 좌측 메뉴 보정

유료 페이지만의 프레젠테이션 정리 (IA 신설 아님):

- 그룹: 마이페이지 / 운영
- 링크: 내 프로필, 내 상품, **노출상품**, **쪽지권**, 쪽지함, 고객센터
- active: positions→노출상품, access→쪽지권
- 폭 **160px** (live mypage CSS 10rem)
- ops surface 유지 (paid ivory로 재칠하지 않음)

## 4) positions

v5 본문 이식: hero, Basic 무료, Prime/Pick 기간카드(5), occupancy, Pick 미리보기, 배지(body full-bleed), 적용 대상, 주문 요약, 환불.  
기간 5카드는 body 784 기준 가로 스크롤 여지 유지.  
우측 레일 224: 구매 전 확인 / 환불·소멸 / 관련 링크 (v5 카피).

## 5) access

`access.html` 1차 (`#/plans/access` 대응). `tickets.html` 동일 내용 복제.  
v5 tickets 플로우 이식. `app.js`에서 `access`→tickets 로직 정규화.

## 6) 실측표

상세: `MEASUREMENTS.md` · live: `live-measure/`.

블록·박스 computed 실측(@1440): **`MEASUREMENTS.md` §5**.

| | Stage5B 후보 | Live | Adopted 팩 |
|--|--:|--:|--:|
| shell | 1280 | 1280 | 1280 |
| nav | 220 | 160 (CSS) | 160 |
| gap | 24 | 24 | 24 |
| body | 648 | 736 (보고) / 800 (행 함의) | **800** |
| rail | 300 | 224 (guest) | 224 |

## 7) 한계

- 정적 시안. 실결제/DB/권한 없음.
- 유료·마이페이지 로그인 게이트 → 좌측 내비는 CSS FACT.
- live mypage는 2열; 본 팩은 Shell-fit을 위해 3열 유지(rail=guest promo 224에 맞춤).
- Pretendard 4 weight만 동봉.
- Stage complete / v1.0 선언 없음.

## 8) 전역 통일 시 이어질 항목

- 로그인 세션으로 `#/plans*`, `#/mypage*` DOM 재실측 → Adopted 재검증.
- mypage 2열 vs 유료 3열(레일) IA 확정.
- GNB/푸터 Stage5B·live 토큰 최종 정렬.
- 실측 회귀에 유료 Shell 케이스 추가.
