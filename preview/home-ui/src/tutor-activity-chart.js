/**
 * 과외쌤 홈 활동지역 분포.
 * 집계: 검색 노출 카드 total. 과외쌤=tutor_region_label, 학생수요=preferred_region_label. 키=활동지역 시·군 라벨.
 */

import { searchApi } from '@search-ui/search-api.js';
import { readTutorHomeRegions } from './tutor-home-seed.js';

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

/**
 * @typedef {{ index: number, label: string, primary: boolean, tutorCount: number, studentCount: number }} ActivityRow
 */

/** @type {ActivityRow[]} */
let rows = [];
let readyKey = '';
let bootGen = 0;

function citySlots() {
  const loaded = readTutorHomeRegions();
  const slots = Array.isArray(loaded) ? loaded : [];
  return slots
    .map((slot, index) => ({
      index,
      label: String(slot?.label || '').trim(),
      primary: !!slot?.primary && !!String(slot?.label || '').trim(),
    }))
    .filter((slot) => slot.label);
}

function slotKey(slots) {
  return slots.map((slot) => `${slot.index}:${slot.label}:${slot.primary ? 1 : 0}`).join('|');
}

/** @param {'tutor'|'student'} tab @param {string} cityLabel */
async function countExposedCards(tab, cityLabel) {
  const filters =
    tab === 'tutor'
      ? { tutor_region_label: cityLabel }
      : { preferred_region_label: cityLabel };
  const data = await searchApi(tab, filters, { page: 1, limit: 1 });
  const total = Number(data.total);
  return Number.isFinite(total) && total > 0 ? total : 0;
}

/**
 * @param {() => void} [rerender]
 */
export function bootTutorActivityCounts(rerender) {
  const slots = citySlots();
  const key = slotKey(slots);
  if (key === readyKey) return;
  const gen = ++bootGen;
  return (async () => {
    /** @type {ActivityRow[]} */
    const next = [];
    for (const slot of slots) {
      let tutorCount = 0;
      let studentCount = 0;
      try {
        [tutorCount, studentCount] = await Promise.all([
          countExposedCards('tutor', slot.label),
          countExposedCards('student', slot.label),
        ]);
      } catch {
        tutorCount = 0;
        studentCount = 0;
      }
      next.push({
        index: slot.index,
        label: slot.label,
        primary: slot.primary,
        tutorCount,
        studentCount,
      });
    }
    if (gen !== bootGen) return;
    rows = next;
    readyKey = key;
    if (typeof rerender === 'function') rerender();
  })();
}

/**
 * @param {{ activeIndex?: number, interactive?: boolean }} [opts]
 */
export function renderTutorActivityBars(opts = {}) {
  void opts;
  const slots = citySlots();
  const key = slotKey(slots);
  const pending = key !== readyKey;
  const source = pending
    ? slots.map((slot) => ({ ...slot, tutorCount: 0, studentCount: 0 }))
    : rows;
  const maxVal = Math.max(
    1,
    ...source.flatMap((row) => [row.tutorCount, row.studentCount]),
  );

  const body = source
    .map((row) => {
      const tPct = pending ? 0 : Math.round((row.tutorCount / maxVal) * 100);
      const sPct = pending ? 0 : Math.round((row.studentCount / maxVal) * 100);
      const tutorText = pending ? '…' : String(row.tutorCount);
      const studentText = pending ? '…' : String(row.studentCount);
      return `
      <div class="act-bars__row" role="listitem">
        <span class="act-bars__region">${esc(row.label)}${row.primary ? '<em>대표</em>' : ''}</span>
        <span class="act-bars__pair">
          <span class="act-bars__metric" title="과외쌤">
            <span class="act-bars__track"><span class="act-bars__fill act-bars__fill--tutor" style="width:${tPct}%"></span></span>
            <span class="act-bars__num"><span class="act-bars__key">과외쌤</span> ${esc(tutorText)}</span>
          </span>
          <span class="act-bars__metric" title="학생수요">
            <span class="act-bars__track"><span class="act-bars__fill act-bars__fill--student" style="width:${sPct}%"></span></span>
            <span class="act-bars__num"><span class="act-bars__key">학생수요</span> ${esc(studentText)}</span>
          </span>
        </span>
      </div>`;
    })
    .join('');

  return `
    <div class="act-bars" data-tutor-activity-bars aria-label="활동지역별 과외쌤·학생 수요">
      <div class="act-bars__legend" aria-hidden="true">
        <span class="act-bars__swatch act-bars__swatch--tutor"></span>과외쌤
        <span class="act-bars__swatch act-bars__swatch--student"></span>학생수요
      </div>
      <div class="act-bars__list" role="list">
        ${body}
      </div>
    </div>`;
}
