const http = require('http');
const options = {
  hostname: 'localhost',
  port: 4003,
  path: '/assets/index-Ch-bVxwo.js',
  method: 'HEAD',
  headers: {
    Origin: 'https://formacar.onrender.com',
  },
};

const req = http.request(options, (res) => {
  console.log('STATUS', res.statusCode);
  console.log('HEADERS', res.headers);
});

req.on('error', (err) => {
  console.error('ERROR', err);
});
req.end();
