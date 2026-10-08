# 148 · Cursor — 고객센터 게스트 카피 (로컬 · 범위 잠금)

- 작성: 2026-09-28 KST
- 정본 메모: [148](148-support-copy-guest-audit-memo.md)
- 선행: **146·147 로컬 수락** (이용안내 WIP 유지 · 이 티켓에서 guide/** 건드리지 말 것)
- 상태: **Cursor 구현 대기** · push · `build:dothome` **금지** (148 수락 후 사용자가 「배포」할 때 146+147+148 함께)
- 저장소: `leejetty-commits/study114` · `D:\work\study114`
- 한 줄: 고객센터 용어·허브·FAQ·운영문의 리드만. **에스크로 단어 제거**. 이미지·엔진 금지.

---

## 0. 오버 방지

1. **148만.** guide/** · 관리자 · 유료상품 UI · 비교엔진 금지.
2. 이용안내 본문 통째 복제 금지. 겹치는 주제는 **짧게 + 이용안내 링크**.
3. `#/support/safe` → `#/guide/safe` 리다이렉트 **유지**. 고객센터에 안전 단독 허브 재신설 금지.
4. 「공개」일괄 치환 금지 (약관 노출·개인정보 문맥 유지). parent-check 등 메모 §2만.
5. **이미지·캡처 패키지 = 이번 티켓 제외** (2차).
6. 미추적 docs/046·047·README 건드리지 말 것. guide WIP stage 금지.

---

## 1. Allowlist (쓰기)

| 파일 | |
|------|--|
| `preview/home-ui/src/support/support-copy.js` | OK |
| `preview/home-ui/src/support/screens.js` | OK |
| `preview/home-ui/src/support/nav.js` | OK (메뉴 라벨) |
| `preview/home-ui/src/policy-copy.js` | OK (에스크로→대금 보관·안전결제 문구만) |

실사용 FAQ 시드가 위 밖이면 **보고 후 멈추고** allowlist 확장 요청. 추측으로 plans/**·admin/** 수정 금지.

---

## 2. Must

### 2.1 에스크로 제거 (잠금)
- 손님 보이는 고객센터·정책 카피에서 **「에스크로」 단어 0**.
- FAQ 제목 예: 「안전번호나 대금 보관이 있나요?」 / 답: 없음·안전번호·대금 보관·안전결제·보증·분쟁 대리 없음.
- 원칙·약관 고지: 「에스크로·지급 보류」→「대금 보관·안전결제」등 **없는 제도 이름 안 가르침**.

### 2.2 용어 순화
- **공급자** → **공부방·과외쌤** (FAQ·체크리스트 제목·audience)
- **포지션 상품** → **동네 노출(기간) 상품**
- Hot·추천 → 사이트에 보이는 **주목·추천 등 광고 표시** 이름에 맞춤
- 좌메뉴·H1·버튼 통일: **운영문의** / 버튼 **운영문의 남기기** (메모 잠금 — 「문의」혼용 정리)

### 2.3 허브(공지 상단) §4.1
리드에 이용안내·운영문의·쪽지 구분. 바로가기 **이용안내** · **안전과외(약관·정책 safety)** 추가. 커뮤니티 유지는 OK.

### 2.4 운영문의 §4.2 · 자료실 §4.3
지정 리드 문장 반영. 「이메일만 보내면 된다」오해 제거 → 로그인 후 폼 + 마이페이지→내 문의 내역.

### 2.5 FAQ §5.1 6문항 교체 + §5.2 핵심 추가(최소 이용·채널 4 + 찾기/등록 짧게 3 + 안전 4 + 계정·유료 핵심)
이용안내와 충돌 시 146/147 잠금 우선. 비교 최대3은 한 줄+이용안내 링크.

### 2.6 안전과외 시드 §6 (support-copy GUIDE 등)
provider-check 제목 「공부방·과외쌤 체크리스트」. 공개→표시/보여 주기(해당 문맥만). 손님은 정책 safety·허브로 모음.

### 2.7 notice-001
「접이식」→ 현재 IA: 약관·정책의 안전과외 · 이용안내의 안전이용.

---

## 3. Must not
- guide/** 수정 (146·147 WIP)
- 이미지 자산 추가
- push / build:dothome
- `#/support/safe`를 고객센터 안전 허브로 되돌리기
- 「학생 의뢰」

---

## 4. 수락 스모크 (게스트)
1. `#/support` 허브: 이용안내·안전과외 바로가기 · 쪽지≠운영문의 리드
2. `#/support/faq`: 에스크로 0 · 공급자 0 · 수정 6+추가 FAQ
3. `#/support/contact`(또는 문의): 운영문의 라벨 · §4.2
4. `#/support/library`: §4.3 한 줄
5. `#/support/policies/safety` 접근 가능
6. `#/support/safe` → guide/safe 유지
7. allowlist 밖 dirty 증가 없음 · hash-object 보고

---

## 5. 붙여넣기 (Cursor) — 문장 인라인

아래 블록을 Cursor에 그대로 사용. study114-ds 없어도 진행.

```text
[148] 고객센터 게스트 카피 · 로컬 · 범위 잠금

저장소: leejetty-commits/study114 · D:\work\study114
git -c safe.directory=D:/work/study114
정본: study114-ds/docs/148-support-copy-cursor-ticket-2026-09-28.md
(메모 전문은 이 지시문 Must에 인라인. guide/** 절대 수정 금지 — 146·147 WIP 유지)

Allowlist ONLY 쓰기:
- preview/home-ui/src/support/support-copy.js
- preview/home-ui/src/support/screens.js
- preview/home-ui/src/support/nav.js
- preview/home-ui/src/policy-copy.js
FAQ 시드가 밖이면 멈추고 보고. plans/**·admin/**·guide/**·이미지·push·build:dothome 금지.

Must:
1) 「에스크로」손님 카피 0. FAQ: 「안전번호나 대금 보관이 있나요?」→ 없음(안전번호·대금보관·안전결제·보증·분쟁대리 없음). 원칙/정책 「에스크로·지급 보류」→「대금 보관·안전결제」류로.
2) 공급자→공부방·과외쌤. 포지션→동네 노출(기간) 상품. 메뉴/H1/버튼=운영문의 / 운영문의 남기기.
3) 허브 리드:
「필요한 답을 빠르게 / 자주 묻는 질문에서 먼저 / 쓰는 방법→이용안내 / 운영팀→운영문의 / 쪽지≠운영문의」
바로가기 추가: 이용안내(찾기·등록·찜·쪽지) · 안전과외(#/support/policies/safety)
4) 운영문의 리드:
「운영문의=운영팀. 오류·정책·계정. 수업 상담=쪽지. 접수 후 마이페이지→내 문의 내역」
5) 자료실: 「안내 자료·양식. 일부 로그인 후. 이용 방법은 이용안내 먼저」
6) FAQ 기존6을 메모 §5.1 문장으로 교체 + §5.2 핵심 추가(채널·짧게 찾기/등록+이용안내링크·안전·유료). 비교 최대3은 짧게+이용안내.
7) GUIDE/시드: provider-check 제목 「공부방·과외쌤 체크리스트」. parent-check 「공개」→표시/보여 주기(해당만). #/support/safe→guide/safe 유지.
8) notice-001: 접이식→「약관·정책의 안전과외 · 이용안내의 안전이용」

Done: 게스트 support 스모크 · 에스크로0 · hash-object · 배포하지 마.
```
