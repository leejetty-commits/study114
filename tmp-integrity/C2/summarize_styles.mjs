import fs from 'fs';

const data = JSON.parse(fs.readFileSync('d:/work/study114/.wt/integrity-tutor/tmp-integrity/C2/style_report.json', 'utf-8'));

console.log('=== PC H1 Styles ===');
for (const item of data.pc) {
  console.log(`${item.name} (${item.path}):`);
  console.log(`  H1: "${item.h1Style?.text}" | size: ${item.h1Style?.fontSize} | align: ${item.h1Style?.textAlign}`);
  console.log(`  Breadcrumb: ${item.breadcrumbText?.replace(/\n/g, ' ')}`);
  console.log(`  SideActive: ${item.sideActiveText?.replace(/\n/g, ' ')}`);
}

console.log('\n=== Mobile Overflow & H1 Styles ===');
for (const item of data.mobile) {
  console.log(`${item.name} (${item.path}):`);
  console.log(`  H1: "${item.h1Text}" | size: ${item.h1FontSize}`);
  console.log(`  Horizontal Scroll: ${item.hasHorizontalScroll} (diff: ${item.scrollDiff}px)`);
}
