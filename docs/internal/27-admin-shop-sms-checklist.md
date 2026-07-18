# 27 — 관리자 레이아웃 · 마켓(쇼핑몰) · 알림(SMS) 체크리스트

**작성:** 2026-07-18  
**근거:** 영카트 `admin.menu400` / `menu500` / `menu900` · Study114 상품 = 공부방·과외쌤

---

## 진행 상태

| # | 항목 | 상태 |
|---|------|------|
| 1 | 관리자 본문 폭·사이드바·운영홈 2단 | ✅ |
| 2 | 쇼핑몰관리 → 마켓·결제 메뉴 차용 | ✅ Lab |
| 3 | 쇼핑몰현황/기타 → 매출·순위·후기·미완료 | ✅ Lab |
| 4 | SMS → 알림·문자 Lab (게이트웨이 없이 1차) | ✅ Lab |
| 5 | 문서·라우터 검증 | ✅ |
| 6 | 회원 상세 드로어(더미 포맷) | ✅ |

---

## 1. 레이아웃 (완료)

- [x] 관리자 `home-app--admin` + 우측 배너 제거로 본문 확장 (최대 ~96rem)
- [x] 좌측 주메뉴 폭·글자 축소 + `word-break: keep-all`
- [x] 운영 홈 카드 2~3단 그리드

확인: http://127.0.0.1:5174/#/admin

## 2~3. 마켓·결제 메뉴

| 경로 | 설명 |
|------|------|
| `#/admin/market/overview` | 마켓 현황 KPI |
| `#/admin/market/listings` | 공부방·과외 목록 → 노출 보정 |
| `#/admin/commerce` | 결제·주문 (기존) |
| `#/admin/exposure` | 노출 보정 (기존) |
| `#/admin/market/stats` | 매출·순위 Lab |
| `#/admin/market/reviews` | 이용 후기 공개/숨김 |
| `#/admin/market/incomplete` | 미완료 결제 |

제외(1차): 재고·배송비·쿠폰존·가격비교사이트

## 4. 알림·문자 Lab (영카트 menu900 정밀)

| 경로 | 설명 |
|------|------|
| `#/admin/notify/settings` | 문자 기본설정 + Lab 안내·업체 URL |
| `#/admin/notify/sync` | 회원 휴대폰 → 주소록 동기화 |
| `#/admin/notify/templates` | 템플릿 그룹·문구(단문/장문) |
| `#/admin/notify/phones` | 수신 그룹·번호(주소록) |
| `#/admin/notify/send` | 미리보기 발송(실발송 없음) · 회원상세에서 번호 프리필 |
| `#/admin/notify/logs` | 전송내역 |
| `#/admin/notify/logs-phone` | 번호별 전송내역 |

저장: `sessionStorage` 키 `study114-admin-sms-lab-v2` (`sms-lab-store.js`)

**2차(실연동):** 알리고/아이코드 등 게이트웨이 키 · 수신 동의 · 발신번호 등록

## 4b. 부가서비스 (영카트 부가서비스 벤치마크)

| 경로 | 설명 |
|------|------|
| `#/admin/addons` | 전체 업체 카드 |
| `#/admin/addons/pg` | 이니시스·KCP·토스·나이스 (카드 결제모듈 연락) |
| `#/admin/addons/sms` | 알리고·아이코드 |
| `#/admin/addons/identity` | 나이스아이디·PASS |

카탈로그: `preview/home-ui/src/admin/vendor-addons.js`

## 6. 회원 상세 포맷

경로: `#/admin/members` → **상세**

드로어 항목: 계정·상태·전화·이메일인증·성별·생년월일·주소·수신동의·가입·최근로그인·프로필수·유료티어 · 역할 · 소셜 · 포지션/횟수권/주문 · 내부메모 · **문자 미리보기**

API 실패/캐시 없음 → seed/더미로도 항상 열림 (`buildMemberDetail`)

## 코드

- `preview/home-ui/src/admin/sms-lab-store.js`
- `preview/home-ui/src/admin/marketplace-lab-store.js`
- `preview/home-ui/src/admin/vendor-addons.js`
- `a28-copy.js` 메뉴 · `router.js` · `a28-screens.js` · `shell.js` · `layout.js` · `home.css`
