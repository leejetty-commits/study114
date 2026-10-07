/**
 * Region 시·도 정식명 정규화(canonicalSido) 검증 스크립트
 *
 * 검증 항목:
 * (a) RegionEnsure 가 RegionAlias::canonicalSido 사용
 * (b) insertRow 호출에 정규화 값($canonicalSido) 전달
 * (c) findExisting 이 sido_name IN (?, ?) 바인딩
 * (d) SIDO_MAP 에 17개 정식명이 값으로 있고 '경기'→'경기도', '강원도'→'강원특별자치도', '전라북도'→'전북특별자치도' 매핑 포함
 * (e) '시 대표' 제외 조건 유지 (dong_name <> '시 대표' 등)
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
let failed = 0;

function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error(`FAIL: ${msg}`);
  } else {
    console.log(`PASS: ${msg}`);
  }
}

const ensurePath = resolve(root, 'src/Region/RegionEnsure.php');
const ensureSrc = readFileSync(ensurePath, 'utf8');

const aliasPath = resolve(root, 'src/Region/RegionAlias.php');
const aliasSrc = readFileSync(aliasPath, 'utf8');

// (a) RegionEnsure 가 RegionAlias::canonicalSido 사용
assert(
  ensureSrc.includes('RegionAlias::canonicalSido('),
  '(a) RegionEnsure calls RegionAlias::canonicalSido'
);
assert(
  /\$canonicalSido\s*=\s*RegionAlias::canonicalSido\(\$sido\);/.test(ensureSrc),
  '(a) RegionEnsure assigns $canonicalSido = RegionAlias::canonicalSido($sido)'
);

// (b) insertRow 호출에 정규화 값 ($canonicalSido) 전달
const insertCalls = [...ensureSrc.matchAll(/self::insertRow\(([^)]+)\)/g)];
assert(
  insertCalls.length >= 2,
  '(b) RegionEnsure contains at least 2 insertRow calls'
);
assert(
  insertCalls.every((m) => m[1].includes('$canonicalSido')),
  '(b) All self::insertRow calls pass $canonicalSido instead of raw $sido'
);
assert(
  !/self::insertRow\([^)]*\$sidoCode,\s*\$sido,/.test(ensureSrc),
  '(b) self::insertRow is not called with raw $sido'
);

// (c) findExisting 이 sido_name IN (?, ?)
assert(
  ensureSrc.includes("sido_name IN (?, ?)"),
  '(c) findExisting SQL uses sido_name IN (?, ?)'
);
assert(
  /\$stmt->execute\(\[\$dongName,\s*\$canonicalSido,\s*\$rawSido,\s*\$sigungu,\s*\$sigungu\]\);/.test(ensureSrc) ||
    /\$stmt->execute\(\[\s*\$dongName,\s*\$canonicalSido,\s*\$rawSido/.test(ensureSrc),
  '(c) findExisting binds [$dongName, $canonicalSido, $rawSido, ...]'
);
const findExistingCalls = [...ensureSrc.matchAll(/self::findExisting\(([^)]+)\)/g)];
assert(
  findExistingCalls.length >= 4,
  '(c) findExisting is called with canonicalSido and rawSido at all fallback/retry points'
);
assert(
  findExistingCalls.every((m) => m[1].includes('$canonicalSido') && m[1].includes('$sido')),
  '(c) Every findExisting call passes both $canonicalSido and $sido'
);

// (d) SIDO_MAP 에 17개 정식명이 값으로 있고 '경기'→'경기도', '강원도'→'강원특별자치도', '전라북도'→'전북특별자치도'
const expected17 = [
  '서울특별시',
  '부산광역시',
  '대구광역시',
  '인천광역시',
  '광주광역시',
  '대전광역시',
  '울산광역시',
  '세종특별자치시',
  '경기도',
  '강원특별자치도',
  '충청북도',
  '충청남도',
  '전북특별자치도',
  '전라남도',
  '경상북도',
  '경상남도',
  '제주특별자치도',
];

// Extract SIDO_MAP array from RegionAlias.php
const sidoMapMatch = aliasSrc.match(/public\s+const\s+SIDO_MAP\s*=\s*\[([\s\S]*?)\];/);
assert(sidoMapMatch !== null, '(d) RegionAlias has public const SIDO_MAP');

if (sidoMapMatch) {
  const mapContent = sidoMapMatch[1];
  const entries = [...mapContent.matchAll(/'([^']+)'\s*=>\s*'([^']+)'/g)].map((m) => [m[1], m[2]]);
  const mapValues = new Set(entries.map(([, v]) => v));

  assert(
    expected17.every((name) => mapValues.has(name)),
    '(d) SIDO_MAP values include all 17 canonical sido names'
  );

  assert(
    mapValues.size === 17,
    `(d) SIDO_MAP target canonical values count is exactly 17 (found: ${mapValues.size})`
  );

  const mapDict = Object.fromEntries(entries);
  assert(
    mapDict['경기'] === '경기도',
    "(d) SIDO_MAP maps '경기' -> '경기도'"
  );
  assert(
    mapDict['강원도'] === '강원특별자치도',
    "(d) SIDO_MAP maps '강원도' -> '강원특별자치도'"
  );
  assert(
    mapDict['전라북도'] === '전북특별자치도',
    "(d) SIDO_MAP maps '전라북도' -> '전북특별자치도'"
  );
  assert(
    mapDict['광주'] === '광주광역시',
    "(d) SIDO_MAP maps '광주' -> '광주광역시'"
  );
}

// (e) '시 대표' 제외 유지
assert(
  /dong_name\s*<>\s*\\?'시 대표\\?'/.test(ensureSrc),
  "(e) SQL filters out '시 대표' in primary dong match"
);
assert(
  /unit_level\s*=\s*\\?'dong\\?'\s*AND\s*dong_name\s*<>\s*\\?'시 대표\\?'/.test(ensureSrc),
  "(e) SQL filters out '시 대표' in dongCode fallback query"
);
assert(
  ensureSrc.includes("if ($dong === '시 대표')"),
  "(e) dongNameFromKakao guards against '시 대표'"
);
assert(
  ensureSrc.includes("(string) ($row['dong_name'] ?? '') !== '시 대표'"),
  "(e) dongCode fallback PHP check guards against '시 대표'"
);

if (failed > 0) {
  console.error(`\nFAILED: ${failed} assertion(s) failed.`);
  process.exit(1);
} else {
  console.log('\nSUCCESS: All region sido canonical assertions passed.');
}
