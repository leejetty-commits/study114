# 234 · Cursor 작업지시 — 찾기 레일 「지금 고민 HOT」 통일 (231 U1 번복)

- 작성: 우동공과2(개발팀장), 2026-10-15. 상태: **완료 · 배포됨**.
- 종현 결정 (t1684~t1686, 2026-10-15 16:24 KST): 찾기 레일의 「많이 보는 고민」은 HOT 과 같은 기능이므로 **이름을 통일**한다. 231 U1(「찾기·등록 HOT 은 지금처럼」)을 **번복**한다.
- 레일 항목 종류는 **지금 있는 것으로 끝**. 새 항목·새 이름은 만들지 않는다.

## 1. 바뀐 것
| | 전 | 후 |
|---|---|---|
| 작은 글자 | 「탐색 도움」 | 「오늘의 현장」 |
| 제목 | 「많이 보는 고민」 | 「지금 고민 HOT」 |
| 카드·아래 버튼 누름 | 그 글 방 팝업 | 「지금 고민 HOT」 10개 팝업(231 2단계와 같은 팝업) |

- 코드: `preview/home-ui/src/right-rail.js:176` `railConcernControl` 슬롯 조건을 `home_right_rail` 에서 `home_right_rail || search_right_rail` 로 넓힘. `liveFieldCopy` 의 찾기 문구를 홈과 같게.
- **등록 레일은 그대로**(그 글 방 팝업).

## 2. 커밋·배포
| 커밋 | 내용 |
|---|---|
| `ec7dc905` | `fix(rail): 찾기 레일을 「지금 고민 HOT」 10개 팝업으로 통일 (234, 231 U1 번복)` — `right-rail.js`, `scripts/verify-rail-info-banners.mjs` |
| `a32d86c4` | 후속 수정: `scripts/verify-rail-concern-banners.mjs` 검사 `m1_search_hot_inpage`(366행 근처) 기대값을 방 팝업 버튼(`data-concern-rail-open=`)에서 HOT 팝업 버튼(`data-concern-hot-open`)으로 변경 |

- main: `f71db4db..a32d86c4`
- Deploy run `38705352820` **성공**.

## 3. 합격 기준
- ①~⑤ **모두 통과**.
- 후속: `m1_search_hot_inpage` 기대값 수정(`a32d86c4`).
