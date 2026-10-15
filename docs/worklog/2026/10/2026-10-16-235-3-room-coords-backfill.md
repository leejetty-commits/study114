# 235-3 기존 공부방 좌표 채우기

- 날짜: 2026-10-16
- 기준: main `4aab4856`
- 브랜치: `cursor/room-coords-backfill-20261016`
- 승인: 이 세션은 자기 작업을 승인하지 않음
- DB에는 쓰지 않음. 13번은 제외.

## 지시 원문

[235-3] 기존 공부방 좌표 채우기 (한 번만 돌리는 데이터 작업)

기준: main 4aab4856. 새 브랜치. force-push 금지, git add -A 금지.

목표
운영 DB study_rooms에서 삭제되지 않았고 latitude·longitude가 NULL인 공부방(현재 6·10·11·12번)의 좌표를 그 방의 address_text(사업장주소)로 채운다. 13번은 이미 들어 있으니 건드리지 않는다.

규칙
1. 좌표는 각 방의 사업장주소 문자열로만 구한다. 동·단지·홍보지역 위치로 대신 채우지 않는다.
2. 서버에는 지오코딩 키가 없으니, 지도 키가 있는 브라우저 화면(관리자 전용 또는 1회용 스크립트 페이지)에서 네이버 지오코딩으로 좌표를 구한다. 키나 비밀값을 커밋에 넣지 않는다.
3. 결과는 바로 DB에 쓰지 않는다. 방마다 id, 주소, 구한 위도·경도를 표로 보여 주고, 종현이 phpMyAdmin에서 돌릴 UPDATE 문을 만들어 준다(WHERE id = ? AND latitude IS NULL 조건 포함).
4. 좌표를 못 구한 방은 NULL로 두고 표에 「못 찾음」으로 적는다.
5. 표 구조, 가입·마이페이지 저장 코드, 지도 핀 그리기는 바꾸지 않는다(4단계에서 함).

## 화면

- `preview/home-ui/room-coords-once.html`
- 주소는 2026-10-16 phpMyAdmin 조회의 `address_text`만 넣었다. 상세주소 칸은 넣지 않았다.
- 화면은 저장하지 않고, 표와 phpMyAdmin 문장만 보여 준다.

## 브라우저에서 구한 결과

| id | 주소 | 위도 | 경도 | 결과 |
|---|---|---|---|---|
| 6 | 경기 의정부시 능곡로26번길 40 (신곡동, 건영아파트) | 37.7399316 | 127.0624999 | 찾음 |
| 10 | 부산 해운대구 중동2로 11 (중동) | 35.1631769 | 129.1636340 | 찾음 |
| 11 | 경기 성남시 분당구 분당로 50 (수내동) | 37.3828194 | 127.1189254 | 찾음 |
| 12 | 경남 김해시 계동로102번길 9 (대청동, 갑오마을주공2단지) | 35.1864526 | 128.7947013 | 찾음 |

못 찾은 방은 없다. 13번은 문장에 없다.

## phpMyAdmin UPDATE

```sql
UPDATE study_rooms
SET latitude = 37.7399316, longitude = 127.0624999
WHERE id = 6 AND latitude IS NULL;

UPDATE study_rooms
SET latitude = 35.1631769, longitude = 129.1636340
WHERE id = 10 AND latitude IS NULL;

UPDATE study_rooms
SET latitude = 37.3828194, longitude = 127.1189254
WHERE id = 11 AND latitude IS NULL;

UPDATE study_rooms
SET latitude = 35.1864526, longitude = 128.7947013
WHERE id = 12 AND latitude IS NULL;
```

## 확인용 SELECT

```sql
SELECT id, address_text, latitude, longitude
FROM study_rooms
WHERE deleted_at IS NULL
ORDER BY id;
```
