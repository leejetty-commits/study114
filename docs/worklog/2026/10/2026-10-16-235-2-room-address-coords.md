# 235-2 공부방 사업장주소 좌표 저장

- 날짜: 2026-10-16
- 기준: main `0363d509`
- 브랜치: `cursor/room-address-coords-20261016`
- 승인: 이 세션은 자기 작업을 승인하지 않음

## 지시 원문

[235-2] 공부방 사업장주소 좌표 저장 (가입·마이페이지)

기준: main 0363d509. 새 브랜치에서 작업하고 main에 직접 올리지 마세요. force-push 금지, git add -A 금지.

목표
공부방 사업장주소(study_rooms.address_text)를 저장할 때 그 주소의 위도·경도를 latitude·longitude에 같이 저장한다. 표 구조는 바꾸지 않는다(칸은 이미 있음).

규칙
1. 가입과 마이페이지에서 사업장주소를 검색해 고르면, 브라우저의 기존 네이버 지도 지오코딩(preview/shared/naver-map.js의 naver.maps.Service.geocode)으로 그 주소의 좌표를 구해 저장 값에 넣는다.
2. 사업장주소가 바뀌면 좌표도 새로 구한다. 마이페이지에서 예전에 불러 둔 state.latitude·longitude를 새 주소와 함께 다시 보내지 않는다.
3. 좌표를 구하지 못하면 latitude·longitude는 NULL로 두고 저장은 막지 않는다. 동·단지·홍보지역 위치로 좌표를 대신 채우지 않는다.
4. 행정동/아파트단지 분기, 홍보지역1이 사업장주소를 따라가는 처리(preview/shared/study-room-basic-form.js, BasicRegisterService.php의 홍보 슬롯 저장)는 바꾸지 않는다.
5. 화면에 개발 용어를 보이지 않는다. 좌표 칸이나 좌표 값은 유저에게 보이지 않는다.

손댈 범위 (대략 4파일)
- preview/auth-ui/src/screens/signup-basic.js
- src/Auth/BasicRegisterService.php registerStudyRoom
- preview/study-room-ui/src/screens/step-basic.js와 form-collect.js
- 마이페이지 저장(StudyRoomRegisterService.php saveLocation)은 이미 좌표를 저장하니 바꿀 필요가 있을 때만 손댄다.

하지 않는 일
- 이미 있는 5곳의 좌표 채우기(3단계), 지도 핀 그리기 변경(4단계)은 이번에 하지 않는다.
- DB 구조 변경, 새 칸 추가는 하지 않는다.

## 구현

- 사업장주소를 고른 뒤에만 `naver.maps.Service.geocode`로 그 주소 문자열의 좌표를 구한다.
- 좌표는 그 주소 문자열에만 붙인다. 주소가 바뀌었는데 좌표를 못 구하면 빈 값으로 저장하고, 서버는 위도·경도를 둘 다 NULL로 둔다.
- 홍보지역 1이 사업장주소를 따라가는 처리와 행정동/아파트단지 분기는 그대로다.
- 현황 화면의 위도·경도 줄은 빼서 좌표가 화면에 보이지 않게 했다.

## 확인

- `scripts/verify-room-address-coords.mjs` OK
- `scripts/verify-room-address-coords.php` OK
- 이 PC PHP에는 sqlite 드라이버가 없다. 운영 DB와 기존 5곳은 쓰지 않았다.
- 아래 값은 가입·마이페이지 저장 SQL에 들어가는 좌표 쌍이다.

```
signup_request address_text=서울 강남구 삼성로 212 latitude=37.5065123 longitude=127.0536123
mypage_address_change address_text=부산 해운대구 중동2로 11 latitude=35.1631000 longitude=129.1636000
stored id=901 address_text=서울 강남구 삼성로 212 latitude=37.5065123 longitude=127.0536123
stored id=902 address_text=부산 해운대구 중동2로 11 latitude=35.1631000 longitude=129.1636000
stored id=903 address_text=부산 해운대구 중동2로 11 latitude=NULL longitude=NULL
```

- id=903은 좌표를 못 구한 경우다. 주소는 남고 위도·경도만 NULL이다.
- 새 주소에는 예전 좌표를 다시 붙이지 않는 것도 스크립트에서 확인했다.
- 브라우저에서 실제 주소 검색은 하지 못했다. 이 작업 폴더에 지도 키가 없다.
