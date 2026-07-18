/**
 * 알림·문자 Lab (영카트 menu900 SMS 관리 벤치마크)
 *
 * 1차: UI·데이터 포맷·미리보기만. 실 SMS 게이트웨이(알리고/아이코드 등)는 후속.
 * 화면에는 이정표 코드를 표시하지 않음.
 */

const SMS_KEY = 'study114-admin-sms-lab-v2';

/** @typedef {'sms'|'lms'|'email'} NotifyChannel */

function nowStamp() {
  return new Date().toISOString().replace('T', ' ').slice(0, 16);
}

function smsSeed() {
  return {
    /** SMS 기본설정 (영카트 900100) */
    settings: {
      smsEnabled: false,
      emailEnabled: true,
      /** 게이트웨이 자리 — 실키는 넣지 않음 */
      gateway: 'none',
      gatewayNote: '실연동 전 · none / aligo / icode 예정',
      senderName: '우동공과',
      senderPhone: '02-0000-0000',
      quietHoursStart: '21:00',
      quietHoursEnd: '08:00',
      /** 이벤트별 자동 알림 on/off */
      events: {
        onReport: true,
        onTicket: true,
        onNewProvider: false,
        onPaidExpire: true,
        onIncompletePay: false,
      },
    },
    /** 템플릿 그룹 (영카트 이모티콘 그룹) */
    templateGroups: [
      { id: 'grp-ops', label: '운영 알림' },
      { id: 'grp-pay', label: '결제·만료' },
      { id: 'grp-mkt', label: '안내·공지' },
    ],
    /** 템플릿 (영카트 이모티콘 관리) */
    templates: [
      {
        id: 'tpl-report',
        groupId: 'grp-ops',
        title: '새 신고 접수',
        channel: 'sms',
        body: '[우동공과] 새 신고가 접수되었습니다. 관리자에서 확인해 주세요.',
      },
      {
        id: 'tpl-ticket',
        groupId: 'grp-ops',
        title: '새 문의',
        channel: 'sms',
        body: '[우동공과] 새 문의가 도착했습니다. 고객센터에서 확인해 주세요.',
      },
      {
        id: 'tpl-expire',
        groupId: 'grp-pay',
        title: '유료 만료 안내',
        channel: 'lms',
        body: '[우동공과] 이용 중인 상품이 {days}일 후 만료됩니다. 마이페이지에서 연장할 수 있습니다.',
      },
      {
        id: 'tpl-welcome',
        groupId: 'grp-mkt',
        title: '가입 환영',
        channel: 'sms',
        body: '[우동공과] 가입을 환영합니다. 우리 동네 공부방·과외를 안전하게 이용해 주세요.',
      },
    ],
    /** 수신 그룹 (영카트 휴대폰번호 그룹) */
    phoneGroups: [
      { id: 'pg-ops', label: '운영자' },
      { id: 'pg-test', label: '테스트' },
    ],
    /** 수신 번호 (영카트 휴대폰번호 관리) */
    phones: [
      { id: 'ph-1', groupId: 'pg-ops', name: '마스터', phone: '010-1111-0001', memo: '운영' },
      { id: 'ph-2', groupId: 'pg-test', name: '학부모 샘플', phone: '010-2222-0002', memo: '더미' },
      { id: 'ph-3', groupId: 'pg-test', name: '공부방 샘플', phone: '010-3333-0003', memo: '더미' },
    ],
    /**
     * 전송 내역 (영카트 전송내역-건별)
     * status: preview | queued | sent | failed  (1차는 주로 preview)
     */
    logs: [
      {
        id: 'SMS-1001',
        to: '010-****-1234',
        toName: '운영자',
        templateId: 'tpl-report',
        templateTitle: '새 신고 접수',
        channel: 'sms',
        status: 'preview',
        body: '[우동공과] 새 신고가 접수되었습니다. 관리자에서 확인해 주세요.',
        byteLen: 0,
        at: '2026-07-17 14:22',
      },
    ],
    /** 회원 휴대폰 동기화 메모 (영카트 회원정보업데이트) */
    lastMemberSyncAt: '',
    syncedMemberPhones: 0,
  };
}

function ensure() {
  try {
    const raw = sessionStorage.getItem(SMS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // 구 스키마 마이그레이션
      if (parsed && !parsed.settings && parsed.channelSms != null) {
        const migrated = smsSeed();
        migrated.settings.smsEnabled = Boolean(parsed.channelSms);
        migrated.settings.emailEnabled = Boolean(parsed.channelEmail);
        migrated.settings.senderName = parsed.senderName || migrated.settings.senderName;
        if (Array.isArray(parsed.templates)) {
          migrated.templates = parsed.templates.map((t) => ({
            ...t,
            groupId: t.groupId || 'grp-ops',
            channel: t.channel || 'sms',
          }));
        }
        if (Array.isArray(parsed.logs)) migrated.logs = parsed.logs;
        save(migrated);
        return migrated;
      }
      return parsed;
    }
  } catch {
    /* ignore */
  }
  const next = smsSeed();
  save(next);
  return next;
}

function save(data) {
  try {
    sessionStorage.setItem(SMS_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

/** 한글 포함 시 대략 2바이트로 보는 간단 길이 (실 SMS 규격은 게이트웨이 문서 따름) */
export function estimateSmsBytes(text) {
  const s = String(text || '');
  let n = 0;
  for (const ch of s) {
    n += ch.charCodeAt(0) > 127 ? 2 : 1;
  }
  return n;
}

/** @returns {'sms'|'lms'} */
export function suggestChannelByBody(text) {
  return estimateSmsBytes(text) > 90 ? 'lms' : 'sms';
}

export function getSmsLab() {
  return ensure();
}

export function saveSmsSettings(patch) {
  const data = ensure();
  data.settings = {
    ...data.settings,
    ...patch,
    events: { ...data.settings.events, ...(patch.events || {}) },
  };
  save(data);
  return data;
}

export function listTemplateGroups() {
  return ensure().templateGroups;
}

export function saveTemplateGroup(input) {
  const data = ensure();
  const id = String(input.id || `grp-${Date.now()}`);
  const row = { id, label: String(input.label || '').trim() || id };
  const idx = data.templateGroups.findIndex((g) => g.id === id);
  if (idx >= 0) data.templateGroups[idx] = row;
  else data.templateGroups.push(row);
  save(data);
  return data;
}

export function deleteTemplateGroup(id) {
  const data = ensure();
  if (data.templates.some((t) => t.groupId === id)) {
    throw new Error('이 그룹에 템플릿이 있어 삭제할 수 없습니다. 템플릿을 먼저 옮기거나 지우세요.');
  }
  data.templateGroups = data.templateGroups.filter((g) => g.id !== id);
  save(data);
  return data;
}

export function listTemplates(groupId) {
  const rows = ensure().templates;
  if (!groupId || groupId === 'all') return rows;
  return rows.filter((t) => t.groupId === groupId);
}

export function saveTemplate(input) {
  const data = ensure();
  const id = String(input.id || `tpl-${Date.now()}`);
  const body = String(input.body || '').trim();
  const row = {
    id,
    groupId: String(input.groupId || 'grp-ops'),
    title: String(input.title || '').trim(),
    channel: input.channel || suggestChannelByBody(body),
    body,
  };
  const idx = data.templates.findIndex((t) => t.id === id);
  if (idx >= 0) data.templates[idx] = row;
  else data.templates.push(row);
  save(data);
  return data;
}

export function deleteTemplate(id) {
  const data = ensure();
  data.templates = data.templates.filter((t) => t.id !== id);
  save(data);
  return data;
}

export function listPhoneGroups() {
  return ensure().phoneGroups;
}

export function savePhoneGroup(input) {
  const data = ensure();
  const id = String(input.id || `pg-${Date.now()}`);
  const row = { id, label: String(input.label || '').trim() || id };
  const idx = data.phoneGroups.findIndex((g) => g.id === id);
  if (idx >= 0) data.phoneGroups[idx] = row;
  else data.phoneGroups.push(row);
  save(data);
  return data;
}

export function deletePhoneGroup(id) {
  const data = ensure();
  if (data.phones.some((p) => p.groupId === id)) {
    throw new Error('이 그룹에 번호가 있어 삭제할 수 없습니다.');
  }
  data.phoneGroups = data.phoneGroups.filter((g) => g.id !== id);
  save(data);
  return data;
}

export function listPhones(groupId) {
  const rows = ensure().phones;
  if (!groupId || groupId === 'all') return rows;
  return rows.filter((p) => p.groupId === groupId);
}

export function savePhone(input) {
  const data = ensure();
  const id = String(input.id || `ph-${Date.now()}`);
  const row = {
    id,
    groupId: String(input.groupId || 'pg-test'),
    name: String(input.name || '').trim(),
    phone: String(input.phone || '').trim(),
    memo: String(input.memo || '').trim(),
  };
  const idx = data.phones.findIndex((p) => p.id === id);
  if (idx >= 0) data.phones[idx] = row;
  else data.phones.push(row);
  save(data);
  return data;
}

export function deletePhone(id) {
  const data = ensure();
  data.phones = data.phones.filter((p) => p.id !== id);
  save(data);
  return data;
}

/**
 * 회원 목록에서 휴대폰을 주소록(테스트 그룹)으로 동기화 — Lab
 * @param {Array<{ name?: string, phone?: string, email?: string }>} members
 */
export function syncPhonesFromMembers(members) {
  const data = ensure();
  let added = 0;
  for (const m of members || []) {
    const phone = String(m.phone || '').trim();
    if (!phone || phone === '—') continue;
    if (data.phones.some((p) => p.phone === phone)) continue;
    data.phones.push({
      id: `ph-sync-${Date.now()}-${added}`,
      groupId: 'pg-test',
      name: String(m.name || m.email || '회원'),
      phone,
      memo: '회원동기화',
    });
    added += 1;
  }
  data.syncedMemberPhones = added;
  data.lastMemberSyncAt = nowStamp();
  save(data);
  return data;
}

/**
 * 미리보기 발송 (실발송 없음)
 * @param {{ to: string, toName?: string, templateId?: string, body?: string, channel?: string }} input
 */
export function previewSend(input) {
  const data = ensure();
  const tpl = data.templates.find((t) => t.id === input.templateId);
  const body = String(input.body || tpl?.body || '').trim();
  const channel = input.channel || tpl?.channel || suggestChannelByBody(body);
  const row = {
    id: `SMS-${Date.now()}`,
    to: String(input.to || '').trim() || '(번호 없음)',
    toName: String(input.toName || ''),
    templateId: tpl?.id || '',
    templateTitle: tpl?.title || '직접 입력',
    channel,
    status: 'preview',
    body,
    byteLen: estimateSmsBytes(body),
    at: nowStamp(),
  };
  data.logs.unshift(row);
  data.logs = data.logs.slice(0, 100);
  save(data);
  return { data, row };
}

/** 건별 내역 */
export function listSendLogs() {
  return ensure().logs;
}

/** 번호별 집계 */
export function listSendLogsByPhone() {
  const map = new Map();
  for (const log of ensure().logs) {
    const key = log.to;
    if (!map.has(key)) {
      map.set(key, { phone: key, name: log.toName || '', count: 0, lastAt: log.at, lastStatus: log.status });
    }
    const row = map.get(key);
    row.count += 1;
    if (String(log.at) > String(row.lastAt)) {
      row.lastAt = log.at;
      row.lastStatus = log.status;
      row.name = log.toName || row.name;
    }
  }
  return [...map.values()].sort((a, b) => String(b.lastAt).localeCompare(String(a.lastAt)));
}

export function resetSmsLab() {
  sessionStorage.removeItem(SMS_KEY);
  sessionStorage.removeItem('study114-admin-notify-lab');
  return ensure();
}

/** @deprecated 호환 별칭 */
export const getNotifyLab = getSmsLab;
export const resetNotifyLab = resetSmsLab;
