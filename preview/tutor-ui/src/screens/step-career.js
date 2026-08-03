/** 학력 단계는 수업·학력 화면에 합쳐졌습니다. */
import { navigate } from '../layout.js';

export function renderCareer() {
  navigate('/register/lesson');
  return '';
}

export function bindCareerEvents() {}
