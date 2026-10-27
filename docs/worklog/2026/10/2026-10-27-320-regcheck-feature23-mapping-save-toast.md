RESTORE_BASE = `72be3c2b72701c261b012283628abdc663152c7c`

원복 절차:
1) 미커밋 코드: `git restore --source=HEAD -- preview/home-ui/src/study-room-reg/registration-check-model.js preview/study-room-ui/src/screens/step-facility.js preview/home-ui/src/study-room-reg/registration-check-edit.js preview/home-ui/src/study-room-reg/registration-check-copy.js`
2) 잘못된 커밋: `git reset --hard 72be3c2b72701c261b012283628abdc663152c7c` (push 후 force-push 금지 → 보고)

# 320 — 등록점검 경력특징2·3 판정 누락 수정 · 저장 성공 알림

- **과제:** 320
- **브랜치:** `cursor/320-regcheck-feature23-mapping-save-toast-20261027`
- **base:** `72be3c2b` (319+319b 병합 후 main)

## 문제
1. fieldOkMap.tierRoom에 feature_2/feature_3 미포함 → 공부방 프라임 부족 목록에 저장해도 잔존
2. embed 상세정보2 저장 성공 시 알림 없음 (onSaved 경로)
3. 드로어 저장 성공 시 알림 없음
