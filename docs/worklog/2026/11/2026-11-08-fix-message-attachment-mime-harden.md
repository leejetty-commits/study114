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
| 표시명 | `original_name`만 사용자 basename 유지(다운로드 표시용) |

파일: `src/Messages/MessageAttachmentService.php`, `config/storage.php` 주석.

## 배포 후 확인 (승인자)

- 쪽지에 JPG/PNG/PDF 첨부·다운로드  
- `.php`·가짜 확장자 거절  
- 제출함 메뉴 없음(기존)
