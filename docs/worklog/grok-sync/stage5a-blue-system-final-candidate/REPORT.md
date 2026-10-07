# Stage 5A — 블루 디자인 시스템 최종 보정본

작성: 2026-09-04 KST  
상태: **5A 최종 보정본 · 운영 적용 전 · Primary 잠금 후보 #266BC4 · 예시 데이터**  
5B 컴포넌트 구현 아님. ops / GitHub / DB / API / 라우트 / 배포 없음.  
원본 `/workspace/study114-ds/stage5a-blue-system/` 은 덮어쓰지 않음.

---

## 0. 이번 보정 지적 대응표

| 검토 지적 | 수정 파일 | 수정 내용 | 확인 화면 | 상태 |
|-----------|-----------|-----------|-----------|------|
| 마이페이지 3열 셸 누락 (ADD, Footer 교체 금지) | `COMPONENTS.md` §14, `tokens.css` `--mp-*`, `assets/ref.css`, `pages/ref-mypage.html` | 컴포넌트 **14개**. 좌 역할 메뉴 · 중 상태+핵심 과제 · 우 보조. 220/1fr/260, 갭 24. 960 이하 가운데 먼저 스택. Primary CTA 가운데만 | `shots/ref-mypage.png` @1440, `shots/ref-mypage-390.png` | **이번 보정** |
| 간격 4px·12px 토큰화 | `tokens.css`, `TOKENS.md`, `COMPONENTS.md`, `RESPONSIVE.md`, `assets/ref.css`, 참조 HTML | `--s-0-5:4px` `--s-1:8px` `--s-1-5:12px` … `--s-10:80px`. 8pt 베이스+4px 보조. `--s-1`=8px 충돌 해소. 반복 간격 4/12를 토큰으로 | 전 화면 | **이번 보정** |
| 히어로·빈 이미지 그라데이션 | `assets/ref.css`, `COMPONENTS.md`, `TOKENS.md`, 참조 HTML | 플랫 `--uds-bg` + 1px Line. 단순 프레임 아이콘 또는 「사진 없음」. 4:3. 장식 그라데이션·가짜 공간 일러스트 제거 | `ref-guest-home`, 검색 사진없음 카드, 상세 | **이번 보정** |
| 가격 없으면 카드 제외 | `COMPONENTS.md` 공통·Prime/Pick/Basic/레일, `REPORT.md` 보류 | 이름은 카드 존재 조건. 가격은 1차이나 미입력 처리는 **정책 미확정**. 시안은 가격 있는 예시만. 「가격 문의」「상담 후 결정」 금지 | 문서. 목업 카드는 모두 가격 있음 | **이번 보정** / **정책 미확정** |
| 960px sticky 이중 표현 | `RESPONSIVE.md`, `COMPONENTS.md`, `TOKENS.md`, `assets/ref.css`, 샷 캡션 | `min-width:961px` sticky. `max-width:960px` static/스택. 정확히 960은 sticky 아님. Basic 1열은 719 | 상세 데스크톱 문서·미디어쿼리 | **이번 보정** |
| Disabled 이유 문구 (권고) | `TOKENS.md` §5, `COMPONENTS.md` Button, `assets/ref.css` `.ctl-hint`, `pages/color-board.html` | 전용 bg/text/border. Primary처럼 안 보임. 클릭 불가. 이유는 버튼 밖, Muted 12/14, 색만 아님 | `shots/color-board.png` | **이번 보정** (권고) |

768 Basic 스트레스(필수 샷): `pages/ref-basic-768-stress.html` · `shots/ref-basic-768-stress.png` @768.

---

## 1. 결정 구분

| 구분 | 내용 |
|------|------|
| **4단계 확정** | 블루 Primary 계열. 클레이 `#B5402A` 미채택. Prime=설득 / Pick=비교 / Basic=탐색. 데스크톱 Basic **2단**. 가격 Ink. CTA 블루. d04 데스크톱 요약 레일 후보. d06 최근/찜/추천=같은 Basic. 증빙 있음/없음. 우동공과 IA·GNB(유료상품 포함). 검색 초기 Basic만(유료 Prime/Pick 비상단). 타이포 12/14/16/18/22/28/36 Pretendard. 마이페이지 3열 뼈대·역할 메뉴 |
| **5A 승인 대상 (아직 운영 아님)** | Primary 잠금 후보 `#266BC4` (흰 글자 5.27:1). `#2B7FFF`는 색 보드만. 토큰 스코프 `.uds-theme`. 모바일 상세 하단 CTA를 워킹 디폴트로 승격. 14 컴포넌트 스펙. Basic 1열 분기 719. sticky는 961+ |
| **이번 보정** | 위 0번 표 6항 + 768 스트레스 샷 + 리뷰 배너 문구 + 컴포넌트 14 |
| **정책 미확정** | 가격 미입력 시 공개 표시·숨김·노출 가능 여부. 로그인 게이트·모달. 모바일 내비 최종. 학생찾기 노출 범위. 지도/거리. plans 아이보리 vs 공개 쿨 뉴트럴 통합. hover/pressed 운영 확정값. Primary ops 전역 최종 |
| **5B로 넘길 수 있는 것** | 없음 — **승인 전 5B 시작 금지**. 승인 후에만 14 컴포넌트 체크리스트·그리드 분기·증빙 카피 교정 후보를 넘김 |
| **Cursor에 아직 넘기면 안 되는 것** | ops PR, plans-ui-v5 수정, 5B 컴포넌트 코드, 로그인 게이트 구현, 모바일 GNB 최종, 학생찾기 메뉴 변경, 지도, 전역 토큰 커밋, 가격 공개/숨김 로직 |

---

## 2. 작업 범위

한 일:
- `/workspace/study114-ds/stage5a-blue-system/` **복사** 후 `/workspace/study114-ds/stage5a-blue-system-final-candidate/`에서만 보정
- 토큰·14 컴포넌트·반응형·리포트 갱신. 참조 화면 + 마이페이지 + 768 스트레스
- Chrome headless 재캡처 + ZIP `/workspace/stage5a-blue-system-final-candidate.zip`

하지 않은 일 (지킨 금지):
- `stage5a-blue-system` 원본 덮어쓰기 없음
- `plans-ui-v5` / ops / GitHub / DB / API / 라우트 / 배포 없음
- 5B 시작 없음
- 새 마이페이지 메뉴·역할 구조 변경·유료상품 삭제·하단탭 확정 없음
- 클레이 `#B5402A` 미사용. `#2B7FFF`는 색 보드만

---

## 3. 4단계에서 확정된 것

| 항목 | 내용 |
|------|------|
| 사이트 Primary 계열 | 블루. 클레이 `#B5402A` 미채택 |
| 차용 | 흰 표면, 얇은 보더, 여백, 정돈된 타이포, 이미지 비율, 정렬, 행동 위계 |
| 레이아웃/IA | 우동공과 유지. Prime=설득, Pick=비교, Basic=탐색 |
| Basic 배열 | 데스크톱 **2단 그리드**. 전체폭 단일 행 아님 |
| 가격 | Ink. 적색 가격 미사용(시안) |
| Primary CTA | 블루만. 결정 영역당 하나 |
| d04 데스크톱 | sticky 미니샵 **요약 레일 후보** |
| d04 모바일 | 하단 sticky CTA를 대안으로 제시(4단계에선 A/B 미채택) |
| d06 | 최근/찜/추천 = **같은 Basic 카드**, 새 종류 없음 |
| 증빙 | 있음/없음. 인증·랭킹 아님 |
| GNB 라벨 | 공부방찾기 / 과외쌤찾기 / 학생찾기 / **유료상품** 유지 |
| 검색 초기 | Basic 통합 목록. 검색 상단에 Prime/Pick 미배치 |
| 타이포 스케일 | 12 / 14 / 16 / 18 / 22 / 28 / 36, Pretendard |
| 마이페이지 | 3열 셸 + 역할 메뉴 뼈대 |

---

## 4. 5A에서 제안한 것 (최종 보정 반영)

| 항목 | 제안 |
|------|------|
| Primary 잠금 후보 | **`#266BC4`** (A). 흰 글자 **5.27:1**. B `#2B7FFF`는 보드 비교만 |
| 토큰 스코프 | `.uds-theme` / `[data-theme="uds-proposal"]` |
| 14 컴포넌트 | Header~Footer + **Mypage 3-column shell** |
| 간격 | 8pt 베이스 + 4px 보조 스텝 |
| 빈 이미지 | 플랫 뉴트럴, 그라데이션 없음 |
| 반응형 | 1440 / **960 경계** / 768 / 430 / 390 / 360. Basic 2→1 = **719px**. sticky = **961px+** |
| 모바일 상세 | 하단 sticky CTA 워킹 디폴트. 본문 패딩으로 바 가림 방지 |
| 리뷰 배너 | 상단만. 「5A 최종 보정본 · 운영 적용 전 · Primary 잠금 후보 #266BC4 · 예시 데이터」 |

---

## 5. 아직 보류할 것

| 항목 | 이유 |
|------|------|
| Primary의 **ops 전역 최종** | 5A는 후보. 실측·plans 통합 수위 미정 |
| plans 아이보리 캔버스와 공개 쿨 뉴트럴 통합 | 병행 vs 단일 테마 미정 |
| 상세 로그인 게이트 · URL · 팝업 모달 | 4단계부터 미확정 |
| 모바일 내비 형태 | 가로 스크롤은 임시. 하단탭 최종화 안 함 |
| 학생찾기 GNB 노출 범위·역할 분리 | 현재 메뉴 유지 |
| 지도 검색·거리 정렬 | 시안 제외 |
| 운영 화면 적색 가격의 Ink 일괄 변경 | 정책·배포 이슈 |
| 증빙 파일 첨부 UX | 보유 여부만 잠금 |
| 비교함 상세 규칙 | 빈 상태만 원칙 |
| **가격 미입력 시 공개 표시·숨김·노출 가능 여부** | 이름은 필수. 가격 공란 운영 규칙은 미확정. 숨김 vs 상태 카피 미정. 대체 카피 발명 금지 |
| hover/pressed의 운영 확정값 | 후보안 파생 |
| 마이페이지 열 폭의 ops 확정 | 5A 후보 220 / 1fr / 260 |

---

## 6. 운영 코드에 반영하면 안 되는 것

| 금지 | 설명 |
|------|------|
| 이 폴더 CSS를 그대로 프로덕션에 올리기 | 잠금 **후보** 시안 |
| `--uds-primary`를 ops 토큰으로 커밋 | 전역 최종이 아님 |
| 5B 없이 컴포넌트 라이브러리화 | 5A는 스펙+정적 HTML |
| 클레이 토큰 재도입 | 닫힌 결정 |
| Basic을 전체폭 1행으로 되돌리기 | 닫힌 결정 |
| 검색에 Prime/Pick을 섞어 유료 1등처럼 보이기 | 4단계 확정 |
| 증빙=인증 뱃지, Hot/SKY/1위 | 정책 |
| 레일을 장바구니로 구현 | 요약 레일 후보일 뿐 |
| 로그인 게이트·모달을 이 HTML 그대로 구현 | 미확정 |
| plans-ui-v5 파일을 이 토큰으로 덮기 | 읽기 전용 연속 |
| 가격 미입력 상품 제외/대체카피 로직 | 정책 미확정 |

---

## 7. Cursor에게 넘길 수 있는 항목

승인 **전**에는 넘기지 않는다. 승인 후 후보안 인용만:

| 항목 | 넘기는 형태 |
|------|-------------|
| Primary **후보** `#266BC4`, 흰 글자 5.27:1 | 문서 인용. PR 금지 |
| 가격 Ink / CTA 블루 분리 원칙 | 신규 시안·카피에 적용 검토 |
| Basic 데스크톱 2단, 최소 너비 320, 1열 분기 719, 홀수 카드 비신장 | 프론트 그리드 논의용 |
| sticky `min-width: 961px` | 미디어쿼리 논의용 |
| 증빙 라벨 있음/없음 | 카피 교정 후보 |
| 14 컴포넌트 필드 목록 | 5B 착수 전 체크리스트 |

넘길 때도 **운영 반영 지시가 아니라 5A 후보안**임을 명시한다.

---

## 8. Cursor에게 아직 넘기면 안 되는 항목

| 항목 | 이유 |
|------|------|
| ops 레포 PR / 라우트 / API / DB | 금지 |
| plans-ui-v5 수정 | 읽기 전용 |
| 5B 컴포넌트 코드 생성 | **승인 전 5A에서 정지** |
| 로그인 게이트·모달 구현 | 미확정 |
| 모바일 GNB 최종 구현 | 미확정 |
| 학생찾기 메뉴 변경 · 유료상품 삭제 | 금지 |
| 지도·거리 | 금지 |
| 전역 토큰 파일을 서비스에 추가 | 후보 단계 |
| 가격 미입력 시 공개/숨김 로직 | 정책 미확정 |

---

## 9. Primary 비교 요약

| | `#266BC4` (A) | `#2B7FFF` (B) |
|--|---------------|---------------|
| 흰 글자 대비 | 5.27:1 AA 본문 통과 | 3.76:1 AA 본문 미달 |
| plans 연속 | `--plans-primary`와 동일 | 더 밝음, 불연속 |
| 4단계 블루 보정 | 참고값과 동일 | 신규 |
| 소프트함 | 중간 | 더 밝으나 대비 손실 |
| 5A 권고 | **잠금 후보** | 보드 잔류, 기본값 아님 |

상세: `DECISIONS.md`. 보드: `pages/color-board.html`, `shots/color-board.png`.

---

## 10. 5A 잠금 · 5B 시작 여부 (제안)

- **5A를 지금 운영 잠금으로 선언하지 않는다.** 이 팩은 최종 **보정 후보**다. 검토 승인 후에 5A 잠금.
- **5B는 승인 전까지 시작하지 않는다.** 구현·Cursor PR·ops 반영 없음.
- Primary `#266BC4` / 5.27:1 은 후보로 유지. 전역 확정 아님.

---

## 11. 금지 유지 확인

- [x] ops / Cursor PR / plans-ui-v5 편집 없음
- [x] `stage5a-blue-system` 원본 미수정
- [x] 5B 구현 없음
- [x] 로그인 게이트·모바일 내비·학생 GNB 최종화 없음
- [x] 지도/거리 없음
- [x] 새 카드 티어 없음
- [x] 가격 운영 정책 발명 없음 (미입력=보류)
- [x] 클레이·전체폭 Basic 비캐논
- [x] 제품 UI에 검토 라벨 없음. 리뷰 배너 상단만
- [x] `#2B7FFF` 색 보드만
- [x] 유료상품 GNB 유지. 검색 첫 화면 유료 Prime/Pick 없음
- [x] 5A에서 정지

---

## 12. 산출 경로

```
/workspace/study114-ds/stage5a-blue-system-final-candidate/
  TOKENS.md
  COMPONENTS.md
  RESPONSIVE.md
  DECISIONS.md
  REPORT.md
  tokens.css
  assets/ref.css
  fonts/Pretendard-*.woff2
  pages/color-board.html
  pages/ref-guest-home.html
  pages/ref-room-search.html
  pages/ref-detail-desktop.html
  pages/ref-detail-mobile.html
  pages/ref-parent-home.html
  pages/ref-mypage.html
  pages/ref-basic-768-stress.html
  shots/color-board.png                 @1440
  shots/ref-guest-home.png              @1440
  shots/ref-room-search.png             @1440
  shots/ref-detail-desktop.png          @1440
  shots/ref-detail-mobile.png           @390
  shots/ref-parent-home.png             @1440
  shots/ref-mypage.png                  @1440
  shots/ref-mypage-390.png              @390
  shots/ref-basic-768.png               @768
  shots/ref-basic-768-stress.png        @768
/workspace/stage5a-blue-system-final-candidate.zip
```
