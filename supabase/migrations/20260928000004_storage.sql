-- CobraYa storage: two private buckets with size and MIME limits enforced by Supabase.
--   org-assets/<org_id>/bank-qr-<uuid>.<ext>       bank QR image (owners/admins upload)
--   payment-proofs/<org_id>/<invoice_id>/<uuid>.<ext> customer proofs (server upload only)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('org-assets', 'org-assets', false, 2097152, array['image/png', 'image/jpeg', 'image/webp']),
  ('payment-proofs', 'payment-proofs', false, 5242880, array['image/png', 'image/jpeg', 'image/webp', 'application/pdf'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Members can read (and create signed URLs for) files of their own organization.
create policy "cobraya: members read org files" on storage.objects
  for select to authenticated
  using (
    bucket_id in ('org-assets', 'payment-proofs')
    and public.is_org_member(public.storage_path_org_id(name))
  );

-- Owners/admins manage organization assets (bank QR).
create policy "cobraya: admins insert org assets" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'org-assets'
    and public.has_org_role(public.storage_path_org_id(name), array['owner', 'admin']::public.member_role[])
  );

create policy "cobraya: admins update org assets" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'org-assets'
    and public.has_org_role(public.storage_path_org_id(name), array['owner', 'admin']::public.member_role[])
  )
  with check (
    bucket_id = 'org-assets'
    and public.has_org_role(public.storage_path_org_id(name), array['owner', 'admin']::public.member_role[])
  );

create policy "cobraya: admins delete org assets" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'org-assets'
    and public.has_org_role(public.storage_path_org_id(name), array['owner', 'admin']::public.member_role[])
  );

-- payment-proofs has no insert policy: only the server (service role) writes there,
-- after validating the public payment token, file type and size.
