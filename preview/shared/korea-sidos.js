/**
 * 공부방 노출지역 시·도 이름. 과외 단위(광역시 / 도의 시·군)는 tutor-unit-cascade.js 가 서버 tutor_units 만 쓴다.
 * 여기의 시·도 이름은 공부방 화면이 이미 가져가므로 유지한다. 시·군 정적 옵션은 만들지 않는다.
 */

import { normalizeCities } from './region-cascade.js';
import { tutorUnitIdFromLabel, tutorUnitLabelFromId } from './tutor-unit-cascade.js';

/** @typedef {{ code: string, label: string }} SidoUnit */

/** @type {SidoUnit[]} */
export const KOREA_METROS = [
  { code: '11', label: '서울특별시' },
  { code: '26', label: '부산광역시' },
  { code: '27', label: '대구광역시' },
  { code: '28', label: '인천광역시' },
  { code: '29', label: '광주광역시' },
  { code: '30', label: '대전광역시' },
  { code: '31', label: '울산광역시' },
  { code: '36', label: '세종특별자치시' },
];

/** @type {SidoUnit[]} */
export const KOREA_PROVINCES = [
  { code: '41', label: '경기도' },
  { code: '51', label: '강원특별자치도' },
  { code: '43', label: '충청북도' },
  { code: '44', label: '충청남도' },
  { code: '52', label: '전북특별자치도' },
  { code: '46', label: '전라남도' },
  { code: '47', label: '경상북도' },
  { code: '48', label: '경상남도' },
  { code: '50', label: '제주특별자치도' },
];

/** 공부방 노출지역 시·도. 과외 저장 id로 쓰지 않는다. */
export const KOREA_SIDOS = [
  ...KOREA_METROS.map((m) => ({ code: m.code, label: m.label })),
  ...KOREA_PROVINCES.map((p) => ({ code: p.code, label: p.label })),
];

/** 과외 단위 id → 공식 전체 이름(「서울특별시」「경기도 수원시」). units 는 서버 tutor_units. */
export const activityLabelFromRegionId = tutorUnitLabelFromId;

/** 과외 단위 공식 전체 이름 → id. 같은 이름이 하나일 때만. */
export const regionIdFromActivityLabel = tutorUnitIdFromLabel;

/** 서버 cities(구 단위)를 선택 단위로만 돌려준다. 정적 폴백은 없다. */
export function buildCityUnitOptions(apiCities = []) {
  return normalizeCities(apiCities);
}
