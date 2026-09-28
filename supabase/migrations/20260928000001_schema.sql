-- CobraYa core schema: tenants, customers, invoices, payments, collection history.
-- All private tables carry organization_id and are protected by RLS (see next migration).

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.member_role as enum ('owner', 'admin', 'collector');
create type public.customer_status as enum ('active', 'inactive');
create type public.invoice_status as enum ('pending', 'partially_paid', 'paid', 'overdue', 'cancelled');
create type public.payment_method as enum ('bank_transfer', 'qr', 'cash', 'other');
create type public.payment_status as enum ('pending_verification', 'verified', 'rejected');
create type public.collection_event_type as enum (
  'reminder_created',
  'whatsapp_opened',
  'note_added',
  'payment_proof_received',
  'payment_verified',
  'payment_rejected',
  'invoice_created',
  'invoice_updated'
);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Current calendar date in Bolivia (UTC-4, no DST).
create or replace function public.today_bo()
returns date
language sql
stable
as $$
  select (now() at time zone 'America/La_Paz')::date;
$$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  legal_name text,
  nit text,
  phone text,
  address text,
  city text,
  bank_name text,
  bank_account_name text,
  bank_account_number text,
  bank_qr_path text,
  -- Optional overrides of the default WhatsApp templates, keyed by template id.
  reminder_templates jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.member_role not null default 'collector',
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  business_name text,
  nit text,
  phone text not null,
  email text,
  address text,
  city text,
  notes text,
  status public.customer_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Enables composite FKs that guarantee children stay inside the same tenant.
  unique (id, organization_id)
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  customer_id uuid not null,
  invoice_number text not null check (char_length(invoice_number) between 1 and 60),
  description text,
  issue_date date not null,
  due_date date not null,
  original_amount numeric(14, 2) not null check (original_amount > 0),
  -- Derived by trigger: original_amount - sum(verified payments). Never written by clients.
  outstanding_amount numeric(14, 2) not null default 0 check (outstanding_amount >= 0),
  status public.invoice_status not null default 'pending',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, organization_id),
  unique (organization_id, invoice_number),
  check (due_date >= issue_date),
  foreign key (customer_id, organization_id)
    references public.customers (id, organization_id)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  customer_id uuid not null,
  invoice_id uuid,
  amount numeric(14, 2) not null check (amount > 0),
  payment_date date not null default public.today_bo(),
  payment_method public.payment_method not null default 'bank_transfer',
  reference text,
  proof_path text,
  status public.payment_status not null default 'pending_verification',
  notes text,
  submitted_by_customer boolean not null default false,
  verified_at timestamptz,
  verified_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (customer_id, organization_id)
    references public.customers (id, organization_id),
  foreign key (invoice_id, organization_id)
    references public.invoices (id, organization_id)
);

create table public.collection_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  customer_id uuid not null,
  invoice_id uuid,
  event_type public.collection_event_type not null,
  message text check (message is null or char_length(message) <= 2000),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  foreign key (customer_id, organization_id)
    references public.customers (id, organization_id) on delete cascade,
  foreign key (invoice_id, organization_id)
    references public.invoices (id, organization_id) on delete cascade
);

create table public.public_payment_links (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  customer_id uuid not null,
  invoice_id uuid not null,
  -- 2 x UUIDv4 = 244 random bits, hex encoded. Unguessable; unique index below.
  token text not null default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (customer_id, organization_id)
    references public.customers (id, organization_id) on delete cascade,
  foreign key (invoice_id, organization_id)
    references public.invoices (id, organization_id) on delete cascade
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index organization_members_user_idx on public.organization_members (user_id);
create index customers_org_name_idx on public.customers (organization_id, name);
create index customers_org_status_idx on public.customers (organization_id, status);
create index invoices_org_due_idx on public.invoices (organization_id, due_date);
create index invoices_org_status_idx on public.invoices (organization_id, status);
create index invoices_customer_idx on public.invoices (customer_id);
create index payments_org_status_idx on public.payments (organization_id, status, created_at desc);
create index payments_invoice_idx on public.payments (invoice_id);
create index payments_customer_idx on public.payments (customer_id);
create index collection_events_org_created_idx on public.collection_events (organization_id, created_at desc);
create index collection_events_customer_idx on public.collection_events (customer_id, created_at desc);
create index collection_events_invoice_idx on public.collection_events (invoice_id, created_at desc);
create unique index public_payment_links_token_idx on public.public_payment_links (token);
create index public_payment_links_invoice_idx on public.public_payment_links (invoice_id);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger organizations_updated_at before update on public.organizations
  for each row execute function public.set_updated_at();
create trigger customers_updated_at before update on public.customers
  for each row execute function public.set_updated_at();
create trigger invoices_updated_at before update on public.invoices
  for each row execute function public.set_updated_at();
create trigger payments_updated_at before update on public.payments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Invoice balance: single source of truth
-- ---------------------------------------------------------------------------
-- outstanding_amount and status are always recomputed from verified payments, so
-- no client write (or repeated verification) can drift the balance.
create or replace function public.invoices_derive_balance()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_paid numeric(14, 2);
begin
  select coalesce(sum(p.amount), 0)
    into v_paid
    from public.payments p
   where p.invoice_id = new.id
     and p.status = 'verified';

  new.outstanding_amount := greatest(new.original_amount - v_paid, 0);

  if new.status = 'cancelled' then
    return new;
  elsif new.outstanding_amount = 0 then
    new.status := 'paid';
  elsif v_paid > 0 then
    new.status := 'partially_paid';
  else
    new.status := 'pending';
  end if;

  return new;
end;
$$;

create trigger invoices_derive_balance
  before insert or update on public.invoices
  for each row execute function public.invoices_derive_balance();

-- Any change to a payment re-derives the linked invoice(s).
create or replace function public.payments_touch_invoice()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') and old.invoice_id is not null then
    update public.invoices set updated_at = now() where id = old.invoice_id;
  end if;
  if tg_op in ('INSERT', 'UPDATE') and new.invoice_id is not null
     and (tg_op = 'INSERT' or new.invoice_id is distinct from old.invoice_id or new.status is distinct from old.status or new.amount is distinct from old.amount) then
    update public.invoices set updated_at = now() where id = new.invoice_id;
  end if;
  return null;
end;
$$;

create trigger payments_touch_invoice
  after insert or update or delete on public.payments
  for each row execute function public.payments_touch_invoice();

-- ---------------------------------------------------------------------------
-- Views (security_invoker => RLS of the caller applies)
-- ---------------------------------------------------------------------------
create or replace view public.invoice_overview
with (security_invoker = true)
as
select
  i.id,
  i.organization_id,
  i.customer_id,
  i.invoice_number,
  i.description,
  i.issue_date,
  i.due_date,
  i.original_amount,
  i.outstanding_amount,
  i.status,
  i.notes,
  i.created_at,
  i.updated_at,
  c.name as customer_name,
  c.business_name as customer_business_name,
  c.phone as customer_phone,
  case
    when i.status in ('pending', 'partially_paid', 'overdue')
         and i.outstanding_amount > 0
         and i.due_date < public.today_bo()
      then 'overdue'::public.invoice_status
    when i.status = 'overdue' then 'pending'::public.invoice_status
    else i.status
  end as effective_status,
  case
    when i.status in ('pending', 'partially_paid', 'overdue') and i.outstanding_amount > 0
      then greatest(public.today_bo() - i.due_date, 0)
    else 0
  end as days_overdue,
  (
    select max(e.created_at)
      from public.collection_events e
     where e.invoice_id = i.id
       and e.event_type in ('reminder_created', 'whatsapp_opened', 'note_added')
  ) as last_contact_at
from public.invoices i
join public.customers c on c.id = i.customer_id;

create or replace view public.customer_overview
with (security_invoker = true)
as
select
  c.*,
  coalesce(agg.open_invoices, 0)::int as open_invoices,
  coalesce(agg.balance, 0)::numeric(14, 2) as balance,
  coalesce(agg.overdue_balance, 0)::numeric(14, 2) as overdue_balance,
  (
    select max(e.created_at)
      from public.collection_events e
     where e.customer_id = c.id
       and e.event_type in ('reminder_created', 'whatsapp_opened', 'note_added')
  ) as last_contact_at
from public.customers c
left join lateral (
  select
    count(*) filter (where i.outstanding_amount > 0) as open_invoices,
    sum(i.outstanding_amount) as balance,
    sum(i.outstanding_amount) filter (where i.due_date < public.today_bo()) as overdue_balance
  from public.invoices i
  where i.customer_id = c.id
    and i.status in ('pending', 'partially_paid', 'overdue')
) agg on true;

-- ---------------------------------------------------------------------------
-- New user bootstrap: profile + organization + owner membership
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_org_name text;
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'phone'), '')
  )
  on conflict (id) do nothing;

  v_org_name := coalesce(nullif(trim(new.raw_user_meta_data ->> 'organization_name'), ''), 'Mi empresa');

  insert into public.organizations (name, city)
  values (left(v_org_name, 120), 'La Paz')
  returning id into v_org_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (v_org_id, new.id, 'owner');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
