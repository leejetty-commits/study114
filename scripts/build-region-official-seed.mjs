/**
 * 행안부 법정동 KIKcd_B xlsx → sql/schema/073 시드.
 * 기준일 2026-07-01. 같은 파일이면 같은 SQL.
 *
 *   node scripts/build-region-official-seed.mjs --input <KIKcd_B.xlsx> --output <sql>
 */
import fs from 'node:fs';
import zlib from 'node:zlib';

const args = process.argv.slice(2);

function flag(name) {
  const i = args.indexOf(name);
  if (i < 0 || !args[i + 1]) {
    console.error('usage: node scripts/build-region-official-seed.mjs --input <xlsx> --output <sql>');
    process.exit(1);
  }
  return args[i + 1];
}

const inputPath = flag('--input');
const outputPath = flag('--output');

function readZip(buf) {
  const sig = Buffer.from([0x50, 0x4b, 0x05, 0x06]);
  const eocd = buf.lastIndexOf(sig);
  if (eocd < 0) throw new Error('xlsx zip end record not found');
  const cdSize = buf.readUInt32LE(eocd + 12);
  const cdOffset = buf.readUInt32LE(eocd + 16);
  const files = new Map();
  let p = cdOffset;
  const end = cdOffset + cdSize;
  while (p < end) {
    if (buf.readUInt32LE(p) !== 0x02014b50) break;
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const localOff = buf.readUInt32LE(p + 42);
    const name = buf.subarray(p + 46, p + 46 + nameLen).toString('utf8');
    p += 46 + nameLen + extraLen + commentLen;
    const ln = buf.readUInt16LE(localOff + 26);
    const le = buf.readUInt16LE(localOff + 28);
    const dataStart = localOff + 30 + ln + le;
    const comp = buf.subarray(dataStart, dataStart + compSize);
    const data = method === 0 ? comp : zlib.inflateRawSync(comp);
    files.set(name, data);
  }
  return files;
}

function decodeXml(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#10;/g, '');
}

function sharedStrings(xml) {
  const out = [];
  const siRe = /<si>([\s\S]*?)<\/si>/g;
  let m;
  while ((m = siRe.exec(xml))) {
    const texts = [...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((x) => decodeXml(x[1]));
    out.push(texts.join(''));
  }
  return out;
}

function sheetRows(xml, strings) {
  const rows = [];
  const rowRe = /<row r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g;
  let m;
  while ((m = rowRe.exec(xml))) {
    const cells = {};
    const cellRe = /<c r="([A-G])\d+"([^>]*)>(?:<v>([^<]*)<\/v>)?<\/c>/g;
    let c;
    while ((c = cellRe.exec(m[2]))) {
      const raw = c[3] ?? '';
      const shared = /t="s"/.test(c[2]);
      cells[c[1]] = shared ? strings[Number(raw)] || '' : decodeXml(raw);
    }
    rows.push(cells);
  }
  return rows;
}

function blank(value) {
  return !value || !String(value).trim();
}

function sqlStr(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

const zip = readZip(fs.readFileSync(inputPath));
const sheetName = [...zip.keys()].find((name) => name.endsWith('xl/worksheets/sheet1.xml'));
const sstName = [...zip.keys()].find((name) => name.endsWith('xl/sharedStrings.xml'));
if (!sheetName || !sstName) throw new Error('xlsx sheet or shared strings missing');

const strings = sharedStrings(zip.get(sstName).toString('utf8'));
const data = sheetRows(zip.get(sheetName).toString('utf8'), strings).slice(1);

const top = [];
const sgg = [];
for (const row of data) {
  const code = String(row.A || '').trim();
  const rec = {
    code,
    sido: String(row.B || '').trim(),
    sgg: String(row.C || '').trim(),
    eup: String(row.D || '').trim(),
    ri: String(row.E || '').trim(),
  };
  if (!/^\d{10}$/.test(code)) throw new Error(`bad code ${code}`);
  if (blank(row.C) && blank(row.D) && blank(row.E)) top.push(rec);
  else if (!blank(row.C) && blank(row.D) && blank(row.E)) sgg.push(rec);
}

const sido = top.filter((row) => row.code.endsWith('00000000'));
const branches = sgg.filter((row) => row.sgg.includes('출장'));
const kept = sgg.filter((row) => !row.sgg.includes('출장') && row.code !== '3611000000');

const childGus = new Set();
for (const row of kept) {
  if (row.sgg.includes(' ') && row.sgg.endsWith('구')) {
    childGus.add(`${row.sido}\t${row.sgg.split(' ')[0]}`);
  }
}

function selectable(row, level) {
  if (level === 'sido') return row.code === '3600000000';
  if (row.sgg.endsWith('구')) return true;
  if (row.sgg.endsWith('군')) return true;
  if (row.sgg.endsWith('시')) return !childGus.has(`${row.sido}\t${row.sgg}`);
  throw new Error(`unclassified sigungu ${row.sido} ${row.sgg} ${row.code}`);
}

function isMetroGun(row) {
  return row.sigunguName.endsWith('군') && (row.sidoName.endsWith('광역시') || row.sidoName.endsWith('통합특별시'));
}

const records = [];
for (const row of sido) {
  const pick = selectable(row, 'sido');
  records.push({
    code: row.code,
    sidoCode: row.code.slice(0, 2),
    sidoName: row.sido,
    sigunguCode: row.code.slice(0, 5),
    sigunguName: pick ? row.sido : '',
    level: 'sido',
    selectable: pick ? 1 : 0,
  });
}
for (const row of kept) {
  records.push({
    code: row.code,
    sidoCode: row.code.slice(0, 2),
    sidoName: row.sido,
    sigunguCode: row.code.slice(0, 5),
    sigunguName: row.sgg,
    level: 'sigungu',
    selectable: selectable(row, 'sigungu') ? 1 : 0,
  });
}
records.sort((a, b) => (a.code < b.code ? -1 : a.code > b.code ? 1 : 0));

const gu = records.filter((row) => row.level === 'sigungu' && row.sigunguName.endsWith('구'));
const generalGu = gu.filter((row) => row.sigunguName.includes(' '));
const plainGu = gu.filter((row) => !row.sigunguName.includes(' '));
const guns = records.filter((row) => row.level === 'sigungu' && row.sigunguName.endsWith('군'));
const cities = records.filter((row) => row.level === 'sigungu' && row.sigunguName.endsWith('시'));
const parentCities = cities.filter((row) => row.selectable === 0);
const bareCities = cities.filter((row) => row.selectable === 1);
const metroGuns = guns.filter((row) => isMetroGun(row));
const otherGuns = guns.filter((row) => !isMetroGun(row));
const sejong = records.filter((row) => row.code === '3600000000');
const banned = records.filter((row) => row.sidoName === '광주광역시' || row.sidoName === '전라남도' || row.sigunguName === '광주광역시' || row.sigunguName === '전라남도');

const expect = {
  sido: 16,
  kept: 268,
  branches: 4,
  si: 77,
  gun: 82,
  plainGu: 70,
  generalGu: 39,
  parentCities: 13,
  sejong: 1,
  banned: 0,
};
const actual = {
  sido: sido.length,
  kept: kept.length,
  branches: branches.length,
  si: cities.length,
  gun: guns.length,
  plainGu: plainGu.length,
  generalGu: generalGu.length,
  parentCities: parentCities.length,
  sejong: sejong.length,
  banned: banned.length,
};
for (const key of Object.keys(expect)) {
  if (actual[key] !== expect[key]) {
    throw new Error(`count ${key}: file ${actual[key]}, expected ${expect[key]}`);
  }
}
if (sido.length + kept.length !== records.length) throw new Error('record total mismatch');
if (records.some((row) => row.sigunguName.length > 50 || row.sidoName.length > 50)) {
  throw new Error('name longer than regions column');
}
const codes = new Set(records.map((row) => row.code));
if (codes.size !== records.length) throw new Error('duplicate official code');
if (codes.has('3611000000')) throw new Error('3611000000 must be excluded');

const selectableRows = records.filter((row) => row.selectable === 1);
const selectableGu = selectableRows.filter((row) => row.sigunguName.endsWith('구')).length;
const selectableMetroGun = selectableRows.filter((row) => isMetroGun(row)).length;
const selectableBare = bareCities.length + otherGuns.length;
const selectableSejong = selectableRows.filter((row) => row.code === '3600000000').length;
if (selectableGu + selectableMetroGun + selectableBare + selectableSejong !== selectableRows.length) {
  throw new Error('selectable split does not add up');
}

const values = records.map((row) => {
  const sigunguName = row.sigunguName === '' ? "''" : sqlStr(row.sigunguName);
  return `  (${sqlStr(row.sidoCode)}, ${sqlStr(row.sidoName)}, ${sqlStr(row.sigunguCode)}, ${sigunguName}, NULL, '', ${sqlStr(row.level)}, ${sqlStr(row.code)}, ${row.selectable})`;
});

const lines = [
  '-- =============================================================================',
  '-- 073 — 법정동 공식 행',
  '-- 기준일: 2026-07-01 (행정안전부 KIKcd_B, 말소 제외본)',
  '-- 생성: node scripts/build-region-official-seed.mjs --input <xlsx> --output 이 파일',
  '-- 기존 행은 수정·삭제하지 않는다. 같은 official_code 는 INSERT IGNORE.',
  `-- 행 수: 시도 ${sido.length} + 시군구 ${kept.length} = ${records.length}`,
  `-- 시군구 원본 272 = 시 ${cities.length} + 군 ${guns.length} + 구 ${plainGu.length} + 일반구형 ${generalGu.length} + 출장 ${branches.length}`,
  `-- 제외: 출장 ${branches.map((row) => row.code + ' ' + row.sgg).join(', ')}; 3611000000`,
  `-- 선택 단위 ${selectableRows.length} = 구 ${selectableGu} + 광역·통합특별시 군 ${selectableMetroGun} + 구 없는 시·군 ${selectableBare} + 세종 ${selectableSejong}`,
  '-- =============================================================================',
  '',
  'USE study114;',
  '',
  'SET NAMES utf8mb4;',
  '',
  'INSERT IGNORE INTO regions (',
  '  sido_code, sido_name, sigungu_code, sigungu_name, dong_code, dong_name,',
  '  unit_level, official_code, is_selectable',
  ') VALUES',
  values.join(',\n') + ';',
  '',
];

fs.writeFileSync(outputPath, lines.join('\n'), 'utf8');
console.error(JSON.stringify({
  output: outputPath,
  rows: records.length,
  ...actual,
  selectable: selectableRows.length,
  selectableGu,
  selectableMetroGun,
  selectableBare,
  selectableSejong,
  excluded: branches.map((row) => `${row.code} ${row.sido} ${row.sgg}`),
}, null, 2));
