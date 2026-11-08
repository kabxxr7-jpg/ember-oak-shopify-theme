// Seeds the development store through the Admin GraphQL API (via `shopify store execute`).
// Idempotent: definitions that exist are skipped, products are upserted by handle, images are uploaded once.
// Run: node tools/seed.mjs
import { readFileSync, statSync } from 'node:fs';
import { gql } from './gql.mjs';
import { coffees, gear, guide } from './data/catalog.mjs';
import { locations } from './data/locations.mjs';

const IMG = new URL('../media/out/', import.meta.url).pathname;
const log = (...a) => console.log('•', ...a);

// ---------- 1. Product metafield definitions (they drive the quiz and the comparison table) ----------
const choices = (arr) => [{ name: 'choices', value: JSON.stringify(arr) }];
const BREWS = ['pour-over', 'drip', 'french-press', 'espresso', 'cold-brew'];
const FLAVORS = ['fruity', 'floral', 'chocolatey', 'nutty', 'smoky'];
const productDefs = [
  { key: 'roast_level', name: 'Roast level', type: 'single_line_text_field', validations: choices(['light', 'medium-light', 'medium', 'dark']) },
  { key: 'brew_methods', name: 'Brew methods', type: 'list.single_line_text_field', validations: choices(BREWS) },
  { key: 'flavor_profile', name: 'Flavor profile', type: 'list.single_line_text_field', validations: choices(FLAVORS) },
  { key: 'caffeine', name: 'Caffeine', type: 'single_line_text_field', validations: choices(['regular', 'decaf']) },
  { key: 'tasting_notes', name: 'Tasting notes', type: 'single_line_text_field' },
  { key: 'origin', name: 'Origin', type: 'single_line_text_field' },
];

const existingDefs = gql(`query { metafieldDefinitions(first: 50, ownerType: PRODUCT, namespace: "custom") { nodes { key } } }`)
  .metafieldDefinitions.nodes.map((n) => n.key);
for (const d of productDefs) {
  if (existingDefs.includes(d.key)) continue;
  gql(`mutation($d: MetafieldDefinitionInput!) { metafieldDefinitionCreate(definition: $d) { createdDefinition { id } userErrors { field message } } }`,
    { d: { ...d, namespace: 'custom', ownerType: 'PRODUCT', pin: true, access: { storefront: 'PUBLIC_READ' } } });
  log('metafield definition', d.key);
}

// ---------- 2. Store location metaobject (store locator data, editable in Admin > Content > Metaobjects) ----------
const hasLocDef = gql(`query { metaobjectDefinitionByType(type: "store_location") { id } }`).metaobjectDefinitionByType;
if (!hasLocDef) {
  gql(`mutation($d: MetaobjectDefinitionCreateInput!) { metaobjectDefinitionCreate(definition: $d) { metaobjectDefinition { id } userErrors { field message } } }`, {
    d: {
      type: 'store_location', name: 'Store location', displayNameKey: 'name',
      access: { storefront: 'PUBLIC_READ' },
      fieldDefinitions: [
        { key: 'name', name: 'Name', type: 'single_line_text_field', required: true },
        { key: 'kind', name: 'Kind', type: 'single_line_text_field', validations: choices(['cafe', 'grocer']) },
        { key: 'address', name: 'Street address', type: 'single_line_text_field', required: true },
        { key: 'city', name: 'City', type: 'single_line_text_field', required: true },
        { key: 'state', name: 'State', type: 'single_line_text_field' },
        { key: 'zip', name: 'ZIP code', type: 'single_line_text_field' },
        { key: 'latitude', name: 'Latitude', type: 'number_decimal', required: true },
        { key: 'longitude', name: 'Longitude', type: 'number_decimal', required: true },
        { key: 'hours', name: 'Opening hours', type: 'single_line_text_field' },
      ],
    },
  });
  log('metaobject definition store_location');
}
for (const l of locations) {
  const handle = l.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  gql(`mutation($h: MetaobjectHandleInput!, $m: MetaobjectUpsertInput!) { metaobjectUpsert(handle: $h, metaobject: $m) { metaobject { id } userErrors { field message } } }`, {
    h: { type: 'store_location', handle },
    m: { fields: [
      { key: 'name', value: l.name }, { key: 'kind', value: l.type }, { key: 'address', value: l.address },
      { key: 'city', value: l.city }, { key: 'state', value: l.state }, { key: 'zip', value: l.zip },
      { key: 'latitude', value: String(l.lat) }, { key: 'longitude', value: String(l.lng) }, { key: 'hours', value: l.hours },
    ] },
  });
}
log(`${locations.length} store locations upserted`);

// ---------- 3. Products ----------
async function upload(file) {
  const path = IMG + file;
  const { stagedUploadsCreate } = gql(`mutation($i: [StagedUploadInput!]!) { stagedUploadsCreate(input: $i) { stagedTargets { url resourceUrl parameters { name value } } userErrors { field message } } }`,
    { i: [{ filename: file, mimeType: 'image/jpeg', resource: 'IMAGE', httpMethod: 'POST', fileSize: String(statSync(path).size) }] });
  const t = stagedUploadsCreate.stagedTargets[0];
  const form = new FormData();
  for (const p of t.parameters) form.append(p.name, p.value);
  form.append('file', new Blob([readFileSync(path)], { type: 'image/jpeg' }), file);
  const r = await fetch(t.url, { method: 'POST', body: form });
  if (!r.ok) throw new Error(`upload ${file}: ${r.status} ${await r.text()}`);
  return t.resourceUrl;
}

const uploaded = new Map();
async function files(names, alt) {
  const out = [];
  for (const n of names) {
    if (!uploaded.has(n)) uploaded.set(n, await upload(n));
    out.push({ originalSource: uploaded.get(n), contentType: 'IMAGE', alt });
  }
  return out;
}

const GRINDS = ['Whole bean', 'Ground for filter', 'Ground for espresso'];
const ONLINE_STORE = gql(`query { publications(first: 10) { nodes { id name } } }`).publications.nodes.find((p) => p.name === 'Online Store').id;

async function upsertProduct(p, { type, tags, options, variants, metafields }) {
  const existing = gql(`query($h: String!) { productByIdentifier(identifier: { handle: $h }) { id media(first: 1) { nodes { id } } } }`, { h: p.handle }).productByIdentifier;
  const input = {
    handle: p.handle, title: p.title, descriptionHtml: `<p>${p.body}</p>`, vendor: 'Ember & Oak Coffee Co.',
    productType: type, status: 'ACTIVE', tags, productOptions: options, variants, metafields,
  };
  if (!existing?.media.nodes.length) input.files = await files(p.images, p.title);
  const res = gql(`mutation($i: ProductSetInput!, $id: ProductSetIdentifiers) { productSet(input: $i, identifier: $id, synchronous: true) { product { id handle } userErrors { field message code } } }`,
    { i: input, id: existing ? { handle: p.handle } : undefined });
  const id = res.productSet.product.id;
  gql(`mutation($id: ID!, $p: ID!) { publishablePublish(id: $id, input: [{ publicationId: $p }]) { userErrors { field message } } }`, { id, p: ONLINE_STORE });
  log('product', p.handle);
  return id;
}

const single = [{ name: 'Title', values: [{ name: 'Default Title' }] }];
const singleVariant = (price, extra = {}) => [{ optionValues: [{ optionName: 'Title', name: 'Default Title' }], price, inventoryPolicy: 'CONTINUE', ...extra }];

for (const c of coffees) {
  await upsertProduct(c, {
    type: 'Coffee',
    tags: ['coffee', `roast:${c.roast}`, ...c.brew.map((b) => `brew:${b}`), c.caffeine === 'decaf' ? 'decaf' : 'caffeinated'],
    options: [{ name: 'Grind', values: GRINDS.map((name) => ({ name })) }],
    variants: GRINDS.map((g) => ({ optionValues: [{ optionName: 'Grind', name: g }], price: c.price, inventoryPolicy: 'CONTINUE' })),
    metafields: [
      { namespace: 'custom', key: 'roast_level', type: 'single_line_text_field', value: c.roast },
      { namespace: 'custom', key: 'brew_methods', type: 'list.single_line_text_field', value: JSON.stringify(c.brew) },
      { namespace: 'custom', key: 'flavor_profile', type: 'list.single_line_text_field', value: JSON.stringify(c.flavor) },
      { namespace: 'custom', key: 'caffeine', type: 'single_line_text_field', value: c.caffeine },
      { namespace: 'custom', key: 'tasting_notes', type: 'single_line_text_field', value: c.notes },
      { namespace: 'custom', key: 'origin', type: 'single_line_text_field', value: c.origin },
    ],
  });
}
for (const g of gear) {
  await upsertProduct(g, { type: g.type, tags: ['gear'], options: single, variants: singleVariant(g.price), metafields: [] });
}
await upsertProduct(guide, {
  type: guide.type, tags: ['digital'], options: single,
  variants: singleVariant(guide.price, { inventoryItem: { requiresShipping: false, tracked: false }, taxable: false }),
  metafields: [],
});

// ---------- 4. Collections (smart, by product type) ----------
const collections = [
  { handle: 'coffee', title: 'Coffee', rule: 'Coffee', body: 'Six coffees, roasted to order every Tuesday and Friday.' },
  { handle: 'brew-gear', title: 'Brew gear', rule: 'Brew gear', body: 'The small set of tools we actually use at home.' },
];
for (const c of collections) {
  const ex = gql(`query($h: String!) { collectionByIdentifier(identifier: { handle: $h }) { id } }`, { h: c.handle }).collectionByIdentifier;
  let id = ex?.id;
  if (!id) {
    id = gql(`mutation($i: CollectionInput!) { collectionCreate(input: $i) { collection { id } userErrors { field message } } }`, {
      i: { handle: c.handle, title: c.title, descriptionHtml: `<p>${c.body}</p>`, ruleSet: { appliedDisjunctively: false, rules: [{ column: 'TYPE', relation: 'EQUALS', condition: c.rule }] } },
    }).collectionCreate.collection.id;
  }
  gql(`mutation($id: ID!, $p: ID!) { publishablePublish(id: $id, input: [{ publicationId: $p }]) { userErrors { field message } } }`, { id, p: ONLINE_STORE });
  log('collection', c.handle);
}
console.log('seed complete');
