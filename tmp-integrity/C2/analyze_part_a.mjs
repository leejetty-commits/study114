import fs from 'fs';

const data = JSON.parse(fs.readFileSync('d:/work/study114/.wt/integrity-tutor/tmp-integrity/C2/part_a_summary.json', 'utf-8'));

console.log('=== PART A SUMMARY ===');
for (const dev of ['pc', 'mobile']) {
  console.log(`\n--- Device: ${dev} ---`);
  for (const item of data[dev]) {
    console.log(`\n[${item.name}] Target: ${item.targetPath} -> Final: ${item.finalUrl}`);
    console.log(`  Title: ${item.title}`);
    if (item.consoleErrors.length > 0) console.log(`  Console Errors:`, item.consoleErrors);
    if (item.pageErrors.length > 0) console.log(`  Page Errors:`, item.pageErrors);
    if (item.httpFailures.length > 0) console.log(`  HTTP Failures:`, item.httpFailures);
    if (item.suspiciousStrings.length > 0) console.log(`  Suspicious:`, item.suspiciousStrings);
    console.log(`  Headings:`, item.headings.map(h => `${h.tag}: ${h.text}`).join(' | '));
    console.log(`  Tabs:`, item.tabsState.map(t => `${t.text}${t.active ? '(A)' : ''}`).join(', '));
  }
}

if (data.blockedRequests.length > 0) {
  console.log('\n=== Blocked Requests ===');
  console.log(data.blockedRequests);
}
