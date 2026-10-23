import fs from 'fs';

const data = JSON.parse(fs.readFileSync('d:/work/study114/.wt/integrity-tutor/tmp-integrity/C2/part_c_summary.json', 'utf-8'));

console.log('=== PART C SUMMARY ===');
for (const dev of ['pc', 'mobile']) {
  console.log(`\n--- Device: ${dev} ---`);
  for (const item of data[dev]) {
    console.log(`\n[${item.name}] Target: ${item.targetPath} -> Final: ${item.finalUrl}`);
    console.log(`  Title: ${item.title}`);
    if (item.consoleErrors.length > 0) console.log(`  Console Errors:`, item.consoleErrors);
    if (item.pageErrors.length > 0) console.log(`  Page Errors:`, item.pageErrors);
    if (item.httpFailures.length > 0) console.log(`  HTTP Failures:`, item.httpFailures);
    console.log(`  Headings:`, item.headings.map(h => `${h.tag}: ${h.text}`).join(' | '));
    console.log(`  Blocked Indicator: ${item.hasBlockedIndicator}`);
    console.log(`  Visible Inputs count: ${item.visibleInputs.length}`);
    if (item.visibleInputs.length > 0) console.log(`  Inputs:`, item.visibleInputs);
    console.log(`  Text Preview:`, item.textPreview.replace(/\n+/g, ' ').slice(0, 200));
  }
}

if (data.blockedRequests.length > 0) {
  console.log('\n=== Blocked Requests ===');
  console.log(data.blockedRequests);
}
