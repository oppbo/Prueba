-- Behavioural tests for tenancy isolation and payment verification.
-- Run with: psql -v ON_ERROR_STOP=1 -f supabase/tests/rls_and_payments.sql
\set QUIET on
\o /dev/null
begin;

-- Two tenants, created through the real signup trigger.
insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'a@test.bo', '{"full_name":"Ana","organization_name":"Org A"}'),
  ('22222222-2222-2222-2222-222222222222', 'b@test.bo', '{"full_name":"Beto","organization_name":"Org B"}');

create temp table t_ids as
select
  (select organization_id from public.organization_members where user_id = '11111111-1111-1111-1111-111111111111') as org_a,
  (select organization_id from public.organization_members where user_id = '22222222-2222-2222-2222-222222222222') as org_b;
grant select on t_ids to authenticated, service_role, anon;

do $$ begin
  assert (select count(*) from public.organizations) = 2, 'signup trigger creates organizations';
  assert (select count(*) from public.profiles) = 2, 'signup trigger creates profiles';
end $$;

-- ---- act as user A
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);

insert into public.customers (id, organization_id, name, phone)
select 'aaaaaaaa-0000-0000-0000-000000000001', org_a, 'Ferretería Illimani', '70000001' from t_ids;
insert into public.invoices (id, organization_id, customer_id, invoice_number, issue_date, due_date, original_amount, outstanding_amount)
select 'aaaaaaaa-0000-0000-0000-0000000000f1', org_a, 'aaaaaaaa-0000-0000-0000-000000000001', 'F-001',
       current_date - 40, current_date - 10, 1000, 1 from t_ids;

do $$ begin
  assert (select outstanding_amount from public.invoices where invoice_number = 'F-001') = 1000,
    'outstanding is derived, client value ignored';
  assert (select effective_status from public.invoice_overview where invoice_number = 'F-001') = 'overdue',
    'overdue derived from due date';
  assert (select days_overdue from public.invoice_overview where invoice_number = 'F-001') >= 9, 'days overdue';
end $$;

-- A cannot insert into org B
do $$ begin
  begin
    insert into public.customers (organization_id, name, phone) select org_b, 'Intruso', '1' from t_ids;
    raise exception 'expected RLS violation';
  exception when insufficient_privilege then null;
  end;
end $$;

-- A cannot insert payments directly
do $$ begin
  begin
    insert into public.payments (organization_id, customer_id, invoice_id, amount, status)
    select org_a, 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-0000000000f1', 1000, 'verified' from t_ids;
    raise exception 'expected RLS violation on payments insert';
  exception when insufficient_privilege then null;
  end;
end $$;

-- record a manual partial payment
select public.record_payment('aaaaaaaa-0000-0000-0000-0000000000f1', 300, current_date, 'cash', 'REC-1', null);
do $$ begin
  assert (select outstanding_amount from public.invoices where invoice_number = 'F-001') = 700, 'partial payment reduces';
  assert (select status from public.invoices where invoice_number = 'F-001') = 'partially_paid', 'partially_paid status';
end $$;

-- cannot overpay manually
do $$ begin
  begin
    perform public.record_payment('aaaaaaaa-0000-0000-0000-0000000000f1', 800, current_date, 'cash', null, null);
    raise exception 'expected amount_exceeds_balance';
  exception when raise_exception then
    assert sqlerrm = 'amount_exceeds_balance', sqlerrm;
  end;
end $$;

select public.get_or_create_payment_link('aaaaaaaa-0000-0000-0000-0000000000f1') as token \gset
do $$ begin
  assert (select count(*) from public.public_payment_links) = 1, 'link created';
end $$;
select public.get_or_create_payment_link('aaaaaaaa-0000-0000-0000-0000000000f1') = :'token' as reused \gset
\if :reused
\else
  \echo 'FAIL: payment link should be reused'
  select 1/0;
\endif

-- authenticated users cannot call the public RPCs directly
do $$ begin
  begin
    perform public.get_payment_page('x');
    raise exception 'expected permission denied';
  exception when insufficient_privilege then null;
  end;
end $$;

-- ---- act as user B: sees nothing of A
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
do $$ begin
  assert (select count(*) from public.customers) = 0, 'B cannot see A customers';
  assert (select count(*) from public.invoices) = 0, 'B cannot see A invoices';
  assert (select count(*) from public.invoice_overview) = 0, 'B cannot see A invoice view';
  assert (select count(*) from public.customer_overview) = 0, 'B cannot see A customer view';
  assert (select count(*) from public.payments) = 0, 'B cannot see A payments';
  assert (select count(*) from public.public_payment_links) = 0, 'B cannot see A links';
  assert (select count(*) from public.organizations) = 1, 'B sees only own org';
end $$;
update public.invoices set original_amount = 1 where invoice_number = 'F-001';
do $$ begin
  begin
    perform public.record_payment('aaaaaaaa-0000-0000-0000-0000000000f1', 10, current_date, 'cash', null, null);
    raise exception 'expected invoice_not_found';
  exception when no_data_found then null;
  end;
  begin
    perform public.get_or_create_payment_link('aaaaaaaa-0000-0000-0000-0000000000f1');
    raise exception 'expected invoice_not_found';
  exception when no_data_found then null;
  end;
end $$;

-- ---- public flow via service_role
reset role;
set local role service_role;
select set_config('request.jwt.claim.sub', '', true);
do $$ begin
  assert public.get_payment_page('nope') is null, 'invalid token returns null';
end $$;
select (public.get_payment_page(:'token') -> 'invoice' ->> 'outstanding_amount')::numeric = 700 as page_ok \gset
\if :page_ok
\else
  \echo 'FAIL: payment page'
  select 1/0;
\endif
select org_a from t_ids \gset
select (public.submit_payment_proof(:'token', 700, :'org_a' || '/f1/proof.png', 'TRX-9', 'pagado') ->> 'payment_id') as proof_payment \gset
do $$ begin
  begin
    perform public.submit_payment_proof((select token from public.public_payment_links limit 1), 10, 'other-org/x.png');
    raise exception 'expected invalid_proof_path';
  exception when raise_exception then assert sqlerrm = 'invalid_proof_path', sqlerrm;
  end;
end $$;
do $$ begin
  assert (select outstanding_amount from public.invoices where invoice_number = 'F-001') = 700, 'pending proof does not reduce';
end $$;

-- ---- B cannot verify A's payment
reset role;
create temp table t_proof as select :'proof_payment'::uuid as id;
grant select on t_proof to authenticated;
set local role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
do $$ begin
  begin
    perform public.verify_payment((select id from t_proof));
    raise exception 'expected not found';
  exception when no_data_found then null;
  end;
end $$;

-- ---- A verifies once; a second verification is rejected and balance is reduced once
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
select public.verify_payment((select id from t_proof));
do $$ begin
  assert (select outstanding_amount from public.invoices where invoice_number = 'F-001') = 0, 'verified proof pays invoice';
  assert (select status from public.invoices where invoice_number = 'F-001') = 'paid', 'paid status';
  begin
    perform public.verify_payment((select id from t_proof));
    raise exception 'expected payment_already_processed';
  exception when raise_exception then assert sqlerrm = 'payment_already_processed', sqlerrm;
  end;
  begin
    perform public.reject_payment((select id from t_proof), 'x');
    raise exception 'expected payment_already_processed';
  exception when raise_exception then assert sqlerrm = 'payment_already_processed', sqlerrm;
  end;
  assert (select outstanding_amount from public.invoices where invoice_number = 'F-001') = 0, 'still zero, not negative';
  assert (select effective_status from public.invoice_overview where invoice_number = 'F-001') = 'paid', 'paid not overdue';
  assert (select count(*) from public.collection_events where event_type = 'payment_verified') = 2, 'events logged';
end $$;

-- editing the amount re-derives the balance from verified payments
update public.invoices set original_amount = 1500 where invoice_number = 'F-001';
do $$ begin
  assert (select outstanding_amount from public.invoices where invoice_number = 'F-001') = 500, 're-derived after edit';
  assert (select status from public.invoices where invoice_number = 'F-001') = 'partially_paid', 'partially paid after edit';
  assert (select balance from public.customer_overview) = 500, 'customer balance';
end $$;

-- storage policies
reset role;
insert into storage.objects (bucket_id, name) select 'payment-proofs', org_a || '/f1/proof.png' from t_ids;
insert into storage.objects (bucket_id, name) values ('payment-proofs', 'not-a-uuid/x.png');
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
do $$ begin
  assert (select count(*) from storage.objects) = 1, 'A reads own org files only';
end $$;
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
do $$ begin
  assert (select count(*) from storage.objects) = 0, 'B reads no A files';
  begin
    insert into storage.objects (bucket_id, name) select 'org-assets', org_a || '/qr.png' from t_ids;
    raise exception 'expected RLS violation on storage';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into storage.objects (bucket_id, name) select 'payment-proofs', org_b || '/x.png' from t_ids;
    raise exception 'expected RLS violation on proofs';
  exception when insufficient_privilege then null;
  end;
end $$;
insert into storage.objects (bucket_id, name) select 'org-assets', org_b || '/qr.png' from t_ids;

-- anon sees nothing
reset role;
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
do $$ begin
  begin
    perform count(*) from public.invoices;
    raise exception 'expected permission denied for anon';
  exception when insufficient_privilege then null;
  end;
end $$;

reset role;
\o
\echo 'ALL DATABASE TESTS PASSED'
rollback;
