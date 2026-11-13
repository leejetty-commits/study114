# 350 자동메일 코드 정상화

**날짜**: 2026-11-11  
**브랜치**: work/350-email-normalize  
**과제ID**: 350

---

## 지시서 원문 요약

- N1: `config/auth.php` 주석을 `우동공과 고객센터 <no-reply@study114.net>`으로 수정
- N2: `STUDY114_MAIL_FROM_NAME` env 키 추가(기본값 `우동공과 고객센터`). `AuthMailer::fromHeader()`·`SettlementMailer::fromHeader()` 하드코딩 제거
- N3: Reply-To 추가 금지, MailTransport 인터페이스 변경 금지
- N4: 바닥글 문구 교체 — `이 메일은 우동공과(study114.net)에서 입력하신 주소로 보내드린 발송 전용 메일이에요. 궁금한 점이 있으시면 help@study114.net으로 편하게 문의해 주세요. 늘 감사한 마음으로 빠르게 답해 드릴게요.` — `고객센터 1:1 문의` 링크 제거
- N5: `PasswordResetService.php` 소셜 전용 분기에서 쓰지 않는 토큰 생성 제거
- 회귀 테스트 추가, HTML 렌더 파일 생성

---

## 변경 파일

| 파일 | 변경 |
|------|------|
| `config/auth.php` | N1: 주석 수정, N2: `mail_from_name` 키 추가 |
| `src/Auth/AuthMailer.php` | N2: `fromHeader()` config 읽기 |
| `src/Report/SettlementMailer.php` | N2: `fromHeader()` config 읽기 |
| `src/Mail/MemberMailTemplate.php` | N4: 바닥글 문구 교체, 지원링크 제거 |
| `src/Auth/PasswordResetService.php` | N5: 소셜 분기 토큰 생성 제거 |
| `scripts/verify-auth-mail-warm.php` | 회귀 테스트 추가 (N2 From 헤더, N5 토큰 미생성) |
| `scripts/verify-mail-lifecycle.php` | 바닥글 새 문구 어서션 갱신 |
| `scripts/verify-member-mail-schedule.php` | 바닥글 새 문구 어서션 갱신 |

---

## 테스트 결과

```
verify-auth-mail-warm.php    : 466 PASS / 0 FAIL
verify-mail-lifecycle.php    : 501 PASS / 0 FAIL
verify-member-mail-schedule.php: 488 PASS / 0 FAIL
```

---

## HTML 렌더 결과 (로컬 확인)

생성 위치: `C:\Users\jetty\AppData\Local\Temp\study114-mail-preview\`

plain text 바닥글 확인:
```
이 메일은 우동공과(study114.net)에서 입력하신 주소로 보내드린 발송 전용 메일이에요. 궁금한 점이 있으시면 help@study114.net으로 편하게 문의해 주세요. 늘 감사한 마음으로 빠르게 답해 드릴게요.
```

HTML 바닥글 확인:
```html
<p style="margin:0;font-size:12px;line-height:1.7;color:#6b7280;">
  이 메일은 우동공과(study114.net)에서 입력하신 주소로 보내드린 발송 전용 메일이에요.
  궁금한 점이 있으시면 <a href="mailto:help@study114.net" style="color:#266bc4;">help@study114.net</a>으로
  편하게 문의해 주세요. 늘 감사한 마음으로 빠르게 답해 드릴게요.
</p>
```

---

## 운영 적용 시 필요한 env

```
STUDY114_MAIL_FROM=no-reply@study114.net
STUDY114_MAIL_FROM_NAME=우동공과 고객센터
```

(닷홈: `public/.htaccess`의 `SetEnv`; GitHub Actions: `STUDY114_MAIL_FROM_NAME` Variable 추가)

---

## DNS D2·D3 승인 요청

DNS 관리처: **Cloudflare** (`marek.ns.cloudflare.com`, `rosalie.ns.cloudflare.com`)

| 항목 | 작업 |
|------|------|
| D2 | `_dmarc.study114.net` TXT 추가: `v=DMARC1; p=none; rua=mailto:help@study114.net` |
| D3 | `study114.net` TXT 삭제: 값이 리터럴 `TXT` 인 레코드 |

MX·SPF·google-*·resend._domainkey·send.study114.net 은 건드리지 않음.

Cloudflare 대시보드 적용 단계:
1. [dash.cloudflare.com](https://dash.cloudflare.com) → `study114.net` → DNS → Records
2. D3: 값 `TXT`인 TXT 레코드 → **삭제(Delete)**
3. D2: **Add record** → Type: TXT, Name: `_dmarc`, Content: `v=DMARC1; p=none; rua=mailto:help@study114.net`, TTL: Auto → **Save**

승인 여부: **미승인 (대기 중)**

---

## 발견한 별도 버그 (수정 금지, 목록만)

- `MemberLifecycleMailTemplate.php`의 바닥글은 `MemberMailTemplate`를 상속·공유하므로 N4로 함께 교체됨 (버그 아님, 확인 완료)
- 기존 `SUPPORT_LINK_LABEL` 상수는 `@deprecated` 처리만 하고 삭제하지 않음 (외부 참조 가능성)

---

## 검수·승인

작업자: Cursor 에이전트 (claude-sonnet-4.6)  
승인자: (미승인, 커밋 후 push 승인 대기)
