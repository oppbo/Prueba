# CobraYa — Product & Security Audit

Scope: every route on desktop (1440×900) and mobile (390×844), the database layer and the server actions. Verification was done against a real Supabase-compatible stack (Postgres 16 + GoTrue auth + PostgREST + a storage emulator enforcing `storage.objects` RLS) with the production build (`next build && next start`), driven by Playwright.

## How it was verified

| Check | Result |
| --- | --- |
| `npm run lint` | pass |
| `npm run typecheck` | pass |
| `npm run build` | pass (15 routes) |
| `npm run test:db` — SQL behavioural tests (tenancy, RLS, derived balances, double verification, storage policies, cascade deletes) | pass |
| Browser E2E (24 checks): login, WhatsApp URL + event log, manual partial payment, overpayment blocked, public page on phone, proof upload, spoofed file rejected, invalid token 404, verification in two tabs, CSV import with bad rows, settings + QR upload, signup of a second tenant, cross-tenant URLs, logout redirect, mobile overflow | pass |
| Console errors during E2E | none (except the intentional 404 for an invalid token) |

## Issues found and fixes made

### Security

| # | Issue | Fix |
| --- | --- | --- |
| S1 | A **shared demo login** would let any visitor change its password through the Supabase Auth API, lock others out, or upload arbitrary images as the demo "bank QR" | "Probar demo" now creates a **private throwaway sandbox per visitor** (own user + organization, fictional data). `npm run demo:cleanup` deletes sandboxes after `DEMO_TTL_HOURS` |
| S2 | Deleting an organization (needed for sandbox cleanup) failed because of `ON DELETE RESTRICT` between invoices and customers | Switched those composite FKs to the default `NO ACTION` (checked at statement end); a customer with invoices still cannot be deleted on its own. Covered by SQL tests |
| S3 | Browser-provided MIME types can be spoofed | Upload type is detected from magic bytes; spoofed "PNG" with script content is rejected (E2E verified). Buckets additionally enforce size/MIME |
| S4 | Payment tokens in URLs could leak via `Referer` | `/p/[token]` sends `Referrer-Policy: no-referrer` and `noindex` |

Checks that passed without changes:

- **IDOR / cross-tenant access:** a second organization opening another tenant's `/dashboard/invoices/<id>` or `/dashboard/customers/<id>` gets the not-found page with no data. RPCs (`record_payment`, `verify_payment`, `reject_payment`, `get_or_create_payment_link`) raise "not found" for other tenants (SQL tests). Direct `insert` into `payments` is denied by RLS.
- **Double verification:** verifying the same proof from two tabs credits once; the second tab gets "Este pago ya fue procesado por otra persona". Balances are derived from verified payments, so even a repeated update cannot double-reduce.
- **anon role:** no privileges on any private table or view; public RPCs executable only by `service_role`.
- **Service-role key:** only in `lib/supabase/admin.ts` (`server-only`), scripts, never `NEXT_PUBLIC_*`.
- **Open redirect:** `next` parameter restricted to `/dashboard…`.
- **Secrets:** no keys committed; `.env*` ignored except `.env.example`.

### Data accuracy

| # | Issue | Fix |
| --- | --- | --- |
| D1 | Demo seed computed "today" once at module load — a long-running server would seed stale dates | Date is evaluated per call |
| D2 | Time-of-day rendering mixed `sept` (ICU) and `sep` (date-fns) | Single month abbreviation table; all dates in `America/La_Paz` |
| D3 | Currency formatting could differ between server and browser ICU data | Custom Bolivian formatter (`Bs 24.580,00`) used everywhere, including charts and WhatsApp text |

Verified: overdue status and days overdue come from the DB using Bolivia's date (`today_bo()`); a paid or cancelled invoice is never overdue; "Cobrado este mes" uses verified payments by payment date; cancelled invoices are excluded from receivables.

### UX / visual

| # | Issue | Fix |
| --- | --- | --- |
| U1 | Chart animation left the last line segment undrawn in screenshots/slow devices; Y-axis labels wrapped ("Bs 160,0 mil") | Animations off, compact labels (`Bs 160k`) |
| U2 | Invoice numbers wrapped mid-number (`F-` / `001203`) in tables, timeline and collection cards | `whitespace-nowrap` |
| U3 | "Facturas que requieren atención" table clipped its last column on laptop widths | Removed the redundant status column (all rows are overdue; days overdue is shown) |
| U4 | Collection card metadata wrapped awkwardly on phones | Wrapping key/value pairs |
| U5 | Detail/settings routes showed the dashboard skeleton while loading | Dedicated detail skeletons |
| U6 | Sidebar stretched with long pages | Sticky, self-aligned sidebar |
| U7 | Proof uploads sent as multipart `File` depended on storage multipart parsing | Upload raw bytes with explicit content type (deterministic) |
| U8 | Demo users had no signal they were in a sandbox | Banner with "Crear mi cuenta" |

### Accessibility

Labels bound to every input (`Field` wires `aria-invalid` / `aria-describedby`), visible focus rings, skip link, `aria-current` on navigation and tabs, Radix dialogs (focus trap, Escape, titles), progress bar semantics, alt text on QR/proof images, chart has a screen-reader data table, status never conveyed by color alone (badges carry text).

## Known behaviour worth knowing

- Opening another tenant's record returns the not-found UI with HTTP **200** instead of 404 because the dashboard streams with `loading.tsx` (Next.js sends headers before `notFound()` resolves). No data is sent; pages are `noindex`.

## Remaining MVP limitations

- WhatsApp is click-to-chat; delivery is not confirmed.
- Static bank QR image; verification is manual.
- One organization per user; team invitations not built (roles enforced in DB).
- A payment applies to one invoice.
- Demo sandbox creation is not rate-limited per IP.
- No SIAT e-invoicing, accounting, inventory or subscription billing (out of scope).
