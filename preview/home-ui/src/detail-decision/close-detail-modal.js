import { refreshBackToTop } from '../../../shared/back-to-top.js';

const MODAL_ID = 'p24-detail-modal';

/** 해시 전환에서 상세를 닫는다. 지도 SDK 모듈은 여기서 불러오지 않는다. */
export function closeDetailModal() {
  const modal = document.getElementById(MODAL_ID);
  modal?.querySelectorAll('[data-naver-map-mount]').forEach((mount) => {
    /** @type {{ destroy?: () => void }|undefined} */ (mount)._mapController?.destroy?.();
  });
  modal?.remove();
  document.body.style.overflow = '';
  document.body.classList.remove('p24-detail-open', 'p24-detail-open--floating');
  refreshBackToTop();
}
