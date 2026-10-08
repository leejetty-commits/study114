/**
 * 과외쌤 프로필 사진 — 검사·리사이즈·업로드 (마이페이지·가입·tutor-ui 공통).
 * 1번 = 대표(BASIC/PICK/PRIME 카드). 서버가 베이직(1:1)·프라임(16:9) 파생본을 만든다.
 */

import { readImageSize, PROMO_IMAGE_SPEC } from './promo-image.js';

export const TUTOR_PROFILE_PHOTO_SPEC = {
  maxCount: 3,
  accept: PROMO_IMAGE_SPEC.accept,
  acceptExt: PROMO_IMAGE_SPEC.acceptExt,
  maxBytes: PROMO_IMAGE_SPEC.maxBytes,
  /** 카드·얼굴 프레임용 — 정사각에 가깝게 */
  minWidth: 800,
  minHeight: 800,
  recommended: '1200×1200 이상',
  basicSize: 720,
  /** 서버 업로드용 (원본 대신 보내 닷홈 메모리·용량 부담 감소) */
  uploadSize: 1200,
  primeWidth: 1280,
  primeHeight: 720,
  jpegQuality: 0.82,
};

export function tutorProfilePhotoHint() {
  const s = TUTOR_PROFILE_PHOTO_SPEC;
  return `JPG · PNG · WebP / 권장 ${s.recommended} / 파일 최대 4MB · ${s.maxCount}장. 가로·세로가 ${s.minWidth}×${s.minHeight}에 못 미치면(예: 가로만 긴 사진) 자동으로 확대한 뒤, 베이직 정사각(${s.basicSize}×${s.basicSize})·프라임 16:9(${s.primeWidth}×${s.primeHeight})로 맞춥니다. 왼쪽(1번)이 대표 사진입니다.`;
}

function extOfName(name) {
  const m = String(name || '')
    .toLowerCase()
    .match(/\.([a-z0-9]+)$/);
  return m ? m[1] : '';
}

/**
 * 형식·용량만 검사. 픽셀이 작아도 통과(업로드 전 최소 크기로 확대).
 * @param {File} file
 * @returns {Promise<string>} 오류 메시지. 통과면 빈 문자열.
 */
export async function validateTutorProfilePhoto(file) {
  if (!file) return '파일을 선택해 주세요.';
  const ext = extOfName(file.name);
  const mimeOk = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type);
  const extOk = TUTOR_PROFILE_PHOTO_SPEC.acceptExt.includes(ext);
  if (!mimeOk && !extOk) {
    return 'JPG, PNG, WebP 파일만 올릴 수 있습니다.';
  }
  if (file.size > TUTOR_PROFILE_PHOTO_SPEC.maxBytes) {
    return '파일 용량은 4MB 이하여야 합니다.';
  }
  try {
    const { width, height } = await readImageSize(file);
    if (width < 1 || height < 1) {
      return '이미지를 확인할 수 없습니다.';
    }
  } catch (err) {
    return err instanceof Error ? err.message : '이미지를 확인할 수 없습니다.';
  }
  return '';
}

/**
 * 가로·세로가 최소보다 작으면 비율 유지한 채 확대(둘 다 최소 이상).
 * @param {File} file
 * @returns {Promise<File>}
 */
export async function ensureTutorProfilePhotoMinSize(file) {
  const minW = TUTOR_PROFILE_PHOTO_SPEC.minWidth;
  const minH = TUTOR_PROFILE_PHOTO_SPEC.minHeight;
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('이미지를 읽을 수 없습니다.'));
      el.src = url;
    });
    const sw = img.naturalWidth || img.width;
    const sh = img.naturalHeight || img.height;
    if (sw >= minW && sh >= minH) {
      return file;
    }
    const scale = Math.max(minW / Math.max(1, sw), minH / Math.max(1, sh));
    const tw = Math.max(minW, Math.round(sw * scale));
    const th = Math.max(minH, Math.round(sh * scale));
    const canvas = document.createElement('canvas');
    canvas.width = tw;
    canvas.height = th;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('이미지 캔버스를 만들 수 없습니다.');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, tw, th);
    const dataUrl = canvasToJpegDataUrl(canvas, TUTOR_PROFILE_PHOTO_SPEC.jpegQuality);
    return dataUrlToJpegFile(dataUrl, file.name || 'profile.jpg');
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {number} quality
 */
function canvasToJpegDataUrl(canvas, quality) {
  return canvas.toDataURL('image/jpeg', quality);
}

/**
 * @param {CanvasImageSource} img
 * @param {number} sw
 * @param {number} sh
 * @param {number} cropX
 * @param {number} cropY
 * @param {number} tw
 * @param {number} th
 */
function cropResizeToCanvas(img, sw, sh, cropX, cropY, tw, th) {
  const target = tw / th;
  const src = sw / Math.max(1, sh);
  let cw;
  let ch;
  if (src > target) {
    cw = Math.round(sh * target);
    ch = sh;
  } else {
    cw = sw;
    ch = Math.round(sw / target);
  }
  const maxX = Math.max(0, sw - cw);
  const maxY = Math.max(0, sh - ch);
  const sx = Math.round(Math.min(maxX, Math.max(0, maxX * cropX)));
  const sy = Math.round(Math.min(maxY, Math.max(0, maxY * cropY)));
  const canvas = document.createElement('canvas');
  canvas.width = tw;
  canvas.height = th;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('이미지 캔버스를 만들 수 없습니다.');
  ctx.drawImage(img, sx, sy, cw, ch, 0, 0, tw, th);
  return canvas;
}

/**
 * @param {File} file
 * @param {number} cropX
 * @param {number} cropY
 */
export async function processTutorProfilePhoto(file, cropX, cropY) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('이미지를 읽을 수 없습니다.'));
      el.src = url;
    });
    const sw = img.naturalWidth || img.width;
    const sh = img.naturalHeight || img.height;
    const cx = Number.isFinite(cropX) ? cropX : 0.5;
    const cy = Number.isFinite(cropY) ? cropY : 0.5;
    const q = TUTOR_PROFILE_PHOTO_SPEC.jpegQuality;
    const basic = cropResizeToCanvas(
      img,
      sw,
      sh,
      cx,
      cy,
      TUTOR_PROFILE_PHOTO_SPEC.basicSize,
      TUTOR_PROFILE_PHOTO_SPEC.basicSize,
    );
    const upload = cropResizeToCanvas(
      img,
      sw,
      sh,
      cx,
      cy,
      TUTOR_PROFILE_PHOTO_SPEC.uploadSize,
      TUTOR_PROFILE_PHOTO_SPEC.uploadSize,
    );
    const prime = cropResizeToCanvas(
      img,
      sw,
      sh,
      cx,
      cy,
      TUTOR_PROFILE_PHOTO_SPEC.primeWidth,
      TUTOR_PROFILE_PHOTO_SPEC.primeHeight,
    );
    const basicUrl = canvasToJpegDataUrl(basic, q);
    const uploadUrl = canvasToJpegDataUrl(upload, q);
    const primeUrl = canvasToJpegDataUrl(prime, q);
    return {
      name: file.name || 'profile.jpg',
      basic_720_path: basicUrl,
      prime_1280_path: primeUrl,
      upload_1200_path: uploadUrl,
      image_path: basicUrl,
      crop_x: cx,
      crop_y: cy,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function readProfileImageApiResult(res) {
  const text = await res.text();
  try {
    const data = JSON.parse(text);
    if (data && typeof data === 'object') return data;
  } catch {
    /* HTML ErrorDocument 등으로 JSON이 아닐 수 있음 */
  }
  return {
    ok: false,
    error: 'http',
    message: `업로드 실패 (HTTP ${res.status}). 서버 응답을 읽지 못했습니다. 잠시 후 다시 시도해 주세요.`,
  };
}

/**
 * @param {number} tutorId
 * @param {File} file
 * @param {{ cropX: number, cropY: number }} crop
 */
export async function uploadTutorProfilePhotoApi(tutorId, file, crop) {
  const fd = new FormData();
  fd.append('action', 'upload');
  fd.append('tutor_id', String(tutorId));
  fd.append('file', file, file.name || 'profile.jpg');
  fd.append('crop_x', String(crop.cropX));
  fd.append('crop_y', String(crop.cropY));
  const res = await fetch('/api/tutor/profile-image.php', {
    method: 'POST',
    credentials: 'include',
    body: fd,
  });
  const data = await readProfileImageApiResult(res);
  // 닷홈은 오류도 HTTP 200 + ok:false 로 올 수 있음
  if (!data.ok) {
    throw new Error(data.message || '프로필 사진 업로드에 실패했습니다.');
  }
  return data.image;
}

/** dataURL → File (서버가 원본 수신 실패할 때 JPEG 파생본 재시도용) */
export async function dataUrlToJpegFile(dataUrl, name) {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
}

/**
 * 가입·tutor-ui 기본정보 화면용 — 고른 사진 1장을 확인해 업로드 준비본을 만든다. 자르기 위치는 가운데.
 * @param {File} file
 * @returns {Promise<{ file: File, previewSrc: string, crop: { cropX: number, cropY: number } }>}
 */
export async function prepareTutorProfilePhoto(file) {
  const err = await validateTutorProfilePhoto(file);
  if (err) throw new Error(err);
  const sized = await ensureTutorProfilePhotoMinSize(file);
  const local = await processTutorProfilePhoto(sized, 0.5, 0.5);
  const uploadFile = await dataUrlToJpegFile(local.upload_1200_path || local.basic_720_path, local.name || 'profile.jpg');
  return { file: uploadFile, previewSrc: local.basic_720_path, crop: { cropX: 0.5, cropY: 0.5 } };
}
