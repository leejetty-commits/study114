> **폐기됨 · CUR-006 Resend 결정으로 대체.**  
> 이 문서는 역사 참고용이며 현재 정본이 아니다. 구현은 Resend HTTPS API (`src/Mail/ResendMailTransport.php`)를 따른다. SMTP 어댑터는 제거되었다.

# CUR-006 · SMTP 제공자 역할 재검토 (폐기)

## SMTP_PROVIDER_RECOMMENDATION: TRANSACTIONAL_PROVIDER

사람용 웹메일(카페24)과 **자동 확인·복구·리마인더**를 분리하는 안을 1순위로 둔다.  
후보 구현체는 내부 CampStory에서 이미 다룬 **Resend**(또는 동급: 도메인 인증·DKIM·발송 로그·API/SMTP).  
현재 SMTP 어댑터는 provider-independent 이므로 host/port/user/pass만 바꾸면 된다.

카페24가 외부 SMTP를 제공한다는 사실만으로 Study114 트랜잭션 메일 제공자로 **확정하지 않는다**.

## 비교

| 항목 | A. 카페24 SMTP | B. Resend(동급 트랜잭션) |
|------|----------------|-------------------------|
| study114.net 인증 | 웹메일 도메인 연결 + DNS | 대시보드 도메인 verify + 전용 DNS |
| DKIM | 계정별 값·문서 분산 · HOLD | 콘솔이 selector/TXT 명시 |
| SPF | 공식 IP 대역 TXT | `include:`/CNAME 등 콘솔 값 |
| DMARC | 수동 | 수동(권장) |
| Gmail 전달성 | 공유 호스팅 평판 리스크 | 트랜잭션 전용 평판·가이드 |
| 발송 로그 | 웹메일함 위주 | API/대시보드 이벤트 |
| 반송 | 약함 | webhook/이벤트 |
| 한도 | 웹메일 상품 의존 | 플랜 명시 |
| 닷홈 PHP 연결 | 587 outbound **미검증(HOLD)** | 443 API 또는 587 SMTP — API가 방화벽에 유리한 경우 많음 |
| 장애 진단 | 제한적 | 메시지 ID·이벤트 |
| 비용 | 웹메일 상품 | 사용량 과금 |
| 사람용 메일함 분리 | 같은 계정 혼용 위험 | **분리 가능(권장)** |
| 유료 리마인더 | 가능하나 스팸·한도 리스크 | 트랜잭션 채널에 적합 |

## 권장 운영 모델

1. **사람용 수발신:** 카페24 웹메일 (`@study114.net` 사서함) — MX는 수신 정책에 맞게  
2. **앱 자동 메일:** Resend(또는 동급) — `noreply@study114.net` 또는 `auth@` 서브도메인  
3. SPF는 **단일 TXT로 병합** (카페24 include + Resend include) — 복수 SPF 금지  
4. 계정 생성·구매·DNS 변경은 이 문서 단계에서 하지 않음

## 현재 게이트와의 관계

- 코드 어댑터: PASS (provider-independent)
- SMTP_PROVIDER_GATE: 여전히 **운영 확정 전 HOLD** (도메인 인증·Secrets·outbound/API 확인 필요)
- 추천만 `TRANSACTIONAL_PROVIDER`로 고정; 카페24는 사람용 메일함으로 유지
