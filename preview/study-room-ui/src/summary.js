/**
 * 공부방 등록 마지막 요약 — 샘플 없이, 기록된 값(빈칸 포함)을 전 항목 나열한다.
 */

import {
  apiMasters,
  SCHOOL_LEVELS,
  LESSON_PLACE_TYPES,
  LESSON_OPERATION_TYPES,
  CAPACITY_PER_TIME_OPTIONS,
  PERSONAL_GENDER_OPTIONS,
  IMAGE_TYPES,
} from './state.js';

function str(v) {
  if (v === null || v === undefined) return '';
  return String(v).trim();
}

function labelOf(list, value) {
  const raw = str(value);
  if (!raw) return '';
  return list.find((o) => String(o.value) === raw)?.label || raw;
}

function yn(v) {
  if (v === null || v === undefined || v === '') return '';
  return v ? '예' : '아니오';
}

function regionLabel(id) {
  const raw = str(id);
  if (!raw) return '';
  const hit = (apiMasters.regions || []).find((r) => String(r.id) === raw);
  return hit?.label || raw;
}

function complexLabel(id) {
  const raw = str(id);
  if (!raw) return '';
  const hit = (apiMasters.complexes || []).find((c) => String(c.id) === raw);
  if (!hit) return raw;
  return hit.address ? `${hit.label} (${hit.address})` : hit.label;
}

function facilityNames(ids) {
  const list = Array.isArray(ids) ? ids : [];
  if (!list.length) return '';
  const masters = apiMasters.facilities || [];
  return list
    .map((id) => {
      const hit = masters.find((f) => Number(f.id) === Number(id));
      return hit ? hit.facility_name : String(id);
    })
    .join(', ');
}

function subjectLine(sub) {
  const name = str(sub?.subject_name);
  const level = labelOf(SCHOOL_LEVELS, sub?.school_level);
  const grade = str(sub?.grade_band);
  const bits = [name, level, grade].filter(Boolean);
  const main = sub?.is_main ? '주력' : '';
  if (!bits.length && !main) return '';
  return [bits.join(' · '), main].filter(Boolean).join(' · ');
}

function slotLine(slot, idx) {
  if (!slot) return '';
  const basis = str(slot.region_basis_type);
  const loc =
    basis === 'complex' ? complexLabel(slot.complex_id) : regionLabel(slot.region_id);
  const mark = slot.is_primary ? '대표' : String(idx + 1);
  if (!loc && !basis) return '';
  return [mark, basis === 'complex' ? '단지' : basis === 'dong' ? '동' : basis, loc]
    .filter(Boolean)
    .join(' · ');
}

function imageLine(img) {
  if (!img) return '';
  const type = labelOf(IMAGE_TYPES, img.image_type);
  const name = str(img.name || img.image_path);
  return [type, name].filter(Boolean).join(' · ');
}

function profileStatusLabel(v) {
  const raw = str(v);
  if (!raw) return '';
  if (raw === 'published') return '공개';
  if (raw === 'hidden') return '숨김';
  if (raw === 'draft' || raw === 'pending') return '저장만 (비공개)';
  return raw;
}

function detailStatusLabel(v) {
  const raw = str(v);
  if (!raw) return '';
  if (raw === 'basic_only') return '기본만';
  if (raw === 'expanded_in_progress') return '상세 진행 중';
  if (raw === 'expanded_complete') return '상세 완료';
  return raw;
}

/**
 * @param {Record<string, unknown>} room
 * @returns {{ title: string, rows: { label: string, value: string }[] }[]}
 */
export function buildRoomInputSummary(room) {
  const s = room && typeof room === 'object' ? room : {};
  const slots = Array.isArray(s.saved_regions) ? s.saved_regions : [];
  const subjects = Array.isArray(s.subjects) ? s.subjects : [];
  const images = Array.isArray(s.images) ? s.images : [];

  const slotValues = [0, 1, 2].map((i) => slotLine(slots[i], i));
  const subjectValues = subjects.length
    ? subjects.map((sub, i) => subjectLine(sub) || '')
    : [''];
  const imageValues = images.length ? images.map((img) => imageLine(img)) : [''];

  return [
    {
      title: '기본정보',
      rows: [
        { label: '공부방명', value: str(s.study_room_name) },
        { label: '주력과목', value: str(s.main_subject_note) },
        { label: '원장 성별', value: labelOf(PERSONAL_GENDER_OPTIONS, s.gender) },
        { label: '교습장', value: labelOf(LESSON_PLACE_TYPES, s.lesson_place_type) },
        { label: '운영자 표시명', value: str(s.operator_display_name) },
        { label: '슬로건', value: str(s.slogan) },
        { label: '한 줄 소개', value: str(s.intro_short) },
        { label: '소개', value: str(s.intro_long) },
      ],
    },
    {
      title: '위치',
      rows: [
        { label: '위치 기준', value: s.region_basis_type === 'complex' ? '단지' : s.region_basis_type === 'dong' ? '동' : str(s.region_basis_type) },
        { label: '대표 지역', value: regionLabel(s.region_id) },
        { label: '대표 단지', value: complexLabel(s.complex_id) },
        { label: '노출 지역 1', value: slotValues[0] },
        { label: '노출 지역 2', value: slotValues[1] },
        { label: '노출 지역 3', value: slotValues[2] },
        { label: '주소 요약', value: str(s.address_text) },
        { label: '위도', value: str(s.latitude) },
        { label: '경도', value: str(s.longitude) },
      ],
    },
    {
      title: '수업 · 가격',
      rows: [
        { label: '수업운영형태', value: labelOf(LESSON_OPERATION_TYPES, s.lesson_operation_type) },
        { label: '타임별 원생수', value: labelOf(CAPACITY_PER_TIME_OPTIONS, s.capacity_per_time) },
        { label: '모집 인원', value: str(s.recruitment_count) },
        { label: '지도 스타일', value: str(s.teaching_style) },
        { label: '주말 가능', value: yn(s.weekend_available) },
        { label: '1:1 가능', value: yn(s.one_on_one_available) },
        { label: '월 대표 가격', value: str(s.price_amount) },
        { label: '가격 설명', value: str(s.price_description) },
        ...subjectValues.map((value, i) => ({
          label: subjects.length > 1 ? `대상 과목 ${i + 1}` : '대상 과목',
          value,
        })),
      ],
    },
    {
      title: '경력 · 특징',
      rows: [
        { label: '교습 경력(년)', value: str(s.career_years) },
        { label: '학원 경력(년)', value: str(s.academy_career_years) },
        { label: '프랜차이즈', value: yn(s.franchise_flag) },
        { label: '프랜차이즈명', value: str(s.franchise_name) },
        { label: '교육청 등록', value: yn(s.education_office_registered) },
        { label: '교육청 등록번호', value: str(s.education_office_reg_no) },
        { label: '특징 1', value: str(s.feature_1) },
        { label: '특징 2', value: str(s.feature_2) },
        { label: '특징 3', value: str(s.feature_3) },
      ],
    },
    {
      title: '시설 · 연락',
      rows: [
        { label: '시설', value: facilityNames(s.facility_ids) },
        { label: '시설 설명', value: str(s.facility_note) },
        { label: '연락 가능 시간', value: str(s.contact_time_note) },
        { label: '문의 전화', value: str(s.contact_phone) },
        { label: '유튜브', value: str(s.youtube_url) },
        { label: '페이스북', value: str(s.facebook_url) },
        { label: '인스타그램', value: str(s.instagram_url) },
        ...imageValues.map((value, i) => ({
          label: images.length > 1 ? `사진 ${i + 1}` : '사진',
          value,
        })),
        { label: '공개 상태', value: profileStatusLabel(s.profile_status) },
        { label: '상세등록 상태', value: detailStatusLabel(s.detail_completion_status) },
      ],
    },
  ];
}
