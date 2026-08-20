import fs from 'node:fs';
const files = [
  'public/assets/brand/room-card-default-basic.svg',
  'public/assets/brand/room-card-default-pick.svg',
  'public/assets/brand/room-card-default-prime.svg',
];
for (const f of files) {
  const buf = fs.readFileSync(f);
  const t = buf.toString('utf8');
  const ok =
    t.includes('\uC6B0\uB3D9\uACF5\uACFC') &&
    t.includes('\uC6B0\uB9AC\uB3D9\uB124') &&
    t.includes('\uACF5\uBD80\uBC29 \uACFC\uC678');
  console.log(f, ok ? 'UTF8_OK' : 'UTF8_BAD', 'size', buf.length);
  if (!ok) {
    const i = t.indexOf('aria-label=');
    console.log('snippet', [...buf.subarray(i, i + 40)]);
  }
}
