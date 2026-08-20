/**
 * 공개 마이샵 뷰모델
 * SSOT: 기본정보 + 상세정보1 + 상세정보2 입력값만.
 * 쪽지설정·등록점검·공개상태·노출등급·진행률 등 운영값 제외.
 */

import {
  formatMonthlyWon,
  formatLessonPlace,
  formatLessonOperationType,
} from '../exposure-format.js';
import { previewState } from '../state.js';
import { EXPOSURE_STUDY_ROOMS } from '../exposure-data.js';
import { myshopInquiryStatusLine } from '../study-room-reg/inquiry-display.js';

const ROOM_DEFAULT = '/assets/brand/room-card-default-basic.svg';

function blank(v) {
  const s = String(v ?? '').trim();
  if (!s || s === '—' || s === '-') return '';
  return s;
}

/**
 * @param {number} id
 * @returns {object | null}
 */
export function resolvePublicStudyRoomItem(id) {
  const n = Number(id);
  if (!Number.isFinite(n) || n <= 0) return null;

  const pools = [
    previewState.parentFind?.activeResultItems,
    previewState.studyRoomFind?.activeResultItems,
    previewState.tutorFind?.activeResultItems,
    previewState.parentFind?.searchExposureItems,
    previewState.studyRoomFind?.searchExposureItems,
    previewState.tutorFind?.searchExposureItems,
  ];
  for (const pool of pools) {
    if (!Array.isArray(pool)) continue;
    const hit = pool.find((x) => Number(x?.id) === n);
    if (hit) return hit;
  }

  return EXPOSURE_STUDY_ROOMS.find((x) => Number(x.id) === n) || null;
}

function collectImageSrcs(item) {
  /** @type {string[]} */
  const out = [];
  const push = (src) => {
    const s = blank(src);
    if (!s || out.includes(s)) return;
    out.push(s);
  };

  push(item.image_path_prime);
  push(item.image_path);
  push(item.image_path_basic);

  if (Array.isArray(item.images)) {
    for (const img of item.images) {
      if (typeof img === 'string') push(img);
      else if (img && typeof img === 'object') {
        if (img.is_system_default) continue;
        push(img.prime_1280_path || img.basic_720_path || img.image_path || img.src);
      }
    }
  }
  if (Array.isArray(item.gallery)) {
    for (const g of item.gallery) {
      if (typeof g === 'string') push(g);
      else push(g?.src || g?.image_path);
    }
  }
  return out;
}

function teachingStyles(item) {
  if (Array.isArray(item.teaching_style_labels) && item.teaching_style_labels.length) {
    return item.teaching_style_labels.map(blank).filter(Boolean);
  }
  if (Array.isArray(item.teaching_style_badges) && item.teaching_style_badges.length) {
    return item.teaching_style_badges.map(blank).filter(Boolean);
  }
  const raw = blank(item.teaching_style);
  if (!raw) return [];
  return raw
    .split(/[,|/]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

function feeLabel(item) {
  if (item.monthly_fee_manwon != null && blank(item.monthly_fee_manwon)) {
    return `월 ${blank(item.monthly_fee_manwon)}만원대`;
  }
  const won = formatMonthlyWon(item.price_amount);
  return won === '—' ? '' : won.replace(/~$/, '');
}

function placeLabel(item) {
  const raw = formatLessonPlace(item.lesson_place_type);
  return raw === '—' ? '' : raw;
}

function operationLabel(item) {
  const raw = formatLessonOperationType(item.lesson_operation_type);
  return raw === '—' ? '' : raw;
}

/**
 * @param {object} item
 */
export function buildPublicMyshopModel(item) {
  if (!item) return null;

  const name = blank(item.study_room_name) || '공부방';
  const slogan = blank(item.slogan);
  const introShort = blank(item.intro_short);
  const introLong = blank(item.intro_long);
  const region = blank(item.location_label || item.region_label);
  const audience = blank(item.grade_band);
  const subject = blank(item.main_subject_note);
  const place = placeLabel(item);
  const operation = operationLabel(item);
  const capacity = blank(item.capacity_per_time);
  const fee = feeLabel(item);
  const features = [item.feature_1, item.feature_2, item.feature_3].map(blank).filter(Boolean);
  const styles = teachingStyles(item);
  const styleNote = blank(item.teaching_style_note);
  const facilityNote = blank(item.facility_summary);
  const photos = collectImageSrcs(item);
  const heroSrc = photos[0] || ROOM_DEFAULT;
  const gallery = photos.slice(1);
  const heroIsDefault = !photos[0];

  const metaBits = [region, audience, subject, place].filter(Boolean);

  const summaryItems = [
    audience && { label: '대상', value: audience },
    subject && { label: '과목', value: subject },
    operation && { label: '수업형태', value: operation },
    fee && { label: '가격대', value: fee },
    capacity && { label: '원생수', value: capacity },
    place && { label: '교습형태', value: place },
  ].filter(Boolean);

  const classCards = Array.isArray(item.classes)
    ? item.classes
        .map((c) => {
          const title = blank(c.class_name || c.name);
          const subject = blank(c.subject_label || c.subject);
          const fee = blank(c.monthly_fee || c.fee);
          if (!title && !subject && !fee) return null;
          return { title, subject, fee: fee ? `${fee}만원` : '' };
        })
        .filter(Boolean)
    : [];

  return {
    id: Number(item.id) || 0,
    name,
    slogan,
    introShort,
    introLong,
    region,
    metaBits,
    summaryItems,
    features,
    styles,
    styleNote,
    facilityNote,
    heroSrc,
    heroIsDefault,
    gallery,
    classCards,
    inquiryStatusLine: myshopInquiryStatusLine(item.inquiry_status),
  };
}
