import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';

process.env.PLAYWRIGHT_BROWSERS_PATH = 'C:/Users/jetty/AppData/Local/ms-playwright';

const req = createRequire('file:///d:/work/study114/package.json');
let playwrightModule;
try {
  playwrightModule = req('playwright');
} catch (e) {
  playwrightModule = req('@playwright/test');
}
const { chromium } = playwrightModule;

const STATE_FILE = 'd:/work/study114/.wt/_integrity-auth/state-tutor.json';
const BASE_URL = 'https://study114.net';
const OUT_DIR = 'd:/work/study114/.wt/integrity-tutor/tmp-integrity/C4';
const SHOTS_DIR = path.join(OUT_DIR, 'screenshots');

// 1x1 PNG 생성
const dummyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');
fs.writeFileSync(path.join(OUT_DIR, 'test-sample.png'), dummyPng);

// 안전장치 패턴
const SAFETY_PATTERN = /pay|checkout|order|toss|purchase|subscribe|withdraw|password|email-change|logout|delete-account/i;
const blockedLogs = [];

export function setupSafetyRoute(page) {
  return page.route('**/*', (route) => {
    const url = route.request().url();
    const method = route.request().method();
    if (SAFETY_PATTERN.test(url)) {
      console.warn(`[SAFETY BLOCKED] ${method} ${url}`);
      blockedLogs.push({ method, url, time: new Date().toISOString() });
      return route.abort('blockedbyclient');
    }
    return route.continue();
  });
}

export { STATE_FILE, BASE_URL, OUT_DIR, SHOTS_DIR, blockedLogs, chromium };
