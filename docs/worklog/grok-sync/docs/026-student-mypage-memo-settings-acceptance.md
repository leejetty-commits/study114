# 026 · 티켓 G 수락 — 쪽지설정 `memo_status` 저장

- 작성일: 2026-09-24 (KST)
- 기준: [024](024-student-mypage-memo-settings-save.md)
- 상태: **로컬 수락** (push / build / 커밋 없음 · 배포는 025+명시)

---

## 0. 판정

**수락.** 024 목적(표시만 → 저장) 충족. 범위 밖 작업 없음.

---

## 1. 잠금 보정 (024 예상값 → 실코드)

| 024 예상 | 실코드 (정본) |
|----------|----------------|
| 안 받음 ≈ `closed` | **`paused`** (`closed` 없음) |
| ENUM | `sql/schema/063_student_memo_fulfillment.sql` → `ENUM('open','paused')` |
| UI | 「쪽지 수신 / 받음 / 안 받음」 유지 |

이후 문서·Cursor 지시에서 쪽지설정의 안 받음은 **`paused`만** 쓴다.

---

## 2. 변경 파일 (보고·코드 대조)

| 파일 | 확인 |
|------|------|
| `preview/home-ui/src/student-reg/screens.js` | 라디오 `open`/`paused` · 저장 시 `memo_status`만 patch · 클라이언트 값 검증 |
| `src/Registration/StudentHubRepository.php` | update allowlist에 `memo_status` · `open`/`paused`만 통과 |

미수정(올바름): `student-memo-status.js`, 라우터 제목, 스키마, 새 API, auth.

---

## 3. 점검표

| 항목 | 결과 |
|------|------|
| PATCH `action: update` id=1 | 예 |
| open → paused → 원복 open · 새로고침 일치 | 예 (보고) |
| Primary `#266BC4` · 실패 「저장에 실패했습니다.」 | 예 |
| basic `request_summary` / detail `special_request_note` 스모크·원복 | 예 |
| 마이프로필·기본·상세·쪽지설정 라우팅 | 예 |
| 쪽지설정에 필수·부족·공개 전·자녀·guardian | 없음 |
| push / build / 커밋 / auth 혼합 | 안 함 |

코드 스팟체크: allowlist L73 · 검증 L174–175 · UI L431–442 · save L517–522.

---

## 4. 다음

- **H** [025](025-student-mypage-af-commit-deploy-prep.md) — 커밋 분리·배포 **준비** (push/build는 명시 지시 후)
- 노션 요약: 사용자 「노션에 남겨」 요청 시에만
