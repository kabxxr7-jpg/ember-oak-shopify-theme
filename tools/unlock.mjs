// Asks YOU for the storefront password (typed here, hidden, never stored), posts it to the store's password page
// once, and saves only the resulting session cookie to .storefront-cookie (git-ignored) so the screenshot and
// Lighthouse scripts can load the password-protected development store.
import { writeFileSync } from 'node:fs';
import { STORE } from './gql.mjs';

function askHidden(q) {
  return new Promise((resolve) => {
    process.stdout.write(q);
    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    let s = '';
    stdin.on('data', function on(ch) {
      ch = ch.toString();
      if (ch === '\r' || ch === '\n') {
        stdin.setRawMode(false); stdin.pause(); stdin.removeListener('data', on);
        process.stdout.write('\n'); resolve(s);
      } else if (ch === '\u0003') process.exit(1);
      else if (ch === '\u007f') s = s.slice(0, -1);
      else s += ch;
    });
  });
}

const password = await askHidden(`Storefront password for ${STORE}: `);
const res = await fetch(`https://${STORE}/password`, {
  method: 'POST',
  redirect: 'manual',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ form_type: 'storefront_password', utf8: '✓', password }),
});
const cookies = res.headers.getSetCookie().map((c) => c.split(';')[0]);
const digest = cookies.find((c) => c.startsWith('storefront_digest='));
if (!digest) {
  console.error(`No storefront session came back (HTTP ${res.status}). Wrong password?`);
  process.exit(1);
}
writeFileSync(new URL('../.storefront-cookie', import.meta.url), cookies.join('; '));
console.log('Unlocked. Session cookie saved to .storefront-cookie (not committed). You can close this tab.');
