# 238 가입 화면 입력값 유지 — Cursor 지시서 (2026-10-16)

## 문제 (점검 E1, `ds/docs/room-audit-2026-10-15/REPORT-공부방모드-점검.md` 33행)
가입폼에서 다음으로 갔다가 「← 가입폼」으로 돌아오면 주소, 비밀번호, 수신 동의가 지워집니다. 약관 화면으로 돌아가면 체크가 모두 풀립니다.
- `preview/auth-ui/src/screens/signup-form.js`
  - 289-300행: 다음을 누르면 `signupState.accountDraft`에 주소 3칸과 수신 동의까지 저장합니다.
  - 19-22행: 그런데 다시 그릴 때는 이메일·이름·휴대폰만 채웁니다.
  - 107-135행(주소 3칸)과 143-160행(이메일·문자 수신 동의 체크)은 저장값을 쓰지 않습니다.
- `preview/auth-ui/src/screens/signup-terms.js`
  - 15-30행(약관 체크), 52행(전체 동의): 그릴 때 이전 체크 상태를 보지 않습니다.
  - 상태에는 `termsAgreed`(true/false) 하나만 있고(`state.js` 107행 `markTermsAgreed`), 칸별 체크는 저장하지 않습니다.

## 할 일
1. **signup-form.js**: 가입폼으로 돌아오면 `accountDraft`로 다시 채웁니다.
   - 주소 3칸: 우편번호 `address_zip`, 도로명 주소 `address`, 상세주소 `address_line2`
   - 수신 동의 체크 2개: 이메일 `email_consent`, 문자 `sms_consent`
   - **비밀번호와 비밀번호 확인은 다시 채우지 않습니다**(종현 확정).
   - 저장값이 있을 때만 비밀번호 칸 근처에 짧은 안내를 한 줄 보여 줍니다. 예: 「비밀번호는 다시 입력해 주세요.」 기존 안내 문구 클래스(`form-hint`)를 그대로 씁니다.
2. **signup-terms.js**: 약관 화면으로 돌아오면 체크를 그대로 보여 줍니다.
   - 칸별 체크(서비스·개인정보·위치·마케팅)와 「전체 동의」 상태를 모두 유지합니다.
   - 칸별 상태를 넣을 곳이 없으면 `state.js`에 칸 하나만 추가합니다. 예: `termsChecked: {}`. `resetSignupState`에서 같이 비웁니다.
   - 다음을 누를 때 체크 상태를 저장합니다.

## 작업 범위 (꼭 지킬 것)
- 손대도 되는 파일: `preview/auth-ui/src/screens/signup-form.js`, `preview/auth-ui/src/screens/signup-terms.js`
- 꼭 필요할 때만: `preview/auth-ui/src/state.js`(최소 변경)
- 손대지 않는 것: 서버 코드(PHP), 다른 가입 단계(`signup-basic.js`, `signup-role.js` 등), 스타일(CSS), 기존 문구
- 범위 밖을 고쳐야 할 것 같으면 **멈추고 보고**합니다.

## 순서
1. origin/main에서 새 브랜치 `cursor/238-signup-keep-values-20261016`을 만듭니다.
2. 위 내용을 고칩니다.
3. 고친 파일만 하나씩 지정해서 add합니다(`git add -A` 금지).
   커밋 메시지: `238 fix(signup): 가입폼·약관으로 돌아올 때 입력값 유지(비밀번호 제외)`
4. 브랜치를 push하고 **멈춥니다**. main에 합치지 않습니다. force push는 하지 않습니다.

## 확인 방법
1. 약관에 동의 → 가입폼을 모두 입력 → 다음 → 「← 가입폼」. 주소 3칸과 수신 동의 체크가 남아 있고, 비밀번호 두 칸은 비어 있으며 안내가 보이는지 확인합니다.
2. 약관 화면까지 돌아갑니다. 칸별 체크와 「전체 동의」가 그대로인지 확인합니다.
3. 새로고침하면 값이 지워져도 됩니다(정상).
4. `git diff origin/main --stat`에 위 2~3파일만 있는지 확인합니다.

## 보고
브랜치 이름, 커밋 번호, 바꾼 파일과 줄 수, 확인 1~3의 결과를 보고합니다.
