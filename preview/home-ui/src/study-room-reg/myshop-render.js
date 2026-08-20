/**
 * 마이샵 쇼케이스 렌더 (미니홈피형 소개) — 원장 미리보기용
 * 운영·상태·체크리스트·수정 CTA 금지. 입력값만 전시.
 *
 * - 원장: 마이페이지 「내 등록 → 마이샵」탭 미리보기
 * - 공개 본편: `#/myshop/study-room/:id` (역할 공통 열람, 별도 셸)
 *   미니카드 → 확대카드 → 마이샵 · 배너=확대 · CTA=마이샵
 *   복귀·검색조건·스크롤: docs/internal/50-student-myshop-routing.md
 */

import { registerState, LESSON_OPERATION_TYPES, CAPACITY_PER_TIME_OPTIONS, TEACHING_STYLE_OPTIONS } from '@study-room-ui/state.js';
import { formatPrimaryAudienceLabel } from '../../../shared/study-room-basic-form.js';
import { myshopInquiryStatusLine } from './inquiry-display.js';

const ROOM_DEFAULT_BASIC = '/assets/brand/room-card-default-basic.svg';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

function blank(v) {
  return String(v ?? '').trim();
}

function imgSrc(img) {
  if (!img || typeof img !== 'object') return '';
  return blank(img.basic_720_path || img.prime_1280_path || img.image_path || img.name);
}

function isSystemDefaultImage(img) {
  return Boolean(img?.is_system_default);
}

/** @param {typeof registerState} s */
function collectGallery(s) {
  const list = Array.isArray(s.images) ? s.images : [];
  return list
    .map((img) => ({ src: imgSrc(img), title: blank(img.title || img.image_type || ''), system: isSystemDefaultImage(img) }))
    .filter((x) => x.src);
}

function labelOf(options, value) {
  return options.find((o) => o.value === value || o.id === value)?.label || '';
}

function teachingStyleLabels(s) {
  const ids = Array.isArray(s.teaching_style_ids) ? s.teaching_style_ids.map(String) : [];
  if (ids.length) {
    return ids
      .map((id) => TEACHING_STYLE_OPTIONS.find((o) => String(o.id) === id)?.label || '')
      .filter(Boolean);
  }
  const raw = blank(s.teaching_style);
  if (!raw) return [];
  return raw
    .split(/[,|/]/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((id) => TEACHING_STYLE_OPTIONS.find((o) => String(o.id) === id)?.label || id);
}

function placeLabel(s) {
  if (s.lesson_place_type === 'academy') return '교습소';
  if (s.lesson_place_type === 'study_room') return '공부방';
  return '';
}

function regionLine(s) {
  const slots = Array.isArray(s.saved_regions) ? s.saved_regions : [];
  const primary = slots.find((r) => r?.is_primary) || slots[0];
  if (primary) {
    const t = blank(primary.region_label || primary.complex_name || '');
    if (t) return t;
  }
  return blank(s.region_label);
}

function feeLine(s, room) {
  if (s.monthly_fee_manwon !== '' && s.monthly_fee_manwon != null) {
    return `월 ${blank(s.monthly_fee_manwon)}만원대`;
  }
  if (room?.price_amount) {
    const man = Math.round(Number(room.price_amount) / 10000);
    if (man > 0) return `월 ${man}만원대`;
  }
  return '';
}

function capacityLine(s, room) {
  const raw = s.capacity_per_time || room?.capacity_per_time;
  const fromEnum = labelOf(CAPACITY_PER_TIME_OPTIONS, raw);
  if (fromEnum) return fromEnum;
  const t = blank(raw);
  // enum 키(one_to_four 등)는 라벨 없이 노출하지 않음
  if (!t || /^[a-z][a-z0-9_]*$/i.test(t)) return '';
  return t;
}

function operationLine(s) {
  return labelOf(LESSON_OPERATION_TYPES, s.lesson_operation_type);
}

function audienceLine(s, room) {
  const fromLevels = formatPrimaryAudienceLabel(s.primary_school_levels);
  if (fromLevels) return fromLevels;
  return blank(room?.grade_band);
}

function features(s, room) {
  return [s.feature_1, s.feature_2, s.feature_3, room?.feature_1]
    .map(blank)
    .filter(Boolean)
    .filter((v, i, arr) => arr.indexOf(v) === i);
}

function formatClassFee(raw) {
  const t = blank(raw);
  if (!t) return '';
  if (/만원/.test(t)) return t;
  return `${t}만원`;
}

function classSummaries(s) {
  const classes = Array.isArray(s.classes) ? s.classes : [];
  return classes
    .map((c) => {
      const name = blank(c.class_name || c.name);
      const subject = blank(c.subject_label || c.subject);
      const fee = formatClassFee(c.monthly_fee ?? c.fee);
      const bits = [name, subject, fee].filter(Boolean);
      return bits.join(' · ');
    })
    .filter(Boolean)
    .slice(0, 6);
}

function chips(items) {
  if (!items.length) return '';
  return `<ul class="myshop-chips">${items.map((t) => `<li class="myshop-chip">${esc(t)}</li>`).join('')}</ul>`;
}

function section(title, inner, extraClass = '') {
  if (!inner) return '';
  return `
    <section class="myshop-section${extraClass ? ` ${extraClass}` : ''}">
      <h2 class="myshop-section__title">${esc(title)}</h2>
      <div class="myshop-section__body">${inner}</div>
    </section>`;
}

/**
 * @param {typeof registerState} s
 * @param {import('./store.js').StudyRoomRecord} room
 */
export function renderMyshopShowcase(s, room) {
  const name = blank(s.study_room_name || room.study_room_name) || '우리 공부방';
  const slogan = blank(s.slogan || room.slogan);
  const introShort = blank(s.intro_short || room.intro_short);
  const introLong = blank(s.intro_long || room.intro_long);
  const subject = blank(s.main_subject_note || room.main_subject_note);
  const region = regionLine(s) || blank(room.region_label);
  const audience = audienceLine(s, room);
  const place = placeLabel(s) || (room.lesson_place_type === 'academy' ? '교습소' : room.lesson_place_type === 'study_room' ? '공부방' : '');
  const op = operationLine(s);
  const fee = feeLine(s, room);
  const capacity = capacityLine(s, room);
  const feats = features(s, room);
  const styles = teachingStyleLabels(s);
  const styleNote = blank(s.teaching_style_note);
  const facilityNote = blank(s.facility_note || room.facility_summary);
  const gallery = collectGallery(s);
  const realPhotos = gallery.filter((g) => !g.system);
  const heroSrc = realPhotos[0]?.src || gallery[0]?.src || ROOM_DEFAULT_BASIC;
  const galleryRest = realPhotos.length > 1 ? realPhotos.slice(1) : realPhotos.length === 0 && gallery.length > 1 ? gallery.slice(1) : realPhotos.slice(1);
  const classLines = classSummaries(s);
  const vibeBits = [
    s.weekend_available ? '주말 수업' : '',
    s.one_on_one_available ? '1:1 가능' : '',
  ].filter(Boolean);

  const metaBits = [region, audience, subject].filter(Boolean);

  const summaryItems = [
    place && { label: '수업장소', value: place },
    op && { label: '수업형태', value: op },
    audience && { label: '대상', value: audience },
    subject && { label: '과목', value: subject },
    fee && { label: '가격대', value: fee },
    capacity && { label: '원생수', value: capacity },
  ].filter(Boolean);

  const featureBody =
    feats.length || styles.length || styleNote || vibeBits.length
      ? `
      ${feats.length ? `<ol class="myshop-features">${feats.map((f, i) => `<li><span class="myshop-features__n">${i + 1}</span><span>${esc(f)}</span></li>`).join('')}</ol>` : ''}
      ${styles.length ? `<div class="myshop-style"><p class="myshop-style__label">지도 스타일</p>${chips(styles)}</div>` : ''}
      ${styleNote ? `<p class="myshop-prose myshop-prose--soft">${esc(styleNote)}</p>` : ''}
      ${vibeBits.length ? chips(vibeBits) : ''}
    `
      : '';

  const galleryBody =
    galleryRest.length > 0
      ? `<div class="myshop-gallery" data-myshop-gallery>
        ${galleryRest
          .map(
            (g, i) => `
          <button type="button" class="myshop-gallery__item" data-myshop-thumb="${esc(g.src)}" aria-label="사진 크게 보기 ${i + 1}">
            <img src="${esc(g.src)}" alt="" loading="lazy" />
          </button>`,
          )
          .join('')}
      </div>`
      : '';

  const introBody = [
    introLong ? `<p class="myshop-prose">${esc(introLong).replace(/\n/g, '<br />')}</p>` : '',
    facilityNote ? `<p class="myshop-prose myshop-prose--soft">${esc(facilityNote).replace(/\n/g, '<br />')}</p>` : '',
    classLines.length
      ? `<ul class="myshop-class-list">${classLines.map((line) => `<li>${esc(line)}</li>`).join('')}</ul>`
      : '',
  ]
    .filter(Boolean)
    .join('');

  const inquiryLine = myshopInquiryStatusLine(s.inquiry_status || room?.inquiry_status);
  const inquiryStatus = inquiryLine
    ? `<p class="myshop-inquiry-status" role="status">
        <span class="myshop-inquiry-status__label">문의 안내</span>
        <span class="myshop-inquiry-status__text">${esc(inquiryLine)}</span>
      </p>`
    : '';

  return `
    <article class="myshop" data-myshop>
      <span class="myshop-deco myshop-deco--tl" aria-hidden="true">✦</span>
      <span class="myshop-deco myshop-deco--tr" aria-hidden="true">★</span>
      <span class="myshop-deco myshop-deco--bl" aria-hidden="true">✿</span>
      <span class="myshop-deco myshop-deco--br" aria-hidden="true">♥</span>
      <header class="myshop-hero">
        <div class="myshop-hero__media">
          <img
            src="${esc(heroSrc)}"
            alt="${esc(name)}"
            data-myshop-fallback="${esc(ROOM_DEFAULT_BASIC)}"
            onerror="if(this.dataset.fallbackApplied)return;this.dataset.fallbackApplied='1';this.src=this.getAttribute('data-myshop-fallback')||'';"
          />
        </div>
        <div class="myshop-hero__copy">
          <p class="myshop-hero__eyebrow">나의 공부방</p>
          <h2 class="myshop-hero__name">${esc(name)}</h2>
          ${slogan ? `<p class="myshop-hero__slogan">${esc(slogan)}</p>` : ''}
          ${introShort && introShort !== slogan ? `<p class="myshop-hero__lead">${esc(introShort)}</p>` : ''}
          ${metaBits.length ? `<p class="myshop-hero__meta">${metaBits.map(esc).join(' · ')}</p>` : ''}
        </div>
      </header>

      ${
        summaryItems.length
          ? `<section class="myshop-summary" aria-label="핵심 정보">
        <ul class="myshop-summary__grid">
          ${summaryItems
            .map(
              (it) => `
            <li>
              <span class="myshop-summary__label">${esc(it.label)}</span>
              <strong class="myshop-summary__value">${esc(it.value)}</strong>
            </li>`,
            )
            .join('')}
        </ul>
      </section>`
          : ''
      }

      ${section('이 공부방의 매력', featureBody, 'myshop-section--features')}
      ${section('사진으로 보는 공간', galleryBody, 'myshop-section--gallery')}
      ${section('소개와 수업 이야기', introBody, 'myshop-section--intro')}
      ${inquiryStatus}
    </article>

    <div class="myshop-lightbox" data-myshop-lightbox hidden>
      <button type="button" class="myshop-lightbox__close" data-myshop-lightbox-close aria-label="닫기">×</button>
      <img src="" alt="" data-myshop-lightbox-img />
    </div>`;
}

/** @param {HTMLElement} root */
export function bindMyshopEvents(root) {
  const box = root.querySelector('[data-myshop-lightbox]');
  const img = root.querySelector('[data-myshop-lightbox-img]');
  if (!box || !img) return;

  const close = () => {
    box.hidden = true;
    img.removeAttribute('src');
  };

  root.querySelectorAll('[data-myshop-thumb]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const src = btn.getAttribute('data-myshop-thumb');
      if (!src) return;
      img.src = src;
      box.hidden = false;
    });
  });

  box.querySelector('[data-myshop-lightbox-close]')?.addEventListener('click', close);
  box.addEventListener('click', (e) => {
    if (e.target === box) close();
  });
}
