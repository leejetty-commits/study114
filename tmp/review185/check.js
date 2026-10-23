const fs=require('fs');
const chart=fs.readFileSync('preview/home-ui/src/tutor-activity-chart.js','utf8');
const tutor=fs.readFileSync('preview/home-ui/src/screens/tutor.js','utf8');
const seed=fs.readFileSync('preview/home-ui/src/tutor-home-seed.js','utf8');
const checks={
  chart_no_note: !(chart.includes('act-bars__note')||chart.includes('예시')),
  chart_no_EXPOSURE: !chart.includes('EXPOSURE'),
  chart_no_MOCK: !chart.includes('MOCK'),
  chart_uses_searchApi: chart.includes('searchApi'),
  chart_uses_saved_regions: chart.includes('readTutorHomeRegions'),
  chart_no_button: !chart.includes('<button'),
  chart_no_data_tutor_region: !chart.includes('data-tutor-region'),
  chart_maxVal: chart.includes('maxVal'),
  tutor_span_pill: tutor.includes('span class="my-box__region-pill'),
  tutor_no_data_tutor_region: !tutor.includes('data-tutor-region'),
  tutor_guides: (tutor.match(/my-box__guide/g)||[]).length===2,
  tutor_default_mypage: tutor.includes("getDefaultMypagePath('tutor')"),
  seed_seoul_fallback: seed.includes("'서울시'")||seed.includes('"서울시"'),
  seed_no_우리동네: !seed.includes('우리동네'),
};
console.log(JSON.stringify(checks,null,2));
const guideLines=[];
tutor.split(/\n/).forEach((l,i)=>{ if(l.includes('my-box__guide')) guideLines.push((i+1)+':'+l.trim()); });
console.log('GUIDES', guideLines);
