# UDX-05 · 제작 봇 체크리스트 (1페이지)

작업명: ________________  날짜(KST): ________  빌드ID: ________

## 시작 전
- [ ] 필수 입력 7항 충족(범위·정본·K/C/D/F·폭·제출물·금지선언·종료조건)
- [ ] 정본 우선순위 확인 · 범위 밖 지시 = 참고만
- [ ] FORBIDDEN 재확인(운영/GitHub/DB/API/PG/Cursor/Stage완료/v1.0 등)

## KEEP / CHANGE
- [ ] KEEP 표 작성(보존·이유·회귀방법·금지범위)
- [ ] CHANGE 완료조건이 px/폭/열/selector/파일로 측정 가능
- [ ] DELETE·FORBIDDEN 작성

## BEFORE
- [ ] BEFORE 캡처·JSON·해시 보존
- [ ] 수정 전 산출물과 후 산출물 경로 분리

## 제작
- [ ] CHANGE 범위만 수정
- [ ] 변경 파일·selector 목록 기록
- [ ] 요청 폭·상태만 AFTER 증거 생성
- [ ] 측정 라벨: 정적 computed(운영 실측 오표기 없음)

## 자체 검사(최종 승인 아님)
- [ ] 요청 폭마다 inner/client/scrollWidth 기록
- [ ] KEEP 회귀 측정
- [ ] 가시성 게이트(name/price 등) 확인
- [ ] 단일 overall PASS로 뭉개지 않고 분리 판정

## 제출
- [ ] missing_refs/broken_local_links = []
- [ ] 금지 파일 없음
- [ ] ZIP 생성 후 **외부** SHA256(공백2칸+파일명)
- [ ] 첨부 한도 초과 시 사용자 PC 동일바이트 복사
- [ ] 보고서 제출 후 **정지**(다음 단계 자동 진입 금지)

판정 초안: PASS / FAIL / HOLD / 미판정 / CONDITIONAL(범위: ____)
