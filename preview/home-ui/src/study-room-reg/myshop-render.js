/**
 * 샵 페이지 단일 렌더 (ShopPage)
 * — 원장 마이페이지「마이샵」과 공개 `#/myshop/study-room/:id` 가 동일한 본문.
 * — 폼·운영 UI 금지. 입력값 결과물만. 빈 값 숨김.
 */

import {
  LESSON_OPERATION_TYPES,
  CAPACITY_PER_TIME_OPTIONS,
  TEACHING_STYLE_OPTIONS,
  WEEKDAY_OPTIONS,
  DAILY_LESSON_MINUTES,
  WEEKLY_LESSON_COUNTS,
  IMAGE_TYPES,
  FACILITY_OPTIONS,
  SCHOOL_LEVELS,
  getFacilityOptions,
} from '@study-room-ui/state.js';
import { formatPrimaryAudienceLabel } from '../../../shared/study-room-basic-form.js';
import { myshopInquiryStatusLine } from './inquiry-display.js';

const ROOM_DEFAULT = '/assets/brand/room-card-default-basic.svg';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

function blank(v) {
  const s = String(v ?? '').trim();
  if (!s || s === '—' || s === '-') return '';
  return s;
}

function labelOf(options, value) {
  if (value == null || value === '') return '';
  return options.find((o) => String(o.value) === String(value) || String(o.id) === String(value))?.label || '';
}

function boolOn(v) {
  return v === true || v === 1 || v === '1';
}

function imgSrc(img) {
  if (!img || typeof img !== 'object') return '';
  return blank(img.basic_720_path || img.prime_1280_path || img.image_path || img.name || img.src);
}

function isSystemDefaultImage(img) {
  return Boolean(img?.is_system_default);
}

function collectPhotos(s) {
  const list = Array.isArray(s.images) ? s.images : [];
  return list
    .map((img) => ({
      src: imgSrc(img),
      type: blank(img.image_type) || 'other',
      title: blank(img.title || img.caption || ''),
      system: isSystemDefaultImage(img),
    }))
    .filter((x) => x.src && !x.system);
}

/** 대표 → Hero, Gallery는 내부시설 → 시설 → 기타 우선 */
function splitHeroAndGallery(photos) {
  const list = Array.isArray(photos) ? [...photos] : [];
  const coverIdx = list.findIndex((p) => p.type === 'cover');
  const hero = coverIdx >= 0 ? list[coverIdx] : list[0] || null;
  const rest = list.filter((p) => p !== hero);
  const rank = (t) => (t === 'interior' ? 0 : t === 'facility' ? 1 : 2);
  rest.sort((a, b) => rank(a.type) - rank(b.type));
  return { hero, gallery: rest };
}

export function __shopTestHooks() {
  return { collectPhotos, splitHeroAndGallery, blank, labelOf, boolOn };
}

function placeLabel(s) {
  if (s.lesson_place_type === 'academy') return '교습소';
  if (s.lesson_place_type === 'study_room') return '공부방';
  return '';
}

function audienceLine(s, room) {
  const fromLevels = formatPrimaryAudienceLabel(s.primary_school_levels);
  if (fromLevels) return fromLevels;
  return blank(room?.grade_band);
}

function regionLabels(s, room) {
  const slots = Array.isArray(s.saved_regions) ? s.saved_regions : [];
  const fromSlots = slots
    .map((r) => blank(r?.region_label || r?.complex_name || ''))
    .filter(Boolean);
  if (fromSlots.length) return [...new Set(fromSlots)];
  if (Array.isArray(s.promo_regions) && s.promo_regions.length) {
    return s.promo_regions.map(blank).filter(Boolean);
  }
  const one = blank(s.region_label || room?.region_label || room?.location_label);
  return one ? [one] : [];
}

function livingAreaSentence(labels) {
  if (!labels.length) return '';
  if (labels.length === 1) return `${labels[0]} 생활권`;
  return `${labels[0]} 생활권 · ${labels.slice(1).join(' · ')}`;
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

function feeLine(s, room) {
  if (s.monthly_fee_manwon !== '' && s.monthly_fee_manwon != null) {
    const n = blank(s.monthly_fee_manwon).replace(/만원.*$/, '');
    return n ? `월 ${n}만원대` : '';
  }
  if (room?.price_amount) {
    const man = Math.round(Number(room.price_amount) / 10000);
    if (man > 0) return `월 ${man}만원대`;
  }
  return '';
}

function minutesLabel(v) {
  return labelOf(DAILY_LESSON_MINUTES, v) || (blank(v) && /^\d+$/.test(blank(v)) ? `${blank(v)}분` : '');
}

function weeklyLabel(v) {
  return labelOf(WEEKLY_LESSON_COUNTS, v) || (blank(v) ? `주 ${blank(v)}회` : '');
}

function schoolLevelLabel(v) {
  return labelOf(SCHOOL_LEVELS, v) || blank(v);
}

function attendanceLabel(days) {
  if (!Array.isArray(days) || !days.length) return '';
  return days
    .map((d) => labelOf(WEEKDAY_OPTIONS, d) || blank(d))
    .filter(Boolean)
    .join('·');
}

function formatClassFee(raw) {
  const t = blank(raw);
  if (!t) return '';
  if (/만원/.test(t)) return `월 ${t.replace(/^월\s*/, '')}`;
  return `월 ${t}만원`;
}

function facilityNames(s) {
  if (Array.isArray(s.facility_names) && s.facility_names.length) {
    return s.facility_names.map(blank).filter(Boolean);
  }
  const ids = Array.isArray(s.facility_ids) ? s.facility_ids.map(Number) : [];
  if (!ids.length) {
    const summary = blank(s.facility_note || s.facility_summary);
    if (summary && /[·,]/.test(summary) && summary.length < 80) {
      return summary.split(/[·,]/).map((x) => x.trim()).filter(Boolean);
    }
    return [];
  }
  const opts = getFacilityOptions().length ? getFacilityOptions() : FACILITY_OPTIONS;
  return ids
    .map((id) => opts.find((f) => Number(f.id) === id)?.facility_name || '')
    .filter(Boolean);
}

function imageTypeLabel(type) {
  return labelOf(IMAGE_TYPES, type) || '';
}

function section(title, inner, tone = '') {
  if (!inner) return '';
  return `
    <section class="shop-sec${tone ? ` shop-sec--${tone}` : ''}">
      <h2 class="shop-sec__title"><span class="shop-sec__mark" aria-hidden="true"></span>${esc(title)}</h2>
      <div class="shop-sec__body">${inner}</div>
    </section>`;
}

function tile(label, value) {
  if (!value) return '';
  return `
    <li class="shop-bento__item">
      <span class="shop-bento__label">${esc(label)}</span>
      <strong class="shop-bento__value">${esc(value)}</strong>
    </li>`;
}

/**
 * @param {object} s registerState-like
 * @param {object} room
 */
export function renderMyshopShowcase(s, room) {
  const name = blank(s.study_room_name || room?.study_room_name) || '공부방';
  const slogan = blank(s.slogan || room?.slogan);
  const introShort = blank(s.intro_short || room?.intro_short);
  const introLong = blank(s.intro_long || room?.intro_long);
  const subject = blank(s.main_subject_note || room?.main_subject_note);
  const place = placeLabel(s);
  const audience = audienceLine(s, room);
  const regions = regionLabels(s, room);
  const living = livingAreaSentence(regions);
  const styles = teachingStyleLabels(s);
  const styleNote = blank(s.teaching_style_note);
  const photos = collectPhotos(s);
  const { hero, gallery } = splitHeroAndGallery(photos);
  const heroSrc = hero?.src || ROOM_DEFAULT;
  const heroIsDefault = !hero;

  const op = labelOf(LESSON_OPERATION_TYPES, s.lesson_operation_type);
  const capacity = labelOf(CAPACITY_PER_TIME_OPTIONS, s.capacity_per_time)
    || (!/^[a-z][a-z0-9_]*$/i.test(blank(s.capacity_per_time)) ? blank(s.capacity_per_time) : '');
  const fee = feeLine(s, room);
  const minutes = minutesLabel(s.minutes_per_lesson);
  const weekly = weeklyLabel(s.lessons_per_week);

  const chips = [audience, subject, place].filter(Boolean);

  /* —— Hero —— */
  const heroHtml = `
    <header class="shop-hero">
      <div class="shop-hero__media${heroIsDefault ? ' shop-hero__media--default' : ''}">
        <img
          src="${esc(heroSrc)}"
          alt="${esc(name)}"
          data-shop-fallback="${esc(ROOM_DEFAULT)}"
          onerror="if(this.dataset.fb)return;this.dataset.fb='1';this.src=this.getAttribute('data-shop-fallback')||'';"
        />
      </div>
      <div class="shop-hero__card">
        <p class="shop-hero__eyebrow">동네의 작은 공부방</p>
        <h1 class="shop-hero__name">${esc(name)}</h1>
        ${slogan ? `<p class="shop-hero__slogan">${esc(slogan)}</p>` : ''}
        ${introShort && introShort !== slogan ? `<p class="shop-hero__lead">${esc(introShort)}</p>` : ''}
        ${living ? `<p class="shop-hero__area">${esc(living)}</p>` : ''}
        ${
          chips.length
            ? `<ul class="shop-hero__chips">${chips.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>`
            : ''
        }
      </div>
    </header>`;

  /* —— Quick Facts Bento —— */
  const bentoParts = [
    tile('과목', subject),
    tile('대상', audience),
    tile('교습형태', place),
    tile('원생수', capacity),
    tile('가격대', fee),
    tile('수업형태', op),
    tile('1일 수업', minutes),
    tile('주당 회수', weekly),
    boolOn(s.one_on_one_available) ? tile('1:1', '가능') : '',
    boolOn(s.weekend_available) ? tile('주말', '가능') : '',
    boolOn(s.correction_available) ? tile('첨삭', '운영') : '',
    boolOn(s.card_payment_available) ? tile('카드결제', '가능') : '',
    boolOn(s.cash_receipt_available) ? tile('현금영수증', '가능') : '',
  ].filter(Boolean);

  const bentoHtml = bentoParts.length
    ? `<section class="shop-bento" aria-label="핵심 정보">
        <ul class="shop-bento__grid">${bentoParts.join('')}</ul>
      </section>`
    : '';

  /* —— Signature —— */
  const sigBits = [
    styles.length
      ? `<ul class="shop-chips">${styles.map((t) => `<li class="shop-chip">${esc(t)}</li>`).join('')}</ul>`
      : '',
    styleNote ? `<p class="shop-prose shop-prose--accent">${esc(styleNote).replace(/\n/g, '<br />')}</p>` : '',
    introLong ? `<p class="shop-prose">${esc(introLong).replace(/\n/g, '<br />')}</p>` : '',
  ].filter(Boolean);
  const signatureHtml = section('이 공부방의 매력', sigBits.join(''), 'signature');

  /* —— Gallery —— */
  let galleryHtml = '';
  if (gallery.length) {
    const [main, ...rest] = gallery;
    galleryHtml = section(
      '사진으로 보는 공간',
      `<div class="shop-gallery" data-shop-gallery>
        <button type="button" class="shop-gallery__hero" data-shop-thumb="${esc(main.src)}" aria-label="사진 크게 보기">
          <img src="${esc(main.src)}" alt="" loading="lazy" />
          ${main.title || imageTypeLabel(main.type) ? `<span class="shop-gallery__cap">${esc(main.title || imageTypeLabel(main.type))}</span>` : ''}
        </button>
        ${
          rest.length
            ? `<div class="shop-gallery__thumbs">
            ${rest
              .map(
                (g, i) => `
              <button type="button" class="shop-gallery__thumb" data-shop-thumb="${esc(g.src)}" aria-label="사진 ${i + 2}">
                <img src="${esc(g.src)}" alt="" loading="lazy" />
              </button>`,
              )
              .join('')}
          </div>`
            : ''
        }
      </div>`,
      'gallery',
    );
  }

  /* —— Classes —— */
  const classes = Array.isArray(s.classes) ? s.classes : [];
  const classCards = classes
    .map((c) => {
      const title = blank(c.class_name || c.name);
      const subj = blank(c.subject_label || c.subject_name || c.subject || c.subject_custom);
      const level = schoolLevelLabel(c.school_level);
      const grade = blank(c.grade_band);
      const days = attendanceLabel(c.attendance_days);
      const perWeek = weeklyLabel(c.lessons_per_week);
      const classFee = formatClassFee(c.monthly_fee ?? c.fee);
      const feeNote = blank(c.fee_note);
      const note = blank(c.lesson_note);
      if (!title && !subj && !classFee && !note) return '';
      return `
        <div class="shop-class">
          <header class="shop-class__head">
            <h3 class="shop-class__title">${esc(title || subj || '수업')}</h3>
            <p class="shop-class__topline">
              ${[level, subj, perWeek, classFee].filter(Boolean).map(esc).join(' · ')}
            </p>
          </header>
          <dl class="shop-class__meta">
            ${grade ? `<div><dt>학년</dt><dd>${esc(grade)}</dd></div>` : ''}
            ${days ? `<div><dt>출석</dt><dd>${esc(days)}</dd></div>` : ''}
            ${feeNote ? `<div class="shop-class__span"><dt>수업료</dt><dd>${esc(feeNote)}</dd></div>` : ''}
            ${note ? `<div class="shop-class__span"><dt>참고</dt><dd>${esc(note)}</dd></div>` : ''}
          </dl>
        </div>`;
    })
    .filter(Boolean)
    .join('');
  const classesHtml = classCards ? section('수업 안내', `<div class="shop-classes">${classCards}</div>`, 'classes') : '';

  /* —— Career —— */
  const uni = blank(s.university_name);
  const major = blank(s.major_name);
  const careerY = blank(s.career_years);
  const academyY = blank(s.academy_career_years);
  const feats = [s.feature_1, s.feature_2, s.feature_3].map(blank).filter(Boolean);
  const careerBits = [
    uni || major
      ? `<p class="shop-prose">${[uni, major].filter(Boolean).map(esc).join(' · ')}</p>`
      : '',
    careerY || academyY
      ? `<ul class="shop-statline">
          ${careerY ? `<li><span>교습경력</span><strong>${esc(careerY)}년</strong></li>` : ''}
          ${academyY ? `<li><span>학원경력</span><strong>${esc(academyY)}년</strong></li>` : ''}
        </ul>`
      : '',
    feats.length
      ? `<ul class="shop-bullets">${feats.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>`
      : '',
  ].filter(Boolean);
  const careerHtml = section('원장 소개 · 경력', careerBits.join(''), 'career');

  /* —— Trust —— */
  const trustItems = [];
  if (boolOn(s.education_office_registered)) {
    trustItems.push({
      label: '교육청 등록',
      value: blank(s.education_office_reg_no) ? `완료 · ${blank(s.education_office_reg_no)}` : '완료',
    });
  }
  if (boolOn(s.business_registration_available)) {
    trustItems.push({ label: '사업자등록', value: '확인' });
  }
  if (s.franchise_flag === true || s.franchise_flag === 1) {
    trustItems.push({
      label: '프랜차이즈',
      value: blank(s.franchise_name) || '예',
    });
  }
  const proofs = Array.isArray(s.other_proof_notes)
    ? s.other_proof_notes.map(blank).filter(Boolean)
    : blank(s.other_proof_notes)
      ? [blank(s.other_proof_notes)]
      : [];
  if (proofs.length) {
    trustItems.push({ label: '기타 증빙', value: proofs.join(' · ') });
  }
  const trustHtml = trustItems.length
    ? section(
        '신뢰 정보',
        `<ul class="shop-trust">
          ${trustItems
            .map(
              (t) => `
            <li>
              <span class="shop-trust__label">${esc(t.label)}</span>
              <strong class="shop-trust__value">${esc(t.value)}</strong>
            </li>`,
            )
            .join('')}
        </ul>`,
        'trust',
      )
    : '';

  /* —— Facility —— */
  const facNames = facilityNames(s);
  const facNote = blank(s.facility_note);
  const facOnlyNote =
    !facNames.length && facNote && !/^[가-힣A-Za-z0-9]+(?:[·,][가-힣A-Za-z0-9]+)+$/.test(facNote)
      ? facNote
      : facNames.length
        ? facNote
        : '';
  const facilityInner = [
    facNames.length
      ? `<ul class="shop-chips shop-chips--soft">${facNames.map((n) => `<li class="shop-chip">${esc(n)}</li>`).join('')}</ul>`
      : '',
    facOnlyNote ? `<p class="shop-prose shop-prose--soft">${esc(facOnlyNote).replace(/\n/g, '<br />')}</p>` : '',
  ].filter(Boolean);
  const facilityHtml = section('시설 · 환경', facilityInner.join(''), 'facility');

  /* —— Location —— */
  const locationInner = regions.length
    ? `
      <p class="shop-area__main">${esc(regions[0])} <span>생활권</span></p>
      ${
        regions.length > 1
          ? `<ul class="shop-chips shop-chips--soft">${regions
              .slice(1)
              .map((r) => `<li class="shop-chip">${esc(r)}</li>`)
              .join('')}</ul>`
          : ''
      }`
    : '';
  const locationHtml = section('위치 · 생활권', locationInner, 'area');

  /* —— Social —— */
  const socialLinks = [
    blank(s.youtube_url) && { label: '유튜브', href: blank(s.youtube_url) },
    blank(s.facebook_url) && { label: '페이스북', href: blank(s.facebook_url) },
    blank(s.instagram_url) && { label: '인스타그램', href: blank(s.instagram_url) },
  ].filter(Boolean);
  const socialHtml = socialLinks.length
    ? section(
        '소셜',
        `<ul class="shop-social">
          ${socialLinks
            .map(
              (l) => `
            <li><a href="${esc(l.href)}" target="_blank" rel="noopener noreferrer">${esc(l.label)}</a></li>`,
            )
            .join('')}
        </ul>`,
        'social',
      )
    : '';

  /* —— Inquiry —— */
  const inquiryLine = myshopInquiryStatusLine(s.inquiry_status || room?.inquiry_status);
  const inquiryHtml = inquiryLine
    ? `<footer class="shop-inquiry" role="status">
        <span class="shop-inquiry__label">문의 안내</span>
        <strong class="shop-inquiry__text">${esc(inquiryLine)}</strong>
      </footer>`
    : '';

  return `
    <article class="shop" data-myshop data-shop>
      ${heroHtml}
      ${bentoHtml}
      ${signatureHtml}
      ${galleryHtml}
      ${classesHtml}
      ${careerHtml}
      ${trustHtml}
      ${facilityHtml}
      ${locationHtml}
      ${socialHtml}
      ${inquiryHtml}
    </article>

    <div class="shop-lightbox" data-myshop-lightbox data-shop-lightbox hidden>
      <button type="button" class="shop-lightbox__close" data-myshop-lightbox-close aria-label="닫기">×</button>
      <img src="" alt="" data-myshop-lightbox-img data-shop-lightbox-img />
    </div>`;
}

/** @param {HTMLElement} root */
export function bindMyshopEvents(root) {
  const box = root.querySelector('[data-myshop-lightbox], [data-shop-lightbox]');
  const img = root.querySelector('[data-myshop-lightbox-img], [data-shop-lightbox-img]');
  if (!box || !img) return;

  const close = () => {
    box.hidden = true;
    img.removeAttribute('src');
  };

  root.querySelectorAll('[data-shop-thumb], [data-myshop-thumb]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const src = btn.getAttribute('data-shop-thumb') || btn.getAttribute('data-myshop-thumb');
      if (!src) return;
      img.src = src;
      box.hidden = false;
    });
  });

  box.querySelector('[data-myshop-lightbox-close], .shop-lightbox__close')?.addEventListener('click', close);
  box.addEventListener('click', (e) => {
    if (e.target === box) close();
  });
}
