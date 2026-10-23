import { readFileSync } from 'node:fs';

const src = readFileSync('preview/home-ui/src/concern/screens.js', 'utf8');
const start = src.indexOf('function renderCommentsTree(');
const end = src.indexOf('\nconst CONCERN_PHOTO_MAX');
const esc = (value) => String(value ?? '');
const formatTime = () => '방금';
const fn = new Function('esc', 'formatTime', `${src.slice(start, end)}\nreturn { renderCommentsTree, renderCommentItem };`);
const { renderCommentsTree } = fn(esc, formatTime);

const access = { canComment: true };
const comment = {
  id: 11,
  authorUserId: 7,
  authorDisplayName: 'A',
  status: 'visible',
  body: '댓글',
  createdAt: '2026-10-23T00:00:00Z',
  replies: [{
    id: 12,
    parentCommentId: 11,
    authorUserId: 7,
    authorDisplayName: 'A',
    status: 'visible',
    body: '답글',
    createdAt: '2026-10-23T00:00:00Z',
    replies: [],
  }],
};

function buttons(html, id) {
  const chunk = html.split(`data-concern-delete-comment="${id}"`).length - 1;
  const report = html.includes(`data-concern-report-comment="${id}"`);
  const react = html.includes(`data-concern-react-comment="${id}"`);
  return { delete: chunk, report, react };
}

const cases = [
  ['손님', renderCommentsTree([comment], access, 0, 1, 'concern', false)],
  ['일반 B', renderCommentsTree([comment], access, 8, 1, 'concern', false)],
  ['작성자 A', renderCommentsTree([comment], access, 7, 1, 'concern', false)],
  ['관리자', renderCommentsTree([comment], access, 9, 1, 'concern', true)],
  ['인자 생략', renderCommentsTree([comment], access, 8, 1, 'concern')],
];
const deleted = { ...comment, status: 'deleted', replies: [{ ...comment.replies[0], status: 'deleted' }] };
const hidden = { ...comment, status: 'hidden', replies: [{ ...comment.replies[0], status: 'hidden' }] };
cases.push(['관리자 삭제됨', renderCommentsTree([deleted], access, 9, 1, 'concern', true)]);
cases.push(['관리자 숨김', renderCommentsTree([hidden], access, 9, 1, 'concern', true)]);

let failed = 0;
function ok(name, cond) {
  if (cond) console.log(`PASS  ${name}`);
  else {
    failed += 1;
    console.error(`FAIL  ${name}`);
  }
}

const guest = buttons(cases[0][1], 11);
const guestReply = buttons(cases[0][1], 12);
ok('손님 댓글·답글 삭제 없음', guest.delete === 0 && guestReply.delete === 0 && !guest.report);

const other = buttons(cases[1][1], 11);
const otherReply = buttons(cases[1][1], 12);
ok('일반 B 삭제 없음, 신고·반응 있음', other.delete === 0 && otherReply.delete === 0 && other.report && other.react && otherReply.report);

const owner = buttons(cases[2][1], 11);
const ownerReply = buttons(cases[2][1], 12);
ok('작성자 삭제 있음, 신고 없음', owner.delete === 1 && ownerReply.delete === 1 && !owner.report && !ownerReply.report);

const admin = buttons(cases[3][1], 11);
const adminReply = buttons(cases[3][1], 12);
ok('관리자 댓글·답글 삭제·신고·반응', admin.delete === 1 && adminReply.delete === 1 && admin.report && admin.react && adminReply.report && adminReply.react);

const omitted = buttons(cases[4][1], 11);
ok('isAdmin 생략은 삭제 없음', omitted.delete === 0);

const adminDeleted = buttons(cases[5][1], 11);
const adminHidden = buttons(cases[6][1], 12);
ok('삭제·숨김은 관리자도 삭제 버튼 없음', adminDeleted.delete === 0 && adminHidden.delete === 0);

if (failed) process.exit(1);
