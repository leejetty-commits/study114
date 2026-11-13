/**
 * 359 — 고객용 환불 안내 단일 모듈 (2026-11-13 종현 확정 문구)
 * 금액·조건 정본은 docs/ssot/18c · 18d. 이 파일은 고객 문장만 모은다.
 * 화면에서 숫자를 다시 타이핑하지 말고 여기 상수를 import 한다.
 */

/** 356 안 A — 한 글자도 바꾸지 말 것 */
export const REFUND_LATER_EXTENSION_DENY =
  '뒤에 이어진 연장 결제가 있어 이 건은 환불할 수 없습니다. 연장 건을 먼저 환불해 주세요.';

/** 쪽지권 — 짧은 안내 */
export const MEMO_TICKET_REFUND_SHORT =
  '쪽지권 환불은 결제 후 7일 이내에 신청하실 수 있어요. 환불 금액은 상품과 사용 횟수에 따라 달라집니다.';

/** 노출상품 — 짧은 안내 */
export const POSITION_REFUND_SHORT =
  '노출상품 환불은 시작 전이면 전액, 시작 후면 남은 기간을 실결제액 기준으로 일할 계산해 드려요. 배지는 함께 회수됩니다.';

/**
 * 자세한 안내 — 문장·목록만. 화면은 renderRefundDetailHtml 을 쓴다.
 * 숫자·조건은 2026-11-13 종현 확정(쪽지권)과 노출 초안. 금액 계산은 하지 않는다.
 * @type {Record<'access'|'position', { intro: string, sections: { title: string, items: string[] }[] }>}
 */
const REFUND_DETAIL_MODEL = {
  access: {
    intro:
      '쪽지권은 결제가 끝난 뒤 7일(7×24시간) 안에 환불을 신청하실 수 있어요. 환불 금액은 상품과 사용 횟수에 따라 달라요. 결제가 완료된 주문만 신청하실 수 있어요.',
    sections: [
      {
        title: '상품별 환불 금액',
        items: [
          '1회 즉시권(500원): 보내기 전이면 500원, 이미 보냈으면 0원',
          '5회권(2,250원, 120일): 0회 사용 2,250원, 1회 1,125원, 2회 750원, 3회 이상 0원',
          '10회권(4,000원, 120일): 0회 사용 4,000원, 1~3회 2,000원, 4회 1,300원, 5회 이상 0원',
          '7일이 지났거나 120일이 지나면 모두 0원이에요.',
        ],
      },
      {
        title: '알아 두실 점',
        items: [
          '사용 횟수는 그 주문에서 받은 횟수만 세요.',
          '환불 금액은 위 금액과 실제 결제 금액 중 작은 쪽이에요.',
          '신청하면 쪽지권이 잠시 잠기고, 철회하면 다시 쓰실 수 있어요.',
          '한 번 철회한 주문은 다시 환불을 신청할 수 없어요.',
          '실제 입금이 끝나야 「환불 완료」로 바뀌어요.',
        ],
      },
    ],
  },
  position: {
    intro:
      '노출상품(프라임·픽) 환불은 결제가 완료된 주문만 신청하실 수 있어요. 시작 전이면 실제로 결제하신 금액을 모두 환불해 드리고, 시작 후면 남은 기간을 실결제액 기준으로 일할 계산해 드려요.',
    sections: [
      {
        title: '조건별 환불 금액',
        items: [
          '이용 기간은 시작일부터 종료일 전날까지입니다.',
          '시작 전: 실제로 결제하신 금액을 모두 환불해 드려요.',
          '시작 후: 실결제액 × 남은 일수 ÷ 전체 일수로 계산하며, 원 단위는 내림해요.',
          '신청하신 당일은 사용한 날로 보고, 남은 일수는 다음 날부터 세어요.',
          '마지막 이용일이거나 이용 기간이 끝난 뒤에는 0원이에요.',
        ],
      },
      {
        title: '알아 두실 점',
        items: [
          '배지만 따로 환불하실 수는 없고, 노출을 환불하시면 배지도 함께 회수되며, 함께 제공된 쪽지는 남은 횟수만 0이 됩니다.',
          REFUND_LATER_EXTENSION_DENY,
          '연장 주문 자체는, 그 뒤에 이어진 연장이 더 없으면 위의 규칙대로 환불하실 수 있어요.',
          '신청하시면 노출과 배지가 내려가고 남은 무료 쪽지는 0이 되며, 철회하시면 다시 복원돼요.',
          '한 번 철회한 주문은 다시 환불을 신청하실 수 없어요.',
          '실제 입금이 끝나기 전에는 「환불 완료」로 보여 드리지 않아요.',
        ],
      },
    ],
  },
};

function refundDetailPlain(family) {
  const model = REFUND_DETAIL_MODEL[family];
  const parts = [model.intro];
  for (const section of model.sections) {
    parts.push(section.title, ...section.items);
  }
  return parts.join(' ');
}

/** 쪽지권 — 자세한 안내 문장 (화면 목록은 renderRefundDetailHtml) */
export const MEMO_TICKET_REFUND_DETAIL = refundDetailPlain('access');

/** 노출상품 — 자세한 안내 문장 (연장 잠금 문장 원문 포함) */
export const POSITION_REFUND_DETAIL = refundDetailPlain('position');

function escRefundText(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * 자세한 안내 HTML. 항목 글자만 이스케이프하고 목록 태그는 여기서 만든다.
 * @param {'access'|'position'} family
 */
export function renderRefundDetailHtml(family) {
  const model = family === 'access' ? REFUND_DETAIL_MODEL.access : REFUND_DETAIL_MODEL.position;
  const intro = `<p>${escRefundText(model.intro)}</p>`;
  const sections = model.sections
    .map((section) => {
      const items = section.items.map((item) => `<li>${escRefundText(item)}</li>`).join('');
      return `<p><strong>${escRefundText(section.title)}</strong></p><ul class="refund-policy-list">${items}</ul>`;
    })
    .join('');
  return `<div class="refund-policy-detail mypage-muted">${intro}${sections}</div>`;
}

/** FAQ — 유료상품 환불과 과외비 환불은 같나요? */
export const FAQ_PAID_VS_TUTOR_FEE_REFUND =
  '다릅니다. 쪽지권·노출상품 환불은 마이페이지의 구매이력에서 바로 신청하실 수 있어요. 환불 금액은 쪽지권과 노출상품 각각의 규정을 따릅니다. 과외비 환불은 수업을 주고받는 분들이 직접 정하시면 됩니다.';

/**
 * 회원탈퇴 등 — 쪽지/노출을 한 줄로 가리키되 조건을 틀리지 않게
 * (노출에 「7일」 프레임을 씌우지 않음)
 */
export const WITHDRAW_REFUND_HINT =
  '쪽지권·노출상품 환불은 각각의 규정을 따르며, 마이페이지 구매이력에서 신청하실 수 있어요.';

/** 주문 요약 한 줄(노출) — 짧은 안내와 동일 출처 */
export const POSITION_REFUND_SUMMARY_LINE = POSITION_REFUND_SHORT;

/** 주문 요약·체크아웃 노트용 */
export function refundCheckoutNote(family) {
  if (family === 'access') {
    return `${MEMO_TICKET_REFUND_SHORT} 최종 금액은 결제 직전에 한 번 더 확인해요.`;
  }
  return `${POSITION_REFUND_SHORT} 최종 금액은 결제 직전에 한 번 더 확인해요.`;
}

/** @param {'access'|'position'} family */
export function refundShort(family) {
  return family === 'access' ? MEMO_TICKET_REFUND_SHORT : POSITION_REFUND_SHORT;
}

/** @param {'access'|'position'} family */
export function refundDetail(family) {
  return family === 'access' ? MEMO_TICKET_REFUND_DETAIL : POSITION_REFUND_DETAIL;
}
