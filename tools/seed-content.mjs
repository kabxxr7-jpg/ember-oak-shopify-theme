// Section images (Files), pages and the main menu. Idempotent. Run after seed.mjs: node tools/seed-content.mjs
import { readFileSync, statSync } from 'node:fs';
import { gql } from './gql.mjs';

const IMG = new URL('../media/out/', import.meta.url).pathname;
const log = (...a) => console.log('•', ...a);

// ---------- 1. Files used by theme sections (referenced as shopify://shop_images/<name>) ----------
const themeImages = [
  ['hero.jpg', 'Barista pouring a pour-over coffee at a café bar'],
  ['lookbook-pourover.jpg', 'Pour-over coffee setup with kettle, dripper and mugs'],
  ['lookbook-flatlay.jpg', 'Coffee beans, ground coffee and a latte on a wooden board'],
  ['cafe.jpg', 'Customers inside a busy café'],
  ['cafe-2.jpg', 'A bright modern café interior'],
  ['roaster.jpg', 'Freshly roasted beans pouring from a drum roaster'],
  ['roast-drum.jpg', 'Coffee beans turning in the roaster cooling tray'],
  ['ember-oak-logo.png', 'Ember & Oak Coffee Co.'],
];

const have = new Set(
  gql(`query { files(first: 100, query: "media_type:IMAGE") { nodes { ... on MediaImage { image { url } } } } }`)
    .files.nodes.map((n) => n.image?.url?.split('/').pop().split('?')[0])
    .filter(Boolean)
);

for (const [name, alt] of themeImages) {
  if (have.has(name)) continue;
  const path = IMG + name;
  const mime = name.endsWith('.png') ? 'image/png' : 'image/jpeg';
  const t = gql(`mutation($i: [StagedUploadInput!]!) { stagedUploadsCreate(input: $i) { stagedTargets { url resourceUrl parameters { name value } } userErrors { field message } } }`,
    { i: [{ filename: name, mimeType: mime, resource: 'FILE', httpMethod: 'POST', fileSize: String(statSync(path).size) }] }).stagedUploadsCreate.stagedTargets[0];
  const form = new FormData();
  for (const p of t.parameters) form.append(p.name, p.value);
  form.append('file', new Blob([readFileSync(path)], { type: mime }), name);
  const r = await fetch(t.url, { method: 'POST', body: form });
  if (!r.ok) throw new Error(`upload ${name}: ${r.status}`);
  gql(`mutation($f: [FileCreateInput!]!) { fileCreate(files: $f) { files { id } userErrors { field message } } }`,
    { f: [{ originalSource: t.resourceUrl, contentType: 'IMAGE', alt, filename: name, duplicateResolutionMode: 'REPLACE' }] });
  log('file', name);
}

// ---------- 2. Pages ----------
const pages = [
  { handle: 'find-your-coffee', title: 'Find your coffee', templateSuffix: 'quiz', body: '' },
  { handle: 'stockists', title: 'Stockists', templateSuffix: 'stockists', body: '' },
  {
    handle: 'about', title: 'About Ember & Oak', templateSuffix: '',
    body: '<p>Ember &amp; Oak is a small-batch roaster that roasts twice a week and ships the same day. This is a demonstration store built to show Shopify theme development: the brand, products, reviews and stockists are fictional, and checkout runs in test mode only.</p>',
  },
];
const pageIds = {};
for (const p of pages) {
  const found = gql(`query($q: String!) { pages(first: 1, query: $q) { nodes { id handle } } }`, { q: `handle:${p.handle}` }).pages.nodes[0];
  const page = { title: p.title, handle: p.handle, body: p.body, isPublished: true, templateSuffix: p.templateSuffix || null };
  if (found) {
    gql(`mutation($id: ID!, $p: PageUpdateInput!) { pageUpdate(id: $id, page: $p) { page { id } userErrors { field message } } }`, { id: found.id, p: page });
    pageIds[p.handle] = found.id;
  } else {
    pageIds[p.handle] = gql(`mutation($p: PageCreateInput!) { pageCreate(page: $p) { page { id } userErrors { field message } } }`, { p: page }).pageCreate.page.id;
  }
  log('page', p.handle);
}

// ---------- 3. Main menu ----------
const ids = gql(`query {
  coffee: collectionByIdentifier(identifier: { handle: "coffee" }) { id }
  gear: collectionByIdentifier(identifier: { handle: "brew-gear" }) { id }
  guide: productByIdentifier(identifier: { handle: "home-brew-guide-pdf" }) { id }
  menus(first: 10) { nodes { id handle title } }
}`);
const main = ids.menus.nodes.find((m) => m.handle === 'main-menu');
const items = [
  { title: 'Shop coffee', type: 'COLLECTION', resourceId: ids.coffee.id },
  { title: 'Find your coffee', type: 'PAGE', resourceId: pageIds['find-your-coffee'] },
  { title: 'Brew gear', type: 'COLLECTION', resourceId: ids.gear.id },
  { title: 'Brew guide (PDF)', type: 'PRODUCT', resourceId: ids.guide.id },
  { title: 'Stockists', type: 'PAGE', resourceId: pageIds.stockists },
  { title: 'About', type: 'PAGE', resourceId: pageIds.about },
];
gql(`mutation($id: ID!, $title: String!, $handle: String!, $items: [MenuItemUpdateInput!]!) { menuUpdate(id: $id, title: $title, handle: $handle, items: $items) { menu { id } userErrors { field message } } }`,
  { id: main.id, title: main.title, handle: main.handle, items });
log('main menu');
console.log('content seed complete');
