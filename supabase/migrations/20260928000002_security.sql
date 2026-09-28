-- CobraYa security: tenant helpers, Row Level Security policies and grants.

-- ---------------------------------------------------------------------------
-- Tenant helpers (SECURITY DEFINER to avoid recursive RLS on organization_members)
-- ---------------------------------------------------------------------------
create or replace function public.is_org_member(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.organization_members m
     where m.organization_id = p_org_id
       and m.user_id = auth.uid()
  );
$$;

create or replace function public.has_org_role(p_org_id uuid, p_roles public.member_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.organization_members m
     where m.organization_id = p_org_id
       and m.user_id = auth.uid()
       and m.role = any (p_roles)
  );
$$;

-- Extracts the organization id from a storage object path "<org_id>/...".
-- Returns null for malformed paths instead of raising.
create or replace function public.storage_path_org_id(p_name text)
returns uuid
language plpgsql
immutable
as $$
declare
  v_first text := split_part(p_name, '/', 1);
begin
  if v_first ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return v_first::uuid;
  end if;
  return null;
end;
$$;

-- ---------------------------------------------------------------------------
-- Enable RLS on every private table
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.customers enable row level security;
alter table public.invoices enable row level security;
alter table public.payments enable row level security;
alter table public.collection_events enable row level security;
alter table public.public_payment_links enable row level security;

-- profiles --------------------------------------------------------------------
create policy "profiles: read self and teammates" on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or exists (
      select 1
        from public.organization_members mine
        join public.organization_members theirs on theirs.organization_id = mine.organization_id
       where mine.user_id = auth.uid()
         and theirs.user_id = profiles.id
    )
  );

create policy "profiles: update self" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- organizations ---------------------------------------------------------------
create policy "organizations: members read" on public.organizations
  for select to authenticated
  using (public.is_org_member(id));

create policy "organizations: owners/admins update" on public.organizations
  for update to authenticated
  using (public.has_org_role(id, array['owner', 'admin']::public.member_role[]))
  with check (public.has_org_role(id, array['owner', 'admin']::public.member_role[]));

-- organization_members (read-only for clients; managed by trigger / future invites)
create policy "organization_members: members read" on public.organization_members
  for select to authenticated
  using (public.is_org_member(organization_id));

-- customers -------------------------------------------------------------------
create policy "customers: members read" on public.customers
  for select to authenticated using (public.is_org_member(organization_id));
create policy "customers: members insert" on public.customers
  for insert to authenticated with check (public.is_org_member(organization_id));
create policy "customers: members update" on public.customers
  for update to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));
create policy "customers: admins delete" on public.customers
  for delete to authenticated
  using (public.has_org_role(organization_id, array['owner', 'admin']::public.member_role[]));

-- invoices --------------------------------------------------------------------
create policy "invoices: members read" on public.invoices
  for select to authenticated using (public.is_org_member(organization_id));
create policy "invoices: members insert" on public.invoices
  for insert to authenticated with check (public.is_org_member(organization_id));
create policy "invoices: members update" on public.invoices
  for update to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));
create policy "invoices: admins delete" on public.invoices
  for delete to authenticated
  using (public.has_org_role(organization_id, array['owner', 'admin']::public.member_role[]));

-- payments: read-only for clients. All writes go through RPCs below so that the
-- verification state machine cannot be bypassed.
create policy "payments: members read" on public.payments
  for select to authenticated using (public.is_org_member(organization_id));

-- collection_events: append-only history
create policy "collection_events: members read" on public.collection_events
  for select to authenticated using (public.is_org_member(organization_id));
create policy "collection_events: members insert" on public.collection_events
  for insert to authenticated
  with check (
    public.is_org_member(organization_id)
    and created_by = auth.uid()
    and event_type in ('reminder_created', 'whatsapp_opened', 'note_added', 'invoice_created', 'invoice_updated')
  );

-- public_payment_links --------------------------------------------------------
create policy "public_payment_links: members read" on public.public_payment_links
  for select to authenticated using (public.is_org_member(organization_id));
create policy "public_payment_links: members insert" on public.public_payment_links
  for insert to authenticated with check (public.is_org_member(organization_id));
create policy "public_payment_links: members update" on public.public_payment_links
  for update to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

-- ---------------------------------------------------------------------------
-- Table privileges: anon gets nothing on private tables.
-- ---------------------------------------------------------------------------
revoke all on
  public.profiles, public.organizations, public.organization_members, public.customers,
  public.invoices, public.payments, public.collection_events, public.public_payment_links
from anon;
revoke all on public.invoice_overview, public.customer_overview from anon;

-- Note: invoices.outstanding_amount / status are re-derived by the
-- invoices_derive_balance trigger on every write, so client-supplied values are ignored.
