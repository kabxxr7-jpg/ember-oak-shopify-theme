// Fictional catalogue for the Ember & Oak Coffee Co. demo store. Prices in USD.
export const coffees = [
  {
    handle: 'morning-ember', title: 'Morning Ember — Ethiopia Yirgacheffe', price: '19.00',
    roast: 'light', brew: ['pour-over', 'drip', 'cold-brew'], flavor: ['fruity', 'floral'], caffeine: 'regular',
    notes: 'Blueberry, jasmine, lemon zest', origin: 'Yirgacheffe, Ethiopia',
    body: 'A bright, tea-like coffee from smallholder farms around Yirgacheffe. We roast it light to keep the blueberry and jasmine up front. Best as a pour-over or a clean filter brew.',
    images: ['morning-ember.jpg', 'beans-light.jpg'],
  },
  {
    handle: 'oak-and-honey-house-blend', title: 'Oak & Honey House Blend', price: '17.00',
    roast: 'medium', brew: ['drip', 'french-press', 'espresso', 'pour-over'], flavor: ['chocolatey', 'nutty'], caffeine: 'regular',
    notes: 'Milk chocolate, toasted almond, honey', origin: 'Huila, Colombia + Cerrado, Brazil',
    body: 'Our everyday coffee. Colombian sweetness on a Brazilian base: round, low in acidity and forgiving in any brewer. The one we drink at the roastery every morning.',
    images: ['oak-and-honey-house-blend.jpg', 'beans-medium.jpg'],
  },
  {
    handle: 'midnight-hearth-espresso', title: 'Midnight Hearth Espresso', price: '18.00',
    roast: 'dark', brew: ['espresso', 'french-press'], flavor: ['chocolatey', 'smoky'], caffeine: 'regular',
    notes: 'Dark cocoa, molasses, a little smoke', origin: 'Sumatra, Indonesia + Minas Gerais, Brazil',
    body: 'A heavy, syrupy espresso blend that stands up to milk. Roasted dark but not burnt, so you get cocoa and molasses rather than ash.',
    images: ['midnight-hearth-espresso.jpg', 'beans-dark.jpg', 'espresso.jpg'],
  },
  {
    handle: 'highland-decaf', title: 'Highland Decaf — Swiss Water Process', price: '18.00',
    roast: 'medium', brew: ['drip', 'french-press', 'pour-over', 'espresso'], flavor: ['chocolatey', 'nutty'], caffeine: 'decaf',
    notes: 'Cocoa, hazelnut, brown sugar', origin: 'Tolima, Colombia',
    body: 'Decaffeinated with water only (Swiss Water Process, 99.9% caffeine free) and roasted to taste like coffee, not like an apology. Good after dinner, good in a moka pot.',
    images: ['highland-decaf.jpg', 'beans-medium.jpg'],
  },
  {
    handle: 'campfire-cold-brew-blend', title: 'Campfire Cold Brew Blend', price: '18.00',
    roast: 'dark', brew: ['cold-brew', 'french-press'], flavor: ['chocolatey', 'nutty'], caffeine: 'regular',
    notes: 'Chocolate fudge, walnut, caramel', origin: 'Brazil + Peru',
    body: 'Built for a 14-hour steep: low acidity, lots of body, sweet even without milk. Ships coarse-ground on request so it goes straight into the jar.',
    images: ['campfire-cold-brew-blend.jpg', 'cold-brew.jpg'],
  },
  {
    handle: 'golden-hour-guatemala', title: 'Golden Hour — Guatemala Huehuetenango', price: '20.00',
    roast: 'medium-light', brew: ['pour-over', 'espresso', 'drip'], flavor: ['fruity', 'nutty'], caffeine: 'regular',
    notes: 'Red apple, caramel, pecan', origin: 'Huehuetenango, Guatemala',
    body: 'A balanced, sweet single origin from the highlands of Huehuetenango. Light enough to taste the apple, roasted enough for caramel. Shines as a filter coffee and as a light espresso.',
    images: ['golden-hour-guatemala.jpg', 'cup-beans.jpg'],
  },
];

export const gear = [
  {
    handle: 'ceramic-pour-over-dripper', title: 'Ceramic Pour-Over Dripper', price: '28.00', type: 'Brew gear',
    body: 'A cone dripper in glazed porcelain that holds heat through the whole brew. Fits standard #2 cone filters. Pairs with any of our light and medium roasts.',
    images: ['pour-over-dripper.jpg'],
  },
  {
    handle: 'stoneware-mug', title: 'Stoneware Mug — 12 oz', price: '24.00', type: 'Brew gear',
    body: 'Hand-thrown stoneware with a matte speckled glaze. 12 oz, dishwasher safe, made in small batches so every mug is a little different.',
    images: ['stoneware-mug.jpg'],
  },
];

export const guide = {
  handle: 'home-brew-guide-pdf', title: 'Home Brew Guide (PDF download)', price: '9.00', type: 'Digital download',
  body: 'An 8-page PDF: grind sizes, ratios and step-by-step recipes for pour-over, French press, espresso and cold brew, plus a troubleshooting table. Delivered as a download link after checkout. Nothing is shipped.',
  images: ['home-brew-guide-cover.jpg'],
};
