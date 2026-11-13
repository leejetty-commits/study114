# C · phpMyAdmin(/myadmin)이 밖에서 열리는 이유와 할 수 있는 것 (2026-11-14)

## 왜 열려 있나
- 닷홈 웹호스팅은 **외부 DB 접속을 막아 두고, DB 작업은 phpMyAdmin으로만 하게** 해 두었다(닷홈 매뉴얼 「phpmyadmin 접속 방법」: https://docs.dothome.co.kr/books/9b70e/page/phpmyadmin). 그래서 모든 계정에 `아이디.dothome.co.kr/myadmin` 주소가 기본으로 붙는다. 우리가 만든 것이 아니라 닷홈 서버 설정이다.
- 우리 도메인에서도 같은 서버로 가기 때문에 `https://study114.net/myadmin/`도 열린다.
- 2026-11-14 확인: `study114.net/myadmin/` → 200 phpMyAdmin 로그인 화면(Cloudflare 거침), `study114.dothome.co.kr/myadmin/` → 200(닷홈 직접). `study114.net/phpmyadmin/`·`/myadmin2/`는 우리 첫 화면(phpMyAdmin 아님).
- 닷홈 매뉴얼에서 myadmin을 끄거나 IP로 제한하는 메뉴는 찾지 못했다. `.htaccess` IP 차단 안내는 있지만 우리 `html` 폴더용이고, myadmin은 그 밖(서버 공용 경로)이라 적용되는지 확인되지 않았다.

## 위험
- DB 아이디는 FTP 아이디와 같다(닷홈 매뉴얼). 그래서 남은 방어는 DB 비밀번호 하나다. 누구나 대입 시도를 할 수 있다.

## 종현이 할 수 있는 것 (쉬운 순서)
1. **Cloudflare에서 우리 도메인 쪽을 막기 (5분, 코드 변경 없음)**
   - Cloudflare 대시보드 → study114.net → 보안(Security) → WAF → 사용자 지정 규칙(Custom rules) → 규칙 만들기
   - 식: `(http.host in {"study114.net" "www.study114.net"} and starts_with(lower(http.request.uri.path), "/myadmin"))`
   - 동작: 차단(Block). (종현 집 IP만 열고 싶으면 식 끝에 `and not ip.src in {종현IP}` — 집 IP가 바뀌면 막히므로 권장은 그냥 차단.)
   - 평소 DB 작업은 `https://study114.dothome.co.kr/myadmin`으로.
   - 확인: 브라우저에서 `https://study114.net/myadmin/` → Cloudflare 차단 화면.
2. **DB 비밀번호를 길게 (20자 이상, 무작위)**
   - 마이닷홈 → 호스팅관리 → 상세보기 → DB 정보 → [변경].
   - ⚠ 바꾸면 서버의 `config/database.php`(자동 배포 아님, 손으로 올림)도 같은 값으로 바꿔야 한다. 다르면 사이트가 바로 멈춘다. 그래서 **사람 적은 시간에, 두 곳을 연달아** 바꾼다. 비밀번호는 채팅·문서에 붙여 넣지 않는다.
3. **닷홈 고객센터에 문의 (선택)** — 「myadmin 접속을 특정 IP로 제한하거나 끌 수 있는지」. 닷홈 주소 쪽은 우리가 직접 막을 방법이 없어 이것만 남는다.

## 바꾸지 않는 것
- phpMyAdmin을 계속 쓰는 방식(운영 SQL은 종현이 phpMyAdmin에서)은 그대로다.
