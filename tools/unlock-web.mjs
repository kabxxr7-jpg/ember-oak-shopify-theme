// A one-page local form (http://127.0.0.1:4791) where you type the storefront password yourself.
// It posts it to the store's /password page once and saves only the session cookie to .storefront-cookie
// (git-ignored). The password is not stored or logged.
import { createServer } from 'node:http';
import { writeFileSync } from 'node:fs';
import { STORE } from './gql.mjs';

const page = (msg = '') => `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>Unlock store for screenshots</title>
<body style="font:16px system-ui;max-width:420px;margin:60px auto;padding:0 16px;color:#2B1B0E;background:#FBF7F0">
<h2>Unlock ${STORE}</h2><p>Type the storefront password. It is sent once to the store and not saved; only the session cookie is kept locally for screenshots and Lighthouse.</p>
<form method="post"><input name="password" type="password" autofocus required style="width:100%;padding:12px;font-size:16px;border:1px solid #999;border-radius:8px">
<button style="margin-top:12px;padding:12px 20px;font-size:16px;border:0;border-radius:99px;background:#B4482F;color:#fff">Unlock</button></form>
<p style="font-weight:600">${msg}</p></body>`;

const server = createServer(async (req, res) => {
  if (req.method !== 'POST') return res.end(page());
  let body = '';
  for await (const chunk of req) body += chunk;
  const password = new URLSearchParams(body).get('password') ?? '';
  const r = await fetch(`https://${STORE}/password`, {
    method: 'POST', redirect: 'manual',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ form_type: 'storefront_password', utf8: '✓', password }),
  });
  const cookies = r.headers.getSetCookie().map((c) => c.split(';')[0]);
  const loc = r.headers.get('location') || '';
  if (!(r.status >= 300 && r.status < 400 && !loc.includes('/password'))) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.end(page('That password did not work. Try again.'));
  }
  writeFileSync(new URL('../.storefront-cookie', import.meta.url), cookies.join('; '));
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(page('Unlocked ✓ You can go back to the chat.'));
  console.log('unlocked');
  setTimeout(() => process.exit(0), 500);
});
server.listen(4791, '127.0.0.1', () => console.log('open http://127.0.0.1:4791'));
