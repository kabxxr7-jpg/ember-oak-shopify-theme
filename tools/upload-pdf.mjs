// Uploads the brew-guide PDF to Shopify Files (GenericFile) and prints its CDN URL.
import { readFileSync, statSync } from 'node:fs';
import { gql } from './gql.mjs';
const name = 'ember-oak-home-brew-guide.pdf';
const path = new URL('../media/out/' + name, import.meta.url).pathname;
const t = gql(`mutation($i: [StagedUploadInput!]!) { stagedUploadsCreate(input: $i) { stagedTargets { url resourceUrl parameters { name value } } userErrors { field message } } }`,
  { i: [{ filename: name, mimeType: 'application/pdf', resource: 'FILE', httpMethod: 'POST', fileSize: String(statSync(path).size) }] }).stagedUploadsCreate.stagedTargets[0];
const form = new FormData();
for (const p of t.parameters) form.append(p.name, p.value);
form.append('file', new Blob([readFileSync(path)], { type: 'application/pdf' }), name);
const r = await fetch(t.url, { method: 'POST', body: form });
if (!r.ok) throw new Error('upload failed ' + r.status);
const f = gql(`mutation($f: [FileCreateInput!]!) { fileCreate(files: $f) { files { id } userErrors { field message } } }`,
  { f: [{ originalSource: t.resourceUrl, contentType: 'FILE', filename: name }] }).fileCreate.files[0];
for (let i = 0; i < 10; i++) {
  const n = gql(`query($id: ID!) { node(id: $id) { ... on GenericFile { url fileStatus } } }`, { id: f.id }).node;
  if (n.url) { console.log(n.url); break; }
  await new Promise((r) => setTimeout(r, 1500));
}
