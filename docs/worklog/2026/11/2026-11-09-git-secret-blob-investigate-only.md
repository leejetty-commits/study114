# 2026-11-09 — git secret blob **조사만** (force-push 없음)

**지시:** 조사만. force-push·히스토리 재작성 **하지 않음**.  
**전제:** 승인자 — 네이버·카카오·구글 등 시크릿 **최근 재발급 완료**.

## 결론 (한 줄)

**지금 main 트리에는 OAuth 실값이 없다(placeholder).**  
**옛 커밋 blob에는 2026-07 사고 때의 실값이 남아 있다.**  
키를 이미 바꿨으므로 **유출된 옛 값의 실사용 위험은 낮음.** 히스토리 삭제(force-push)는 **별도 승인·계획** 전까지 보류가 맞다.

## HEAD (현재 파일)

| 검사 | 결과 |
|------|------|
| `public/.htaccess` OAuth·메일키·Resend·OTP pepper | 전부 `__NAME__` **placeholder** |
| `GOCSPX-` 패턴 (사고문서·검사 스크립트 제외) | **없음** |
| `config/database.php` 추적 | **없음** |
| `.env` 커밋 이력 | **없음**(검색 범위 내) |

## 히스토리 (값 미출력)

정본 사고문: `docs/internal/31-oauth-secret-incident.md`

| 커밋 | 내용(키 이름만) |
|------|----------------|
| `a990122b` | `.htaccess`에 네이버 ID/SECRET **실값** |
| `fce2c282` | + 카카오 REST/SECRET **실값** |
| `1d56525d` | + 구글 ID/SECRET **실값** (`GOCSPX-` 포함 구간) |
| `e498dd78` · `42bcfc79` 등 | placeholder 전환 전 `.htaccess`에 구글 패턴 **잔존** |
| `48c7d23c` | 저장소 제거·배포 Secrets 주입 전환 → 이후 **placeholder** |

`git log -S GOCSPX-` 에도 위 구간·일부 worklog 문구 커밋이 잡힘(문서 접두어 언급 포함).

## 의미

1. **공개 저장소·포크·스캐너**는 옛 blob을 이미 볼 수 있다고 가정(31번과 동일).  
2. **재발급 완료** → 그 옛 값으로는 지금 로그인·API가 안 됨.  
3. force-push로 히스토리 지우기는 협업·Actions·로컬 클론 모두 영향 → **이번 범위 밖**.

## 권고

| 우선 | 조치 |
|------|------|
| 이미 함 | provider 시크릿 재발급 · Secrets만 실값 |
| 유지 | `check-no-committed-secrets.sh` · placeholder 커밋 금지 |
| 선택·승인 후 | `git filter-repo` / BFG 등으로 `.htaccess` 옛 실값 제거 + force-push + 전 클론 재설정 공지 |
| 불필요에 가까움 | 재발급만으로 실사용 방어는 충분. 히스토리 정리는 **위생·규정** 목적 |

## 하지 않은 것

- force-push  
- filter-repo / BFG  
- 시크릿 **값** 채팅·문서 출력  

## 승인자 결정 (2026-11-09)

**히스토리 삭제·force-push 하지 않음. 그대로 둔다.**  
이유: 네이버·카카오·구글 등 **전체 키 재발급 완료** → 옛 blob 실사용 위험 낮음. 위생용 재작성은 선택하지 않음.  
