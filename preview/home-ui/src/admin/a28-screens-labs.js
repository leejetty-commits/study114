/**
 * A28 market / addons / notify lab panels — extracted from a28-screens.js
 * Rollback: git revert this commit.
 */
import { parseHashQuery } from '../../../shared/preview-links.js';
import {
  getMarketplaceLab,
} from './marketplace-lab-store.js';
import {
  getSmsLab,
  listTemplateGroups,
  listTemplates,
  listPhoneGroups,
  listPhones,
  listSendLogs,
  listSendLogsByPhone,
  estimateSmsBytes,
} from './sms-lab-store.js';
import {
  listAddonVendors,
  ADDON_CATEGORY_LABELS,
  ADDON_STATUS_LABELS,
  SMS_LAB_NOTICE,
} from './vendor-addons.js';
import { SMS_STATUS_KO } from './a28-screens-state.js';
import { esc, renderOpsTip, renderPanel } from './a28-screens-shared.js';

export function renderMarketLab(section = 'overview') {
  const data = getMarketplaceLab();
  const kindKo = { study_room: '공부방', tutor: '과외쌤' };
  const statusKo = { published: '공개중', hidden: '숨김', pending: '대기', draft: '비공개' };

  if (section === 'overview') {
    const k = data.kpi;
    return renderPanel(
      '마켓 현황',
      'A28-07b',
      `${renderOpsTip()}
       <p class="a28-help">공부방·과외쌤이 곧 「상품」입니다. 오늘 운영 숫자를 먼저 보고, 아래 메뉴로 내려가세요.</p>
       <div class="admin-kpi-row">
         <div class="admin-kpi"><span>오늘 주문</span><strong>${k.ordersToday}</strong></div>
         <div class="admin-kpi"><span>오늘 결제</span><strong>${k.paidToday}</strong></div>
         <div class="admin-kpi"><span>미완료 결제</span><strong>${k.incomplete}</strong><small><a href="#/admin/market/incomplete" data-a28-nav="/admin/market/incomplete">보기</a></small></div>
         <div class="admin-kpi"><span>열린 문의</span><strong>${k.openInquiries}</strong><small><a href="#/admin/tickets" data-a28-nav="/admin/tickets">문의</a></small></div>
         <div class="admin-kpi"><span>후기 대기</span><strong>${k.reviewsPending}</strong><small><a href="#/admin/market/reviews" data-a28-nav="/admin/market/reviews">후기</a></small></div>
         <div class="admin-kpi"><span>관심(찜)</span><strong>${k.bookmarks}</strong></div>
       </div>
       <p class="a28-help"><a href="#/admin/commerce" data-a28-nav="/admin/commerce">→ 결제·주문 상세</a> · <a href="#/admin/exposure" data-a28-nav="/admin/exposure">→ 노출 보정</a></p>
       <button type="button" class="btn btn--secondary btn--sm" data-market-reset>예시 데이터 초기화</button>`,
    );
  }

  if (section === 'listings') {
    const rows = data.listings
      .map(
        (r) => `<tr>
          <td>${esc(kindKo[r.kind] || r.kind)}</td>
          <td>${esc(r.name)}</td>
          <td>${esc(r.region)}</td>
          <td>${esc(statusKo[r.status] || r.status)}</td>
          <td><a class="btn btn--secondary btn--sm" href="#/admin/exposure" data-a28-nav="/admin/exposure">노출 보정</a></td>
        </tr>`,
      )
      .join('');
    return renderPanel(
      '공부방·과외 목록',
      'A28-07a',
      `${renderOpsTip()}
       <p class="a28-help">등록된 공부방·과외쌤 목록입니다. 숨기거나 다시 보이게 하려면 「노출 보정」으로 가세요.</p>
       <table class="sup-admin-table"><thead><tr><th>구분</th><th>이름</th><th>지역</th><th>상태</th><th></th></tr></thead>
       <tbody>${rows || '<tr><td colspan="5" class="sup-empty">목록 없음</td></tr>'}</tbody></table>`,
    );
  }

  if (section === 'stats') {
    const sales = data.sales
      .map((r) => `<tr><td>${esc(r.period)}</td><td>${Number(r.amount).toLocaleString()}원</td><td>${r.orders}건</td></tr>`)
      .join('');
    const ranks = data.ranks
      .map(
        (r, i) =>
          `<tr><td>${i + 1}</td><td>${esc(kindKo[r.kind] || r.kind)}</td><td>${esc(r.name)}</td><td>${r.views}</td><td>${r.pays}</td></tr>`,
      )
      .join('');
    return renderPanel(
      '매출·순위',
      'A28-07b',
      `${renderOpsTip()}
       <p class="a28-help">미리보기용 예시 숫자입니다. 나중에 실제 결제 기록과 연결하면 됩니다.</p>
       <h3 class="admin-section-title">매출 요약</h3>
       <table class="sup-admin-table"><thead><tr><th>기간</th><th>금액</th><th>건수</th></tr></thead><tbody>${sales}</tbody></table>
       <h3 class="admin-section-title">공부방·과외 순위</h3>
       <table class="sup-admin-table"><thead><tr><th>#</th><th>구분</th><th>이름</th><th>조회</th><th>결제</th></tr></thead><tbody>${ranks}</tbody></table>`,
    );
  }

  if (section === 'reviews') {
    const rows = data.reviews
      .map(
        (r) => `<tr>
          <td>${esc(r.id)}</td>
          <td>${esc(kindKo[r.kind] || r.kind)}</td>
          <td>${esc(r.target)}</td>
          <td>${r.rating}점</td>
          <td>${esc(r.body)}</td>
          <td>${esc(r.status === 'published' ? '공개' : r.status === 'pending' ? '대기' : '숨김')}</td>
          <td class="sup-admin-actions">
            <button type="button" class="btn btn--primary btn--sm" data-review-status="${esc(r.id)}" data-review-next="published">공개</button>
            <button type="button" class="btn btn--secondary btn--sm" data-review-status="${esc(r.id)}" data-review-next="hidden">숨김</button>
          </td>
        </tr>`,
      )
      .join('');
    return renderPanel(
      '이용 후기',
      'A28-07b',
      `${renderOpsTip()}
       <p class="a28-help">「승인」이 아닙니다. 공개할지·숨길지만 고릅니다. 회원 화면에 인증·보증처럼 보이지 않게 하세요.</p>
       <table class="sup-admin-table"><thead><tr><th>번호</th><th>구분</th><th>대상</th><th>별점</th><th>내용</th><th>상태</th><th></th></tr></thead>
       <tbody>${rows || '<tr><td colspan="7" class="sup-empty">후기 없음</td></tr>'}</tbody></table>`,
    );
  }

  // incomplete
  const rows = data.incomplete
    .map(
      (r) => `<tr>
        <td>${esc(r.id)}</td>
        <td>${esc(r.email)}</td>
        <td>${esc(r.product)}</td>
        <td>${Number(r.amount).toLocaleString()}원</td>
        <td>${esc(r.step)}</td>
        <td>${esc(r.at)}</td>
        <td><button type="button" class="btn btn--secondary btn--sm" data-incomplete-dismiss="${esc(r.id)}">목록에서 빼기</button></td>
      </tr>`,
    )
    .join('');
  return renderPanel(
    '미완료 결제',
    'A28-07b',
    `${renderOpsTip()}
     <p class="a28-help">결제창에서 나가거나 실패한 건입니다. 연락이 필요하면 회원관리에서 찾아보세요.</p>
     <table class="sup-admin-table"><thead><tr><th>번호</th><th>계정</th><th>상품</th><th>금액</th><th>단계</th><th>시각</th><th></th></tr></thead>
     <tbody>${rows || '<tr><td colspan="7" class="sup-empty">미완료 없음</td></tr>'}</tbody></table>`,
  );
}

/** @param {import('./vendor-addons.js').AddonVendor[]} vendors */
function renderAddonVendorCards(vendors) {
  if (!vendors.length) {
    return '<p class="a28-help">등록된 업체가 없습니다.</p>';
  }
  return `<div class="addon-vendor-grid">${vendors
    .map((v) => {
      const cat = ADDON_CATEGORY_LABELS[v.category] || v.category;
      const st = ADDON_STATUS_LABELS[v.status] || v.status;
      const links = [
        v.homeUrl
          ? `<a class="btn btn--primary btn--sm" href="${esc(v.homeUrl)}" target="_blank" rel="noopener noreferrer">홈페이지</a>`
          : '',
        v.applyUrl
          ? `<a class="btn btn--secondary btn--sm" href="${esc(v.applyUrl)}" target="_blank" rel="noopener noreferrer">신청·가입</a>`
          : '',
        v.docsUrl
          ? `<a class="btn btn--secondary btn--sm" href="${esc(v.docsUrl)}" target="_blank" rel="noopener noreferrer">연동 문서</a>`
          : '',
      ]
        .filter(Boolean)
        .join(' ');
      return `<article class="addon-vendor-card">
        <header class="addon-vendor-card__head">
          <h3 class="addon-vendor-card__title">${esc(v.name)}</h3>
          <span class="addon-vendor-card__badge">${esc(st)}</span>
        </header>
        <p class="addon-vendor-card__cat">${esc(cat)}</p>
        <p class="addon-vendor-card__summary">${esc(v.summary)}</p>
        ${v.phone ? `<p class="addon-vendor-card__phone">상담 · ${esc(v.phone)}</p>` : ''}
        ${v.note ? `<p class="a28-help">${esc(v.note)}</p>` : ''}
        <p class="addon-vendor-card__url"><code>${esc(v.homeUrl)}</code></p>
        <div class="addon-vendor-card__actions">${links}</div>
      </article>`;
    })
    .join('')}</div>`;
}

function renderSmsLabNotice() {
  const smsVendors = listAddonVendors('sms');
  const urlList = smsVendors
    .map(
      (v) =>
        `<li><strong>${esc(v.name)}</strong> — <a href="${esc(v.homeUrl)}" target="_blank" rel="noopener noreferrer">${esc(v.homeUrl)}</a>${
          v.applyUrl
            ? ` · <a href="${esc(v.applyUrl)}" target="_blank" rel="noopener noreferrer">신청</a>`
            : ''
        }</li>`,
    )
    .join('');
  return `<div class="a28-help a28-help--warn" role="note">
      <strong>${esc(SMS_LAB_NOTICE.title)}</strong>
      <p>${esc(SMS_LAB_NOTICE.body)}</p>
      <p><strong>업체 URL</strong></p>
      <ul class="addon-url-list">${urlList}</ul>
      <p class="addon-notice-links"><a href="#/admin/addons/sms" data-a28-nav="/admin/addons/sms">→ 부가서비스 · 문자·메시징</a>
        · <a href="#/admin/addons/pg" data-a28-nav="/admin/addons/pg">카드·전자결제</a></p>
    </div>`;
}

/** @param {string} [section] home|pg|sms|identity */
export function renderAddons(section = 'home') {
  const titleMap = {
    home: '부가서비스',
    pg: '카드·전자결제',
    sms: '문자·메시징',
    identity: '본인인증',
  };
  const lead =
    section === 'home'
      ? '영카트 「부가서비스」처럼, 나중에 연동할 업체의 홈페이지·신청·문서 URL을 모아 두었습니다. 지금은 연락·계약용이며 실결제·실문자 연동은 아직 없습니다.'
      : section === 'pg'
        ? '카드 결제모듈 상담·계약이 필요할 때 아래 업체로 바로 이동하세요. 수수료·심사는 업체와 직접 확인합니다.'
        : section === 'sms'
          ? '문자 실제 발송 전에 가입·발신번호·연동키를 준비할 업체입니다.'
          : '본인확인이 정책상 필요할 때만 검토합니다. 가입 SMS OTP는 쓰지 않습니다.';

  const category = section === 'home' ? 'all' : section;
  const vendors = listAddonVendors(/** @type {'all'|'sms'|'pg'|'identity'} */ (category));

  const nav = `<nav class="addon-subnav" aria-label="부가서비스 구분">
      <a href="#/admin/addons" data-a28-nav="/admin/addons"${section === 'home' ? ' class="is-on"' : ''}>전체</a>
      <a href="#/admin/addons/pg" data-a28-nav="/admin/addons/pg"${section === 'pg' ? ' class="is-on"' : ''}>카드·전자결제</a>
      <a href="#/admin/addons/sms" data-a28-nav="/admin/addons/sms"${section === 'sms' ? ' class="is-on"' : ''}>문자</a>
      <a href="#/admin/addons/identity" data-a28-nav="/admin/addons/identity"${section === 'identity' ? ' class="is-on"' : ''}>본인인증</a>
    </nav>`;

  return renderPanel(
    titleMap[section] || '부가서비스',
    'A28-09',
    `${renderOpsTip()}
     <p class="a28-help">${esc(lead)}</p>
     ${nav}
     ${section === 'sms' ? renderSmsLabNotice() : ''}
     ${renderAddonVendorCards(vendors)}
     ${
       section === 'pg'
         ? '<p class="a28-help">결제·주문 미리보기: <a href="#/admin/commerce" data-a28-nav="/admin/commerce">결제·주문</a> · <a href="#/admin/market/overview" data-a28-nav="/admin/market/overview">마켓 현황</a></p>'
         : ''
     }
     ${
       section === 'sms'
         ? '<p class="a28-help"><a href="#/admin/notify/settings" data-a28-nav="/admin/notify/settings">→ 문자 기본설정(미리보기)</a></p>'
         : ''
     }`,
  );
}

/** @param {string} [section] settings|templates|send|logs */
export function renderNotifyLab(section = 'settings') {

  const lab = getSmsLab();

  const st = lab.settings;

  const statusKo = SMS_STATUS_KO;

  const chKo = { sms: '단문', lms: '장문', email: '이메일' };



  if (section === 'settings') {

    const ev = st.events || {};

    return renderPanel(

      '문자 기본설정',

      'A28-09',

      `${renderOpsTip()}
       ${renderSmsLabNotice()}

       <form class="sup-admin-form" data-sms-settings>

         <label class="a28-check"><input type="checkbox" name="smsEnabled"${checked(st.smsEnabled)} /> 문자(SMS) 사용(예정)</label>

         <label class="a28-check"><input type="checkbox" name="emailEnabled"${checked(st.emailEnabled)} /> 이메일 알림 사용</label>

         <label class="sup-field"><span>게이트웨이</span>

           <select name="gateway">

             <option value="none"${selected(st.gateway, 'none')}>연결 안 함(미리보기)</option>

             <option value="aligo"${selected(st.gateway, 'aligo')}>알리고(예정)</option>

             <option value="icode"${selected(st.gateway, 'icode')}>아이코드(예정)</option>

           </select>

         </label>

         <label class="sup-field"><span>발신 표시명</span><input name="senderName" value="${esc(st.senderName)}" /></label>

         <label class="sup-field"><span>발신 번호(표시용)</span><input name="senderPhone" value="${esc(st.senderPhone)}" /></label>

         <label class="sup-field"><span>야간 제한 시작</span><input name="quietHoursStart" value="${esc(st.quietHoursStart)}" placeholder="21:00" /></label>

         <label class="sup-field"><span>야간 제한 종료</span><input name="quietHoursEnd" value="${esc(st.quietHoursEnd)}" placeholder="08:00" /></label>

         <h4 class="admin-section-title">자동 알림 이벤트</h4>

         <div class="a28-checkbox-grid">

           <label><input type="checkbox" name="onReport"${checked(ev.onReport)} /> 새 신고</label>

           <label><input type="checkbox" name="onTicket"${checked(ev.onTicket)} /> 새 문의</label>

           <label><input type="checkbox" name="onNewProvider"${checked(ev.onNewProvider)} /> 새 공부방·과외 등록</label>

           <label><input type="checkbox" name="onPaidExpire"${checked(ev.onPaidExpire)} /> 유료 만료 임박</label>

           <label><input type="checkbox" name="onIncompletePay"${checked(ev.onIncompletePay)} /> 미완료 결제</label>

         </div>

         <button type="submit" class="btn btn--primary btn--sm">설정 저장</button>

       </form>

       <p class="a28-help"><a href="#/admin/settings/notify" data-a28-nav="/admin/settings/notify">→ 환경설정 · 운영 알림</a></p>`,

    );

  }



  if (section === 'sync') {

    return renderPanel(

      '회원번호 동기화',

      'A28-09',

      `${renderOpsTip()}

       <p class="a28-help">회원관리에 있는 휴대폰을 「테스트」 주소록 그룹으로 가져옵니다. 이미 있는 번호는 건너뜁니다.</p>

       <p class="a28-help">최근 동기화: ${esc(lab.lastMemberSyncAt || '없음')} · 추가 ${lab.syncedMemberPhones || 0}건</p>

       <button type="button" class="btn btn--primary btn--sm" data-sms-sync-members>회원 휴대폰 가져오기</button>

       <p class="a28-help"><a href="#/admin/notify/phones" data-a28-nav="/admin/notify/phones">→ 수신번호 관리</a></p>`,

    );

  }



  if (section === 'templates') {

    const groups = listTemplateGroups();

    const groupOpts = groups.map((g) => `<option value="${esc(g.id)}">${esc(g.label)}</option>`).join('');

    const groupRows = groups

      .map(

        (g) =>

          `<tr><td>${esc(g.label)}</td><td><code>${esc(g.id)}</code></td>

            <td><button type="button" class="btn btn--secondary btn--sm" data-tpl-grp-del="${esc(g.id)}">삭제</button></td></tr>`,

      )

      .join('');

    const rows = listTemplates('all')

      .map((t) => {

        const g = groups.find((x) => x.id === t.groupId);

        return `<tr>

          <td>${esc(g?.label || t.groupId)}</td>

          <td>${esc(t.title)}</td>

          <td>${esc(chKo[t.channel] || t.channel)}</td>

          <td>${esc(t.body)}</td>

          <td class="sup-admin-actions">

            <button type="button" class="btn btn--secondary btn--sm" data-tpl-edit="${esc(t.id)}">수정</button>

            <button type="button" class="btn btn--secondary btn--sm" data-tpl-delete="${esc(t.id)}">삭제</button>

          </td>

        </tr>`;

      })

      .join('');

    return renderPanel(

      '문구 템플릿',

      'A28-09',

      `${renderOpsTip()}

       <p class="a28-help">그룹으로 묶어 두고, 본문에 {days} 같은 자리표시를 쓸 수 있습니다. 글자 수가 길면 장문(LMS)으로 권장합니다.</p>

       <h3 class="admin-section-title">템플릿 그룹</h3>

       <table class="sup-admin-table"><thead><tr><th>이름</th><th>키</th><th></th></tr></thead>

         <tbody>${groupRows || '<tr><td colspan="3" class="sup-empty">그룹 없음</td></tr>'}</tbody></table>

       <form class="admin-filter-bar" data-tpl-grp-form>

         <input name="label" class="admin-input" placeholder="그룹 이름" required />

         <button type="submit" class="btn btn--primary btn--sm">그룹 추가</button>

       </form>

       <h3 class="admin-section-title">템플릿</h3>

       <table class="sup-admin-table"><thead><tr><th>그룹</th><th>제목</th><th>채널</th><th>본문</th><th></th></tr></thead>

         <tbody>${rows || '<tr><td colspan="5" class="sup-empty">템플릿 없음</td></tr>'}</tbody></table>

       <form class="sup-admin-form" data-tpl-form>

         <h4 class="sup-admin-form__title">템플릿 작성 · 수정</h4>

         <input type="hidden" name="id" value="" />

         <label class="sup-field"><span>그룹</span><select name="groupId">${groupOpts}</select></label>

         <label class="sup-field"><span>제목</span><input name="title" required /></label>

         <label class="sup-field"><span>채널</span>

           <select name="channel">

             <option value="sms">단문(SMS)</option>

             <option value="lms">장문(LMS)</option>

             <option value="email">이메일</option>

           </select>

         </label>

         <label class="sup-field"><span>본문</span><textarea name="body" rows="3" required data-sms-body></textarea></label>

         <p class="a28-help" data-sms-bytes>대략 0바이트 · 단문 권장</p>

         <div class="sup-admin-form__actions">

           <button type="submit" class="btn btn--primary btn--sm">저장</button>

           <button type="button" class="btn btn--secondary btn--sm" data-tpl-reset>새 템플릿</button>

         </div>

       </form>`,

    );

  }



  if (section === 'phones') {

    const groups = listPhoneGroups();

    const groupOpts = groups.map((g) => `<option value="${esc(g.id)}">${esc(g.label)}</option>`).join('');

    const groupRows = groups

      .map(

        (g) =>

          `<tr><td>${esc(g.label)}</td><td><code>${esc(g.id)}</code></td>

            <td><button type="button" class="btn btn--secondary btn--sm" data-ph-grp-del="${esc(g.id)}">삭제</button></td></tr>`,

      )

      .join('');

    const rows = listPhones('all')

      .map((p) => {

        const g = groups.find((x) => x.id === p.groupId);

        const sendPath = `/admin/notify/send?phone=${encodeURIComponent(p.phone)}&name=${encodeURIComponent(p.name)}`;

        return `<tr>

          <td>${esc(g?.label || p.groupId)}</td>

          <td>${esc(p.name)}</td>

          <td>${esc(p.phone)}</td>

          <td>${esc(p.memo || '—')}</td>

          <td class="sup-admin-actions">

            <button type="button" class="btn btn--secondary btn--sm" data-ph-edit="${esc(p.id)}">수정</button>

            <button type="button" class="btn btn--secondary btn--sm" data-ph-del="${esc(p.id)}">삭제</button>

            <a class="btn btn--secondary btn--sm" href="#${esc(sendPath)}" data-a28-nav="${esc(sendPath)}">보내기</a>

          </td>

        </tr>`;

      })

      .join('');

    return renderPanel(

      '수신번호 관리',

      'A28-09',

      `${renderOpsTip()}

       <p class="a28-help">운영·테스트용 주소록입니다. 실서비스에서는 수신동의·광고성 문자 규정을 지켜야 합니다.</p>

       <h3 class="admin-section-title">수신 그룹</h3>

       <table class="sup-admin-table"><thead><tr><th>이름</th><th>키</th><th></th></tr></thead>

         <tbody>${groupRows || '<tr><td colspan="3" class="sup-empty">그룹 없음</td></tr>'}</tbody></table>

       <form class="admin-filter-bar" data-ph-grp-form>

         <input name="label" class="admin-input" placeholder="그룹 이름" required />

         <button type="submit" class="btn btn--primary btn--sm">그룹 추가</button>

       </form>

       <h3 class="admin-section-title">번호</h3>

       <table class="sup-admin-table"><thead><tr><th>그룹</th><th>이름</th><th>휴대폰</th><th>메모</th><th></th></tr></thead>

         <tbody>${rows || '<tr><td colspan="5" class="sup-empty">번호 없음</td></tr>'}</tbody></table>

       <form class="sup-admin-form" data-ph-form>

         <h4 class="sup-admin-form__title">번호 추가 · 수정</h4>

         <input type="hidden" name="id" value="" />

         <label class="sup-field"><span>그룹</span><select name="groupId">${groupOpts}</select></label>

         <label class="sup-field"><span>이름</span><input name="name" required /></label>

         <label class="sup-field"><span>휴대폰</span><input name="phone" required placeholder="010-0000-0000" /></label>

         <label class="sup-field"><span>메모</span><input name="memo" /></label>

         <div class="sup-admin-form__actions">

           <button type="submit" class="btn btn--primary btn--sm">저장</button>

           <button type="button" class="btn btn--secondary btn--sm" data-ph-reset>새 번호</button>

         </div>

       </form>`,

    );

  }



  if (section === 'send') {

    const q = parseHashQuery();

    const prePhone = q.phone || '';

    const preName = q.name || '';

    const tplOpts = listTemplates('all').map((t) => `<option value="${esc(t.id)}">${esc(t.title)}</option>`).join('');

    const phoneOpts = listPhones('all')

      .map((p) => `<option value="${esc(p.phone)}" data-name="${esc(p.name)}">${esc(p.name)} · ${esc(p.phone)}</option>`)

      .join('');

    return renderPanel(

      '문자 보내기',

      'A28-09',

      `${renderOpsTip()}

       <p class="a28-help"><strong>실제로 문자를 보내지 않습니다.</strong> 전송내역에 「미리보기」로만 남깁니다.</p>

       <form class="sup-admin-form" data-sms-send>

         <label class="sup-field"><span>주소록에서 고르기</span>

           <select data-sms-pick-phone>

             <option value="">직접 입력</option>

             ${phoneOpts}

           </select>

         </label>

         <label class="sup-field"><span>받는 이름</span><input name="toName" value="${esc(preName)}" /></label>

         <label class="sup-field"><span>받는 번호</span><input name="to" value="${esc(prePhone)}" placeholder="010-0000-0000" required /></label>

         <label class="sup-field"><span>템플릿</span><select name="templateId" data-sms-tpl>${tplOpts}</select></label>

         <label class="sup-field"><span>본문</span><textarea name="body" rows="4" data-sms-body></textarea></label>

         <p class="a28-help" data-sms-bytes>대략 0바이트</p>

         <button type="submit" class="btn btn--primary btn--sm">미리보기 기록</button>

       </form>`,

    );

  }



  if (section === 'logs-phone') {

    const rows = listSendLogsByPhone()

      .map(

        (r) =>

          `<tr><td>${esc(r.phone)}</td><td>${esc(r.name || '—')}</td><td>${r.count}</td><td>${esc(statusKo[r.lastStatus] || r.lastStatus)}</td><td>${esc(r.lastAt)}</td></tr>`,

      )

      .join('');

    return renderPanel(

      '전송내역(번호별)',

      'A28-09',

      `${renderOpsTip()}

       <p class="a28-help">수신번호별로 몇 건 남겼는지 봅니다.</p>

       <table class="sup-admin-table"><thead><tr><th>번호</th><th>이름</th><th>건수</th><th>최근 상태</th><th>최근 시각</th></tr></thead>

         <tbody>${rows || '<tr><td colspan="5" class="sup-empty">내역 없음</td></tr>'}</tbody></table>`,

    );

  }



  const logs = listSendLogs()

    .map(

      (l) =>

        `<tr>

          <td>${esc(l.id)}</td>

          <td>${esc(l.to)}${l.toName ? `<br><small>${esc(l.toName)}</small>` : ''}</td>

          <td>${esc(l.templateTitle || '—')}</td>

          <td>${esc(chKo[l.channel] || l.channel)}</td>

          <td>${esc(statusKo[l.status] || l.status)}</td>

          <td>${l.byteLen || estimateSmsBytes(l.body)}</td>

          <td>${esc(l.at)}</td>

        </tr>`,

    )

    .join('');

  return renderPanel(

    '전송내역(건별)',

    'A28-09',

    `${renderOpsTip()}

     <p class="a28-help">미리보기 기록이 쌓입니다. 실발송 연동 후 sent/failed 상태가 추가됩니다.</p>

     <table class="sup-admin-table"><thead><tr><th>식별번호</th><th>수신</th><th>문구 틀</th><th>발송 방식</th><th>상태</th><th>글자 용량</th><th>시각</th></tr></thead>

       <tbody>${logs || '<tr><td colspan="7" class="sup-empty">내역 없음</td></tr>'}</tbody></table>

     <button type="button" class="btn btn--secondary btn--sm" data-sms-reset>문자 미리보기 초기화</button>`,

  );

}

