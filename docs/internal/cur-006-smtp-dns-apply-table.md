# CUR-006 · study114.net 인증 SMTP DNS 적용표

> **실제 DNS 변경은 하지 않는다.** Cloudflare DNS 관리 화면에서 적용할 초안이다.  
> 네임서버: Cloudflare (`study114.net`). 메일 관련 레코드는 **DNS only**(프록시 회색구름).

## 전제

- 웹/앱 호스팅: 닷홈
- 메일 제공(우선안): 카페24 웹메일 + 외부 SMTP (`smtp.cafe24.com:587` · STARTTLS)
- 발신 From: `noreply@study114.net` (또는 동일 도메인 인증 사서함)
- 확인 링크 베이스: `https://study114.net`

## SMTP_PROVIDER_GATE: HOLD 인 이유와 DNS 값

카페24 **공식** 외부 연동 안내([웹메일 설정 및 외부 연동](https://help.cafe24.com/docs/business-tools/webmail/webmail-setup-and-integration-guide)):

| 항목 | 값 |
|------|-----|
| SMTP host | `smtp.cafe24.com` |
| port | `587` |
| 암호화 | STARTTLS(TLS) 권장 |
| 사용자 이름 | 전체 주소 (`로컬@study114.net`) |

카페24 **공식** SPF 예시([웹메일 스팸 설정 가이드](https://help.cafe24.com/docs/business-tools/webmail/webmail-spam-prevention-guide)):

```text
v=spf1 ip4:183.110.224.0/24 ip4:175.126.146.0/24 ip4:112.175.12.0/24 ip4:118.219.233.0/24 ~all
```

**DKIM** 공개키·selector는 카페24 웹메일/도메인 연결 화면의 **계정별 값**이 필요하며, 이 문서 작성 시점에는 study114 실계정 값을 확인하지 못했다 → 표에 placeholder로 둔다.

## 적용 레코드 초안

| 유형 | 이름/호스트 | 값 | Proxy | 비고 |
|------|-------------|-----|-------|------|
| MX | `@` / `study114.net` | 카페24 웹메일이 안내하는 MX (상품 화면 값) | DNS only | 수신을 카페24로 둘 때만. 미사용 시 기존 MX 유지 |
| TXT (SPF) | `@` | **단일** `v=spf1 …` (아래 병합안) | DNS only | **TXT SPF를 복수로 두지 말 것** |
| TXT (DKIM) | `{selector}._domainkey` | 카페24가 제공한 `v=DKIM1; k=rsa; p=…` | DNS only | selector·p는 콘솔 복사 |
| TXT (DMARC) | `_dmarc` | `v=DMARC1; p=none; rua=mailto:noreply@study114.net` | DNS only | 초기 p=none 권장 후 강화 |
| CNAME Return-Path | (해당 시) | 카페24가 요구하면 콘솔 값 | DNS only | 미요구 시 생략 |

## SPF 병합 원칙

현재 Cloudflare TXT가 의미 없는 `"TXT"`만 있는 상태였다면 → 카페24 SPF 예시로 **교체(1개)**.

이미 다른 `v=spf1` 가 있으면:

1. 기존 레코드를 삭제하지 말고 **한 줄로 병합**
2. `include:` / `ip4:` 를 카페24 안내에 맞게 합친 뒤 `~all` 또는 `-all` 하나로 종료
3. `v=spf1` TXT를 **두 개** 만들지 않음 (PermError)

예시(카페24만 발신, 닷홈 `mail()` 폐기 전제):

```text
v=spf1 ip4:183.110.224.0/24 ip4:175.126.146.0/24 ip4:112.175.12.0/24 ip4:118.219.233.0/24 ~all
```

## 기존 레코드 충돌 체크리스트

- [ ] Cloudflare에 `v=spf1` TXT가 2개 이상인가? → 1개로 병합
- [ ] 닷홈/기타 MX가 남아 카페24 수신과 충돌하는가?
- [ ] 오렌지 구름(프록시)이 MX/TXT에 켜져 있는가? → DNS only로
- [ ] DKIM TXT 길이 잘림(512/255 split) 여부

## 앱 설정과의 정합

| 앱 SetEnv | 기대 값 |
|-----------|---------|
| `STUDY114_MAIL_FROM` | `noreply@study114.net` (인증 사서함) |
| `STUDY114_SMTP_HOST` | `smtp.cafe24.com` |
| `STUDY114_SMTP_PORT` | `587` |
| `STUDY114_SMTP_ENCRYPTION` | `tls` |
| `STUDY114_SMTP_USERNAME` | 전체 메일 주소 |
| `STUDY114_SMTP_PASSWORD` | GitHub Secret / 서버만 |

Return-Path는 SMTP envelope MAIL FROM = From 주소와 동일하게 클라이언트가 설정한다.
