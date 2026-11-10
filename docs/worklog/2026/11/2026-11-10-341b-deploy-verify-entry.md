# 341b 배포 Verify — entry JS를 index.html에서 읽기 (2026-11-10)

선행: PR #152 (`1c837464`) 머지 후 Deploy `42782993999` 실패.

## 원인
`Verify build output`가 `ls public/assets/index-*.js | head -n 1`로 파일을 고름.
341 분할 후 작은 동적 청크가 알파벳 앞에 오면 네이버 지도 키 `grep`이 실패한다.

## 수정
`.github/workflows/deploy.yml` — `public/index.html`의 `/assets/index-*.js` entry만 검사.
