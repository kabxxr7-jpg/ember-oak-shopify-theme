// Tiny wrapper around `shopify store execute` (Shopify CLI 5): the CLI holds the store auth,
// so no Admin API token ever lives in this repo.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const STORE = process.env.SHOPIFY_STORE ?? 'ember-and-oak-coffee-tpmi70xy.myshopify.com';

export function gql(query, variables = {}, { mutation = /^\s*mutation/.test(query) } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'gql-'));
  try {
    writeFileSync(join(dir, 'q.graphql'), query);
    writeFileSync(join(dir, 'v.json'), JSON.stringify(variables));
    const args = ['store', 'execute', '-s', STORE, '--query-file', join(dir, 'q.graphql'), '--variable-file', join(dir, 'v.json'),
      '--output-file', join(dir, 'out.json'), '--no-input', '--no-color'];
    if (mutation) args.push('--allow-mutations');
    execFileSync('shopify', args, { stdio: ['ignore', 'ignore', 'pipe'] });
    const res = JSON.parse(readFileSync(join(dir, 'out.json'), 'utf8'));
    if (res.errors) throw new Error(JSON.stringify(res.errors, null, 2));
    const data = res.data ?? res;
    // Surface userErrors from any top-level mutation payload.
    for (const [k, v] of Object.entries(data)) {
      if (v && Array.isArray(v.userErrors) && v.userErrors.length) {
        const e = new Error(`${k}: ${JSON.stringify(v.userErrors)}`);
        e.userErrors = v.userErrors;
        e.data = data;
        throw e;
      }
    }
    return data;
  } catch (e) {
    if (e.stderr) e.message += '\n' + e.stderr.toString();
    throw e;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
