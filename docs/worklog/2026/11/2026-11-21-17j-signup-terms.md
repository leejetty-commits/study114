# 17j 가입 약관 화면 정리

- 기준: `origin/main` `9e1cf264` (PR #292)
- 2026-11-21. 약관 「보기」가 화면을 떠나지 않게 한다.

## 지시

약관 화면에서 「보기」는 새 탭이나 주소 이동 없이 같은 화면 위 창으로 연다. PC는 가운데, 375px 이하는 아래에서 올라오는 창이다. 본문은 `getPolicyPage`의 terms, privacy, marketing 원문이다. 필수 두 칸은 표시 전용이고, 창을 맨 아래까지 본 뒤 「읽었고 동의합니다」를 체크해야 앞 칸이 켜진다. 마케팅 창은 읽기 전용이고, 동의 라디오는 제목 바로 아래 한 항목이다. 전체 동의는 없앤다. 「다음」은 필수 두 칸과 마케팅 선택이 있을 때 켜지고, 저장 로직은 그대로다.

허용 파일: `preview/auth-ui/src/screens/signup-terms.js`, `preview/auth-ui/src/styles/base.css`, `preview/auth-ui/src/styles/theme-v1.css`(`.terms-all`만), 이 worklog.

## 수정

- 「보기」의 `window.open`을 겹침 창으로 바꿨다. 닫기는 닫기 버튼, 바깥 클릭, Esc. 480px 이하(375 폭 포함)는 아래 시트, 그 위는 가운데 창이다.
- 필수 동의는 창 맨 아래 체크와 앞 칸이 같이 움직인다.
- 전체 동의 마크업과 `.terms-all` 스타일을 뺐다.
- 로그인 링크와 「다음」 저장(`termsChecked`, `marketingConsent`, `markTermsAgreed`)은 그대로다.
