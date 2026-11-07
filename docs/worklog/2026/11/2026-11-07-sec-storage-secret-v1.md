# sec-storage-secret-v1 — 첨부 다운로드 HMAC 비밀값 (2026-11-07)

**브랜치:** `cursor/sec-storage-secret-v1-20261107`  
**상태:** 코드 준비 · **배포 전 사용자 Secret 등록 필수**  
**범위:** 유튜브 홍보 전 보안 필수 2번

## 쉬운 말

제출함 첨부 파일을 받을 때 쓰는 **단기 출입증(토큰)** 서명이, 지금까지 저장소에 공개된 개발용 비밀번호로 찍힐 수 있었습니다.  
운영에 강한 비밀을 넣고, 약하면 토큰을 안 만듭니다.

## 변경

| 파일 | 내용 |
|------|------|
| `config/storage.php` | 공개 기본값 제거 |
| `public/.htaccess` | `STUDY114_STORAGE_SECRET` placeholder |
| `.github/workflows/deploy.yml` | Secret 주입 · 32자 미만·공개 기본값이면 배포 중단 |
| `src/Board/BoardAttachmentService.php` | 비밀 미준비 시 발급/다운로드 거부 · owner 다운로드 시 작성자 재검증 |

## 배포 전 사용자 할 일

1. GitHub → Settings → Secrets → Actions  
2. **New secret** 이름: `STUDY114_STORAGE_SECRET`  
3. 값: 32자 이상 랜덤 (PowerShell 예)  
   `-join ((1..48) | ForEach-Object { '{0:x}' -f (Get-Random -Max 16) })`  
4. `study114-dev-attachment-secret` 쓰지 말 것  
5. 평소 메모 불필요(1번 cron과 동일). Secret만 있으면 배포가 넣음.

## 영향

- 홈·일반 쪽지: 그대로  
- 제출함 **첨부 다운로드**만 새 비밀로 서명. Secret 없이 배포하면 Actions가 멈춤.
