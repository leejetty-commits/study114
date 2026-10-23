const html = await fetch('https://study114.net/?n=' + Date.now(), { cache: 'no-store' }).then((r) => r.text());
const asset = [...html.matchAll(/assets\/[^"' ]+\.css/g)].map((m) => m[0])[0];
const css = await fetch('https://study114.net/' + asset, { cache: 'no-store' }).then((r) => r.text());
const i = css.indexOf('live-rail-slot--best');
const hits = [];
let from = 0;
while (hits.length < 8) {
  const j = css.indexOf('live-rail-slot--best', from);
  if (j < 0) break;
  hits.push(css.slice(Math.max(0, j - 40), j + 120).replace(/\s+/g, ' '));
  from = j + 20;
}
console.log('asset', asset, 'count', css.split('live-rail-slot--best').length - 1);
console.log('open', css.includes('live-rail-best__open'));
console.log('hotToken', css.includes('--rail-tone-hot'));
for (const h of hits) console.log('---', h);
