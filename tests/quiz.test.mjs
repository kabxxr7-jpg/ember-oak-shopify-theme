// Unit tests for the quiz scoring in theme/assets/eo-quiz.js, run against the real catalogue data.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { coffees } from '../tools/data/catalog.mjs';

const { scoreProducts } = createRequire(import.meta.url)('../theme/assets/eo-quiz.js');
const products = coffees.map((c, i) => ({
  id: i, title: c.title, available: true,
  attrs: { roast_level: c.roast, brew_methods: c.brew, flavor_profile: c.flavor, caffeine: c.caffeine },
}));
const ask = (brew, flavors, roast, caffeine) => [
  { key: 'brew_methods', values: [brew], weight: 4, filter: false },
  { key: 'flavor_profile', values: flavors, weight: 3, filter: false },
  { key: 'roast_level', values: [roast], weight: 2, filter: false },
  { key: 'caffeine', values: [caffeine], weight: 1, filter: true },
];

test('fruity light pour-over drinker gets Morning Ember at 100%', () => {
  const [best] = scoreProducts(products, ask('pour-over', ['fruity', 'floral'], 'light', 'regular'));
  assert.match(best.title, /Morning Ember/);
  assert.equal(best.score, 100);
  assert.ok(best.reasons.includes('Brews well as pour over'));
});

test('espresso + smoky + dark gets Midnight Hearth', () => {
  const [best] = scoreProducts(products, ask('espresso', ['smoky'], 'dark', 'regular'));
  assert.match(best.title, /Midnight Hearth/);
});

test('decaf is a hard filter: only decaf coffees come back', () => {
  const ranked = scoreProducts(products, ask('drip', ['chocolatey'], 'medium', 'decaf'));
  assert.equal(ranked.length, 1);
  assert.match(ranked[0].title, /Highland Decaf/);
});

test('"any" answers are ignored, not counted against products', () => {
  const ranked = scoreProducts(products, ask('cold-brew', ['chocolatey'], 'any', 'any'));
  assert.match(ranked[0].title, /Campfire/);
  assert.equal(ranked[0].score, 100);
  assert.equal(ranked.length, products.length);
});

test('a roast one step away earns half the roast weight', () => {
  const golden = products.find((p) => /Golden/.test(p.title)); // medium-light
  const [only] = scoreProducts([golden], [{ key: 'roast_level', values: ['light'], weight: 2, filter: false }]);
  assert.equal(only.score, 50);
});

test('sold-out products are never recommended', () => {
  const list = products.map((p) => ({ ...p, available: !/Morning Ember/.test(p.title) }));
  const ranked = scoreProducts(list, ask('pour-over', ['fruity'], 'light', 'regular'));
  assert.ok(ranked.every((p) => !/Morning Ember/.test(p.title)));
});
