# 174d — 학생/학부모 로그인 클릭 이탈 매트릭스 (실사이트)

일자: 2026-09-27  
계정: leejetty+student@gmail.com (프롬프트 std 별칭의 실제 계정) → `/#/parent` · 헤더 「로그인: 이종현학생」  
연관: `174` / `174a`(게스트) / `174b`(공부방 R1~R3) / `174c`(과외쌤 T1~T4)  
정책: Policy 174 (페이지 잔류 내비 원칙)

## 1. Top 우선순위 결함

| ID | 판정 | 현상 | 기대 | 비고 |
| :--- | :--- | :--- | :--- | :--- |
| **S1** | **이탈버그** | 고객센터·공지사항·약관/정책 「← 메인 홈으로」 → `/#/guest` | `/#/parent` (학생/학부모 홈) | 공부방 R1, 과외쌤 T1과 동일 계열 결함 (`getSupportContextRole` 미동기화) |
| **S2** | **이탈버그** | 이용안내·안전가이드·등록방법 「← 메인 홈으로」 → `/#/tutor` | `/#/parent` (학생/학부모 홈) | 세션 스토리지 stale `Jv`로 인해 타 역할 홈(`/#/tutor`)으로 잘못 이탈 |
| **S3** | **이탈버그** | 검색 배너 「홈으로」 `href`가 `/#/guest` (GNB 홈은 `/#/parent` 정상) | GNB와 배너 「홈으로」 모두 `/#/parent` 통일 | 공부방 R2, 과외쌤 T2와 동일 계열 하드코딩 결함 |
| **S4** | **이탈버그** | 학생 찾기 배너의 「유료상품 알아보기」 클릭 시 GNB/푸터 없는 고아 화면(`/#/plans`) 진입 | 학생 역할용 배너 CTA 제거 또는 전용 안내 팝업 | 공급자 전용 유료상품으로 학생 사용자 이탈 유발 |
| **S5** | **개선권장** | 마이페이지 현재위치 breadcrumb 「마이페이지」 클릭 시 자기 자신(`/#/mypage/registrations/students/4`) 제자리 링크 | `/#/mypage` 또는 역할 홈 | 공부방 R3, 과외쌤 T3과 동일 계열 |
| **S6** | **개선권장** | 마이페이지 우측 사이드바 「소개 페이지에서 보기」가 공부방 소개(`/#/promo/study-room`)로 연결 | 학생용 소개 또는 서비스 공통 소개 링크 | 과외쌤 T4와 동일 맥락 불일치 |

---

## 2. 클릭 매트릭스 (Click Matrix)

| 화면 (Screen) | 클릭 요소 (Click) | 출발 URL (Start URL) | 도착 URL (End URL) | 판정 (Verdict) | 한줄 요약 (One-line) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 홈 (`/#/parent`) | GNB 홈 | `/#/parent` | `/#/parent` | 잔류OK | 학생 홈 제자리 정상 유지 |
| 홈 (`/#/parent`) | GNB 공부방찾기 | `/#/parent` | `/search/#/search/room?role=parent` | 이동OK | 학생 역할 파라미터 유지 탐색 이동 |
| 홈 (`/#/parent`) | GNB 과외쌤찾기 | `/#/parent` | `/search/#/search/tutor?role=parent` | 이동OK | 학생 역할 파라미터 유지 탐색 이동 |
| 홈 (`/#/parent`) | GNB 학생찾기 | `/#/parent` | `/search/#/search/student?role=parent` | 이동OK | 학생 역할 파라미터 유지 탐색 이동 |
| 홈 (`/#/parent`) | GNB 커뮤니티 | `/#/parent` | `/#/community` | 이동OK | 커뮤니티 홈 이동 정상 |
| 홈 (`/#/parent`) | GNB 고객센터 | `/#/parent` | `/#/support` | 이동OK | 고객센터 이동 정상 |
| 홈 (`/#/parent`) | 탭 (과외쌤/학생/공부방) | `/#/parent` | `/#/parent` | 잔류OK | 탭 전환 시 인페이지 잔류 및 목록 갱신 |
| 홈 (`/#/parent`) | 공부방 카드 (베이직카드) | `/#/parent` | `/#/parent` | 팝업OK | 인페이지 상세 모달 팝업 표출 |
| 홍보 (`/#/promo/study-room`) | ← 메인 홈으로 | `/#/promo/study-room` | `/#/parent` | 이동OK | 학생 역할 홈으로 복귀 정상 |
| 홍보 (`/#/promo/tutor`) | ← 메인 홈으로 | `/#/promo/tutor` | `/#/parent` | 이동OK | 학생 역할 홈으로 복귀 정상 |
| 홍보 (`/#/promo/parent`) | ← 메인 홈으로 | `/#/promo/parent` | `/#/parent` | 이동OK | 학생 역할 홈으로 복귀 정상 |
| 이용안내 (`/#/guide`) | ← 메인 홈으로 | `/#/guide` | `/#/tutor` | **이탈버그** | 학생 로그인 세션인데 과외쌤 홈으로 이탈 |
| 이용안내 (`/#/guide/registration`) | ← 메인 홈으로 | `/#/guide/registration` | `/#/tutor` | **이탈버그** | 학생 로그인 세션인데 과외쌤 홈으로 이탈 |
| 안전가이드 (`/#/guide/safe`) | ← 메인 홈으로 | `/#/guide/safe` | `/#/tutor` | **이탈버그** | 학생 로그인 세션인데 과외쌤 홈으로 이탈 |
| 고객센터 (`/#/support`) | ← 메인 홈으로 | `/#/support` | `/#/guest` | **이탈버그** | 학생 로그인 세션인데 게스트 홈으로 퇴출 |
| 공지사항 (`/#/support/notice`) | ← 메인 홈으로 | `/#/support/notice` | `/#/guest` | **이탈버그** | 학생 로그인 세션인데 게스트 홈으로 퇴출 |
| 약관 (`/#/support/policies/terms`) | ← 메인 홈으로 | `/#/support/policies/terms` | `/#/guest` | **이탈버그** | 학생 로그인 세션인데 게스트 홈으로 퇴출 |
| 커뮤니티 (`/#/community`) | ← 메인 홈으로 | `/#/community` | `/#/parent` | 이동OK | 학생 역할 홈으로 복귀 정상 |
| 커뮤니티 고민방 (`/#/community/parent`) | ← 메인 홈으로 | `/#/community/parent` | `/#/parent` | 이동OK | 학생 역할 홈으로 복귀 정상 |
| 검색 (`/search/#/search/tutor`) | GNB 홈 | `/search/#/search/tutor?role=parent` | `/#/parent` | 이동OK | GNB 홈은 학생 홈으로 정상 연결 |
| 검색 (`/search/#/search/tutor`) | 소개 배너 「홈으로」 | `/search/#/search/tutor?role=parent` | `/#/guest` (href) | **이탈버그** | 배너 「홈으로」 href가 `/#/guest`로 불일치 |
| 검색 (`/search/#/search/room`) | 소개 배너 「홈으로」 | `/search/#/search/room?role=parent` | `/#/guest` (href) | **이탈버그** | 배너 「홈으로」 href가 `/#/guest`로 불일치 |
| 검색 (`/search/#/search/student`) | 소개 배너 「유료상품 알아보기」 | `/search/#/search/student?role=parent` | `/#/plans` | **이탈버그** | 공급자 전용 유료상품 빈 화면(고아 화면) 이탈 |
| 검색 (`/search/#/search/tutor`) | 과외쌤 카드 「상세」 | `/search/#/search/tutor?role=parent` | `/search/#/search/tutor?role=parent` | 팝업OK | 인페이지 과외쌤 상세 모달 팝업 표출 |
| 검색 (`/search/#/search/student`) | 학생 카드 | `/search/#/search/student?role=parent` | `/search/#/search/student?role=parent` | 잔류OK | 인페이지 잔류 유지 |
| 마이페이지 등록 (`/mypage/registrations/students/4`) | breadcrumb 「마이페이지」 | `/#/mypage/registrations/students/4` | `/#/mypage/registrations/students/4` | 개선권장 | 자기 자신으로 제자리 링크 |
| 마이페이지 등록 (`/mypage/registrations/students/4`) | 등록 베이직카드 미리보기 | `/#/mypage/registrations/students/4` | `/#/mypage/registrations/students/4` | 잔류OK | 인페이지 잔류 유지 |
| 마이페이지 등록 (`/mypage/registrations/students/4`) | 사이드바 「소개 페이지에서 보기」 | `/#/mypage/registrations/students/4` | `/#/promo/study-room` | 개선권장 | 학생 맥락에서 공부방 홍보 랜딩 연결 |
| 마이페이지 등록 (`/mypage/registrations/students/4`) | 탭 (기본정보/상세정보/쪽지설정) | `/#/mypage/registrations/students/4` | `.../basic`, `.../detail`, `.../settings` | 이동OK | 서브 양식 페이지 전환 정상 |
| 마이페이지 계정설정 (`/#/mypage/account`) | 비밀번호 변경 버튼 | `/#/mypage/account` | `/#/mypage/account` | 잔류OK | 인페이지 폼 확장 처리 |
| 마이페이지 탭 (`wishlist`, `recent`, `messages`) | 메뉴 탭 전환 | `/#/mypage/account` | `/#/mypage/wishlist` 등 | 이동OK | 마이페이지 서브 섹션 이동 정상 |

