/**
 * 쪽지 첨부 — 상세정보1 홍보사진(jpg/jpeg/png/webp) ∪ 제출·증빙(pdf)
 * 용량: 상담 채널 한도 파일당 5MB · 메시지당 3개
 */

export const MESSAGE_ATTACHMENT = {
  maxBytes: 5 * 1024 * 1024,
  maxFiles: 3,
  accept: '.pdf,.jpg,.jpeg,.png,.webp',
  allowedExt: ['pdf', 'jpg', 'jpeg', 'png', 'webp'],
  hint: 'PDF·JPG·PNG·WebP · 파일당 5MB · 최대 3개 (선택)',
  label: '증빙 서류 첨부',
};

/** @param {number} bytes */
export function formatFileBytes(bytes) {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)}KB`;
  return `${(n / (1024 * 1024)).toFixed(1)}MB`;
}

/**
 * @param {FileList|File[]|null|undefined} fileList
 * @returns {string|null}
 */
export function validateMessageFiles(fileList) {
  const files = Array.from(fileList || []);
  if (files.length > MESSAGE_ATTACHMENT.maxFiles) {
    return `파일은 최대 ${MESSAGE_ATTACHMENT.maxFiles}개까지 첨부할 수 있습니다.`;
  }
  for (const file of files) {
    if (file.size > MESSAGE_ATTACHMENT.maxBytes) {
      return `${file.name}이(가) 5MB를 넘습니다.`;
    }
    const ext = String(file.name.split('.').pop() || '').toLowerCase();
    if (!MESSAGE_ATTACHMENT.allowedExt.includes(ext)) {
      return 'PDF, JPG, PNG, WebP만 첨부할 수 있습니다.';
    }
  }
  return null;
}

export function attachmentDownloadUrl(id) {
  return `/api/messages/attachments.php?id=${Number(id)}`;
}
