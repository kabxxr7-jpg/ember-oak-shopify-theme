// Unit tests for the store locator maths and the one-time ZIP geocode cache (theme/assets/eo-locator.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { locations } from '../tools/data/locations.mjs';

const store = new Map();
globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)) };
const { haversine, sortByDistance, geocodeZip } = createRequire(import.meta.url)('../theme/assets/eo-locator.js');

test('haversine: New York to Los Angeles is about 2,445 miles', () => {
  const d = haversine({ lat: 40.7128, lng: -74.006 }, { lat: 34.0522, lng: -118.2437 }, 'mi');
  assert.ok(Math.abs(d - 2445) < 15, `got ${d}`);
});

test('haversine: km and miles agree', () => {
  const a = { lat: 51.5, lng: -0.12 }, b = { lat: 48.85, lng: 2.35 };
  assert.ok(Math.abs(haversine(a, b, 'km') / haversine(a, b, 'mi') - 1.609) < 0.01);
});

test('ZIP 10001 (Manhattan) sorts New York stockists first', () => {
  const rows = sortByDistance(locations, { lat: 40.7484, lng: -73.9967 }, { limit: 3 });
  assert.deepEqual(rows.map((r) => r.city), ['New York', 'Brooklyn', 'Philadelphia']);
  assert.ok(rows[0].distance < 2);
});

test('ZIP 98101 (Seattle) puts Capitol Hill first and Portland second', () => {
  const rows = sortByDistance(locations, { lat: 47.6114, lng: -122.3305 }, { limit: 2 });
  assert.equal(rows[0].name, 'Capitol Hill Roasting Room');
  assert.equal(rows[1].city, 'Portland');
});

test('kind filter returns only grocers, still sorted', () => {
  const rows = sortByDistance(locations, { lat: 41.88, lng: -87.63 }, { kind: 'grocer' });
  assert.ok(rows.every((r) => r.kind === 'grocer'));
  for (let i = 1; i < rows.length; i++) assert.ok(rows[i].distance >= rows[i - 1].distance);
});

test('geocodeZip calls the API once per ZIP, then serves the cache', async () => {
  let calls = 0;
  const fake = async (url) => {
    calls++;
    assert.equal(url, 'https://api.zippopotam.us/us/78704');
    return { ok: true, status: 200, json: async () => ({ places: [{ latitude: '30.2422', longitude: '-97.7694', 'place name': 'Austin', 'state abbreviation': 'TX' }] }) };
  };
  const first = await geocodeZip('78704', fake);
  const second = await geocodeZip('78704', fake);
  assert.equal(calls, 1);
  assert.equal(first.place, 'Austin, TX');
  assert.equal(second.cached, true);
});

test('geocodeZip returns null for an unknown ZIP', async () => {
  const res = await geocodeZip('00000', async () => ({ ok: false, status: 404 }));
  assert.equal(res, null);
});
