/** 경력 단계는 수업·경력 화면에 합쳐졌습니다. */
import { navigate, withRoomId } from '../layout.js';

export function renderCareer() {
  navigate(withRoomId('/register/lesson'));
  return '';
}

export function bindCareerEvents() {}
