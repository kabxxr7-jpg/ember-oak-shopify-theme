// Builds the store's product and section images from the Unsplash source photos in media/src.
// Coffee packshots: one plain kraft-bag photo + an Ember & Oak label drawn here (SVG), one per product.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const SRC = new URL('../media/src/', import.meta.url).pathname;
const OUT = new URL('../media/out/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

export const coffees = [
  { handle: 'morning-ember', name: 'Morning Ember', origin: 'ETHIOPIA · YIRGACHEFFE', roast: 'LIGHT ROAST', color: '#E2A33B', ink: '#2B1B0E' },
  { handle: 'oak-and-honey-house-blend', name: 'Oak & Honey', origin: 'HOUSE BLEND', roast: 'MEDIUM ROAST', color: '#C8553D', ink: '#FFF7EC' },
  { handle: 'midnight-hearth-espresso', name: 'Midnight Hearth', origin: 'ESPRESSO BLEND', roast: 'DARK ROAST', color: '#1F2A2E', ink: '#F3E3C3' },
  { handle: 'highland-decaf', name: 'Highland Decaf', origin: 'COLOMBIA · SWISS WATER', roast: 'MEDIUM · DECAF', color: '#3E7C6B', ink: '#F4F1E8' },
  { handle: 'campfire-cold-brew-blend', name: 'Campfire', origin: 'COLD BREW BLEND', roast: 'MEDIUM-DARK', color: '#2D4E7E', ink: '#F4F1E8' },
  { handle: 'golden-hour-guatemala', name: 'Golden Hour', origin: 'GUATEMALA · HUEHUETENANGO', roast: 'MEDIUM-LIGHT', color: '#B9772A', ink: '#FFF7EC' },
];

const esc = (s) => s.replace(/&/g, '&amp;');

function label({ name, origin, roast, color, ink }, w, h) {
  const words = name.split(' ');
  const lines = name.length > 12 && words.length > 1 ? [words.slice(0, -1).join(' '), words.at(-1)] : [name];
  const nameSvg = lines
    .map((l, i) => `<text x="${w / 2}" y="${h * 0.44 + i * h * 0.12}" font-family="Georgia, serif" font-size="${h * 0.105}" font-style="italic" fill="${ink}" text-anchor="middle">${esc(l)}</text>`)
    .join('');
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <rect x="0" y="0" width="${w}" height="${h}" rx="6" fill="${color}"/>
  <rect x="${w * 0.05}" y="${h * 0.04}" width="${w * 0.9}" height="${h * 0.92}" rx="4" fill="none" stroke="${ink}" stroke-opacity="0.55" stroke-width="2"/>
  <text x="${w / 2}" y="${h * 0.15}" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="${h * 0.058}" letter-spacing="${h * 0.012}" fill="${ink}" text-anchor="middle">EMBER &amp; OAK</text>
  <text x="${w / 2}" y="${h * 0.215}" font-family="Helvetica, Arial, sans-serif" font-size="${h * 0.035}" letter-spacing="${h * 0.008}" fill="${ink}" fill-opacity="0.8" text-anchor="middle">COFFEE CO. · EST. 2019</text>
  <line x1="${w * 0.3}" y1="${h * 0.27}" x2="${w * 0.7}" y2="${h * 0.27}" stroke="${ink}" stroke-opacity="0.6" stroke-width="2"/>
  ${nameSvg}
  <text x="${w / 2}" y="${h * 0.72}" font-family="Helvetica, Arial, sans-serif" font-size="${h * 0.036}" letter-spacing="${h * 0.006}" fill="${ink}" text-anchor="middle">${esc(origin)}</text>
  <text x="${w / 2}" y="${h * 0.8}" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="${h * 0.042}" letter-spacing="${h * 0.01}" fill="${ink}" text-anchor="middle">${esc(roast)}</text>
  <text x="${w / 2}" y="${h * 0.9}" font-family="Helvetica, Arial, sans-serif" font-size="${h * 0.034}" fill="${ink}" fill-opacity="0.8" text-anchor="middle">12 OZ (340 G) · WHOLE BEAN</text>
</svg>`);
}

async function packshot(c) {
  // Bag front face in the 2000x1333 source is roughly x 662-1012, y 412-975.
  const w = 286, h = 400;
  const lab = await sharp(label(c, w, h)).png().toBuffer();
  await sharp(SRC + 'bag.jpg')
    .composite([{ input: lab, left: 694, top: 520, blend: 'multiply' }])
    .extract({ left: 170, top: 0, width: 1333, height: 1333 })
    .resize(1600, 1600)
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(`${OUT}${c.handle}.jpg`);
}

const crop = (src, out, w, h, opts = {}) =>
  sharp(SRC + src).resize(w, h, { fit: 'cover', position: opts.position ?? 'centre' }).jpeg({ quality: 82, mozjpeg: true }).toFile(OUT + out);

for (const c of coffees) await packshot(c);
await Promise.all([
  crop('beans-a.jpg', 'beans-light.jpg', 1600, 1600),
  crop('beans-b.jpg', 'beans-medium.jpg', 1600, 1600),
  crop('beans-c.jpg', 'beans-dark.jpg', 1600, 1600),
  crop('mug.jpg', 'stoneware-mug.jpg', 1600, 1600),
  crop('dripper.jpg', 'pour-over-dripper.jpg', 1600, 1600),
  crop('coldbrew.jpg', 'cold-brew.jpg', 1600, 1600),
  crop('espresso.jpg', 'espresso.jpg', 1600, 1600),
  crop('hero-pourover.jpg', 'hero.jpg', 2400, 1350),
  crop('roaster.jpg', 'roaster.jpg', 1600, 1200),
  crop('flatlay.jpg', 'lookbook-flatlay.jpg', 1600, 1200),
  crop('hero-pourover.jpg', 'lookbook-pourover.jpg', 1200, 1500),
  crop('cup-beans.jpg', 'cup-beans.jpg', 1600, 1600),
  crop('cafe.jpg', 'cafe.jpg', 1600, 1000),
  crop('cafe2.jpg', 'cafe-2.jpg', 1600, 1000),
  crop('roast-drum.jpg', 'roast-drum.jpg', 1600, 1200),
  crop('pour.jpg', 'brew-guide-cover-photo.jpg', 1200, 1600),
]);
console.log('done');

// Cover for the Home Brew Guide (digital product), drawn over the pour-over photo.
{
  const W = 1600, H = 1600;
  const overlay = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1F2A2E" stop-opacity="0.15"/><stop offset="0.55" stop-color="#1F2A2E" stop-opacity="0.55"/><stop offset="1" stop-color="#1F2A2E" stop-opacity="0.92"/></linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <text x="120" y="1120" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="44" letter-spacing="10" fill="#E2A33B">EMBER &amp; OAK COFFEE CO.</text>
  <text x="114" y="1260" font-family="Georgia, serif" font-style="italic" font-size="150" fill="#FFF7EC">Home Brew Guide</text>
  <text x="120" y="1350" font-family="Helvetica, Arial, sans-serif" font-size="46" fill="#F3E3C3">Pour-over · French press · Espresso · Cold brew</text>
  <rect x="120" y="1420" width="310" height="70" rx="35" fill="#E2A33B"/>
  <text x="275" y="1467" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="34" fill="#1F2A2E" text-anchor="middle">PDF · 8 PAGES</text>
</svg>`);
  await sharp(SRC + 'pour.jpg').resize(W, H, { fit: 'cover' }).composite([{ input: overlay }]).jpeg({ quality: 84, mozjpeg: true }).toFile(OUT + 'home-brew-guide-cover.jpg');
}

// Wordmark logo (transparent PNG) for the header.
{
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="300">
  <g fill="#2B1B0E">
    <circle cx="150" cy="150" r="118" fill="none" stroke="#2B1B0E" stroke-width="14"/>
    <path d="M150 62 C 196 112 206 160 178 204 C 166 222 134 222 122 204 C 96 166 112 118 150 62 Z" fill="#B4482F"/>
    <path d="M150 120 C 166 146 168 172 152 196 C 138 176 136 150 150 120 Z" fill="#E2A33B"/>
    <text x="310" y="150" font-family="Georgia, serif" font-style="italic" font-size="128">Ember &amp; Oak</text>
    <text x="316" y="232" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="46" letter-spacing="22">COFFEE CO.</text>
  </g></svg>`);
  await sharp(svg).png().toFile(OUT + 'ember-oak-logo.png');
}
