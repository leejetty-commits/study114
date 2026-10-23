import https from 'node:https';

https.get('https://study114.net/auth/signup/role', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('HEADERS:', res.headers);
    console.log('BODY:', data.slice(0, 500));
  });
});
