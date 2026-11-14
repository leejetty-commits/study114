# [368-보완4] 되돌리기 테스트 + 안내 문구

## 지시서 원문 (요약)

1. `scripts/verify-promo-replace-atomic.php` — (a) 형식 오류 교체 → 기존 유지 (b) INSERT 실패 ROLLBACK → 기존 유지, 새 파일 삭제 (c) 다른 방 사진 ID 거부
2. `promo-photos.js:88`, `registration-check-copy.js:80`의 「최대 4MB」→ 「큰 사진은 자동으로 줄여서 올려요」
3. 작은 사진 확대 안내: 「작은 사진은 확대되어 화질이 좋지 않을 수 있어요. 그래도 올릴 수 있어요.」

## 스크립트 실행 결과

```
SETUP  방1 테스트 사진 id=45 sort=5
SETUP  방2 사진 id=46 sort=1

=== (a) 형식 오류 파일로 교체 시도 ===
PASS  (a) bad_type 예외
NOTE  에러코드=bad_type 메시지=이미지를 읽을 수 없어요. JPG, PNG, WebP로 올려 주세요.
PASS  (a) 기존 행 존재
PASS  (a) original_path 그대로
PASS  (a) 원본 파일 존재
PASS  (a) 프라임 파일 존재

=== (b) INSERT 강제 실패 (ROLLBACK 경로) ===
PASS  (b) 새 원본 파일 생성됨
PASS  (b) 새 프라임 파일 생성됨
NOTE  ROLLBACK 실행 — SQLSTATE[23000]: Integrity constraint violation: 1048 Column 'sort_order' cannot be null
PASS  (b) 예외 발생으로 ROLLBACK
PASS  (b) ROLLBACK 후 기존 행 복원
PASS  (b) 기존 original_path 그대로
PASS  (b) 기존 원본 파일 존재
PASS  (b) 기존 프라임 파일 존재
PASS  (b) 새 원본 파일 삭제됨
PASS  (b) 새 프라임 파일 삭제됨

=== (c) 다른 방 사진 ID로 교체 시도 ===
PASS  (c) 다른 방 사진을 이 방에서 못 찾음
PASS  (c) InvalidArgumentException 발생
PASS  (c) 메시지 = 찾을 수 없습니다
NOTE  메시지=사진을 찾을 수 없습니다.
PASS  (c) 방1 테스트 행 온전
PASS  (c) 방2 행 온전

=== 정리 ===
CLEANUP 완료

ALL PASS
```

## 기존 테스트 회귀

- `verify-promo-exception-codes.php` — ALL PASS
- `verify-prime-contain-blur.php` — ALL PASS

## 수정 파일·줄 번호

| # | 파일 | 줄 | 내용 |
|---|---|---|---|
| 1 | `scripts/verify-promo-replace-atomic.php` | 신규 | 되돌리기 검증 스크립트 |
| 2 | `preview/study-room-ui/src/promo-photos.js` | 88 | 「최대 4MB」→「큰 사진은 자동으로 줄여서 올려요」 |
| 3 | `preview/home-ui/src/study-room-reg/registration-check-copy.js` | 80 | 「최대 4MB」→「큰 사진은 자동으로 줄여서 올려요」 |
| 4 | `preview/shared/promo-image.js` | 22 | 「사진이 작아 조금 흐릿하게 보일 수 있어요」→「작은 사진은 확대되어 화질이 좋지 않을 수 있어요. 그래도 올릴 수 있어요.」 |

## 검수

- [ ] 사용자 승인 대기
