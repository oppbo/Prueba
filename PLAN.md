# CobraYa — Implementation Plan

Focused accounts-receivable & collections MVP for Bolivian SMEs. UI in Spanish, code/docs in English.

## Architecture

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | Next.js 16 (App Router, Turbopack) + React 19 + TypeScript | Server components for data pages, server actions for mutations |
| Styling | Tailwind CSS v4 + hand-written shadcn/ui-style components on Radix primitives | shadcn registry is unreachable from the build sandbox; same code style, owned locally |
| Data | Supabase Postgres + RLS | Multi-tenant isolation enforced in the database, not just the app |
| Auth | Supabase Auth (email/password) via `@supabase/ssr` cookies | Works with server components, server actions and `proxy.ts` |
| Files | Supabase Storage, two **private** buckets | `org-assets` (bank QR), `payment-proofs` (customer proofs) |
| Validation | Zod schemas shared by client forms (React Hook Form) and server actions | Never trust browser validation |

### Data-access rules

1. **Authenticated dashboard** — every query/mutation uses the user's session client, so Postgres RLS applies. Server actions additionally resolve the caller's organization and validate input with Zod.
2. **Money-changing operations** are Postgres functions (RPC): `record_payment`, `verify_payment`, `reject_payment`. `invoices.outstanding_amount` is **derived** by trigger (`original_amount − Σ verified payments`), so a payment can never reduce a balance twice.
3. **Public payment page `/p/[token]`** — the browser never talks to Supabase. Server code uses the service-role client (`server-only` module) to call two `SECURITY DEFINER` functions (`get_payment_page`, `submit_payment_proof`) that are executable only by `service_role` and return the minimum data. Tokens are 244-bit random.
4. **Overdue** is computed, not stored: `invoice_overview` view (security invoker) derives `effective_status` and `days_overdue` with `America/La_Paz` dates.

### Folder layout

```
app/                 routes (landing, auth, dashboard, public payment page)
components/ui/       design-system primitives (button, card, dialog, table…)
components/<domain>/ feature components (customers, invoices, collections…)
lib/supabase/        server / browser / admin / proxy clients
lib/data/            server-side queries
lib/actions/         server actions (mutations)
lib/validation/      zod schemas
lib/format.ts        Bs currency, dates (La Paz), phone
lib/whatsapp.ts      click-to-chat URL + templates
lib/csv/             CSV column detection + row parsing
supabase/migrations/ SQL schema, RLS, storage, RPCs
supabase/seed/       demo data script (tsx)
types/               database + domain types
```

## Stages

1. Scaffold, design system, PLAN.md
2. Schema + RLS + RPC migrations (tested against local Postgres 16 with auth/storage stubs)
3. Supabase clients, auth (login/signup/logout), proxy route protection, dashboard shell
4. Dashboard (metrics, chart, attention list, upcoming, activity)
5. Customers (list/search/filter/paginate, create/edit, detail)
6. Invoices (list/filters, create/edit/cancel, detail + timeline, record payment, payment link)
7. Collections workspace + WhatsApp click-to-chat with editable templates
8. Public payment page + proof upload
9. Payment verification tabs
10. CSV import wizard
11. Settings (company, bank + QR, templates)
12. Landing page
13. Seed script, README, `.env.example`
14. Audit pass (AUDIT.md), lint/typecheck/build
15. Deployment prep (GitHub / Vercel / Supabase)

Each stage ends with `npm run lint && npm run typecheck && npm run build`.
