const fs=require("fs");
const j=fs.readFileSync("preview/home-ui/src/home-marketing-banner.js","utf8");
const c=fs.readFileSync("preview/home-ui/src/styles/home-marketing-banner.css","utf8");
const trio=j.match(/const HOME_PROMO_TRIO = \[[\s\S]*?\];/)[0];
const checks={
  files:fs.readFileSync("tmp/181b-files.txt","utf8").trim().split(/\r?\n/),
  paths:["/promo/study-room","/promo/tutor","/promo/parent"].every(p=>trio.includes("path: '"+p+"'")),
  cream:c.includes("background: #f6f1e8"),
  border:c.includes("border: 1px solid #e6dfd4"),
  radius:c.includes("border-radius: 12px"),
  leftBar:c.includes(".home-promo-trio__card::before"),
  hover:c.includes("var(--home-promo-hover-bg)") && c.includes(".home-promo-trio__card:hover"),
  col3:c.includes("repeat(3, minmax(0, 1fr))"),
  col1at720:/@media \(max-width: 720px\) \{\s*\.home-promo-trio \{\s*grid-template-columns: 1fr;/.test(c),
  surfaces:j.includes("new Set(['guest', 'parent', 'study_room', 'tutor'])"),
  banned:["paid","픽","프라임"].filter(w=>trio.includes(w)),
  copy:{
    study:["우리동네 공부방","내가 찾는 공부방","가까운 곳부터 비교하고, 등록은 가볍게 시작하세요"].every(s=>trio.includes(s)),
    tutor:["우리동네 과외쌤","나의 과외쌤은 어디에?","활동 지역·주력 과목으로 프로필을 분명하게"].every(s=>trio.includes(s)),
    parent:["학생 · 학부모 보조","학생, 인재로 만들기","가까운 곳부터 비교하고, 쪽지로 시작하세요"].every(s=>trio.includes(s)),
  },
  accents:{study:c.includes("--home-promo-accent: #266bc4"), tutor:c.includes("#0f766e"), parent:c.includes("#c2410c")}
};
console.log(JSON.stringify(checks,null,2));
