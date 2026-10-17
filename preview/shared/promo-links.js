/**
 * 홍보 채널 — 유튜브(최대 4) · 네이버 블로그(최대 2, 제목 짝) · 인스타그램 · 틱톡 · 네이버 클립
 * facebook_url 은 화면에서 숨기고 저장값만 유지한다.
 * 1차: URL 저장·단순 노출만 (임베드·통계·외부 제목 조회 없음)
 */

export const YOUTUBE_URL_FIELDS = ['youtube_url', 'youtube_url_2', 'youtube_url_3', 'youtube_url_4'];

export const BLOG_PAIRS = [
  { url: 'blog_url_1', title: 'blog_title_1', which: '1번째' },
  { url: 'blog_url_2', title: 'blog_title_2', which: '2번째' },
];

/** 화면·저장에 쓰는 홍보 채널 필드. facebook_url 은 숨은 값이다. */
export const PROMO_CHANNEL_FIELDS = [
  ...YOUTUBE_URL_FIELDS,
  'blog_url_1',
  'blog_title_1',
  'blog_url_2',
  'blog_title_2',
  'instagram_url',
  'tiktok_url',
  'naver_clip_url',
  'facebook_url',
];

const CHANNEL_HOSTS = {
  youtube: ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'],
  instagram: ['instagram.com', 'www.instagram.com'],
  tiktok: ['tiktok.com', 'www.tiktok.com', 'vm.tiktok.com', 'vt.tiktok.com'],
  naver_clip: ['clip.naver.com'],
  blog: ['blog.naver.com'],
};

const URL_FIELD_CHANNEL = {
  youtube_url: ['youtube', '유튜브'],
  youtube_url_2: ['youtube', '유튜브 2번째'],
  youtube_url_3: ['youtube', '유튜브 3번째'],
  youtube_url_4: ['youtube', '유튜브 4번째'],
  instagram_url: ['instagram', '인스타그램'],
  tiktok_url: ['tiktok', '틱톡'],
  naver_clip_url: ['naver_clip', '네이버 클립'],
  blog_url_1: ['blog', '블로그 1번째'],
  blog_url_2: ['blog', '블로그 2번째'],
};

const CONTACT_BLOCKED = '전화번호·카톡 아이디는 넣을 수 없어요';

/** @param {string} raw */
export function normalizePromoUrl(raw) {
  return String(raw ?? '').trim();
}

function escAttr(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

/** URL로 읽기 전에 원문에서 연락처를 본다. */
export function promoHasBlockedContact(raw) {
  const text = String(raw ?? '');
  const lower = text.toLowerCase();
  if (lower.includes('tel:')) return true;
  if (lower.includes('open.kakao.com') || lower.includes('pf.kakao.com')) return true;
  if (/(^|[^\d])01[016789][-\s.]?\d{3,4}[-\s.]?\d{4}(?!\d)/.test(text)) return true;
  const compact = text.replace(/[-\s.]/g, '');
  return /(^|[^\d])01[016789]\d{7,8}(?!\d)/.test(compact);
}

/**
 * @param {string} channel
 * @param {string} host
 */
function hostAllowed(channel, host) {
  return (CHANNEL_HOSTS[channel] || []).includes(String(host || '').toLowerCase());
}

/**
 * @param {string} raw
 * @param {string} channel
 * @param {string} label
 * @returns {string|null}
 */
function validateChannelUrl(raw, channel, label) {
  const value = normalizePromoUrl(raw);
  if (!value) return null;
  if (promoHasBlockedContact(value)) return CONTACT_BLOCKED;
  let url;
  try {
    url = new URL(value);
  } catch {
    return `${label} 주소가 아니에요`;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return `${label} 주소가 아니에요`;
  }
  if (!hostAllowed(channel, url.hostname)) {
    return `${label} 주소가 아니에요`;
  }
  return null;
}

/**
 * @param {Record<string, unknown>} urls
 * @returns {string|null}
 */
export function validatePromoUrls(urls) {
  for (const [field, spec] of Object.entries(URL_FIELD_CHANNEL)) {
    const message = validateChannelUrl(urls?.[field], spec[0], spec[1]);
    if (message) return message;
  }
  const facebook = normalizePromoUrl(urls?.facebook_url);
  if (facebook) {
    try {
      const url = new URL(facebook);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return '페이스북 링크 URL 형식이 올바르지 않습니다. (http/https)';
      }
    } catch {
      return '페이스북 링크 URL 형식이 올바르지 않습니다. (http/https)';
    }
  }
  for (const pair of BLOG_PAIRS) {
    const url = normalizePromoUrl(urls?.[pair.url]);
    const title = normalizePromoUrl(urls?.[pair.title]);
    if (/[\r\n]/.test(String(urls?.[pair.title] ?? ''))) {
      return `블로그 ${pair.which} 제목은 한 줄로 적어 주세요`;
    }
    if (title.length > 255) {
      return `블로그 ${pair.which} 제목은 255자까지예요`;
    }
    if (url && !title) return `블로그 ${pair.which} 주소를 넣었으면 제목도 적어 주세요`;
    if (title && !url) return `블로그 ${pair.which} 제목만 있고 주소가 없어요`;
  }
  return null;
}

/** @param {string} url */
export function extractYoutubeVideoId(url) {
  const s = normalizePromoUrl(url);
  if (!s) return null;
  try {
    const u = new URL(s);
    if (u.hostname.includes('youtu.be')) {
      const id = u.pathname.replace(/^\//, '').split('/')[0];
      return id || null;
    }
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return v;
      const parts = u.pathname.split('/').filter(Boolean);
      const embedIdx = parts.indexOf('embed');
      if (embedIdx >= 0 && parts[embedIdx + 1]) return parts[embedIdx + 1];
      const shortsIdx = parts.indexOf('shorts');
      if (shortsIdx >= 0 && parts[shortsIdx + 1]) return parts[shortsIdx + 1];
    }
  } catch {
    return null;
  }
  return null;
}

/** @param {Record<string, unknown>} state @param {string[]} keys */
function lastFilledIndex(state, keys) {
  let last = 0;
  keys.forEach((key, index) => {
    if (normalizePromoUrl(state?.[key])) last = index + 1;
  });
  return last;
}

/** @param {Record<string, unknown>} state */
export function visibleYoutubeCount(state) {
  const opened = Number(state?._promoYoutubeOpen) || 1;
  return Math.min(4, Math.max(1, lastFilledIndex(state, YOUTUBE_URL_FIELDS), opened));
}

/** @param {Record<string, unknown>} state */
export function visibleBlogCount(state) {
  const opened = Number(state?._promoBlogOpen) || 1;
  let last = 0;
  BLOG_PAIRS.forEach((pair, index) => {
    if (normalizePromoUrl(state?.[pair.url]) || normalizePromoUrl(state?.[pair.title])) last = index + 1;
  });
  return Math.min(2, Math.max(1, last, opened));
}

/**
 * @param {HTMLFormElement|null|undefined} form
 * @param {Record<string, unknown>} state
 */
export function syncPromoFieldsFromForm(form, state) {
  if (!form) return;
  const fd = new FormData(form);
  for (const key of PROMO_CHANNEL_FIELDS) {
    if (form.querySelector(`[name="${key}"]`)) {
      state[key] = String(fd.get(key) ?? '');
    }
  }
}

/** @param {Record<string, unknown>} state */
export function promoChannelPayload(state) {
  return {
    youtube_url: state?.youtube_url || '',
    youtube_url_2: state?.youtube_url_2 || '',
    youtube_url_3: state?.youtube_url_3 || '',
    youtube_url_4: state?.youtube_url_4 || '',
    blog_url_1: state?.blog_url_1 || '',
    blog_title_1: state?.blog_title_1 || '',
    blog_url_2: state?.blog_url_2 || '',
    blog_title_2: state?.blog_title_2 || '',
    instagram_url: state?.instagram_url || '',
    tiktok_url: state?.tiktok_url || '',
    naver_clip_url: state?.naver_clip_url || '',
    facebook_url: state?.facebook_url || '',
  };
}

function urlField(name, label, value, placeholder) {
  return `
    <div class="form-group">
      <label class="form-label" for="${name}">${label}</label>
      <input class="form-input" type="url" id="${name}" name="${name}" placeholder="${escAttr(placeholder)}" value="${escAttr(value)}" />
    </div>`;
}

/**
 * 등록·수정 폼의 홍보 채널 칸. 페이스북은 숨은 값으로만 둔다.
 * @param {Record<string, unknown>} state
 */
export function renderPromoChannelFields(state) {
  const youtubeCount = visibleYoutubeCount(state);
  const blogCount = visibleBlogCount(state);
  const youtubeLabels = ['유튜브 링크', '유튜브 링크 2', '유튜브 링크 3', '유튜브 링크 4'];
  const youtubeFields = YOUTUBE_URL_FIELDS.slice(0, youtubeCount)
    .map((name, index) =>
      urlField(name, youtubeLabels[index], state?.[name], 'https://www.youtube.com/...'),
    )
    .join('');
  const youtubeAdd =
    youtubeCount < 4
      ? `<button type="button" class="register-plus-btn" data-action="add-promo-youtube">+ 영상 추가</button>`
      : '';
  const blogFields = BLOG_PAIRS.slice(0, blogCount)
    .map(
      (pair) => `
      <div class="register-promo-blog">
        ${urlField(pair.url, `네이버 블로그 주소 ${pair.which}`, state?.[pair.url], 'https://blog.naver.com/...')}
        <div class="form-group">
          <label class="form-label" for="${pair.title}">블로그 제목 ${pair.which}</label>
          <input class="form-input" type="text" id="${pair.title}" name="${pair.title}" maxlength="255" placeholder="보여줄 제목" value="${escAttr(state?.[pair.title])}" />
        </div>
      </div>`,
    )
    .join('');
  const blogAdd =
    blogCount < 2
      ? `<button type="button" class="register-plus-btn" data-action="add-promo-blog">+ 블로그 추가</button>`
      : '';
  return `
    <div class="register-promo-channels" data-promo-channels>
      <input type="hidden" name="facebook_url" value="${escAttr(state?.facebook_url)}" />
      ${youtubeFields}
      ${youtubeAdd}
      <p class="register-hint">블로그는 네이버 블로그 주소만 넣을 수 있어요. 제목은 직접 적습니다.</p>
      ${blogFields}
      ${blogAdd}
      ${urlField('instagram_url', '인스타그램 링크', state?.instagram_url, 'https://www.instagram.com/...')}
      ${urlField('tiktok_url', '틱톡 링크', state?.tiktok_url, 'https://www.tiktok.com/...')}
      ${urlField('naver_clip_url', '네이버 클립 링크', state?.naver_clip_url, 'https://clip.naver.com/...')}
    </div>`;
}

/**
 * @param {HTMLElement} root
 * @param {Record<string, unknown>} state
 * @param {{ sync: () => void, refresh: () => void }} actions
 */
export function bindPromoChannelAdds(root, state, actions) {
  root.querySelector('[data-action="add-promo-youtube"]')?.addEventListener('click', () => {
    actions.sync();
    const count = visibleYoutubeCount(state);
    if (count >= 4) return;
    state._promoYoutubeOpen = count + 1;
    actions.refresh();
  });
  root.querySelector('[data-action="add-promo-blog"]')?.addEventListener('click', () => {
    actions.sync();
    const count = visibleBlogCount(state);
    if (count >= 2) return;
    state._promoBlogOpen = count + 1;
    actions.refresh();
  });
}

function blankLink(href, label, className) {
  const url = normalizePromoUrl(href);
  if (!url) return '';
  return `<a class="${className}" href="${escAttr(url)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
}

/**
 * @param {Record<string, unknown>} item
 * @param {(s: string) => string} [esc]
 */
export function renderPromoLinksSection(item, esc = escAttr) {
  const youtubeUrls = YOUTUBE_URL_FIELDS.map((key) => normalizePromoUrl(item?.[key])).filter(Boolean);
  const blogs = BLOG_PAIRS.map((pair) => ({
    url: normalizePromoUrl(item?.[pair.url]),
    title: normalizePromoUrl(item?.[pair.title]),
  })).filter((row) => row.url);
  const instagram = normalizePromoUrl(item?.instagram_url);
  const tiktok = normalizePromoUrl(item?.tiktok_url);
  const clip = normalizePromoUrl(item?.naver_clip_url);
  if (!youtubeUrls.length && !blogs.length && !instagram && !tiktok && !clip) return '';

  const icons = [
    youtubeUrls[0]
      ? blankLink(youtubeUrls[0], '유튜브', 'p24-promo__icon')
      : '',
    blogs[0] ? blankLink(blogs[0].url, '블로그', 'p24-promo__icon') : '',
    instagram ? blankLink(instagram, '인스타그램', 'p24-promo__icon') : '',
    tiktok ? blankLink(tiktok, '틱톡', 'p24-promo__icon') : '',
    clip ? blankLink(clip, '네이버 클립', 'p24-promo__icon') : '',
  ].join('');

  const thumbs = youtubeUrls
    .map((url) => {
      const id = extractYoutubeVideoId(url);
      if (!id) return '';
      return `<a class="p24-promo__thumb" href="${esc(url)}" target="_blank" rel="noopener noreferrer"><img src="https://img.youtube.com/vi/${esc(id)}/mqdefault.jpg" alt="유튜브" width="160" height="90" loading="lazy" /></a>`;
    })
    .join('');

  const blogLines = blogs
    .map(
      (row) =>
        `<a class="p24-promo__blog" href="${esc(row.url)}" target="_blank" rel="noopener noreferrer">${esc(row.title || '네이버 블로그')}</a>`,
    )
    .join('');

  return `
    <section class="p24-section p24-promo">
      <h3 class="p24-section__title">홍보 채널</h3>
      <div class="p24-promo__icons">${icons}</div>
      ${thumbs ? `<div class="p24-promo__thumbs">${thumbs}</div>` : ''}
      ${blogLines ? `<div class="p24-promo__blogs">${blogLines}</div>` : ''}
    </section>`;
}
