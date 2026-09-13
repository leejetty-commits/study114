/**
 * 유료상품 공통 블록 — 주문 요약 · 구매 전 확인 · 환불 접힘 · 적용 대상
 * 금액·환불액은 서버 정본 표시용. 프론트에서 확정 계산하지 않음.
 */

import { formatKrw, resolveCheckoutAmount } from './runtime-config.js';
import { getStudyRoom } from '../study-room-reg/store.js';
import { getTutor } from '../tutor-reg/store.js';
import { buildPlansHref } from './router.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

function roleLabel(role) {
  if (role === 'study_room') return '공부방';
  if (role === 'tutor') return '과외쌤';
  return '공급자';
}

/**
 * 적용 대상 (노출상품 전용 · 쪽지권은 프로필만)
 * @param {import('./profiles.js').ProviderProfile | null} profile
 * @param {'study_room'|'tutor'|string} role
 * @param {'positions'|'access'} page
 */
export function renderApplyTargetBlock(profile, role, page = 'positions') {
  if (role !== 'study_room' && role !== 'tutor') {
    return `
      <section class="plans-section plans-apply-target" data-plans-apply>
        <div class="plans-section__head">
          <h3 class="plans-section__title">적용 대상</h3>
          <p class="plans-section__lead">구매는 공급자 로그인·프로필 선택 후 진행합니다.</p>
        </div>
      </section>`;
  }

  if (!profile) {
    return `
      <section class="plans-section plans-apply-target" data-plans-apply>
        <div class="plans-section__head">
          <h3 class="plans-section__title">적용 대상</h3>
          <p class="plans-section__lead">적용할 프로필을 먼저 선택하세요. 상품 소개는 위에서 확인할 수 있습니다.</p>
        </div>
      </section>`;
  }

  const profileLine = `${esc(profile.label)} · ${esc(roleLabel(profile.providerType))} · ${esc(profile.status || '')}`;

  if (page === 'access') {
    return `
      <section class="plans-section plans-apply-target plans-apply-target--compact" data-plans-apply>
        <div class="plans-section__head">
          <h3 class="plans-section__title">적용 프로필</h3>
          <p class="plans-section__lead">쪽지권은 지역 선택이 없습니다. 선택한 프로필에만 적용됩니다.</p>
        </div>
        <p class="plans-apply-target__profile"><strong>${profileLine}</strong></p>
      </section>`;
  }

  /** @type {string[]} */
  let regionOptions = [];
  let subjectLine = '';
  let regionReady = false;

  if (profile.providerType === 'study_room') {
    const room = getStudyRoom(Number(profile.id));
    const label = room?.region_label || room?.region || '';
    if (label) {
      regionOptions = [String(label)];
      regionReady = true;
    }
    // 대표 홍보지역 1·2·3 — 등록 데이터가 있으면 칩으로 표시 (미연동 시 안내)
    if (Array.isArray(room?.promo_regions) && room.promo_regions.length) {
      regionOptions = room.promo_regions.map(String).filter(Boolean).slice(0, 3);
      regionReady = regionOptions.length > 0;
    }
  } else {
    const tutor = getTutor(Number(profile.id));
    subjectLine = tutor?.main_subject_note || '';
    const label = tutor?.region_label || '';
    if (label) {
      regionOptions = [String(label)];
      regionReady = Boolean(label && subjectLine);
    } else {
      regionReady = Boolean(subjectLine);
    }
  }

  const regionHtml = regionOptions.length
    ? `<div class="plans-apply-target__regions" role="group" aria-label="적용 지역">
        ${regionOptions
          .map(
            (r, i) =>
              `<label class="plans-region-chip"><input type="radio" name="plans-apply-region" value="${esc(r)}" data-plans-apply-region ${i === 0 ? 'checked' : ''} /> <span>${esc(r)}</span></label>`,
          )
          .join('')}
      </div>`
    : `<p class="mypage-muted plans-apply-target__warn">적용 지역이 없습니다. 상세등록에서 ${
        profile.providerType === 'study_room' ? '대표 홍보지역' : '활동지역'
      }을 먼저 설정해 주세요.</p>`;

  const subjectHtml =
    profile.providerType === 'tutor'
      ? subjectLine
        ? `<p class="plans-apply-target__subject">주력과목 · <strong>${esc(subjectLine)}</strong></p>`
        : `<p class="mypage-muted plans-apply-target__warn">주력과목이 없습니다. 상세등록에서 주력과목을 설정해 주세요.</p>`
      : '';

  return `
    <section class="plans-section plans-apply-target" data-plans-apply data-region-ready="${regionReady ? '1' : '0'}">
      <div class="plans-section__head">
        <h3 class="plans-section__title">적용 대상</h3>
        <p class="plans-section__lead">상품을 고른 뒤, 적용할 프로필과 지역을 확인합니다.</p>
      </div>
      <p class="plans-apply-target__profile"><strong>${profileLine}</strong></p>
      ${subjectHtml}
      ${regionHtml}
      ${
        !regionReady
          ? `<p class="plans-eligibility"><span>지역${
              profile.providerType === 'tutor' ? '·주력과목' : ''
            }이 정해지기 전에는 기간 선택과 구매를 진행할 수 없습니다.</span></p>`
          : ''
      }
      <p class="mypage-muted" style="margin-top:0.5rem">
        <a href="#/mypage/registrations" data-nav="/mypage/registrations">상세등록에서 지역·과목 수정</a>
      </p>
    </section>`;
}

/**
 * @param {{ rows: { label: string, value: string }[], totalLabel?: string, totalValue?: string, ctaDisabled?: boolean, ctaLabel?: string, family: 'position'|'access' }} opts
 */
export function renderOrderSummaryBlock(opts) {
  const rows = opts.rows || [];
  const ctaDisabled = Boolean(opts.ctaDisabled);
  const ctaLabel = opts.ctaLabel || '구매하기';
  return `
    <section class="plans-section plans-order-summary" data-plans-order-summary data-family="${esc(opts.family)}">
      <div class="plans-section__head">
        <h3 class="plans-section__title">주문 요약</h3>
        <p class="plans-section__lead">결제 금액은 서버 카탈로그 기준으로 다시 확인됩니다.</p>
      </div>
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
      <p class="mypage-muted plans-order-summary__note">자동연장 없음 · 표시가는 참고이며 결제 직전 서버가 재검증합니다.</p>
      <button type="button" class="btn btn--primary plans-order-summary__cta" data-plans-order-cta ${ctaDisabled ? 'disabled' : ''}>${esc(ctaLabel)}</button>
    </section>`;
}

export function renderAccessPurchaseCheck() {
  return `
    <section class="plans-section plans-purchase-check" data-plans-purchase-check>
      <div class="plans-section__head">
        <h3 class="plans-section__title">구매 전 확인</h3>
      </div>
      <p>5회권과 10회권은 구매일부터 120일 동안 사용할 수 있습니다. 사용 중인 유료 묶음권은 중복 구매할 수 없으니 예상 사용량을 확인하고 필요한 만큼만 구매하세요.</p>
      <p class="mypage-muted">사용기한이 지나면 남은 횟수는 소멸하며 환불·연장되지 않습니다.</p>
      <p class="mypage-muted">보유 중인 쪽지권의 남은 횟수와 사용기한은 마이페이지의 내 상품에서 확인할 수 있습니다.</p>
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
            <li>120일 만료 시 잔여횟수 소멸 · 연장·환불 없음</li>
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
      <p>보낸 쪽지와 이어진 대화는 쪽지함에서 확인할 수 있습니다.</p>
      <p class="plans-access-aux__links">
        <a class="btn btn--secondary btn--sm" href="#/mypage/plans/my" data-nav="/mypage/plans/my">내 쪽지권 보기</a>
        <a class="btn btn--secondary btn--sm" href="#/mypage/messages" data-nav="/mypage/messages">쪽지함 보기</a>
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
