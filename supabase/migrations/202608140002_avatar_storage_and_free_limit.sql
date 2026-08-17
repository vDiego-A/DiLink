insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check (
  auth.uid() = user_id
  and plan = 'free'
  and show_branding = true
);

revoke insert, update on public.profiles from authenticated;
grant insert (
  user_id,
  username,
  display_name,
  bio,
  avatar_url,
  theme,
  primary_color,
  secondary_color,
  font,
  background_type,
  background_value,
  button_style,
  is_published
) on public.profiles to authenticated;
grant update (
  username,
  display_name,
  bio,
  avatar_url,
  theme,
  primary_color,
  secondary_color,
  font,
  background_type,
  background_value,
  button_style,
  is_published
) on public.profiles to authenticated;

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read"
on storage.objects for select
to public
using (bucket_id = 'avatars');

drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create or replace function public.enforce_free_link_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_plan text;
  current_link_count integer;
begin
  if exists (select 1 from public.links where id = new.id) then
    return new;
  end if;

  select plan into profile_plan
  from public.profiles
  where id = new.profile_id;

  if profile_plan = 'free' then
    select count(*) into current_link_count
    from public.links
    where profile_id = new.profile_id;

    if current_link_count >= 3 then
      raise exception 'free_link_limit_reached'
        using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_free_link_limit() from public;

drop trigger if exists links_enforce_free_limit on public.links;
create trigger links_enforce_free_limit
before insert on public.links
for each row execute function public.enforce_free_link_limit();
