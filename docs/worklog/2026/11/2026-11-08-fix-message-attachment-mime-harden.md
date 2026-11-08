# 6-2 쪽지 첨부 MIME/경로 보강

**날짜:** 2026-11-08  
**브랜치:** `fix/message-attachment-mime-harden`  
**지시:** 문서정리 후 보강 · **쪽지만** (제출함 제외)

## 문서 정리 (선행)

- PR #122 / cherry-pick: 329·handoff·82e·328·49에서 제출함을 보안 목록에서 제외.

## 코드

| 항목 | 내용 |
|------|------|
| MIME | `finfo`/`mime_content_type`만. 클라이언트 `type` 불사용 |
| 저장 이름 | `bin2hex` + **서버 MIME→확장자** (사용자 파일명 확장자 무시) |
| PDF | 선두 `%PDF-` |
| 이미지 | `getimagesize` + 픽셀 폭탄 가드 + GD 재인코딩 |
| 표시명 | 사용자 basename 유지 + **확장자는 서버 MIME만** (`shell.php`→실JPG면 `shell.jpg`) |

파일: `src/Messages/MessageAttachmentService.php`, `config/storage.php` 주석.

## 배포·실측

| 항목 | 값 |
|------|-----|
| merge | `f842ef49` (PR #123) |
| Deploy | Actions `42494247444` success |
| 실측 | 2026-11-09 — PNG 첨부·다운로드 → PNG 유지(정상). 승인자 OK |

## 확인 체크

- [x] 쪽지 PNG 첨부·다운로드  
- [ ] JPG/PDF (선택)  
- [ ] `.php` 위장 거절 (서버 MIME 기준)  
- [x] 제출함 메뉴 없음(기존)
