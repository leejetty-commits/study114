/**
 * 유료상품 공통 블록 — 주문 요약 · 구매 전 확인 · 환불 접힘 · 적용 대상
 * 금액·환불액은 서버 정본 표시용. 프론트에서 확정 계산하지 않음.
 */

import { formatKrw, resolveCheckoutAmount } from './runtime-config.js';
import { getStudyRoom } from '../study-room-reg/store.js';
import { getTutor } from '../tutor-reg/store.js';
import { buildPlansHref, parsePlansQuery } from './router.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

function roleLabel(role) {
  if (role === 'study_room') return '공부방';
  if (role === 'tutor') return '과외쌤';
  return '공급자';
}

/**
 * 공부방 적용 지역 후보 — 마이페이지 홍보지역 1~3을 항상 반환한다.
 * ID가 없어도 숨기지 않는다(구매 불가로 표시).
 * @param {object|null|undefined} room
 * @returns {{ label: string, region_basis_type: 'dong'|'complex'|'', region_id: string, complex_id: string, has_scope_id: boolean, slot: number }[]}
 */
export function listStudyRoomApplyRegions(room) {
  if (!room) return [];
  /** @type {{ label: string, region_basis_type: 'dong'|'complex'|'', region_id: string, complex_id: string, has_scope_id: boolean, slot: number }[]} */
  const out = [];
  const saved = Array.isArray(room.saved_regions) ? room.saved_regions : [];
  saved.forEach((s, idx) => {
    const regionId = s?.region_id != null && String(s.region_id) !== '' ? String(s.region_id) : '';
    const complexId = s?.complex_id != null && String(s.complex_id) !== '' ? String(s.complex_id) : '';
    const basis =
      s?.region_basis_type === 'complex' || complexId
        ? 'complex'
        : regionId
          ? 'dong'
          : '';
    const label =
      String(s?.region_label || s?.complex_name || '').trim() ||
      (basis === 'complex' && complexId
        ? `단지 #${complexId}`
        : regionId
          ? `행정동 #${regionId}`
          : `홍보지역 ${idx + 1}`);
    out.push({
      label,
      region_basis_type: basis,
      region_id: regionId,
      complex_id: basis === 'complex' ? complexId : '',
      has_scope_id: Boolean((basis === 'complex' && complexId) || (basis === 'dong' && regionId)),
      slot: idx + 1,
    });
  });
  if (out.length) return out.slice(0, 3);

  const topRegionId = room.region_id != null && String(room.region_id) !== '' ? String(room.region_id) : '';
  const topComplexId = room.complex_id != null && String(room.complex_id) !== '' ? String(room.complex_id) : '';
  const topLabel = String(room.region_label || room.region || room.complex_name || '').trim();
  if (topComplexId || topRegionId || topLabel) {
    const basis = topComplexId ? 'complex' : topRegionId ? 'dong' : '';
    out.push({
      label: topLabel || (basis === 'complex' ? `단지 #${topComplexId}` : topRegionId ? `행정동 #${topRegionId}` : '홍보지역 1'),
      region_basis_type: basis,
      region_id: topRegionId,
      complex_id: basis === 'complex' ? topComplexId : '',
      has_scope_id: Boolean((basis === 'complex' && topComplexId) || (basis === 'dong' && topRegionId)),
      slot: 1,
    });
  }
  return out.slice(0, 3);
}

/**
 * 지역 칩 구매 상태 — 숨기지 않고 사유를 붙인다.
 * @param {ReturnType<typeof listStudyRoomApplyRegions>[number]} region
 * @param {{
 *   room: object,
 *   productCode?: string,
 *   primeScopes?: { region_id?: number|string|null, complex_id?: number|string|null, used?: number, remaining?: number, capacity?: number, region_basis_type?: string }[],
 * }} ctx
 * @returns {{ purchasable: boolean, reason: string, tone: 'ok'|'warn'|'soldout'|'muted' }}
 */
export function studyRoomRegionPurchaseState(region, ctx) {
  const room = ctx.room || {};
  const productCode = ctx.productCode || 'prime';
  if (!region?.has_scope_id) {
    return {
      purchasable: false,
      reason: '지역 ID 미연결 · 기본정보에서 주소를 다시 저장해 주세요',
      tone: 'muted',
    };
  }
  if (room.profile_status === 'hidden') {
    return {
      purchasable: false,
      reason: '숨김 상태 · 노출 중지 해제 후 구매 가능',
      tone: 'warn',
    };
  }
  if (productCode === 'prime' || productCode === 'pick') {
    if (room.detail_completion_status !== 'expanded_complete') {
      return {
        purchasable: false,
        reason: productCode === 'prime' ? 'Prime 정보 부족 · 등록점검에서 확인' : 'Pick 정보 부족 · 등록점검에서 확인',
        tone: 'warn',
      };
    }
  }
  if (productCode === 'prime' && Array.isArray(ctx.primeScopes)) {
    const match = ctx.primeScopes.find((s) => {
      if (region.region_basis_type === 'complex') {
        return String(s.complex_id || '') === String(region.complex_id || '');
      }
      return String(s.region_id || '') === String(region.region_id || '');
    });
    if (match && Number(match.remaining) <= 0) {
      const used = Number(match.used) || 3;
      const cap = Number(match.capacity) || 3;
      const place =
        region.region_basis_type === 'complex'
          ? `해당 단지 Prime ${used}/${cap} 마감`
          : `해당 행정동 Prime ${used}/${cap} 마감`;
      return { purchasable: false, reason: place, tone: 'soldout' };
    }
  }
  return { purchasable: true, reason: '구매 가능', tone: 'ok' };
}

/**
 * 과외쌤 적용 시 후보 — 활동지역 1·2·3의 city_id만 허용(라벨 문자열만이면 구매 불가).
 * @param {object|null|undefined} tutor
 * @returns {{ label: string, city_id: string }[]}
 */
export function listTutorApplyCities(tutor) {
  if (!tutor) return [];
  /** @type {{ label: string, city_id: string }[]} */
  const out = [];
  const saved = Array.isArray(tutor.saved_regions) ? tutor.saved_regions : [];
  for (const s of saved) {
    const cityId = s?.region_id != null && String(s.region_id) !== '' ? String(s.region_id) : '';
    if (!cityId) continue;
    const label =
      String(s.region_label || s.label || s.sido_name || '').trim() || `시 #${cityId}`;
    if (out.some((x) => x.city_id === cityId)) continue;
    out.push({ label, city_id: cityId });
  }
  if (out.length) return out.slice(0, 3);
  const topId = tutor.primary_region_id != null && String(tutor.primary_region_id) !== ''
    ? String(tutor.primary_region_id)
    : '';
  if (topId) {
    out.push({
      label: String(tutor.primary_region_label || tutor.region_label || `시 #${topId}`),
      city_id: topId,
    });
  }
  return out.slice(0, 3);
}

/**
 * 적용 대상 준비 여부 (지역·주력과목). 주문 CTA 가드용.
 * 과외쌤: 노출축(city_id + primary_subject_id)만 본다. 소개문·카드 카피 완성도는 구매 차단 사유가 아니다.
 * @param {import('./profiles.js').ProviderProfile | null} profile
 * @param {'study_room'|'tutor'|string} role
 * @returns {{
 *   regionReady: boolean,
 *   regionOptions: string[],
 *   regionScopes: { label: string, region_basis_type?: 'dong'|'complex', region_id?: string, complex_id?: string, city_id?: string }[],
 *   subjectLine: string,
 *   primarySubjectId: string,
 * }}
 */
export function getApplyTargetReadiness(profile, role) {
  if ((role !== 'study_room' && role !== 'tutor') || !profile) {
    return { regionReady: false, regionOptions: [], regionScopes: [], subjectLine: '', primarySubjectId: '' };
  }
  /** @type {{ label: string, region_basis_type?: 'dong'|'complex'|'', region_id?: string, complex_id?: string, city_id?: string, has_scope_id?: boolean, slot?: number }[]} */
  let regionScopes = [];
  let subjectLine = '';
  let primarySubjectId = '';
  let regionReady = false;

  if (profile.providerType === 'study_room') {
    const room = getStudyRoom(Number(profile.id));
    regionScopes = listStudyRoomApplyRegions(room);
    regionReady = regionScopes.some((r) => r.has_scope_id);
  } else {
    const tutor = getTutor(Number(profile.id));
    subjectLine = tutor?.main_subject_note || '';
    primarySubjectId =
      tutor?.primary_subject_id != null && String(tutor.primary_subject_id) !== ''
        ? String(tutor.primary_subject_id)
        : '';
    const cities = listTutorApplyCities(tutor);
    regionScopes = cities.map((c) => ({
      label: c.label,
      city_id: c.city_id,
      region_basis_type: undefined,
      region_id: '',
      complex_id: '',
      has_scope_id: true,
    }));
    // 주력과목 id는 서버가 기본등록에서 자동 연결. 클라이언트 id 유무로 구매를 막지 않는다.
    regionReady = cities.length > 0 && (primarySubjectId !== '' || Boolean(tutor?.has_primary_subject));
  }

  return {
    regionReady,
    regionOptions: regionScopes.map((r) => r.label),
    regionScopes,
    subjectLine,
    primarySubjectId,
  };
}

/**
 * 적용 대상 (노출상품 전용 · 쪽지권은 프로필만)
 * @param {import('./profiles.js').ProviderProfile | null} profile
 * @param {'study_room'|'tutor'|string} role
 * @param {'positions'|'access'} page
 * @param {{ productCode?: string, primeScopes?: object[] }} [opts]
 */
export function renderApplyTargetBlock(profile, role, page = 'positions', opts = {}) {
  if (role !== 'study_room' && role !== 'tutor') {
    return `
      <section class="plans-sf-panel plans-apply-target" data-plans-apply>
        <header class="plans-sf-panel__head">
          <h2 class="plans-sf-panel__title">적용 대상</h2>
          <p class="plans-sf-panel__lead">구매는 공급자 로그인·프로필 선택 후 진행합니다.</p>
        </header>
      </section>`;
  }

  if (!profile) {
    return `
      <section class="plans-sf-panel plans-apply-target" data-plans-apply>
        <header class="plans-sf-panel__head">
          <h2 class="plans-sf-panel__title">적용 대상</h2>
          <p class="plans-sf-panel__lead">적용할 프로필을 먼저 선택하세요. 상품 소개는 위에서 확인할 수 있습니다.</p>
        </header>
      </section>`;
  }

  const profileMain = `${esc(profile.label)} · ${esc(roleLabel(profile.providerType))}`;
  const statusRaw = String(profile.status || '').trim();
  const statusBadge = statusRaw
    ? `<span class="plans-apply-target__status">${esc(statusRaw)}</span>`
    : '';
  const profileHtml = `<p class="plans-apply-target__profile">
        <span class="plans-apply-target__profile-main">${profileMain}</span>
        ${statusBadge}
      </p>`;

  if (page === 'access') {
    return `
      <section class="plans-sf-panel plans-apply-target plans-apply-target--compact" data-plans-apply>
        <header class="plans-sf-panel__head">
          <h2 class="plans-sf-panel__title">적용 프로필 확인</h2>
          <p class="plans-sf-panel__lead">쪽지권은 선택한 프로필에 적용됩니다. 지역 선택은 없습니다.</p>
        </header>
        ${profileHtml}
      </section>`;
  }

  const { regionReady, regionScopes, subjectLine } = getApplyTargetReadiness(profile, role);
  const q = parsePlansQuery();
  const hasQueryCity = Boolean(q.city_id);
  const hasQueryRegion = Boolean(q.region_id || q.complex_id);
  const productCode = String(opts.productCode || q.product || 'prime');
  const room =
    profile.providerType === 'study_room' ? getStudyRoom(Number(profile.id)) : null;
  const primeScopes = Array.isArray(opts.primeScopes) ? opts.primeScopes : [];

  const regionHtml = regionScopes.length
    ? (() => {
        const firstBuyable = regionScopes.findIndex((r) => {
          if (profile.providerType !== 'study_room' || !room) return true;
          return studyRoomRegionPurchaseState(r, { room, productCode, primeScopes }).purchasable;
        });
        return `<div class="plans-apply-target__regions" role="group" aria-label="적용 지역">
        ${regionScopes
          .map((r, i) => {
            const state =
              profile.providerType === 'study_room' && room
                ? studyRoomRegionPurchaseState(r, { room, productCode, primeScopes })
                : { purchasable: true, reason: '구매 가능', tone: 'ok' };
            const disabled = !state.purchasable;
            const queryMatch = r.city_id
              ? hasQueryCity && String(q.city_id) === String(r.city_id)
              : hasQueryRegion &&
                ((q.complex_id && String(r.complex_id) === String(q.complex_id)) ||
                  (q.region_id && String(r.region_id) === String(q.region_id)));
            const checked =
              !disabled && (queryMatch || (!hasQueryCity && !hasQueryRegion && i === firstBuyable));
            return `<label class="plans-region-chip plans-region-chip--${esc(state.tone)}${
              disabled ? ' is-disabled' : ''
            }">
              <input type="radio" name="plans-apply-region" value="${esc(r.label)}"
                data-plans-apply-region
                data-purchasable="${state.purchasable ? '1' : '0'}"
                aria-label="적용 지역 ${esc(r.label)}"
                ${r.city_id ? `data-city-id="${esc(r.city_id)}"` : ''}
                ${r.region_basis_type ? `data-region-basis="${esc(r.region_basis_type)}"` : ''}
                ${r.region_id ? `data-region-id="${esc(r.region_id)}"` : ''}
                ${r.complex_id ? `data-complex-id="${esc(r.complex_id)}"` : ''}
                ${disabled ? 'disabled' : ''}
                ${checked ? 'checked' : ''} />
              <span class="plans-region-chip__label">${esc(r.label)}</span>
              <span class="plans-region-chip__reason">${esc(state.reason)}</span>
            </label>`;
          })
          .join('')}
      </div>`;
      })()
    : `<p class="plans-muted plans-apply-target__warn">적용 지역이 없습니다. 상세등록에서 ${
        profile.providerType === 'study_room' ? '대표 홍보지역 1~3' : '활동지역 시 1·2·3'
      }을 먼저 설정해 주세요.</p>`;

  const subjectHtml =
    profile.providerType === 'tutor'
      ? subjectLine
        ? `<p class="plans-apply-target__subject">주력과목 · <strong>${esc(subjectLine)}</strong> · 기본등록 값으로 자동 연결됩니다</p>`
        : `<p class="plans-muted plans-apply-target__warn">주력과목이 없습니다. 상세등록에서 주력과목 1개를 선택해 주세요.</p>`
      : '';

  return `
    <section class="plans-sf-panel plans-apply-target" data-plans-apply data-region-ready="${regionReady ? '1' : '0'}">
      <header class="plans-sf-panel__head">
        <h2 class="plans-sf-panel__title">적용 대상</h2>
        <p class="plans-sf-panel__lead">상품을 고른 뒤, 적용할 프로필과 지역을 확인합니다.</p>
      </header>
      ${profileHtml}
      ${subjectHtml}
      ${regionHtml}
      ${
        !regionReady
          ? `<p class="plans-eligibility plans-eligibility--soft"><span>지역${
              profile.providerType === 'tutor' ? '·주력과목' : ''
            }이 정해지기 전에는 기간 선택과 구매를 진행할 수 없습니다.</span></p>`
          : ''
      }
      <p class="plans-muted plans-apply-target__edit">
        <a href="#/mypage/registrations" data-nav="/mypage/registrations">상세등록에서 지역·과목 수정</a>
      </p>
    </section>`;
}

/**
 * 노출상품 주문 요약 행 — access(쪽지권)는 사용하지 않는다.
 * @param {{
 *   profileLabel: string,
 *   roleText: string,
 *   productName: string,
 *   regionValue: string,
 *   periodLabel: string,
 *   positionPriceText: string,
 *   badgeLines: { label: string, value: string }[],
 *   badgeSumText?: string,
 *   periodRangeText?: string,
 *   listPriceText?: string,
 *   discountText?: string,
 *   memoBundleText?: string,
 *   refundText?: string,
 * }} opts
 * @returns {{ label: string, value: string }[]}
 */
export function buildPositionOrderRows(opts) {
  const badgeRows = opts.badgeLines.length
    ? opts.badgeLines.map((b) => ({
        label: `홍보 배지 · ${b.label}`,
        value: b.value,
      }))
    : [{ label: '홍보 배지', value: '없음' }];
  return [
    { label: '적용 프로필', value: opts.profileLabel },
    { label: '역할', value: opts.roleText },
    { label: '상품', value: opts.productName },
    { label: '적용 지역', value: opts.regionValue },
    { label: '기간', value: opts.periodLabel },
    ...(opts.periodRangeText ? [{ label: '시작일 ~ 종료일', value: opts.periodRangeText }] : []),
    ...(opts.listPriceText ? [{ label: '정상가', value: opts.listPriceText }] : []),
    { label: '노출상품 표시가', value: opts.positionPriceText },
    ...(opts.discountText ? [{ label: '기간 할인', value: opts.discountText }] : []),
    ...(opts.memoBundleText ? [{ label: '무료 쪽지', value: opts.memoBundleText }] : []),
    ...badgeRows,
    ...(opts.badgeLines.length && opts.badgeSumText ? [{ label: '배지 소계', value: opts.badgeSumText }] : []),
    { label: '자동연장', value: '없음' },
    { label: '환불기준', value: opts.refundText || '시작 전 전액 · 시작 후 일할 계산(서버 정본)' },
  ];
}

/**
 * @param {{ rows: { label: string, value: string }[], totalLabel?: string, totalValue?: string, ctaDisabled?: boolean, ctaLabel?: string, family: 'position'|'access', showCta?: boolean, note?: string }} opts
 */
export function renderOrderSummaryBlock(opts) {
  const rows = opts.rows || [];
  const ctaDisabled = Boolean(opts.ctaDisabled);
  const ctaLabel = opts.ctaLabel || '구매하기';
  return `
    <section class="plans-sf-panel plans-order-summary" data-plans-order-summary data-family="${esc(opts.family)}">
      <header class="plans-sf-panel__head">
        <h2 class="plans-sf-panel__title">주문 요약</h2>
        <p class="plans-sf-panel__lead">결제 금액은 서버 카탈로그 기준으로 다시 확인됩니다.</p>
      </header>
      <dl class="plans-order-summary__list">
        ${rows
          .map(
            (r) => `
          <div class="plans-order-summary__row">
            <dt>${esc(r.label)}</dt>
            <dd>${esc(r.value)}</dd>
          </div>`,
          )
          .join('')}
      </dl>
      ${
        opts.totalLabel
          ? `<p class="plans-order-summary__total"><span>${esc(opts.totalLabel)}</span><strong data-plans-order-total>${esc(opts.totalValue || '—')}</strong></p>`
          : ''
      }
      <p class="plans-muted plans-order-summary__note">${esc(
        opts.note || '자동연장 없음 · 표시가는 참고이며 결제 직전 서버가 재검증합니다.',
      )}</p>
      ${
        opts.showCta === false
          ? ''
          : `<button type="button" class="btn btn--primary plans-order-summary__cta" data-plans-order-cta aria-label="${esc(ctaLabel)}" ${ctaDisabled ? 'disabled' : ''}>${esc(ctaLabel)}</button>`
      }
    </section>`;
}

export function renderAccessPurchaseCheck() {
  return `
    <section class="plans-purchase-check" data-plans-purchase-check>
      <header class="plans-sf-panel__head">
        <h2 class="plans-sf-panel__title">구매 전 확인</h2>
      </header>
      <p>5회권과 10회권은 구매일부터 120일 동안 사용할 수 있습니다. 사용 중인 유료 묶음권은 중복 구매할 수 없으니 예상 사용량을 확인하고 필요한 만큼만 구매하세요.</p>
      <p class="plans-muted">사용기한이 지나면 남은 횟수는 소멸하며 환불·연장되지 않습니다.</p>
    </section>`;
}

/**
 * @param {'position'|'access'} family
 */
export function renderPolicyAccordion(family) {
  if (family === 'access') {
    return `
      <details class="plans-policy-acc">
        <summary>환불·소멸 안내</summary>
        <div class="plans-policy-acc__body">
          <ul class="plans-tier-list">
            <li>1회 즉시권: 7일 이내 미발송 시 전액 · 발송 완료 또는 7일 경과 시 0원</li>
            <li>5회권·10회권: 사용 구간별 환불표는 서버·약관 정본을 따릅니다</li>
            <li>120일 만료 시 남은 횟수 소멸 · 연장·환불 없음</li>
            <li>회사 귀책 발송 실패는 횟수 복구를 우선합니다</li>
          </ul>
          <p class="mypage-muted">환불 가능 여부와 금액은 프론트가 계산하지 않으며, 요청 시 서버가 확정합니다.</p>
        </div>
      </details>`;
  }
  return `
    <details class="plans-policy-acc">
      <summary>환불·만료 안내</summary>
      <div class="plans-policy-acc__body">
        <ul class="plans-tier-list">
          <li>시작 전: 전액 환불</li>
          <li>시작 후: 요청일 다음 날부터 남은 미사용 기간을 실제 결제금액 기준 일할 계산</li>
          <li>만료 후 Basic(기본 노출)으로 복귀 · 마이샵·프로필은 유지</li>
          <li>자동연장 없음</li>
        </ul>
        <p class="mypage-muted">환불 금액은 서버 정본으로 산정합니다. 화면 안내는 참고용입니다.</p>
      </div>
    </details>`;
}

export function renderBasicFreeRow() {
  return `
    <div class="plans-basic-free" data-plans-basic-free>
      <strong>마이샵 꾸미기와 Basic 노출은 무료입니다.</strong>
      <p>별도의 끌어올리기(UP) 상품은 제공하지 않습니다. 더 좋은 자리가 필요하면 노출상품을 선택하세요.</p>
    </div>`;
}

export function renderAccessAuxLinks() {
  return `
    <div class="plans-access-aux">
      <p>보유 중인 쪽지권의 남은 횟수와 사용기한은 마이페이지의 내 상품에서 확인할 수 있습니다.</p>
      <p>보낸 쪽지와 이어진 대화는 쪽지함에서 확인할 수 있습니다.</p>
      <p class="plans-access-aux__links">
        <a class="plans-access-aux__link" href="#/mypage/plans/my" data-nav="/mypage/plans/my">내 쪽지권 보기</a>
        <a class="plans-access-aux__link" href="#/mypage/messages" data-nav="/mypage/messages">쪽지함 보기</a>
      </p>
    </div>`;
}

/**
 * 카탈로그 옵션 표시가 (서버 hydrate 값 · 프론트 발명 금지)
 * @param {object|null|undefined} option
 */
export function formatOptionDisplayPrice(option) {
  if (!option) return '—';
  const amt = resolveCheckoutAmount(option.priceKrw);
  return amt.testMode
    ? `${formatKrw(option.priceKrw)} (시험 ${formatKrw(amt.chargeKrw)})`
    : formatKrw(option.priceKrw);
}

export { esc, roleLabel, buildPlansHref };
