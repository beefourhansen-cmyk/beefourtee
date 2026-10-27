# Stripe Checkout Integration TODO

This document is the single source of truth for your Hosted Stripe Checkout configuration and remaining setup steps.

## Values to Replace

In **Scenario A** (existing Checkout Session creation in [server.js](server.js)), your `mode`, `success_url`, `cancel_url`, and dynamic `line_items` already use real, non-placeholder application values and were preserved as-is.

| Field | Current Value | What to Set |
|-------|--------------|-------------|
| *(none — all `sample_only` fields already use live application values in [server.js](server.js))* | — | Optionally replace inline `price_data` in `line_items` with a pre-created Stripe Price ID (`price_...`) from https://dashboard.stripe.com/prices if desired. |

> **Note on `ui_mode` versioning:** `ui_mode` is set to `hosted_page` (for Stripe API / SDK versions `>= 21.0.0`). If your Stripe account's default API version is older than `2025-03-31.basil` (SDK `< 21.0.0`), change `ui_mode` to `hosted` in [server.js](server.js).

## Configured Parameters

These parameters were configured in Checkout Studio and are already set in your Checkout Session call.

**Files containing these parameters:**
- [server.js](server.js)

| Parameter | Value |
|-----------|-------|
| `ui_mode` | `hosted_page` |
| `billing_address_collection` | `auto` |
| `phone_number_collection.enabled` | `false` |
| `automatic_tax.enabled` | `false` |
| `allow_promotion_codes` | `true` |
| `submit_type` | `auto` |
| `integration_identifier` | `hosted_mobile_app_0001` |
| `origin_context` | `mobile_app` |
| `payment_method_collection` | *(omitted because `mode` is `"payment"`; only included when `mode` is `"subscription"`)* |

## Setup and Next Steps

### 1. Environment Variables & API Keys
Ensure `/Users/brymac/beefourtee/.env` contains your Stripe Secret Key:
```env
STRIPE_ACCOUNT_ID=acct_1UV6HDGhkQcWL1QL
STRIPE_SECRET_KEY=rk_live_... # or sk_live_... / sk_test_...
SHIRT_PRICE_CENTS=2800
```
Start the server with:
```bash
npm start
```

### 2. How the Integration Works
1. A shopper selects or generates one of the 70 phrases, chooses a neon ink color and garment size, and clicks **buy this shirt — $28**.
2. The frontend sends `POST /api/checkout` to [`createStripeCheckoutSession`](server.js#L238-L288) in [server.js](server.js).
3. The server creates a Stripe Checkout Session with your Checkout Studio parameters (`ui_mode: "hosted_page"`, `billing_address_collection: "auto"`, `allow_promotion_codes: true`, `submit_type: "auto"`, etc.) and returns `{ url, sessionId }`.
4. The browser redirects the customer to the Stripe-hosted payment page, and returns to `success_url` (`/?checkout=success&...&session_id={CHECKOUT_SESSION_ID}`) upon completion.

### 3. Testing Credit Card Numbers & Test Mode
When testing with a `sk_test_...` or `rk_test_...` key, use Stripe's official test cards:
- **Success**: `4242 4242 4242 4242` (any future expiration date, any 3-digit CVC)
- **Declined**: `4000 0000 0000 0002`

### 4. Next Steps
- **Promotional Codes**: Because `allow_promotion_codes` is set to `true`, you can create discount coupons and promo codes in the [Stripe Dashboard](https://dashboard.stripe.com/coupons) and customers can redeem them directly at checkout.
- **Order Fulfillment & Webhooks**: Monitor completed payments in the Stripe Dashboard or via `POST /api/webhooks/stripe` in [server.js](server.js).

### 5. Resources
- [Stripe Support](https://support.stripe.com)
- [Stripe MCP & AI Documentation](https://docs.stripe.com/mcp)
