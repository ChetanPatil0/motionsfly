# MotionFly

Single-owner digital products & tutorials ecommerce platform — built entirely as one Next.js application (App Router, TypeScript, PostgreSQL/Prisma, Tailwind + shadcn/ui).

This delivery contains **Phases 1 through 11** from the MotionFly master specification, working end-to-end against a real Postgres database. Phase 12 (final UX polish pass across every screen) and Phase 13 (production hardening/testing) are the two phases still outstanding.

## Storage note
Per request, this build uses **local filesystem storage**, not S3:
- Paid digital files live in `/storage` (outside `/public`, never directly servable) and are only ever released through the authorized `/api/downloads/[token]` route.
- Uploads are transactional: a file is staged to a temp folder, the DB row is created inside a `prisma.$transaction`, and the file is only moved to its permanent location *after* that transaction commits. On any failure, the temp file is discarded — nothing orphaned ever reaches permanent storage.
- Deleting a product (hard delete) or refunding an order cleans up the related files/tokens in the same spirit — DB state changes first, disk/token cleanup happens only after that succeeds.
- Public assets (thumbnails, store logo, favicon) use a separate simpler `/public/uploads` path since they aren't paid content.

## What's implemented, phase by phase

1. **Foundation** — Prisma schema (25 models / 13 enums), Auth.js + Argon2, theme system (DB-persisted for users, cookie for guests), top loader, error/empty states, i18n-ready locale files.
2. **Users & Admin** — role-based admin guard, admin shell, Dashboard with DB-aggregated revenue/orders charts, top products, subscription stats, recent orders; Users list + per-user detail (orders/downloads/wishlist/reviews/subscriptions).
3. **Products** — categories, product CRUD, transactional file upload, thumbnail upload, public listing/detail with SEO metadata.
4. **Tutorials** — CRUD (admin UI + API), public listing/detail, real server-verified FREE/PAID/PREMIUM access gating.
5. **Commerce** — guest (cookie) + registered (DB) cart with merge-on-login, checkout with price-snapshotting order creation.
6. **Payments** — Razorpay, Stripe, PayPal via raw REST (no extra paid SDKs). Orders only ever flip to PAID through a cryptographically verified path (HMAC signature check, webhook signature check, or a PayPal server-to-server capture) — never a trusted frontend callback.
7. **Digital Delivery** — secure download route (token, ownership, expiry, download-limit checks), invoices, admin refund flow that revokes download tokens in the same transaction.
8. **Subscriptions (partial)** — plans (INR/USD, monthly/yearly) full CRUD, per-user subscription history and admin cross-user view, server-verified premium access checks. *Recurring billing/webhook-driven renewal and the actual "Subscribe" checkout flow are not wired up — this was intentionally out of scope for this round.*
9. **Engagement** — wishlist add/remove, likes (duplicate-proof via unique constraint), reviews (purchase-verified creation, owner edit/delete, admin hide/delete).
10. **Promotions** — coupons (percentage/fixed, usage limits, min order amount, date range) with real server-side validation wired into checkout; offers (product-scoped discounts) with admin CRUD.
11. **Settings** — General (incl. logo/favicon upload, maintenance mode), Payments (provider enable/disable), Subscription toggle, Downloads (expiry/limit — actually consumed by the fulfillment flow), Email toggles, Website fields.

## Getting started

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL, NEXTAUTH_SECRET, and any payment provider keys you want to test
npx prisma migrate dev --name init
npx prisma db seed      # creates admin@motionfly.dev / Admin@12345 and default store settings
npm run dev
```

Visit `http://localhost:3000` for the storefront, log in at `/login` with the seeded admin account, and visit `/admin/dashboard`.

## Known gaps / next steps

- **Phase 8 remainder**: subscription purchase checkout flow (a user can view/manage plans and cancel, but can't yet buy one end-to-end) + recurring billing webhooks (renewal) from each provider.
- **Legal/marketing pages**: FAQ, Privacy Policy, Terms of Service, Refund Policy, Contact, About — none exist yet.
- **OTP/email verification**: schema fields exist (`otpCode`, `otpExpiresAt`) but nothing generates or checks them yet.
- **Phase 12**: a pass to make sure every screen added across Phases 3–11 has full skeleton/empty/error coverage and a responsive/dark-mode check.
- **Phase 13**: SEO sitemap/robots, accessibility audit, rate limiting, and end-to-end testing against real payment sandbox accounts.

## Email & subscription notifications

- `lib/email.ts` sends via the Resend REST API (set `RESEND_API_KEY` and `EMAIL_FROM` in `.env`). If no API key is set, emails are logged to the console instead of failing the calling flow — email delivery is always best-effort and never blocks checkout/auth.
- Wired triggers: order confirmation, invoice, per-item secure download link (all sent on payment fulfillment), password reset, subscription cancelled.
- `POST /api/cron/subscription-check` (protected by a `x-cron-secret` header matching `CRON_SECRET`) finds subscriptions renewing within 3 days and sends a reminder email, and flips subscriptions whose period has ended and were marked to cancel into `EXPIRED`. Point an external scheduler (Vercel Cron, cron-job.org, etc.) at this daily — Next.js has no built-in cron runner.
- `/account/subscription` shows a yellow warning banner when the active subscription is within 3 days of renewing/expiring, and includes a working **Cancel Subscription** button (sets `cancelAtPeriodEnd`, keeps access until the period ends, sends the cancellation email immediately).
- The homepage is now session-aware: logged-in users get a personalized greeting and a "Go to My Account" CTA, the "Go Premium" section is hidden for users who already have an active subscription, and recent purchases influence the hero copy.

