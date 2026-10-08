# 124 · 홈 팝업 Phase 4(티켓 121) 수락

- 커밋: `8eaf74d113efa0d096d7b64aeb2b0f5c8f4d3229` (부모 `2a2fe69`), 로컬 전용. push·build:dothome 없음.
- 판정: **수락**. 홈 팝업 Phase 1a~4 로컬 완료.

## 대조 결과
- 파일 5개, 전부 121 허용 목록. `site-settings-store.js`는 수정 없이 이 화면에서 호출만 끊음(`savePopup`/`deletePopup` import 제거).
- 신규 `admin/home-popup-api.js`: 목록·1건·저장·삭제, `credentials:'include'`, 서버 오류 코드를 한글 문구로 바꿈.
- 관리자 화면: 목록·폼 출력 전부 `esc()` 처리. 미리보기는 새 탭 `/?popupPreviewId=<id>#...`.
- `gate.js`: 관리자 + 숫자 `popupPreviewId`일 때만 관리자 API로 1건 받아 미리보기(스위치 없음). 우선순위 popupPreviewId > popupDemo > 엔진. 관리자 아니거나 실패하면 엔진.
- `mount.js`: 행 미리보기에서는 패밀리 스위치 숨김(1줄).
- 스모크: 보고 전 항목 통과, 테스트 행 0건, jetty 메일 인증 NULL 복구.
- 비활성 유형 문구 칸은 기존 `.sup-field{display:flex}` 때문에 인라인 `display:none`으로 가림. 새 CSS 없음. 허용.

## 남은 것
- 배포 대기: 커밋 f63924a·345590b·05f8df7·997ae27·2a2fe69·8eaf74d. 사용자가 「배포」라고 할 때만. 운영 DB에 069 수동 적용 필요.
- 워킹트리 잔여물(screens.js 빈 줄, 미추적 docs 046·047·README)은 커밋 금지 유지.
