globalThis.window = {
  location: { hash: '', pathname: '/', search: '' },
  addEventListener() {},
  removeEventListener() {},
};
globalThis.document = { cookie: '' };
globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
globalThis.sessionStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };

const calls = [];
globalThis.fetch = async (url, opts = {}) => {
  const href = String(url);
  calls.push({ href, method: opts.method || 'GET' });
  if (href.includes('/api/board/posts.php')) {
    return {
      ok: true,
      json: async () => ({
        ok: true,
        post: {
          id: 'post-kept',
          post_key: 'post-kept',
          title: '제목',
          description: '본문',
          type: 'worry',
          status: 'published',
        },
      }),
    };
  }
  return {
    ok: false,
    status: 500,
    json: async () => ({ ok: false, message: '사진을 저장하지 못했어요.' }),
  };
};

const { saveConcernPostThenPhotos } = await import('../preview/home-ui/src/concern/store.js');
const file = new File([new Uint8Array([1, 2, 3])], 'a.jpg', { type: 'image/jpeg' });
const saved = await saveConcernPostThenPhotos(
  { boardKey: 'concern-parent', title: '제목', body: '본문', type: 'worry' },
  { files: [file] },
);
const postKept = saved.post && (saved.post.id === 'post-kept' || saved.post.postKey === 'post-kept');
const told = String(saved.photoError || '').includes('사진을 저장하지 못했어요.');
const postedFirst = calls[0]?.href.includes('/api/board/posts.php') && calls[1]?.href.includes('concern-photos.php');
console.log(postKept && told && postedFirst ? 'PASS photo fail keeps post' : 'FAIL', { postKept, told, postedFirst, saved, calls });
process.exit(postKept && told && postedFirst ? 0 : 1);
