# Ember & Oak — Shopify theme on a live development store

A complete Online Store 2.0 theme for a fictional coffee roaster, running on a real Shopify development store.
It is built on Dawn 16.1.1 with five custom pieces a merchant can edit in the theme editor:

1. **Comparison table**: compares coffees side by side, with every row read from product metafields
2. **Testimonial slider**: CSS scroll-snap, with buttons, dots, keyboard control and an optional, accessible autoplay
3. **Shoppable lookbook**: a photo with numbered hotspots that add products straight to the cart
4. **"Find your coffee" quiz**: questions tied to product metafields, scored in the browser
5. **ZIP-code store locator**: geocodes the shopper's ZIP once and sorts a cached stockist list by distance

There is also a **digital download** product (an 8-page PDF brew guide) and **test checkout** through Shopify's test
payment gateway (formerly "Bogus Gateway").

> This is our own development store, not a client's. The brand, products, reviews and stockists are fictional, and
> checkout runs in test mode: nothing is charged or shipped.

**Live store:** https://ember-and-oak-coffee-tpmi70xy.myshopify.com (development stores are always password
protected; the password is given with the link)

## Real vs simulated

| Part | Real | Simulated / demo |
|---|---|---|
| Shopify store | A real Shopify development store (Basic plan features), real Admin API, real theme | Not open to the public: development stores are always password protected |
| Theme | Real OS 2.0 theme pushed with Shopify CLI 5; every section is editable in the theme editor | — |
| Products, prices, collections | Real Shopify products, variants, collections and metafields, created through the Admin GraphQL API | The brand "Ember & Oak Coffee Co." and its coffees are fictional |
| Product photos | Unsplash photos (Unsplash License); coffee bags are one plain kraft-bag photo with our own label drawn on top | — |
| Quiz | Real metafield-driven scoring running in the browser on the live store; 6 unit tests | — |
| Store locator | Real ZIP geocoding (one request to the free zippopotam.us API, cached), real distance maths, real metaobject data | The 24 stockists are invented; their coordinates sit near real neighbourhoods so distances look right |
| Reviews | The slider is real | The quotes and names are written for the demo and labelled "Reviews (sample)" |
| Checkout | Real Shopify checkout; two test orders paid through it on 2026-11-08 ([evidence](docs/test-orders.md)) | Test payment gateway: card number `1` approves, `2` declines, `3` errors. No money moves |
| Digital download | Real product (no shipping) fulfilled by Shopify's Digital Products app: test order #1002 was fulfilled automatically 6 s after payment and its download link issued (2026-11-08); the PDF is real | The emailed link was not delivered: the test buyer address was a placeholder |
| Newsletter form | Real Shopify customer signup | No emails are sent from the demo |

## How each feature works

### 1. Comparison table: `sections/eo-comparison-table.liquid`
- **Columns:** the products are picked with a `product_list` setting (up to 6), and one column can be highlighted with a badge.
- **Rows:** each row is a block.
  - A "metafield row" names a key in the `custom` namespace (`roast_level`, `tasting_notes`, `origin`, `brew_methods`, `caffeine`).
  - List metafields render as chips, and `roast_level` can render as a 4-dot roast meter.
  - There are also blocks for a price row and an add-to-cart row.
- **Editing:** a merchant changes what is compared by editing metafields or blocks, never code.
- **Mobile:** the header column stays put (`position: sticky`) while the table scrolls sideways inside its own focusable region.
- **Add to cart:** goes through `assets/eo-cart.js`, which posts to the AJAX Cart API and hands the result to Dawn's own cart drawer, so the drawer and the header count update exactly as they do from a product page.

### 2. Testimonial slider: `sections/eo-testimonials.liquid`, `assets/eo-testimonials.js`
- **Sliding:** CSS scroll-snap does the sliding, so it works without JavaScript and swipes natively on phones.
- **Controls:** a small custom element adds previous/next buttons, dots and arrow keys.
- **Autoplay:** optional. It pauses on hover, on focus, on touch and in hidden tabs, and is off under `prefers-reduced-motion` and in the theme editor.
- **Layout:** 1 card per view on phones, 2 on tablets, 3 on desktop.
- **Blocks:** quote, name, location, stars, optional photo, and an optional link to the product reviewed.

### 3. Shoppable lookbook: `sections/eo-lookbook.liquid`, `assets/eo-lookbook.js`
- **Hotspots:** one image and up to 6 hotspot blocks, each a product plus x/y position in %.
- **Opening a hotspot:** each one is a real `<button aria-expanded>` that opens a card with the price and an add-to-cart button. The card flips side automatically near the edges, and Escape or an outside click closes it.
- **Product list:** the same products are listed beside the photo, with + buttons. Hovering a list item highlights its hotspot, and the list keeps the section usable on small screens and with screen readers.

### 4. Product quiz: `sections/eo-product-quiz.liquid`, `assets/eo-quiz.js`, page `/pages/find-your-coffee`
- **Product data:** the products of a chosen collection are printed once into the page as JSON, together with four metafields: `custom.brew_methods`, `custom.flavor_profile`, `custom.roast_level` and `custom.caffeine`.
- **Questions:** each question is a block with:
  - the metafield it matches
  - its answers, one per line as `value = label`
  - whether more than one answer is allowed
  - a weight from 1 to 5
  - an optional "must match" filter
- **Scoring:** `scoreProducts()` is pure and unit-tested. Points per product:
  - a match adds the question's weight
  - a roast one step away adds half
  - a "must match" question (here, decaf) removes non-matching products
  - sold-out products are excluded
  - "any" answers are ignored rather than counted against products
- **Result:** the best match with a match percentage and the reasons ("Brews well as pour over", "Fruity notes"), plus two runners-up. Every result can be added to the cart in one tap.
- **Privacy and speed:** no app, no external calls, and nothing leaves the page.

### 5. Store locator: `sections/eo-store-locator.liquid`, `assets/eo-locator.js`, page `/pages/stockists`
- **Stockist data:** each stockist is a **Store location metaobject** (Admin → Content → Metaobjects) with name, kind (café/grocer), address, opening hours, latitude and longitude. The location of each stockist is entered once with the stockist, and Liquid prints the whole list as one JSON block in the page, cached with the page.
- **The shopper's ZIP:** geocoded **once** with one request to the free zippopotam.us API, then cached in `localStorage`, so searching the same ZIP again costs nothing. "Use my location" asks the browser instead.
- **Sorting and filters:** sorting is haversine distance in the browser, and there's a café/grocer filter. Results show the distance in miles or km, the hours, and a Google Maps directions link.
- **Cost:** no map SDK, no API key, no per-search server cost.

### 6. Digital download + test checkout
- **Product:** "Home Brew Guide (PDF download)" has `requiresShipping: false` and no inventory tracking, so checkout skips shipping. It is delivered with Shopify's free **Digital Products** app.
- **The PDF:** generated by `tools/make-guide-pdf.mjs`: 8 pages of real brewing recipes.
- **Payments:** the only active payment method is Shopify's test payment gateway (formerly "Bogus Gateway").

## Build and tooling

- **Store creation:** `shopify store create dev` (Shopify CLI 5)
- **Admin API seeding:** `tools/seed.mjs` and `tools/seed-content.mjs`, through `shopify store execute`, so the CLI holds the auth and no Admin API token exists in this repo. Both scripts can be re-run safely.
  - **Metafield definitions:** with `choices` validations, pinned, and readable by the storefront
  - **Metaobject:** the `store_location` definition and its 24 entries
  - **Products:** created with `productSet` and published to the Online Store
  - **Collections:** two smart collections
  - **Images:** uploaded through `stagedUploadsCreate` and `fileCreate`
  - **Pages and menu:** pages with their own templates, and the main menu
- **Images:** `tools/make-images.mjs` (sharp)
  - crops the Unsplash photos
  - draws the bag labels, the logo and the brew-guide cover
- **The PDF:** `tools/make-guide-pdf.mjs` (pdfkit)
- **Theme:** `theme/` is Dawn 16.1.1 plus the custom files below, pushed with `shopify theme push`.

```sh
npm --prefix tools ci
node tools/make-images.mjs && node tools/make-guide-pdf.mjs
shopify store auth -s <store>.myshopify.com --scopes write_products,write_metaobject_definitions,write_metaobjects,write_files,write_content,write_online_store_navigation,write_publications
node tools/seed.mjs && node tools/seed-content.mjs
shopify theme check --path theme
shopify theme push --path theme --store <store>.myshopify.com --unpublished
node --test tests/*.test.mjs
```

Custom files (everything else under `theme/` is unmodified Dawn 16.1.1, except the settings, the header group and the locale strings):

```
theme/sections/eo-comparison-table.liquid   theme/assets/eo-cart.js
theme/sections/eo-testimonials.liquid       theme/assets/eo-testimonials.js
theme/sections/eo-lookbook.liquid           theme/assets/eo-lookbook.js
theme/sections/eo-product-quiz.liquid       theme/assets/eo-quiz.js
theme/sections/eo-store-locator.liquid      theme/assets/eo-locator.js
theme/assets/eo-sections.css                theme/templates/index.json, page.quiz.json, page.stockists.json
```

## Quality checks

- **theme-check** (`shopify theme check`, CLI 5.0.1): 0 errors. 0 warnings in the custom files; the 9 warnings reported are all in unmodified Dawn 16.1.1 files (for example `UnusedAssign` in `main-search.liquid`).
- **Unit tests:** `node --test tests/*.test.mjs` runs 13 tests on the quiz scoring and the locator maths and cache.
- **Lighthouse 12.8.2** (live store, median of 3-5 runs):
  - Home: mobile performance 79, desktop 99
  - Quiz page: mobile performance 90
  - Stockists page: mobile performance 87
  - Accessibility: 100 on home, quiz and stockists
  - SEO: 100
  - CLS: 0 everywhere
  - Details and what was fixed: [`docs/lighthouse.md`](docs/lighthouse.md).

## Credits

- Theme base: [Dawn](https://github.com/Shopify/dawn) by Shopify (MIT).
- Photos: [Unsplash](https://unsplash.com) contributors, used under the Unsplash License. The coffee-bag photo is a plain unbranded kraft bag; the labels are ours.
- ZIP geocoding: [Zippopotam.us](https://zippopotam.us) (free, no key).
