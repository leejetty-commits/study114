#!/usr/bin/env node
/**
 * §16 (로컬) ↔ Notion §15 화면 인벤토리 동기화
 * 정본: docs/ssot/screen-inventory.json
 *
 * Usage:
 *   node scripts/sync-screen-inventory.mjs          # 로컬 §16 갱신 + Notion 패치 생성
 *   node scripts/sync-screen-inventory.mjs --check  # drift 검사만
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const JSON_PATH = join(ROOT, 'docs/ssot/screen-inventory.json');
const MD_PATH = join(ROOT, 'docs/ssot/30-first-route-map-and-screen-inventory.md');
const OUT_DIR = join(ROOT, 'docs/ssot/generated');
const START = '<!-- screen-inventory:start -->';
const END = '<!-- screen-inventory:end -->';

const checkOnly = process.argv.includes('--check');

/** @param {string} s */
function escCell(s) {
  return String(s ?? '').replace(/\|/g, '\\|');
}

/** @param {import('../docs/ssot/screen-inventory.json').rows[0]} row */
function fmtId(row) {
  return row.bold ? `**${row.id}**` : row.id;
}

/** @param {import('../docs/ssot/screen-inventory.json').rows[0]} row */
function localRow(row) {
  const route = row.route.includes('#') ? `\`${row.route}\`` : row.route;
  return `| ${fmtId(row)} | ${escCell(row.name)} | ${row.type} | ${route} | ${row.ui} | ${row.doc} | ${row.entry} | ${row.phase} | ${escCell(row.note)} |`;
}

/** @param {import('../docs/ssot/screen-inventory.json').rows[0]} row */
function notionRow(row) {
  const route = row.route.includes('#') ? `\`${row.route}\`` : row.route;
  return `| ${row.id} | ${escCell(row.name)} | ${row.type} | ${route} | ${row.ui} | ${row.doc} | ${row.entry} | ${escCell(row.note)} |`;
}

function buildLocalTable(rows) {
  const header = `| ID | 이름 | 유형 | route | UI | 문서 | 진입 | 1차 | 비고 |
|----|------|------|-------|:--:|:--:|------|:---:|------|`;
  return [header, ...rows.map(localRow)].join('\n');
}

function buildNotionSection15(rows) {
  const header = `| ID | 이름 | 유형 | route / 진입 | 현재 상태 | 문서 상태 | 진입 규칙 | 비고 |
|----|------|------|--------------|:---------:|:---------:|:---------:|------|`;
  return [header, ...rows.map(notionRow)].join('\n');
}

function patchMarkdown(table, meta) {
  let md = readFileSync(MD_PATH, 'utf8');
  const block = `${START}\n${table}\n${END}`;

  if (md.includes(START) && md.includes(END)) {
    const re = new RegExp(`${START}[\\s\\S]*?${END}`);
    md = md.replace(re, block);
  } else {
    const anchor = '## 16. 화면 인벤토리 본표';
    const idx = md.indexOf(anchor);
    if (idx === -1) throw new Error('§16 섹션을 찾을 수 없습니다.');
    const tableStart = md.indexOf('| ID | 이름 |', idx);
    const tableEnd = md.indexOf('\n---\n', tableStart);
    if (tableStart === -1 || tableEnd === -1) throw new Error('§16 표를 찾을 수 없습니다.');
    md = md.slice(0, tableStart) + block + md.slice(tableEnd);
  }

  md = md.replace(
    /\| 마지막 동기화 \| \*\*[^*]+\*\* \|/,
    `| 마지막 동기화 | **${meta.lastSync}** |`,
  );
  md = md.replace(
    /\*\*다음 동기화 체크:\*\*[^\n]+/,
    `**다음 동기화 체크:** \`npm run sync:inventory\` · Notion §15 (자동 패치: \`docs/ssot/generated/notion-section-15.md\`)`,
  );

  if (!checkOnly) writeFileSync(MD_PATH, md, 'utf8');
  return md;
}

function main() {
  const data = JSON.parse(readFileSync(JSON_PATH, 'utf8'));
  const { rows, meta } = data;
  const localTable = buildLocalTable(rows);
  const notionTable = buildNotionSection15(rows);

  mkdirSync(OUT_DIR, { recursive: true });
  const notionOut = join(OUT_DIR, 'notion-section-15.md');
  const localOut = join(OUT_DIR, 'screen-inventory-local.md');

  if (!checkOnly) {
    writeFileSync(
      notionOut,
      `# Notion 30장 §15 동기화 패치 (${meta.lastSync})\n\n` +
        `페이지: ${meta.notionUrl}\n\n` +
        `Notion MCP \`update_content\`로 §15 표 전체 또는 §20을 아래로 교체.\n\n` +
        notionTable +
        '\n',
      'utf8',
    );
    writeFileSync(localOut, localTable + '\n', 'utf8');
    patchMarkdown(localTable, meta);
    console.log(`✅ 로컬 §16 갱신: ${MD_PATH}`);
    console.log(`✅ Notion 패치: ${notionOut}`);
  } else {
    const md = readFileSync(MD_PATH, 'utf8');
    const m = md.match(new RegExp(`${START}\\n([\\s\\S]*?)\\n${END}`));
    const current = m ? m[1].trim() : null;
    if (current !== localTable) {
      console.error('❌ drift: screen-inventory.json ≠ 로컬 §16 (npm run sync:inventory 실행 필요)');
      process.exit(1);
    }
    console.log('✅ screen-inventory.json ↔ 로컬 §16 일치');
  }
}

main();
