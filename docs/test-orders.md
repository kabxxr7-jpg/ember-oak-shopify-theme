# Test orders (Shopify test payment gateway)

Both orders were placed on 2026-11-08 through the live storefront checkout. The only active payment provider is
Shopify's test payment gateway (formerly "Bogus Gateway"), card number `1`, so no money moved. The evidence below
was read back through the Admin GraphQL API (`orders` with `transactions`, `fulfillments` and `events`) and the
Digital Products app's order page.

## #1002: the PDF digital download

| Field | Value |
|---|---|
| Item | Home Brew Guide (PDF download), $9.00 USD, `requiresShipping: false` |
| Test order | `test: true` |
| Payment | authorized 17:25:48 UTC, captured 17:25:52 UTC; gateway `bogus`, both transactions SUCCESS |
| Fulfilment | FULFILLED at 17:25:58 UTC. Order event: "Digital Products marked 1 item as fulfilled" (6 s after capture, no manual step) |
| Download link | issued by Shopify Digital Products: asset link **Active**, downloads **0 / Unlimited** (app order page) |
| Order confirmation email | sent (order event at 17:25:52 UTC) |
| Download email | **failed**: "Digital product email failed to send" to the placeholder address `test@example.com`, which cannot receive mail |

Conclusion: the paid order was fulfilled automatically and its download link was issued and active. The emailed copy
of the link was not delivered, because the buyer address was a non-deliverable placeholder.

## #1001: a physical product

One bag of Oak & Honey House Blend, $25.00 USD including shipping. Authorized and captured 15:20 UTC via `bogus`
(SUCCESS, `test: true`). Left unfulfilled, since there is nothing to ship from a demo store.
