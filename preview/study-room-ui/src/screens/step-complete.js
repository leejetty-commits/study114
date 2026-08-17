import {
  registerState,
  getFacilityOptions,
  LESSON_PLACE_TYPES,
  LESSON_OPERATION_TYPES,
  CAPACITY_PER_TIME_OPTIONS,
  PERSONAL_GENDER_OPTIONS,
  getRegions,
  getComplexes,
} from '../state.js';
import { applyRoomToState } from '../form-collect.js';
import { loadRoom } from '../register-api.js';
import { renderRegisterShell, renderGuideNotice, bindGlobalEvents, mypageRegistrationsUrl } from '../layout.js';
import { homeUiUrl } from '../../../shared/preview-links.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

function blank(v) {
  const s = String(v ?? '').trim();
  return s || '—';
}

function formatPrice(amount) {
  if (!amount) return '—';
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return '—';
  return `${n.toLocaleString('ko-KR')}원/월`;
}

function yn(v) {
  return v ? '예' : '아니오';
}

function labelOf(list, value) {
  return list.find((o) => o.value === value)?.label || blank(value);
}

function facilityNames() {
  return registerState.facility_ids
    .map((id) => getFacilityOptions().find((f) => f.id === id)?.facility_name)
    .filter(Boolean)
    .join(', ');
}

function regionLabel(id) {
  if (!id) return '';
  return getRegions().find((r) => String(r.id) === String(id))?.label || String(id);
}

function complexLabel(id) {
  if (!id) return '';
  const c = getComplexes().find((x) => String(x.id) === String(id));
  if (!c) return String(id);
  return c.address ? `${c.label} (${c.address})` : c.label;
}

function locationLines(s) {
  const slots = Array.isArray(s.saved_regions) ? s.saved_regions : [];
  const lines = slots
    .map((slot, i) => {
      const basis = slot.region_basis_type || s.region_basis_type || 'dong';
      const text =
        basis === 'complex' ? complexLabel(slot.complex_id) : regionLabel(slot.region_id);
      if (!String(text || '').trim()) return null;
      return `${slot.is_primary ? '대표' : i + 1} · ${text}`;
    })
    .filter(Boolean);
  return lines.length ? lines.join('\n') : '';
}

function row(label, value, multiline = false) {
  const text = multiline ? esc(blank(value)).replace(/\n/g, '<br />') : esc(blank(value));
  return `<div class="register-overview__row"><dt>${esc(label)}</dt><dd><span>${text}</span></dd></div>`;
}

let hydratingComplete = false;

export function renderComplete() {
  const s = registerState;
  const skipped = s.detail_completion_status !== 'expanded_complete';
  const subjects = (s.subjects || [])
    .filter((x) => String(x.subject_name || '').trim())
    .map((x) => `${x.subject_name}${x.grade_band ? ` (${x.grade_band})` : ''}${x.is_main ? ' · 주력' : ''}`)
    .join('\n');

  const content = `
    <div class="register-complete">
      <div class="register-complete__icon" aria-hidden="true">✓</div>
      <h2 class="register-complete__title">${skipped ? '지금까지 입력한 내용입니다' : '공부방 등록이 완료되었습니다'}</h2>
      <p class="register-complete__thanks">${skipped ? '상세등록은 마이페이지에서 이어서 채울 수 있습니다.' : '수고하셨습니다!'}</p>
      <p class="register-complete__lead">아래는 서버에 저장된 값입니다. 비어 있는 항목은 마이페이지에서 입력할 수 있습니다.</p>
    </div>
    ${renderGuideNotice('내용을 다시 손보고 싶으면 마이페이지 · 내 등록에서 수정할 수 있습니다.')}
    <div class="register-overview">
      <h3 class="register-section-title">기본정보</h3>
      <dl class="register-overview__dl">
        ${row('공부방명', s.study_room_name)}
        ${row('주력과목', s.main_subject_note)}
        ${row('원장 성별', labelOf(PERSONAL_GENDER_OPTIONS, s.gender))}
        ${row('교습장', labelOf(LESSON_PLACE_TYPES, s.lesson_place_type))}
        ${row('운영자 표시명', s.operator_display_name)}
        ${row('한 줄 소개', s.intro_short)}
      </dl>
      <h3 class="register-section-title">위치</h3>
      <dl class="register-overview__dl">
        ${row('대표 위치', locationLines(s).split('\n')[0] || regionLabel(s.region_id) || complexLabel(s.complex_id))}
        ${row('노출 지역', locationLines(s), true)}
        ${row('주소 요약', s.address_text)}
      </dl>
      <h3 class="register-section-title">수업 · 가격</h3>
      <dl class="register-overview__dl">
        ${row('수업운영형태', labelOf(LESSON_OPERATION_TYPES, s.lesson_operation_type))}
        ${row('타임별 원생수', labelOf(CAPACITY_PER_TIME_OPTIONS, s.capacity_per_time))}
        ${row('모집 인원', s.recruitment_count)}
        ${row('지도 스타일', s.teaching_style)}
        ${row('주말 가능', yn(s.weekend_available))}
        ${row('1:1 가능', yn(s.one_on_one_available))}
        ${row('월 대표 가격', formatPrice(s.price_amount))}
        ${row('가격 설명', s.price_description, true)}
        ${row('대상 과목', subjects, true)}
      </dl>
      <h3 class="register-section-title">경력 · 시설 · 연락</h3>
      <dl class="register-overview__dl">
        ${row('교습 경력(년)', s.career_years)}
        ${row('학원 경력(년)', s.academy_career_years)}
        ${row('프랜차이즈', s.franchise_flag ? blank(s.franchise_name) || '예' : '아니오')}
        ${row('교육청 등록', s.education_office_registered ? blank(s.education_office_reg_no) || '예' : '아니오')}
        ${row('특징 1', s.feature_1)}
        ${row('특징 2', s.feature_2)}
        ${row('특징 3', s.feature_3)}
        ${row('시설', facilityNames())}
        ${row('시설 설명', s.facility_note, true)}
        ${row('연락 가능 시간', s.contact_time_note)}
        ${row('문의 전화', s.contact_phone)}
        ${row('유튜브', s.youtube_url)}
        ${row('페이스북', s.facebook_url)}
        ${row('인스타그램', s.instagram_url)}
        ${row('공개 상태', s.profile_status === 'published' ? '공개' : '저장만 (비공개)')}
      </dl>
    </div>
    <div class="register-nav" style="border-top:none;padding-top:var(--space-2);">
      <a href="${mypageRegistrationsUrl()}" class="btn btn--secondary">마이페이지에서 수정</a>
      <a href="${homeUiUrl('study-room')}" class="btn btn--primary">공부방 메인으로</a>
    </div>
  `;
  return renderRegisterShell(content, {
    stepKey: 'complete',
    title: '입력 내용 확인',
    subtitle: skipped ? '건너뛴 항목은 비어 있습니다.' : '상세등록까지 저장된 값입니다.',
  });
}

export function bindCompleteEvents(root) {
  bindGlobalEvents(root);
  if (!registerState.completeNeedsHydrate || hydratingComplete) return;
  hydratingComplete = true;
  loadRoom()
    .then((room) => {
      if (room) applyRoomToState(registerState, room);
      registerState.completeNeedsHydrate = false;
      window.dispatchEvent(new Event('hashchange'));
    })
    .catch(() => {
      registerState.completeNeedsHydrate = false;
    })
    .finally(() => {
      hydratingComplete = false;
    });
}
