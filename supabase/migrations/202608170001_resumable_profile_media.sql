update storage.buckets
set
  file_size_limit = null,
  allowed_mime_types = array['image/*', 'video/*']
where id = 'avatars';

update storage.buckets
set
  file_size_limit = null,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'video/*']
where id = 'background-assets';

drop policy if exists "background_assets_insert_own_by_plan" on storage.objects;
drop policy if exists "background_assets_update_own_by_plan" on storage.objects;

create policy "background_assets_insert_own_by_plan"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'background-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
  and (
    (
      name = auth.uid()::text || '/background-image'
      and coalesce(metadata->>'mimetype', '') in ('image/jpeg', 'image/png', 'image/webp')
      and coalesce((metadata->>'size')::bigint, 9223372036854775807) <= 20971520
    )
    or (
      name = auth.uid()::text || '/background-video'
      and coalesce(metadata->>'mimetype', '') like 'video/%'
      and public.can_use_pro_features()
    )
  )
);

create policy "background_assets_update_own_by_plan"
on storage.objects for update
to authenticated
using (
  bucket_id = 'background-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
  and name in (
    auth.uid()::text || '/background-image',
    auth.uid()::text || '/background-video'
  )
)
with check (
  bucket_id = 'background-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
  and (
    (
      name = auth.uid()::text || '/background-image'
      and coalesce(metadata->>'mimetype', '') in ('image/jpeg', 'image/png', 'image/webp')
      and coalesce((metadata->>'size')::bigint, 9223372036854775807) <= 20971520
    )
    or (
      name = auth.uid()::text || '/background-video'
      and coalesce(metadata->>'mimetype', '') like 'video/%'
      and public.can_use_pro_features()
    )
  )
);
