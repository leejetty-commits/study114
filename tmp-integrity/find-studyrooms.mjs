import { createRequire } from 'node:module';
const require = createRequire('file:///d:/work/study114/package.json');
import https from 'node:https';

function checkId(id) {
  return new Promise((resolve) => {
    https.get(`https://study114.net/api/study-room/public.php?id=${id}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ id, status: res.statusCode, ok: json.ok, data: json });
        } catch (e) {
          resolve({ id, status: res.statusCode, error: 'parse_error', raw: data });
        }
      });
    }).on('error', (err) => {
      resolve({ id, error: err.message });
    });
  });
}

async function run() {
  console.log('Testing IDs 1..150 ...');
  const results = [];
  for (let id = 1; id <= 150; id++) {
    const res = await checkId(id);
    if (res.status === 200 && res.ok) {
      console.log(`Found published study room ID: ${id}, Name: ${res.data?.item?.room_name || res.data?.item?.name}`);
      results.push({ id, item: res.data.item });
    }
  }
  console.log(`Found total ${results.length} published study rooms.`);
}

run();
