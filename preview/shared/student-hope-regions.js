/**
 * 학생 희망지역 이중 축 — 공부방(동/단지) · 과외쌤(시)
 * Notion 14장 상세등록 본체 + 1필수·추가2
 */

/** @typedef {'tutor'|'study_room'} StudentHopeType */

/**
 * @typedef {object} HopeRegionSlot
 * @property {string} region_id
 * @property {string} region_label
 * @property {string} [complex_id]
 * @property {string} [complex_label]
 * @property {string} [address_text]
 * @property {'city'|'dong'} [scope_type]
 * @property {boolean} [is_primary]
 */

/** @param {unknown} saved @param {number} [count] @returns {HopeRegionSlot[]} */
export function normalizeHopeSlots(saved, count = 3) {
  const arr = Array.isArray(saved) ? saved.map((s) => ({ ...s })) : [];
  while (arr.length < count) {
    arr.push({
      region_id: '',
      region_label: '',
      complex_id: '',
      complex_label: '',
      address_text: '',
      is_primary: arr.length === 0,
    });
  }
  return arr.slice(0, count).map((s, i) => ({
    region_id: s.region_id != null ? String(s.region_id) : '',
    region_label: String(s.region_label || '').trim(),
    complex_id: s.complex_id != null ? String(s.complex_id) : '',
    complex_label: String(s.complex_label || '').trim(),
    address_text: String(s.address_text || '').trim(),
    scope_type: s.scope_type === 'city' ? 'city' : 'dong',
    is_primary: i === 0,
  }));
}

/** @param {string} label */
export function cityLabelFromRegionLabel(label) {
  const first = String(label || '')
    .trim()
    .split(/\s+/)[0];
  if (!first) return '';
  // 표시는 「서울시」형으로 통일 가능하나, 마스터는 서울특별시 등 — 원문 시·도 유지
  return first;
}

/**
 * 레거시 region_label → preferred_lesson_type 축의 1번만 매핑 (반대축 복제 금지)
 * @param {object} student
 * @returns {{ preferred_studyroom_regions: HopeRegionSlot[], preferred_tutor_regions: HopeRegionSlot[] }}
 */
export function hydrateDualHopeRegions(student) {
  let study = normalizeHopeSlots(student?.preferred_studyroom_regions);
  let tutor = normalizeHopeSlots(student?.preferred_tutor_regions);

  const studyFilled = study.some((s) => s.region_id || s.region_label);
  const tutorFilled = tutor.some((s) => s.region_id || s.region_label);

  if (!studyFilled && student?.preferred_studyroom_region_id) {
    study[0] = {
      ...study[0],
      region_id: String(student.preferred_studyroom_region_id),
      region_label: String(student.preferred_studyroom_region_label || student.region_label || ''),
      complex_id: student.preferred_studyroom_complex_id
        ? String(student.preferred_studyroom_complex_id)
        : '',
      complex_label: String(student.preferred_studyroom_complex_label || ''),
      is_primary: true,
      scope_type: 'dong',
    };
  }
  if (!tutorFilled && student?.preferred_tutor_region_id) {
    tutor[0] = {
      ...tutor[0],
      region_id: String(student.preferred_tutor_region_id),
      region_label: String(
        student.preferred_tutor_region_label || cityLabelFromRegionLabel(student.region_label || ''),
      ),
      scope_type: 'city',
      is_primary: true,
    };
  }

  const studyOk = study.some((s) => s.region_id || s.region_label);
  const tutorOk = tutor.some((s) => s.region_id || s.region_label);
  const legacy = String(student?.region_label || '').trim();

  if (!studyOk && !tutorOk && legacy) {
    const hope = student?.preferred_lesson_type === 'study_room' ? 'study_room' : 'tutor';
    if (hope === 'study_room') {
      study[0] = {
        ...study[0],
        region_id: student.region_id != null ? String(student.region_id) : '',
        region_label: legacy,
        complex_id: '',
        complex_label: '',
        scope_type: 'dong',
        is_primary: true,
      };
    } else {
      tutor[0] = {
        ...tutor[0],
        region_id: student.region_id != null ? String(student.region_id) : '',
        region_label: cityLabelFromRegionLabel(legacy),
        scope_type: 'city',
        is_primary: true,
      };
    }
  }

  return { preferred_studyroom_regions: study, preferred_tutor_regions: tutor };
}

/** @param {HopeRegionSlot} slot @param {'studyroom'|'tutor'} axis */
export function formatHopeSlotLabel(slot, axis) {
  if (!slot) return '';
  if (axis === 'tutor') return String(slot.region_label || '').trim();
  if (slot.complex_label) {
    const addr = String(slot.address_text || '').trim();
    return addr ? `${slot.complex_label} · ${addr}` : String(slot.complex_label);
  }
  const parts = [slot.region_label].filter(Boolean);
  if (parts.length) return parts.join(' · ');
  return String(slot.address_text || '').trim();
}

/**
 * 희망유형 축의 1번 슬롯 라벨 (홈/찾기/카드 기본값)
 * @param {object} student
 */
export function primaryHopeRegionLabel(student) {
  const { preferred_studyroom_regions: study, preferred_tutor_regions: tutor } =
    hydrateDualHopeRegions(student || {});
  const hope = student?.preferred_lesson_type === 'study_room' ? 'study_room' : 'tutor';
  if (hope === 'study_room') return formatHopeSlotLabel(study[0], 'studyroom');
  return formatHopeSlotLabel(tutor[0], 'tutor');
}

/**
 * @param {HopeRegionSlot[]} slots
 * @param {'studyroom'|'tutor'} axis
 * @returns {string|null} error message
 */
export function validateHopeAxisSlots(slots, axis) {
  const list = normalizeHopeSlots(slots);
  const filled = list.map((s, i) => ({
    i,
    key:
      axis === 'tutor'
        ? String(s.region_label || s.region_id || '').trim()
        : [s.region_id || s.region_label, s.complex_id].filter(Boolean).join('|'),
    has: axis === 'tutor' ? !!(s.region_id || s.region_label) : !!(s.region_id || s.region_label),
  }));

  if (!filled[0]?.has) {
    return axis === 'tutor'
      ? '과외쌤 희망지역 1번(시)을 선택해 주세요.'
      : '공부방 희망지역 1번(행정동)을 선택해 주세요.';
  }

  for (let i = 1; i < filled.length; i++) {
    if (filled[i].has && !filled[i - 1].has) {
      return `${axis === 'tutor' ? '과외쌤' : '공부방'} 희망지역은 ${i}번을 먼저 입력해야 ${i + 1}번을 넣을 수 있습니다.`;
    }
  }

  const keys = filled.filter((f) => f.has).map((f) => f.key);
  if (new Set(keys).size !== keys.length) {
    return `${axis === 'tutor' ? '과외쌤' : '공부방'} 희망지역에 중복된 선택이 있습니다.`;
  }

  return null;
}

/**
 * @param {HopeRegionSlot[]} study
 * @param {HopeRegionSlot[]} tutor
 * @returns {string|null}
 */
export function validateDualHopeRegions(study, tutor) {
  return validateHopeAxisSlots(study, 'studyroom') || validateHopeAxisSlots(tutor, 'tutor');
}

/**
 * 공개 readiness용 — 희망유형 축의 1번만 필수 (반대축 강제 금지)
 * @param {object} student
 */
export function dualHopeRegionsReady(student) {
  const { preferred_studyroom_regions: study, preferred_tutor_regions: tutor } =
    hydrateDualHopeRegions(student || {});
  const hope = student?.preferred_lesson_type === 'study_room' ? 'study_room' : 'tutor';
  if (hope === 'study_room') {
    const basis = student?.preferred_studyroom_region_basis;
    const studyOk =
      basis === 'complex'
        ? !!(study[0]?.complex_id || study[0]?.complex_label)
        : !!(study[0]?.region_id || study[0]?.region_label);
    return { studyOk, tutorOk: true, ok: studyOk, activeHope: hope };
  }
  const tutorOk = !!(tutor[0]?.region_id || tutor[0]?.region_label);
  return { studyOk: true, tutorOk, ok: tutorOk, activeHope: hope };
}

/** 찾기 A→B→C — 희망유형별 1번 슬롯 기억 */
const FIND_REGION_KEY = 'study114.studentFind.lastRegionByHope';

/** @returns {{ tutor?: string, study_room?: string }} */
export function readStoredHopeRegions() {
  try {
    const raw = localStorage.getItem(FIND_REGION_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * @param {StudentHopeType} hopeType
 * @param {string} regionLabel
 */
export function writeStoredHopeRegion(hopeType, regionLabel) {
  const label = String(regionLabel || '').trim();
  if (!label || (hopeType !== 'tutor' && hopeType !== 'study_room')) return;
  try {
    const prev = readStoredHopeRegions();
    prev[hopeType] = label;
    localStorage.setItem(FIND_REGION_KEY, JSON.stringify(prev));
  } catch {
    /* ignore */
  }
}

/**
 * @param {StudentHopeType} hopeType
 * @param {string} [guestFallback]
 */
export function resolveFindDefaultRegion(hopeType, guestFallback = '') {
  const stored = readStoredHopeRegions()[hopeType];
  if (stored) return stored;
  return guestFallback;
}

/**
 * 저장 후 찾기 기본값 갱신 — 양축 1번
 * @param {object} student
 */
export function persistFindDefaultsFromStudent(student) {
  const { preferred_studyroom_regions: study, preferred_tutor_regions: tutor } =
    hydrateDualHopeRegions(student || {});
  const studyLabel = formatHopeSlotLabel(study[0], 'studyroom');
  const tutorLabel = formatHopeSlotLabel(tutor[0], 'tutor');
  if (studyLabel) writeStoredHopeRegion('study_room', studyLabel);
  if (tutorLabel) writeStoredHopeRegion('tutor', tutorLabel);
}
