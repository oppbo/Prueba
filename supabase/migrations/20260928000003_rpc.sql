-- CobraYa RPCs: money-changing operations and the public payment page.
-- Every SECURITY DEFINER function pins search_path and checks tenancy explicitly.

-- ---------------------------------------------------------------------------
-- record_payment: a team member registers a payment they already confirmed
-- (cash, transfer seen in their bank app...). Created as verified.
-- ---------------------------------------------------------------------------
create or replace function public.record_payment(
  p_invoice_id uuid,
  p_amount numeric,
  p_payment_date date,
  p_method public.payment_method,
  p_reference text default null,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invoice public.invoices%rowtype;
  v_payment_id uuid;
  v_outstanding numeric(14, 2);
begin
  select * into v_invoice from public.invoices where id = p_invoice_id for update;

  if not found or not public.is_org_member(v_invoice.organization_id) then
    raise exception 'invoice_not_found' using errcode = 'P0002';
  end if;
  if v_invoice.status = 'cancelled' then
    raise exception 'invoice_cancelled' using errcode = 'P0001';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'invalid_amount' using errcode = 'P0001';
  end if;
  if p_amount > v_invoice.outstanding_amount then
    raise exception 'amount_exceeds_balance' using errcode = 'P0001';
  end if;
  if p_payment_date is null or p_payment_date > public.today_bo() + 1 then
    raise exception 'invalid_payment_date' using errcode = 'P0001';
  end if;

  insert into public.payments (
    organization_id, customer_id, invoice_id, amount, payment_date, payment_method,
    reference, notes, status, verified_at, verified_by
  ) values (
    v_invoice.organization_id, v_invoice.customer_id, v_invoice.id, round(p_amount, 2), p_payment_date,
    p_method, nullif(trim(p_reference), ''), nullif(trim(p_notes), ''), 'verified', now(), auth.uid()
  )
  returning id into v_payment_id;

  insert into public.collection_events (organization_id, customer_id, invoice_id, event_type, message, created_by)
  values (
    v_invoice.organization_id, v_invoice.customer_id, v_invoice.id, 'payment_verified',
    'Pago registrado manualmente por Bs ' || to_char(round(p_amount, 2), 'FM999999999990.00'),
    auth.uid()
  );

  select outstanding_amount into v_outstanding from public.invoices where id = v_invoice.id;

  return jsonb_build_object('payment_id', v_payment_id, 'outstanding_amount', v_outstanding);
end;
$$;

-- ---------------------------------------------------------------------------
-- verify_payment: pending_verification -> verified. Row lock + status guard make
-- a double click / concurrent request a no-op error instead of a double credit.
-- The invoice balance itself is derived from verified payments by trigger.
-- ---------------------------------------------------------------------------
create or replace function public.verify_payment(p_payment_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.payments%rowtype;
  v_outstanding numeric(14, 2);
begin
  select * into v_payment from public.payments where id = p_payment_id for update;

  if not found or not public.is_org_member(v_payment.organization_id) then
    raise exception 'payment_not_found' using errcode = 'P0002';
  end if;
  if v_payment.status <> 'pending_verification' then
    raise exception 'payment_already_processed' using errcode = 'P0001';
  end if;

  update public.payments
     set status = 'verified', verified_at = now(), verified_by = auth.uid()
   where id = v_payment.id;

  insert into public.collection_events (organization_id, customer_id, invoice_id, event_type, message, created_by)
  values (
    v_payment.organization_id, v_payment.customer_id, v_payment.invoice_id, 'payment_verified',
    'Pago verificado por Bs ' || to_char(v_payment.amount, 'FM999999999990.00'),
    auth.uid()
  );

  if v_payment.invoice_id is not null then
    select outstanding_amount into v_outstanding from public.invoices where id = v_payment.invoice_id;
  end if;

  return jsonb_build_object('payment_id', v_payment.id, 'outstanding_amount', v_outstanding);
end;
$$;

create or replace function public.reject_payment(p_payment_id uuid, p_reason text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.payments%rowtype;
begin
  select * into v_payment from public.payments where id = p_payment_id for update;

  if not found or not public.is_org_member(v_payment.organization_id) then
    raise exception 'payment_not_found' using errcode = 'P0002';
  end if;
  if v_payment.status <> 'pending_verification' then
    raise exception 'payment_already_processed' using errcode = 'P0001';
  end if;

  update public.payments
     set status = 'rejected',
         notes = coalesce(nullif(trim(p_reason), ''), notes),
         verified_at = now(),
         verified_by = auth.uid()
   where id = v_payment.id;

  insert into public.collection_events (organization_id, customer_id, invoice_id, event_type, message, created_by)
  values (
    v_payment.organization_id, v_payment.customer_id, v_payment.invoice_id, 'payment_rejected',
    coalesce('Comprobante rechazado: ' || nullif(trim(p_reason), ''), 'Comprobante rechazado'),
    auth.uid()
  );

  return jsonb_build_object('payment_id', v_payment.id);
end;
$$;

-- ---------------------------------------------------------------------------
-- get_or_create_payment_link: reuses the active link of an invoice.
-- ---------------------------------------------------------------------------
create or replace function public.get_or_create_payment_link(p_invoice_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invoice public.invoices%rowtype;
  v_token text;
begin
  select * into v_invoice from public.invoices where id = p_invoice_id;
  if not found or not public.is_org_member(v_invoice.organization_id) then
    raise exception 'invoice_not_found' using errcode = 'P0002';
  end if;
  if v_invoice.status = 'cancelled' then
    raise exception 'invoice_cancelled' using errcode = 'P0001';
  end if;

  select token into v_token
    from public.public_payment_links
   where invoice_id = v_invoice.id
     and active
     and (expires_at is null or expires_at > now())
   order by created_at desc
   limit 1;

  if v_token is null then
    insert into public.public_payment_links (organization_id, customer_id, invoice_id)
    values (v_invoice.organization_id, v_invoice.customer_id, v_invoice.id)
    returning token into v_token;
  end if;

  return v_token;
end;
$$;

-- ---------------------------------------------------------------------------
-- Public payment page (service_role only; called from Next.js server code).
-- Returns the minimum data needed to pay one invoice.
-- ---------------------------------------------------------------------------
create or replace function public.get_payment_page(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  if p_token is null or p_token !~ '^[0-9a-f]{64}$' then
    return null;
  end if;

  select jsonb_build_object(
    'organization', jsonb_build_object(
      'id', o.id,
      'name', o.name,
      'legal_name', o.legal_name,
      'city', o.city,
      'phone', o.phone,
      'bank_name', o.bank_name,
      'bank_account_name', o.bank_account_name,
      'bank_account_number', o.bank_account_number,
      'bank_qr_path', o.bank_qr_path
    ),
    'customer', jsonb_build_object('name', coalesce(c.business_name, c.name)),
    'invoice', jsonb_build_object(
      'id', i.id,
      'invoice_number', i.invoice_number,
      'description', i.description,
      'issue_date', i.issue_date,
      'due_date', i.due_date,
      'original_amount', i.original_amount,
      'outstanding_amount', i.outstanding_amount,
      'status', i.status,
      'is_overdue', (i.status in ('pending', 'partially_paid', 'overdue') and i.outstanding_amount > 0 and i.due_date < public.today_bo())
    ),
    'pending_amount', coalesce((
      select sum(p.amount) from public.payments p
       where p.invoice_id = i.id and p.status = 'pending_verification'
    ), 0)
  )
  into v_result
  from public.public_payment_links l
  join public.invoices i on i.id = l.invoice_id
  join public.customers c on c.id = l.customer_id
  join public.organizations o on o.id = l.organization_id
  where l.token = p_token
    and l.active
    and (l.expires_at is null or l.expires_at > now());

  return v_result;
end;
$$;

create or replace function public.submit_payment_proof(
  p_token text,
  p_amount numeric,
  p_proof_path text,
  p_reference text default null,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_link public.public_payment_links%rowtype;
  v_invoice public.invoices%rowtype;
  v_payment_id uuid;
  v_recent int;
begin
  select * into v_link
    from public.public_payment_links
   where token = p_token
     and active
     and (expires_at is null or expires_at > now());
  if not found then
    raise exception 'link_not_found' using errcode = 'P0002';
  end if;

  select * into v_invoice from public.invoices where id = v_link.invoice_id;
  if v_invoice.status in ('cancelled', 'paid') then
    raise exception 'invoice_not_payable' using errcode = 'P0001';
  end if;
  if p_amount is null or p_amount <= 0 or p_amount > v_invoice.original_amount then
    raise exception 'invalid_amount' using errcode = 'P0001';
  end if;
  -- Proof files must live in this organization's folder of the proofs bucket.
  if p_proof_path is null or split_part(p_proof_path, '/', 1) <> v_link.organization_id::text then
    raise exception 'invalid_proof_path' using errcode = 'P0001';
  end if;

  -- Basic abuse protection: at most 5 submissions per link per hour.
  select count(*) into v_recent
    from public.payments
   where invoice_id = v_link.invoice_id
     and submitted_by_customer
     and created_at > now() - interval '1 hour';
  if v_recent >= 5 then
    raise exception 'too_many_submissions' using errcode = 'P0001';
  end if;

  insert into public.payments (
    organization_id, customer_id, invoice_id, amount, payment_date, payment_method,
    reference, proof_path, notes, status, submitted_by_customer
  ) values (
    v_link.organization_id, v_link.customer_id, v_link.invoice_id, round(p_amount, 2), public.today_bo(),
    'qr', nullif(left(trim(p_reference), 120), ''), p_proof_path, nullif(left(trim(p_note), 500), ''),
    'pending_verification', true
  )
  returning id into v_payment_id;

  insert into public.collection_events (organization_id, customer_id, invoice_id, event_type, message, created_by)
  values (
    v_link.organization_id, v_link.customer_id, v_link.invoice_id, 'payment_proof_received',
    'Comprobante recibido por Bs ' || to_char(round(p_amount, 2), 'FM999999999990.00'),
    null
  );

  return jsonb_build_object('payment_id', v_payment_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- Function privileges
-- ---------------------------------------------------------------------------
revoke execute on function public.record_payment(uuid, numeric, date, public.payment_method, text, text) from public, anon;
revoke execute on function public.verify_payment(uuid) from public, anon;
revoke execute on function public.reject_payment(uuid, text) from public, anon;
revoke execute on function public.get_or_create_payment_link(uuid) from public, anon;
revoke execute on function public.get_payment_page(text) from public, anon, authenticated;
revoke execute on function public.submit_payment_proof(text, numeric, text, text, text) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.invoices_derive_balance() from public, anon, authenticated;
revoke execute on function public.payments_touch_invoice() from public, anon, authenticated;

grant execute on function public.record_payment(uuid, numeric, date, public.payment_method, text, text) to authenticated;
grant execute on function public.verify_payment(uuid) to authenticated;
grant execute on function public.reject_payment(uuid, text) to authenticated;
grant execute on function public.get_or_create_payment_link(uuid) to authenticated;
grant execute on function public.get_payment_page(text) to service_role;
grant execute on function public.submit_payment_proof(text, numeric, text, text, text) to service_role;
