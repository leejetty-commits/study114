import https from 'node:https';
import fs from 'node:fs';

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        return resolve(`Failed ${res.statusCode}`);
      }
      const stream = fs.createWriteStream(dest);
      res.pipe(stream);
      stream.on('finish', () => {
        stream.close();
        resolve('OK');
      });
    }).on('error', reject);
  });
}

async function run() {
  await download('https://study114.net/uploads/promo/rooms/6/28c2536cd7c1afe8_prime_1280.webp', 'd:\\work\\study114\\.wt\\integrity\\tmp-integrity\\room6_img.webp');
  await download('https://study114.net/uploads/promo/rooms/7/ed0214b5c930c904_prime_1280.webp', 'd:\\work\\study114\\.wt\\integrity\\tmp-integrity\\room7_img.webp');
  console.log('Downloaded images.');
}

run();
