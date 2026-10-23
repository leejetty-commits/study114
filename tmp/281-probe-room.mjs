import { execSync } from 'node:child_process';

const API = 'http://127.0.0.1:8080';
const jar = new Map();
function store(res) {
  for (const l of res.headers.getSetCookie?.() || []) {
    const p = l.split(';')[0];
    const i = p.indexOf('=');
    if (i > 0) jar.set(p.slice(0, i), p.slice(i + 1));
  }
}
function cookie() {
  return [...jar].map(([k, v]) => `${k}=${v}`).join('; ');
}

const mail = `281_probe_${Date.now()}@test.local`;
let r = await fetch(`${API}/api/auth/signup.php`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: mail,
    password: 'TestPass123!',
    password_confirm: 'TestPass123!',
    name: 'p',
    gender: 'male',
    phone: '01012345678',
    address: '서울',
    address_zip: '06236',
    address_line2: '',
    role: 'study_room',
    sms_consent: false,
    email_consent: true,
  }),
});
store(r);
const s = await r.json();
console.log('signup', s);
execSync(
  `docker exec study114-mysql-dev mysql -uroot -pstudy114dev study114_dev -e "UPDATE users SET email_verified_at=NOW() WHERE id=${s.user_id}"`,
);
const regionId = 1;
r = await fetch(`${API}/api/auth/basic-register.php`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Cookie: cookie() },
  body: JSON.stringify({
    role: 'study_room',
    payload: {
      study_room_name: 'probe',
      region_id: regionId,
      main_subject_note: '수학',
      price_amount: 1,
      lesson_place_type: 'academy',
      lesson_operation_type: 'group_by_time_slot',
      capacity_per_time: 'one_to_four',
      primary_school_levels: ['middle'],
      gender: 'male',
      education_office_registered: false,
      slogan: 's',
      home_address: '서울',
      home_address_zip: '06236',
      address_text: '서울',
      region_basis_type: 'dong',
      saved_regions: [{ region_id: regionId, region_basis_type: 'dong' }],
    },
  }),
});
store(r);
console.log('basic', await r.json());
r = await fetch(`${API}/api/registrations/study-rooms.php`, {
  headers: { Cookie: cookie() },
});
const text = await r.text();
console.log('list', r.status, text.slice(0, 800));
execSync(
  `docker exec study114-mysql-dev mysql -uroot -pstudy114dev study114_dev -e "SELECT id,user_id,study_room_name FROM study_rooms WHERE user_id=${s.user_id}"`,
  { stdio: 'inherit' },
);
