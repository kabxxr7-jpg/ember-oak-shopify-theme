# Lighthouse results

Measured 2026-11-08 (IST evening) on the live development store
`ember-and-oak-coffee-tpmi70xy.myshopify.com`, theme "Ember & Oak" (Dawn 16.1.1 + custom sections).

**How it was measured**
- Lighthouse 12.8.2 in headless Chrome for Testing, run from a MacBook on a home connection in India.
- Default mobile throttling (slow 4G, 4x CPU) unless marked desktop.
- The store is password protected, so each run sent the storefront session cookie; the cookie is removed from the saved reports.
- Raw reports: `docs/lighthouse-raw/`. Script: `tools/lighthouse.sh`.

Scores move a lot between runs on Shopify, because Shopify's own scripts and the network vary. Below is the
**median** of several runs, with the range in brackets.

| Page | Runs | Performance | Accessibility | Best practices | SEO | LCP (median) | CLS | TBT (median) |
|---|---|---|---|---|---|---|---|---|
| Home, mobile | 5 | **79** (73–89) | 96 → **100** after the fix below | 75 | 100 | 3.4 s | 0 | 380 ms |
| Home, desktop | 3 | **99** (99–100) | 100 | 74 | 100 | 0.8 s | 0 | 0 ms |
| Quiz page, mobile | 3 | **90** (86–93) | 100 | 75 | 100 | 2.7 s | 0 | 200 ms |
| Stockists page, mobile | 3 | **87** (82–93) | 100 | 75 | 100 | 2.9 s | 0 | 290 ms |
| Product page, mobile | 3 | **86** (70–91) | 96 | 75 | 100 | 3.5 s | 0 | 150 ms |

## Fixed after the first pass
- **Text contrast:** the reveal-on-scroll animation meant text was still fading in when Lighthouse checked it. The animation is now off.
- **Meta description:** there was none, so the layout now falls back to a shop-level description when a page has none of its own.
- **Testimonial slides:** they used `role="group"` on `<figure>`, which isn't allowed. The slide is now a `div` wrapping a `figure`.
- **Lookbook hotspots:** their accessible names didn't include the visible number. They now do ("1. Show …").
- **Comparison table:** the swipe hint had low contrast; it's now darker.

A re-run of the home page after these fixes scored **100** for accessibility.

## Not fixed (outside the custom code)
- **Best practices 74–75 (all pages):** a third-party cookie and console errors that Shopify's own scripts produce on a development store, such as `shop.app` framing and a missing default customer-account menu.
- **Accessibility 96 on product pages:** the quantity input in Dawn's product form has no programmatic label (unchanged Dawn code).
- **Mobile performance:** most main-thread time is Shopify's platform scripts plus the full-width hero image. The custom sections add one small CSS file and 1–3 small deferred scripts per page; nothing is render-blocking JavaScript.
