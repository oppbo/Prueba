# CobraYa

**Cobra más rápido. Controla cada boliviano pendiente.**

CobraYa is an accounts-receivable and collections SaaS for small and medium Bolivian businesses (distributors, importers, hardware wholesalers, auto parts, printers, agencies — anyone who sells on credit). It replaces the Excel + WhatsApp + bank-screenshot routine with one place to see who owes money, remind them on WhatsApp, give them a payment page with the company's bank QR, receive payment proofs and verify them.

The UI is in Spanish (Bolivia): amounts in bolivianos (`Bs 24.580,00`), phones with `+591`, dates in `America/La_Paz`. Code and docs are in English.

---

## 1. Features

| Area | What it does |
| --- | --- |
| **Inicio** | Total receivable, overdue, collected this month, due this week; 6-month chart (collected vs. receivable balance); invoices needing attention; upcoming due dates; recent activity; banner for proofs waiting for verification |
| **Clientes** | Search, status filter, pagination, create/edit, detail page with debt, overdue debt, open invoices, payment history, collection timeline and WhatsApp reminder |
| **Facturas** | Filters (Todas / Pendientes / Vencidas / Pagadas), create/edit, cancel (anular), detail with progress and timeline, record payment, payment link, WhatsApp reminder |
| **Cobranza** | Daily work queue: *Vencidas* (by days overdue, then amount), *Vencen pronto* (7 days), *Sin contacto reciente* (7 days) with WhatsApp / Registrar pago / Nota on every row |
| **WhatsApp** | Click-to-chat (`wa.me`) with 4 editable templates (before due, due today, overdue, strongly overdue). The message is editable; opening WhatsApp is logged. It never claims a message was *sent* |
| **Página de pago** `/p/[token]` | Public, mobile-first page: company, customer, invoice, amount due, bank QR image and account details, proof upload (JPG/PNG/WebP/PDF ≤ 5 MB) |
| **Pagos** | Tabs *Por verificar / Verificados / Rechazados*, proof preview, verify or reject. Verification is atomic and idempotent |
| **Importar** | CSV wizard: drop zone → auto column mapping (Spanish aliases) → per-row validation with exact errors → confirm → summary. Downloadable template |
| **Configuración** | Company data, bank data + QR upload with preview, WhatsApp templates |
| **Landing** `/` | Marketing page with product previews built from real UI components and placeholder pricing |
| **Demo** | "Probar demo" creates a private throwaway sandbox with fictional data per visitor |

## 2. Tech stack

Next.js 16 (App Router, Turbopack, Server Actions) · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui-style components on Radix primitives · Supabase (Postgres, Auth, Storage, RLS) · Zod · React Hook Form · date-fns · Lucide · Recharts · Papa Parse.

### Architecture

```
app/                  routes: landing, (auth), dashboard/*, p/[token], auth/confirm
components/ui         design-system primitives (button, dialog, table, field…)
components/<domain>   feature components (collections, invoices, portal, import…)
lib/supabase          server (user session), admin (service role, server-only), proxy
lib/data              server-side queries (read)
lib/actions           server actions (mutations) — validate with Zod, then RLS/RPC
lib/validation        Zod schemas shared by client forms and server actions
lib/csv               CSV column detection + row validation (shared client/server)
lib/demo              demo dataset (seed script + sandbox)
supabase/migrations   schema, RLS, RPCs, storage buckets/policies
supabase/tests        SQL behavioural tests for tenancy and payments
scripts/              seed + demo cleanup (tsx)
proxy.ts              session refresh + route protection (Next 16 "proxy", formerly middleware)
```

Key design decisions:

- **Multi-tenant from day one.** Every business row has `organization_id`; RLS on every table checks membership via `is_org_member()`. Composite foreign keys `(customer_id, organization_id)` make cross-tenant references impossible even for buggy code.
- **Balances are derived, never written.** `invoices.outstanding_amount` = `original_amount − Σ verified payments`, recomputed by trigger. Payments can only be created/verified/rejected through Postgres functions (`record_payment`, `verify_payment`, `reject_payment`) that lock the row and check state, so a payment can never reduce a balance twice.
- **Overdue is computed, not stored**, in the `invoice_overview` view using Bolivia's date.
- **The public payment page never talks to Supabase from the browser.** Server code validates the token through `SECURITY DEFINER` functions executable only by the service role and returns the minimum data.

## 3. Local setup

Requirements: Node.js ≥ 20.9, npm, a Supabase project (free tier is fine).

```bash
git clone <your-repo-url> cobraya && cd cobraya
npm install
cp .env.example .env.local   # then fill in the values (see section 8)
```

## 4. Supabase setup

1. Create a project at <https://supabase.com/dashboard> (region: São Paulo `sa-east-1` is closest to Bolivia).
2. **Project Settings → API**: copy the Project URL, the `anon` key and the `service_role` key into `.env.local`.
3. **Authentication → URL Configuration**:
   - *Site URL*: `http://localhost:3000` (later your Vercel URL)
   - *Redirect URLs*: `http://localhost:3000/**` and `https://<your-vercel-domain>/**`
4. **Authentication → Providers → Email**: enabled. For a frictionless pilot you may turn *Confirm email* off; with it on, users get a confirmation link that lands on `/auth/confirm`.
5. Run the database migrations (next section). They also create the two **private** storage buckets and their policies.

## 5. Database migrations

The SQL lives in `supabase/migrations/` and must run in filename order:

1. `…_schema.sql` — tables, enums, indexes, triggers, views, signup bootstrap
2. `…_security.sql` — RLS policies and grants
3. `…_rpc.sql` — payment/verification/public-page functions
4. `…_storage.sql` — buckets `org-assets`, `payment-proofs` + policies

**Option A — SQL Editor (no tools needed):** open *SQL Editor → New query*, paste each file in order and run it.

**Option B — Supabase CLI:**

```bash
npx supabase login
npx supabase init            # creates supabase/config.toml; keep the existing migrations
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

**Optional — run the SQL tests** against any local Postgres 15+ (they use stubs for Supabase's `auth`/`storage` schemas and roll back):

```bash
PGHOST=localhost PGPORT=5432 PGUSER=postgres npm run test:db
```

## 6. Seed / demo data

```bash
npm run seed
```

Creates (or resets) the login `DEMO_USER_EMAIL` / `DEMO_USER_PASSWORD` with the organization **Distribuidora Andina SRL** (La Paz): 12 customers, 25 invoices (paid, partially paid, overdue, due soon), verified payments over six months, 3 proofs waiting for verification, 1 rejected proof, collection history, payment links and a demo QR. Re-running it only replaces that organization's data. All businesses, people and phone numbers (`7000 01xx`) are fictional.

**"Probar demo" button:** each click creates a private sandbox (its own user + organization, same fictional data) and signs the visitor in, so visitors never share or overwrite each other's data. Remove old sandboxes with:

```bash
npm run demo:cleanup          # deletes sandboxes older than DEMO_TTL_HOURS (default 24)
```

## 7. Run locally

```bash
npm run dev          # http://localhost:3000
npm run lint
npm run typecheck
npm run build && npm start
npm run check        # lint + typecheck + build
```

## 8. Environment variables

| Variable | Where to get it | Exposure |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL | public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → `anon` / publishable key | public (RLS protects data) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → `service_role` / secret key | **server only** |
| `NEXT_PUBLIC_SITE_URL` | Your app URL (`http://localhost:3000`, `https://cobraya-bolivia.vercel.app`) | public |
| `DEMO_USER_EMAIL`, `DEMO_USER_PASSWORD` | You choose them; used by `npm run seed` | server / scripts only |
| `DEMO_TTL_HOURS` | Optional, sandbox lifetime for `demo:cleanup` | scripts only |

The service-role key is required because the public payment page, proof upload and demo sandboxes run without a user session. It is imported only from `lib/supabase/admin.ts`, which starts with `import "server-only"` — the build fails if a client component ever imports it.

## 9. GitHub workflow

```bash
git init && git add -A && git commit -m "chore: initial import"
gh repo create cobraya-bolivia --private --source=. --remote=origin --push
# or, without gh: create an empty repo on github.com, then
git remote add origin git@github.com:<you>/cobraya-bolivia.git
git push -u origin main
```

`.env.local` is ignored by `.gitignore`; only `.env.example` is committed.

## 10. Deploy to Vercel

1. <https://vercel.com/new> → *Import Git Repository* → select the repo (private repos work on the free Hobby plan).
2. Framework preset: **Next.js** (auto). Build command `npm run build`, no other settings needed.
3. *Environment Variables* (Production + Preview): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL=https://<project>.vercel.app`.
4. Deploy. Then in Supabase → Authentication → URL Configuration set *Site URL* to the Vercel URL and add `https://<project>.vercel.app/**` to *Redirect URLs*.
5. Every push to `main` redeploys automatically; pull requests get preview URLs.

CLI alternative: `npx vercel link`, `npx vercel env add …`, `npx vercel --prod`.

Optional: schedule `npm run demo:cleanup` daily (e.g. a GitHub Actions cron with the two Supabase secrets).

## 11. Security notes

- RLS enabled on every private table; `anon` has no table privileges at all.
- Tenant isolation is enforced three times: RLS, explicit `organization_id` filters in every query/action, and composite foreign keys. Changing an id in a URL or request returns "not found".
- Payments are read-only for clients; state changes go through locked, state-checked RPCs. Balances are derived by trigger.
- Public payment tokens: 244 random bits, validated by format and by a service-role-only function; the page sends `Referrer-Policy: no-referrer` and `X-Robots-Tag: noindex`.
- Uploads: file type detected from magic bytes (not the browser MIME or name), size-capped (QR 2 MB, proofs 5 MB), stored in **private** buckets under server-generated names; buckets also enforce size/MIME limits. Files are served only through short-lived signed URLs.
- Proof submissions are rate-limited per link (5/hour) in the database.
- All mutations validate input with Zod on the server; client validation is UX only.
- Login redirects accept only `/dashboard…` paths (no open redirects).
- Security headers: `X-Frame-Options: DENY`, `nosniff`, strict referrer policy, restrictive `Permissions-Policy`.

## 12. Known MVP limitations

- WhatsApp uses click-to-chat: the user presses *send* in WhatsApp; delivery/read status is unknown.
- Bank QR is the static image supplied by the bank, not a dynamic per-invoice QR; payments are verified manually.
- One organization per user; no team invitations UI yet (roles `owner/admin/collector` exist in the schema and are enforced).
- No electronic invoicing (SIAT), accounting, inventory or subscription billing — by design.
- Payments are linked to a single invoice (no allocation of one transfer across several invoices).
- "Probar demo" sandboxes are not rate-limited per IP; run `demo:cleanup` regularly.

## 13. Future integrations

- **WhatsApp Business Platform (Meta Cloud API):** a verified Meta Business account, a WhatsApp Business number, approved message templates (HSM) in Spanish, a server-side sender + webhook to store delivery/read status in `collection_events`, and per-conversation pricing. The template system and event log are already shaped for this.
- **Automatic bank reconciliation:** dynamic QR / payment notifications from a Bolivian bank or aggregator (API agreements are bank-specific), a webhook that matches the transfer reference to an invoice and calls `verify_payment`.
- **SIAT (Impuestos Nacionales) e-invoicing:** handled by a certified billing provider or the SIAT web services (CUIS/CUFD, digital signature). CobraYa would import issued invoices rather than emit them.
- **Accounting / ERP sync:** export verified payments (CSV or API) to the customer's accounting system.
