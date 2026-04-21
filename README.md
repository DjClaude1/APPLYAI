# ApplyAI — Land interviews 10× faster

AI-powered resume + cover-letter tailor. Paste a job description + your
resume, get back an **ATS-optimized bullet rewrite**, a **personalized
3-paragraph cover letter**, a **0-100 match score**, and **5 specific
improvements** — in ~15 seconds.

Built to run on 100% free tiers:

| Layer      | Tool                            |
| ---------- | ------------------------------- |
| Frontend   | Next.js 15 (App Router) + Tailwind CSS v4 |
| Auth + DB  | Supabase (free tier)            |
| AI         | Google AI Studio — Gemini 2.0 Flash |
| Payments   | PayPal Subscriptions (sandbox + live) |
| Hosting    | Vercel (hobby)                  |

---

## 1. Product

- **Target user:** active job seekers (especially tech / marketing / ops) frustrated by the resume blackhole.
- **Pain point:** tailoring a resume + writing a cover letter per role takes 45+ min and most people skip it, tanking their reply rate.
- **Why they pay:** one extra interview is worth thousands of dollars. $9/mo for unlimited tailoring is a no-brainer.

### Features

1. **Tailored resume bullets** (5-8 rewrites using JD keywords).
2. **Personalized cover letter** (≤ 220 words, 3 paragraphs, in user voice).
3. **Match score** 0-100 + top keywords from the JD.
4. **5 concrete improvements** to make before applying.
5. **History** — every generation stored per user for later reuse.

### Monetization

- **Free:** 3 tailored applications / month.
- **Pro — $9/mo:** unlimited, priority model, downloadable history. Billed via PayPal Subscriptions.

---

## 2. Run locally

### Prerequisites

- Node.js **20+**
- A free Supabase project
- A free Google AI Studio API key
- A PayPal developer account (sandbox is fine to start)

### Setup

```bash
git clone https://github.com/DjClaude1/APPLYAI.git
cd APPLYAI
npm install
cp .env.example .env.local
# → fill in the values (see section 3 below)
npm run dev
```

Open http://localhost:3000.

---

## 3. Step-by-step deployment

> Total setup time: ~20 minutes. Keep this README open and tick each step as you go.

### Step 1 — Supabase (free)

1. Go to <https://supabase.com> → **New project**. Region closest to you, strong DB password.
2. Once the project is ready, open **SQL Editor → New query**, paste the entire contents of [`supabase/schema.sql`](./supabase/schema.sql), click **Run**. This creates the `profiles`, `generations`, `paypal_events`, `payments` tables + RLS + the signup trigger.
3. Open **Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` **(keep secret)**
4. Open **Authentication → Providers → Email** and make sure it's enabled. For speed, disable **Confirm email** while testing.
5. Open **Authentication → URL Configuration** and set **Site URL** to your production URL once you have it (e.g. `https://applyai.vercel.app`). For local dev, `http://localhost:3000` is already in the default allow list.

### Step 2 — Google AI Studio (Gemini, free)

1. Go to <https://aistudio.google.com/app/apikey> → **Create API key**.
2. Copy the key into `GEMINI_API_KEY`.

### Step 3 — PayPal (free)

1. Go to <https://developer.paypal.com/dashboard> → **Apps & Credentials**.
2. Start in **Sandbox**. Click **Create App** → name it `ApplyAI`.
3. Copy **Client ID** → `PAYPAL_CLIENT_ID` **and** `NEXT_PUBLIC_PAYPAL_CLIENT_ID`.
4. Copy **Secret** → `PAYPAL_CLIENT_SECRET`.
5. Leave `PAYPAL_ENV=sandbox` while testing. Switch to `live` + live creds when you flip to production.
6. **Create a subscription plan** (PayPal requires this before the JS SDK can charge):
   - Visit <https://www.paypal.com/billing/plans> (sandbox: <https://www.sandbox.paypal.com/billing/plans>) and click **Create plan** → **Standard product** → fixed price → **$9.00 USD / Month**.
   - Alternatively via API: `POST /v1/catalogs/products` then `POST /v1/billing/plans`.
   - Copy the resulting `P-XXXX...` plan ID → `NEXT_PUBLIC_PAYPAL_PLAN_ID`.
7. **Create a webhook** (after deploying, but you can come back to this):
   - Dashboard → your App → **Webhooks** → **Add Webhook**.
   - URL: `https://<your-vercel-domain>/api/paypal/webhook`
   - Events to subscribe to:
     - `BILLING.SUBSCRIPTION.ACTIVATED`
     - `BILLING.SUBSCRIPTION.CANCELLED`
     - `BILLING.SUBSCRIPTION.EXPIRED`
     - `BILLING.SUBSCRIPTION.SUSPENDED`
     - `BILLING.SUBSCRIPTION.UPDATED`
     - `PAYMENT.SALE.COMPLETED`
   - Save, then copy the **Webhook ID** → `PAYPAL_WEBHOOK_ID`.

### Step 4 — Deploy to Vercel

1. Push this repo to GitHub (the `DjClaude1/APPLYAI` repo already is).
2. Go to <https://vercel.com/new> → **Import** the repo.
3. Framework preset: **Next.js** (auto-detected).
4. Add every variable from `.env.example` under **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`
   - `PAYPAL_ENV`
   - `PAYPAL_CLIENT_ID`
   - `NEXT_PUBLIC_PAYPAL_CLIENT_ID`
   - `PAYPAL_CLIENT_SECRET`
   - `NEXT_PUBLIC_PAYPAL_PLAN_ID`
   - `PAYPAL_WEBHOOK_ID`
   - `NEXT_PUBLIC_SITE_URL` = `https://<your-domain>.vercel.app`
5. Click **Deploy**. First deploy ~90 seconds.
6. Once live, go back to **PayPal → Webhooks** and point the webhook URL to `https://<your-domain>.vercel.app/api/paypal/webhook`, then paste the resulting `Webhook ID` into `PAYPAL_WEBHOOK_ID` in Vercel env, and redeploy.
7. Back in **Supabase → Authentication → URL Configuration**, set **Site URL** to your Vercel domain.

### Step 5 — Smoke test

1. Visit your domain → **Sign in** → create an account (use a real address if email confirmation is enabled).
2. Go to **Dashboard** → paste any job description + a short plain-text resume → **Tailor my application**. You should see a match score + tailored bullets + cover letter in ~15s.
3. Exhaust the free tier (3 generations) and click **Upgrade** → subscribe with a **PayPal sandbox buyer account**.
4. You should land on `/billing/success` and `profiles.plan` should flip to `pro` once the webhook fires (confirm in Supabase → Table editor → `profiles`).

### Step 6 — Flip to live

1. In PayPal dashboard switch to **Live** creds, re-create the plan + webhook on the live environment.
2. Update Vercel env: `PAYPAL_ENV=live`, swap `PAYPAL_CLIENT_ID` / `NEXT_PUBLIC_PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` / `NEXT_PUBLIC_PAYPAL_PLAN_ID` / `PAYPAL_WEBHOOK_ID` → redeploy.
3. You're now collecting real $9 payments. 🚀

---

## 4. Project structure

```
src/
├── app/
│   ├── layout.tsx             # root layout (Tailwind, gradient bg)
│   ├── page.tsx               # landing page
│   ├── login/page.tsx         # email + password auth
│   ├── dashboard/page.tsx     # tailor form + quota
│   ├── pricing/page.tsx       # free vs Pro + PayPal button
│   ├── billing/success/page.tsx
│   ├── billing/cancel/page.tsx
│   └── api/
│       ├── generate/route.ts           # Gemini tailoring + quota enforcement
│       ├── paypal/activate/route.ts    # post-checkout activation
│       └── paypal/webhook/route.ts     # ACTIVATED / CANCELLED / SALE.COMPLETED
├── components/
│   ├── Navbar.tsx
│   ├── GeneratorForm.tsx
│   ├── PaypalSubscribeButton.tsx
│   └── SignOutButton.tsx
├── lib/
│   ├── gemini.ts              # Gemini client + prompt + schema
│   ├── paypal.ts              # PayPal REST client + webhook verification
│   ├── utils.ts
│   └── supabase/
│       ├── client.ts          # browser client
│       ├── server.ts          # server + admin client
│       └── middleware.ts      # refreshes session on every request
├── middleware.ts
supabase/
└── schema.sql                 # full Postgres schema + RLS + trigger
```

---

## 5. Scripts

```bash
npm run dev        # local dev server
npm run build      # production build
npm run start      # run the production build
npm run lint       # next lint
npm run typecheck  # tsc --noEmit
```

---

## 6. License

MIT — ship it, fork it, sell it.
