# UDX-05 · 독립 검사 체크리스트 (1페이지)

대상 팩/ZIP: ________________  검사일(KST): ________  검사자(봇): ________

## 독립성
- [ ] 제작 설명을 증거로 쓰지 않음
- [ ] 실패를 즉시 수정하지 않고 먼저 FAIL 보고

## 패키지
- [ ] ZIP 테스트 통과
- [ ] HTML/CSS 로컬 참조 재귀 · missing/broken = 0
- [ ] 목록↔ZIP 일치 · 금지 파일 없음
- [ ] 외부 SHA256 형식 검증(`sha256sum -c`)
- [ ] ZIP 내부 자기해시 없음

## 폭·실측
요청 폭: [ ]1440 [ ]960 [ ]768 [ ]430 [ ]390 [ ]360 [ ]기타____
- [ ] 각 폭 viewport=innerWidth=clientWidth(불일치 시 측정 무효)
- [ ] scrollWidth ≤ innerWidth(해당 게이트)
- [ ] 문서 수치 ↔ computed 일치
- [ ] 캡처·JSON 동일 빌드
- [ ] 미검사 폭에 PASS 표기 없음

## 모바일/터치(해당 시)
- [ ] 본문 최소폭(예: 360≥328, 390≥358) 또는 작업 정본
- [ ] 카드/옵션 최소폭·가시성 true
- [ ] 터치 44×44
- [ ] GNB 잘림/비가시 → mobileGnb FAIL (`scroll_disclosure`≠PASS)

## 회귀·역할
- [ ] KEEP 회귀
- [ ] 화면 역할 혼동 없음(예: 유료=샘플, 목록=홈/찾기)
- [ ] 요구 밖 개선·정책 발명 없음

## 판정(분리)
| 키 | 결과 |
|---|---|
| 작업단위 | |
| 모바일본문 등 | |
| mobileGnb 등 | |
| stageOverall | HOLD/미판정/… |
| designManualV1 | NOT_DECLARED |

최종: PASS / FAIL / HOLD / 미판정 / CONDITIONAL  
Stage 5B 완료·v1.0·운영 반영: **선언 안 함**
