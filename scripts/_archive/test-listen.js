import http from 'http';

const s = http.createServer((req, res) => res.end('ok'));
s.listen(3000, '127.0.0.1', () => { console.log('LISTEN_OK'); s.close(); });
