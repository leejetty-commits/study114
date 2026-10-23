import https from 'node:https';

function checkId(id) {
  return new Promise((resolve) => {
    https.get(`https://study114.net/api/study-room/public.php?id=${id}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve(JSON.parse(data));
      });
    });
  });
}

async function run() {
  for (const id of [6, 7, 8]) {
    const res = await checkId(id);
    console.log(`=== STUDY ROOM ID ${id} ===`);
    console.log(JSON.stringify(res, null, 2));
  }
}

run();
