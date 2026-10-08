/**
 * 과외쌤 홈 활동지역 분포.
 * 집계: 검색 노출 카드 total. 지역은 과외 단위(광역시 / 도의 시·군) id.
 * 과외쌤=tutor_region_id, 학생수요=과외 희망 학생의 preferred_region_id.
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
 * @typedef {{ index: number, label: string, regionId: string, primary: boolean, tutorCount: number|null, studentCount: number|null }} ActivityRow
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
      regionId: String(slot?.regionId || '').trim(),
      primary: !!slot?.primary && !!String(slot?.label || '').trim(),
    }))
    .filter((slot) => slot.label || slot.regionId);
}

function slotKey(slots) {
  return slots.map((slot) => `${slot.index}:${slot.regionId}:${slot.label}:${slot.primary ? 1 : 0}`).join('|');
}

/** 과외 단위 id가 아니면 null. 숫자를 만들지 않는다. @param {'tutor'|'student'} tab @param {string} regionId */
async function countExposedCards(tab, regionId) {
  if (!/^\d+$/.test(regionId)) return null;
  const filters =
    tab === 'tutor'
      ? { tutor_region_id: regionId }
      : { preferred_lesson_type: 'tutor', preferred_region_id: regionId };
  const data = await searchApi(tab, filters, { page: 1, limit: 1 });
  const total = Number(data.total);
  return Number.isFinite(total) && total >= 0 ? total : null;
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
      let tutorCount = null;
      let studentCount = null;
      try {
        [tutorCount, studentCount] = await Promise.all([
          countExposedCards('tutor', slot.regionId),
          countExposedCards('student', slot.regionId),
        ]);
      } catch {
        tutorCount = null;
        studentCount = null;
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
    ? slots.map((slot) => ({ ...slot, tutorCount: null, studentCount: null }))
    : rows;
  const maxVal = Math.max(
    1,
    ...source.flatMap((row) => [row.tutorCount || 0, row.studentCount || 0]),
  );

  const body = source
    .map((row) => {
      const tutorKnown = !pending && row.tutorCount != null;
      const studentKnown = !pending && row.studentCount != null;
      const tPct = tutorKnown ? Math.round((row.tutorCount / maxVal) * 100) : 0;
      const sPct = studentKnown ? Math.round((row.studentCount / maxVal) * 100) : 0;
      const tutorText = pending ? '…' : tutorKnown ? String(row.tutorCount) : '—';
      const studentText = pending ? '…' : studentKnown ? String(row.studentCount) : '—';
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
    <div class="act-bars" data-tutor-activity-bars aria-label="과외지역별 과외쌤·학생 수요">
      <div class="act-bars__legend" aria-hidden="true">
        <span class="act-bars__swatch act-bars__swatch--tutor"></span>과외쌤
        <span class="act-bars__swatch act-bars__swatch--student"></span>학생수요
      </div>
      <div class="act-bars__list" role="list">
        ${body}
      </div>
    </div>`;
}
