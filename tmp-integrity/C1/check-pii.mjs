process.env.PLAYWRIGHT_BROWSERS_PATH = 'C:\\Users\\jetty\\AppData\\Local\\ms-playwright';

import { createRequire } from 'node:module';
import * as fs from 'node:fs';

const require = createRequire('file:///d:/work/study114/package.json');
const reportPath = 'd:\\work\\study114\\.wt\\integrity-tutor\\tmp-integrity\\C1\\full-inspection-report.json';
const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));

function checkPersonalInfo(text, label) {
  const issues = [];
  // Phone numbers: 010-xxxx-xxxx, 02-xxx-xxxx, 0xx-xxx-xxxx
  const phoneMatch = text.match(/01[0-9]-?\d{3,4}-?\d{4}|0[2-6][1-5]?-?\d{3,4}-?\d{4}/g);
  if (phoneMatch) {
    issues.push(`Phone found: ${phoneMatch.join(', ')}`);
  }
  // Emails:
  const emailMatch = text.match(/[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g);
  if (emailMatch) {
    issues.push(`Email found: ${emailMatch.join(', ')}`);
  }
  // Detailed address (e.g., xxx동 xxx호, 몇 호):
  const detailAddrMatch = text.match(/\d+동\s*\d+호|\d+호/g);
  if (detailAddrMatch) {
    issues.push(`Possible detailed address: ${detailAddrMatch.join(', ')}`);
  }
  console.log(`[${label}] Personal info check:`, issues.length ? issues : 'None found (CLEAN)');
}

if (report.studentModalInfo?.text) {
  checkPersonalInfo(report.studentModalInfo.text, 'Student Modal');
}
if (report.tutorModalInfo?.text) {
  checkPersonalInfo(report.tutorModalInfo.text, 'Tutor Modal');
}
for (const [id, data] of Object.entries(report.studyRooms || {})) {
  if (data.pc?.bodyText) {
    checkPersonalInfo(data.pc.bodyText, `Study Room ${id}`);
  }
}
