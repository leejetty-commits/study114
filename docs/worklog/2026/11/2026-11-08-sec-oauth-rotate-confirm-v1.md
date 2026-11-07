# sec-oauth-rotate-confirm-v1 — OAuth 3사 시크릿 재발급 확인 (2026-11-08)

**브랜치:** 문서 기록 (`docs/sec-youtube-pre-security-record-20261108`)  
**상태:** ✅ 완료 (코드 변경 없음 · 사람 콘솔+Secrets+Deploy)  
**범위:** 유튜브 홍보 전 보안 필수 5번

## 지시 요지

불안하므로 네이버·카카오·구글 Client Secret을 새로 하고 Secrets·배포·로그인까지 확인.

## 결과

| 제공사 | 조치 | 로그인 |
|--------|------|--------|
| 네이버 | ID 유지 · Secret 재발급 | OK |
| 카카오 | REST 키 유지 · 카카오 로그인 Secret 재발급 (비즈니스 인증 ✕) | OK |
| 구글 | Add secret → 배포 후 옛 secret 삭제 | OK |

Deploy: Actions **Deploy to dothome** 수동 Run (`main`) 각 Secret 갱신 후.

## 문서 반영

- `docs/internal/31-oauth-secret-incident.md` — 상태 ✅ · §3 완료 기록
- `docs/internal/81-youtube-pre-security-lock.md` — 신규 잠금
- grok-sync `328-youtube-pre-security-2026-11-08.md`
- `docs/worklog/2026/11/2026-11-08-handoff.md`
