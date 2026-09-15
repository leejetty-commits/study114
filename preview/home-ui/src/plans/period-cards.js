/**
 * 노출상품 기간 카드 — 카탈로그 기간 순서·힌트·미리보기 날짜.
 * 가격은 계산하지 않고 옵션의 서버 판매가만 쓴다.
 * 날짜 미리보기는 PositionPeriodCalculator(Asia/Seoul, 반개방)와 같은 달력 규칙을 따른다.
 */

export const PERIOD_ORDER = ['2주', '1개월', '2개월', '3개월', '6개월'];

const MONTH_FROM_VALUE = {
  1: '1개월',
  2: '2개월',
  3: '3개월',
  6: '6개월',
};

/**
 * @param {object} option
 * @returns {string}
 */
export function periodKey(option) {
  const label = String(option?.label || option?.apiVariant || '').trim();
  if (PERIOD_ORDER.includes(label)) return label;
  if (option?.durationType === 'day' && Number(option.durationValue) === 14) return '2주';
  if (option?.durationType === 'month') {
    const mapped = MONTH_FROM_VALUE[Number(option.durationValue)];
    if (mapped) return mapped;
  }
  return label || PERIOD_ORDER[0];
}

/**
 * @param {object[]} options
 * @returns {object[]}
 */
export function sortPeriodOptions(options) {
  return [...(options || [])].sort((a, b) => {
    const ia = PERIOD_ORDER.indexOf(periodKey(a));
    const ib = PERIOD_ORDER.indexOf(periodKey(b));
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
}

/**
 * 과장 리본 없이 작은 힌트만.
 * @param {string} productCode
 * @param {string} key
 * @returns {string}
 */
export function periodHint(productCode, key) {
  if (key === '3개월') return '추천';
  if (productCode === 'pick' && key === '2주') return '체험';
  if (productCode === 'prime' && key === '6개월') return '장기';
  return '';
}

/**
 * @param {Date} [now]
 * @returns {string} YYYY-MM-DD in Asia/Seoul
 */
export function kstTodayYmd(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/**
 * @param {object} option
 * @returns {{ type: 'day'|'month', value: number }}
 */
export function resolvePeriodDuration(option) {
  const typeRaw = option?.durationType;
  const valueRaw = Number(option?.durationValue);
  if ((typeRaw === 'day' || typeRaw === 'month') && valueRaw > 0) {
    return { type: typeRaw, value: valueRaw };
  }
  const key = periodKey(option);
  if (key === '2주') return { type: 'day', value: 14 };
  const months = { '1개월': 1, '2개월': 2, '3개월': 3, '6개월': 6 };
  if (months[key]) return { type: 'month', value: months[key] };
  return { type: 'month', value: 1 };
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function formatYmd(y, m, d) {
  return `${String(y).padStart(4, '0')}-${pad2(m)}-${pad2(d)}`;
}

function parseYmd(ymd) {
  const [y, m, d] = String(ymd)
    .slice(0, 10)
    .split('-')
    .map((n) => Number(n));
  return { y, m, d };
}

function addDaysYmd(ymd, days) {
  const { y, m, d } = parseYmd(ymd);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return formatYmd(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

function lastDayOfMonth(y, m) {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

function addCalendarMonths(ymd, months) {
  const parsed = parseYmd(ymd);
  let month = parsed.m + months;
  let year = parsed.y + Math.trunc((month - 1) / 12);
  month = ((month - 1) % 12) + 1;
  if (month < 1) {
    month += 12;
    year -= 1;
  }
  const last = lastDayOfMonth(year, month);
  const clamped = parsed.d > last;
  return { ymd: formatYmd(year, month, Math.min(parsed.d, last)), clamped };
}

/**
 * 결제 완료 가정(신규) 미리보기. checkout createOrder 값이 정본이다.
 * @param {object} option
 * @param {string} [startedOn]
 * @returns {{ startedOn: string, endsOn: string, endExclusiveOn: string }}
 */
export function previewInclusiveRange(option, startedOn = kstTodayYmd()) {
  const { type, value } = resolvePeriodDuration(option);
  if (type === 'day') {
    const endExclusiveOn = addDaysYmd(startedOn, value);
    return {
      startedOn,
      endsOn: addDaysYmd(endExclusiveOn, -1),
      endExclusiveOn,
    };
  }
  const { ymd: anchor, clamped } = addCalendarMonths(startedOn, value);
  if (clamped) {
    return {
      startedOn,
      endsOn: anchor,
      endExclusiveOn: addDaysYmd(anchor, 1),
    };
  }
  return {
    startedOn,
    endsOn: addDaysYmd(anchor, -1),
    endExclusiveOn: anchor,
  };
}

/**
 * @param {'study_room'|'tutor'|string} role
 * @returns {string}
 */
export function periodDisabledReason(role) {
  return role === 'tutor' ? '활동시를 먼저 선택하세요.' : '지역을 먼저 선택하세요.';
}
