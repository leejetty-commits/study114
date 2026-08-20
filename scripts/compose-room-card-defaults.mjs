/**
 * 원본 심벌·우동공과 + 벡터 서브카피 → 소/중/대 카드 기본 이미지
 *   node scripts/compose-room-card-defaults.mjs
 *
 * 소=basic 480² · 중=pick 720² · 대=prime 1280×720
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const sharp = require(path.join(__dirname, '../tmp/sharp-tools/node_modules/sharp'));

const root = path.resolve(__dirname, '..');
const assetsDir = path.join(
  process.env.USERPROFILE || '',
  '.cursor/projects/d-work-study114/assets',
);

const SRC = {
  /** 컬러 우동공과 워드마크 (검정 배경 PNG) */
  wordmark: path.join(
    assetsDir,
    'c__Users_jetty_AppData_Roaming_Cursor_User_workspaceStorage_ae5184f637e1b2f0151ebd8387f42b01_images____9_3x-a30f23fc-e075-4de5-8f93-121765044141.png',
  ),
  /** 연필핀 심벌 포함 풀 로고 (투명 PNG) */
  logoFull: path.join(root, 'public/assets/brand/logo-full.png'),
};

const outBrand = path.join(root, 'public/assets/brand');
const outDirs = [
  outBrand,
  path.join(root, 'preview/home-ui/public/assets/brand'),
  path.join(root, 'preview/auth-ui/public/assets/brand'),
];

function ensureDirs() {
  for (const d of outDirs) fs.mkdirSync(d, { recursive: true });
  fs.mkdirSync(path.join(outBrand, 'src'), { recursive: true });
}

/** 검정·거의검정을 투명으로 만든 뒤 내용 bbox trim */
async function knockoutBlackAndTrim(input, { blackMax = 28, padding = 6 } = {}) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const out = Buffer.from(data);
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      const r = out[i];
      const g = out[i + 1];
      const b = out[i + 2];
      let a = out[i + 3];
      if (r <= blackMax && g <= blackMax && b <= blackMax) {
        out[i + 3] = 0;
        a = 0;
      }
      if (a < 24) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  if (maxX < minX) {
    throw new Error('no visible pixels after knockout');
  }

  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(width - 1, maxX + padding);
  maxY = Math.min(height - 1, maxY + padding);

  return sharp(out, { raw: { width, height, channels: 4 } })
    .extract({ left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 })
    .png()
    .toBuffer();
}

/** logo-full 왼쪽 심벌만 분리 */
async function extractPin(logoFullPath) {
  const meta = await sharp(logoFullPath).metadata();
  const w = meta.width || 1;
  const h = meta.height || 1;
  //  empirically: pin ends ~410 on 1616-wide asset
  const cropW = Math.min(w, Math.round(w * 0.26));
  const cropped = await sharp(logoFullPath)
    .extract({ left: 0, top: 0, width: cropW, height: h })
    .png()
    .toBuffer();
  return knockoutBlackAndTrim(cropped, { blackMax: 32, padding: 4 });
}

async function prepareSources() {
  if (!fs.existsSync(SRC.wordmark)) throw new Error(`missing wordmark: ${SRC.wordmark}`);
  if (!fs.existsSync(SRC.logoFull)) throw new Error(`missing logo-full: ${SRC.logoFull}`);

  const wordmark = await knockoutBlackAndTrim(SRC.wordmark, { blackMax: 22, padding: 4 });
  const pin = await extractPin(SRC.logoFull);

  fs.writeFileSync(path.join(outBrand, 'src/udong-wordmark.png'), wordmark);
  fs.writeFileSync(path.join(outBrand, 'src/udong-pin.png'), pin);

  const wmMeta = await sharp(wordmark).metadata();
  const pinMeta = await sharp(pin).metadata();
  console.log('wordmark', wmMeta.width, wmMeta.height);
  console.log('pin', pinMeta.width, pinMeta.height);
  return { wordmark, pin };
}

function subtitleSvg(width, height, opts) {
  const {
    x,
    y,
    y1,
    y2,
    size,
    size1,
    size2,
    anchor = 'middle',
    mode = 'two', // 'one' | 'two'
  } = opts;
  const font = `Pretendard, 'Noto Sans KR', Malgun Gothic, sans-serif`;
  if (mode === 'one') {
    return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <text x="${x}" y="${y}" fill="#334155" font-size="${size}" font-weight="700" text-anchor="${anchor}" font-family="${font}">우리동네 공부방과외</text>
</svg>`);
  }
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <text x="${x}" y="${y1}" fill="#334155" font-size="${size1}" font-weight="700" text-anchor="${anchor}" font-family="${font}">우리동네</text>
  <text x="${x}" y="${y2}" fill="#64748b" font-size="${size2}" font-weight="600" text-anchor="${anchor}" font-family="${font}">공부방과외</text>
</svg>`);
}

function bgSvg(w, h, tint) {
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f8fafc"/>
      <stop offset="100%" stop-color="${tint}"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
</svg>`);
}

async function fitContain(buf, maxW, maxH) {
  return sharp(buf)
    .resize({
      width: maxW,
      height: maxH,
      fit: 'inside',
      withoutEnlargement: false,
    })
    .png()
    .toBuffer({ resolveWithObject: true });
}

async function composeSquare({ wordmark, pin, size, tint, label }) {
  const canvas = size;
  const pad = Math.round(size * 0.055);
  const plate = canvas - pad * 2;
  const rx = Math.round(size * 0.048);

  // 심벌 살짝 축소
  const { data: pinR, info: pinI } = await fitContain(pin, Math.round(size * 0.28), Math.round(size * 0.25));
  const { data: wmR, info: wmI } = await fitContain(wordmark, Math.round(size * 0.78), Math.round(size * 0.22));

  const pinX = Math.round((canvas - pinI.width) / 2);
  const pinY = Math.round(size * 0.14);
  const wmX = Math.round((canvas - wmI.width) / 2);
  const wmY = pinY + pinI.height + Math.round(size * 0.05);

  const subY = wmY + wmI.height + Math.round(size * 0.09);
  const subSize = Math.round(size * 0.046);
  const sub = await sharp(
    subtitleSvg(canvas, canvas, {
      mode: 'one',
      x: canvas / 2,
      y: subY,
      size: subSize,
      anchor: 'middle',
    }),
  )
    .png()
    .toBuffer();

  const plateSvg = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${canvas}" height="${canvas}">
  <rect x="${pad}" y="${pad}" width="${plate}" height="${plate}" rx="${rx}" fill="#ffffff" fill-opacity="0.88" stroke="#e2e8f0" stroke-width="2"/>
</svg>`);

  const out = await sharp(bgSvg(canvas, canvas, tint))
    .composite([
      { input: await sharp(plateSvg).png().toBuffer(), left: 0, top: 0 },
      { input: pinR, left: pinX, top: pinY },
      { input: wmR, left: wmX, top: wmY },
      { input: sub, left: 0, top: 0 },
    ])
    .png({ compressionLevel: 9 })
    .toBuffer();

  console.log(label, canvas, 'ok');
  return out;
}

async function composeWide({ wordmark, pin, tint, label }) {
  const W = 1280;
  const H = 720;
  // 앞 심벌 축소
  const { data: pinR, info: pinI } = await fitContain(pin, 160, 240);
  const { data: wmR, info: wmI } = await fitContain(wordmark, 480, 156);

  const pinX = 130;
  const pinY = Math.round((H - pinI.height) / 2);
  const wmX = pinX + pinI.width + 48;
  const wmY = Math.round((H - wmI.height) / 2) - 10;

  const subX = wmX + wmI.width + 44;
  const sub = await sharp(
    subtitleSvg(W, H, {
      mode: 'two',
      x: subX,
      y1: Math.round(H * 0.44),
      y2: Math.round(H * 0.44) + 52,
      size1: 42,
      size2: 40,
      anchor: 'start',
    }),
  )
    .png()
    .toBuffer();

  const plateSvg = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect x="48" y="64" width="1184" height="592" rx="36" fill="#ffffff" fill-opacity="0.88" stroke="#e2e8f0" stroke-width="2"/>
</svg>`);

  const out = await sharp(bgSvg(W, H, tint))
    .composite([
      { input: await sharp(plateSvg).png().toBuffer(), left: 0, top: 0 },
      { input: pinR, left: pinX, top: pinY },
      { input: wmR, left: wmX, top: wmY },
      { input: sub, left: 0, top: 0 },
    ])
    .png({ compressionLevel: 9 })
    .toBuffer();

  console.log(label, `${W}x${H}`, 'ok');
  return out;
}

/** 카드 슬롯용: PNG를 data-URI로 내장 (img src=.svg 에서도 동작) */
function wrapSvgEmbedded(pngBuf, w, h, aria) {
  const b64 = pngBuf.toString('base64');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${aria}">
  <image width="${w}" height="${h}" href="data:image/png;base64,${b64}" xlink:href="data:image/png;base64,${b64}"/>
</svg>
`;
}

async function writeAll(svgName, buf, w, h) {
  const pngName = svgName.replace(/\.svg$/, '.png');
  const svgBody = wrapSvgEmbedded(buf, w, h, '우동공과 우리동네 공부방과외');
  for (const dir of outDirs) {
    fs.writeFileSync(path.join(dir, pngName), buf);
    fs.writeFileSync(path.join(dir, svgName), svgBody, 'utf8');
  }
}

async function main() {
  ensureDirs();
  const { wordmark, pin } = await prepareSources();

  const small = await composeSquare({
    wordmark,
    pin,
    size: 480,
    tint: '#eef4fb',
    label: '소',
  });
  const mid = await composeSquare({
    wordmark,
    pin,
    size: 720,
    tint: '#f5f3ff',
    label: '중',
  });
  const large = await composeWide({
    wordmark,
    pin,
    tint: '#e0f2fe',
    label: '대',
  });

  await writeAll('room-card-default-basic.svg', small, 480, 480);
  await writeAll('room-card-default-pick.svg', mid, 720, 720);
  await writeAll('room-card-default-prime.svg', large, 1280, 720);

  for (const dir of outDirs) {
    fs.copyFileSync(path.join(dir, 'room-card-default-basic.png'), path.join(dir, 'room-card-default-S.png'));
    fs.copyFileSync(path.join(dir, 'room-card-default-pick.png'), path.join(dir, 'room-card-default-M.png'));
    fs.copyFileSync(path.join(dir, 'room-card-default-prime.png'), path.join(dir, 'room-card-default-L.png'));
  }

  console.log('done → public/assets/brand/room-card-default-{basic,pick,prime|S,M,L}.png');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
