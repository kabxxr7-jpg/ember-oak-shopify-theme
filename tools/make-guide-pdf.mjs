// Builds the "Home Brew Guide" PDF sold as the store's digital download (8 pages, A5).
import PDFDocument from 'pdfkit';
import { createWriteStream } from 'node:fs';

const OUT = new URL('../media/out/ember-oak-home-brew-guide.pdf', import.meta.url).pathname;
const IMG = new URL('../media/out/', import.meta.url).pathname;
const doc = new PDFDocument({ size: 'A5', margin: 48, info: { Title: 'Home Brew Guide', Author: 'Ember & Oak Coffee Co. (demo brand)' } });
doc.pipe(createWriteStream(OUT));

const INK = '#2B1B0E', ACCENT = '#B4482F', MUTED = '#6b5a4c';
const W = doc.page.width, M = 48;

function header(title, kicker) {
  doc.fillColor(ACCENT).font('Helvetica-Bold').fontSize(8).text(kicker.toUpperCase(), M, M, { characterSpacing: 2 });
  doc.moveDown(0.4).fillColor(INK).font('Times-Italic').fontSize(26).text(title);
  doc.moveDown(0.6);
}
function para(t) { doc.fillColor(INK).font('Helvetica').fontSize(10).text(t, M, doc.y, { width: W - 2 * M, lineGap: 3 }); doc.moveDown(0.6); }
function steps(list) {
  list.forEach((s, i) => {
    const y = doc.y;
    doc.circle(M + 8, y + 6, 8).fill(ACCENT);
    doc.fillColor('#fff').font('Helvetica-Bold').fontSize(8).text(String(i + 1), M + 4.5, y + 2.5, { width: 7, align: 'center' });
    doc.fillColor(INK).font('Helvetica').fontSize(10).text(s, M + 24, y, { width: W - 2 * M - 24, lineGap: 2 });
    doc.moveDown(0.5);
  });
}
function recipe(rows) {
  doc.moveDown(0.3);
  rows.forEach(([k, v]) => {
    const y = doc.y;
    doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(8).text(k.toUpperCase(), M, y, { characterSpacing: 1 });
    doc.fillColor(INK).font('Helvetica').fontSize(10).text(v, M + 100, y);
    doc.moveDown(0.35);
  });
  doc.x = M;
  doc.moveDown(0.5);
}
function footer(n) {
  const bottom = doc.page.margins.bottom;
  doc.page.margins.bottom = 0;
  doc.fillColor(MUTED).font('Helvetica').fontSize(7).text(`Ember & Oak Coffee Co. · Home Brew Guide · ${n}`, M, doc.page.height - 30, { width: W - 2 * M, align: 'center', lineBreak: false });
  doc.page.margins.bottom = bottom;
}

// 1. Cover
doc.image(IMG + 'home-brew-guide-cover.jpg', 0, 0, { width: W, height: doc.page.height, cover: [W, doc.page.height] });

// 2. Basics
doc.addPage(); header('The four things that matter', 'Start here');
para('Great coffee at home comes down to four variables. Get these right and any of our coffees will taste the way the bag says.');
steps([
  'Fresh beans. Use within six weeks of the roast date printed on the bag. Keep the bag sealed, away from light and heat. Never in the fridge.',
  'Ratio. Start at 1:16 (1 g of coffee to 16 g of water) for filter and adjust by taste. Use a scale; scoops vary by 30%.',
  'Grind. Grind just before brewing. Finer extracts faster, coarser slower. Grind size is the main dial you turn.',
  'Water. Filtered water just off the boil, 92-96 °C (198-205 °F). Wait 30 seconds after the kettle clicks.',
]);
footer(2);

// 3. Grind chart
doc.addPage(); header('Grind size chart', 'Reference');
recipe([
  ['Espresso', 'Fine, like powdered sugar'],
  ['Moka pot', 'Fine-medium, like table salt'],
  ['Pour-over', 'Medium-fine, like sand'],
  ['Drip machine', 'Medium, like coarse sand'],
  ['French press', 'Coarse, like sea salt'],
  ['Cold brew', 'Extra coarse, like peppercorns'],
]);
para('Tip: if you buy ground coffee from us, pick "Ground for filter" for pour-over, drip and French press, and "Ground for espresso" for espresso machines and moka pots.');
footer(3);

// 4. Pour-over
doc.addPage(); header('Pour-over', 'Recipe');
recipe([['Coffee', '20 g, medium-fine'], ['Water', '320 g at 94 °C'], ['Time', '3:00 - 3:30 total'], ['Try with', 'Morning Ember, Golden Hour']]);
steps([
  'Rinse the paper filter with hot water and discard the rinse water.',
  'Add coffee, level the bed, start a timer and pour 50 g of water. Let it bloom for 40 seconds.',
  'Pour slowly in circles to 200 g by 1:15, then to 320 g by 2:00.',
  'Give the dripper a gentle swirl so the bed drains flat. Done by 3:00 - 3:30.',
]);
footer(4);

// 5. French press
doc.addPage(); header('French press', 'Recipe');
recipe([['Coffee', '30 g, coarse'], ['Water', '500 g at 95 °C'], ['Time', '4:00 steep + 5:00 settle'], ['Try with', 'Oak & Honey, Highland Decaf']]);
steps([
  'Add coffee and all the water. Start a timer.',
  'At 4:00, stir the crust and scoop off the foam and floating grounds.',
  'Wait another 5 minutes for the fines to settle. This is the step most people skip.',
  'Press the plunger just to the surface (not to the bottom) and pour gently.',
]);
footer(5);

// 6. Espresso
doc.addPage(); header('Espresso', 'Recipe');
recipe([['Dose', '18 g, fine'], ['Yield', '36 g in the cup (1:2)'], ['Time', '25 - 30 seconds'], ['Try with', 'Midnight Hearth, Oak & Honey']]);
steps([
  'Weigh the dose, distribute evenly and tamp level.',
  'Start the shot and the timer together. Stop at 36 g.',
  'Under 25 seconds and sour? Grind finer. Over 30 seconds and bitter? Grind coarser.',
  'Change one thing at a time and taste after each change.',
]);
footer(6);

// 7. Cold brew
doc.addPage(); header('Cold brew', 'Recipe');
recipe([['Coffee', '100 g, extra coarse'], ['Water', '1 litre, cold, filtered'], ['Time', '14 - 18 hours in the fridge'], ['Try with', 'Campfire, Morning Ember']]);
steps([
  'Stir coffee and water together in a jar until all the grounds are wet.',
  'Cover and refrigerate for 14 - 18 hours.',
  'Strain through a paper filter or a fine cloth.',
  'This makes a concentrate: dilute 1:1 with water or milk over ice. Keeps for a week.',
]);
footer(7);

// 8. Troubleshooting
doc.addPage(); header('Troubleshooting', 'Fix your cup');
recipe([
  ['Sour, thin', 'Under-extracted: grind finer or brew longer'],
  ['Bitter, dry', 'Over-extracted: grind coarser or brew shorter'],
  ['Weak', 'Use more coffee (go from 1:16 to 1:15)'],
  ['Too strong', 'Use less coffee (go from 1:16 to 1:17)'],
  ['Flat, stale', 'Check the roast date; buy smaller bags'],
  ['Muddy', 'Coarser grind, or let the press settle longer'],
]);
para('Ember & Oak Coffee Co. is a demonstration brand. The recipes in this guide are real and work with any good coffee.');
footer(8);

doc.end();
console.log('wrote', OUT);
