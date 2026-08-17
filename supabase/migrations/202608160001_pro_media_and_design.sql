create or replace function public.can_use_pro_features()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.has_active_pro(auth.uid());
$$;

revoke all on function public.can_use_pro_features() from public;
grant execute on function public.can_use_pro_features() to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'background-assets',
  'background-assets',
  true,
  26214400,
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "background_assets_public_read" on storage.objects;
create policy "background_assets_public_read"
on storage.objects for select
to public
using (bucket_id = 'background-assets');

drop policy if exists "background_assets_insert_own_pro" on storage.objects;
create policy "background_assets_insert_own_pro"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'background-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.can_use_pro_features()
);

drop policy if exists "background_assets_update_own_pro" on storage.objects;
create policy "background_assets_update_own_pro"
on storage.objects for update
to authenticated
using (
  bucket_id = 'background-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.can_use_pro_features()
)
with check (
  bucket_id = 'background-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.can_use_pro_features()
);

drop policy if exists "background_assets_delete_own" on storage.objects;
create policy "background_assets_delete_own"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'background-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create or replace function public.enforce_profile_plan_capabilities()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  effective_plan text := 'free';
begin
  if public.has_active_pro(new.user_id) then
    effective_plan := 'pro';
  end if;

  if new.theme not in ('neon', 'minimal', 'aurora', 'sunset', 'professional', 'clean')
    or new.button_style not in (
      'rounded', 'pill', 'square', 'outline', 'glass', 'glow',
      'liquid-glass', 'neon-outline', 'soft-3d', 'gradient'
    )
    or new.font not in (
      'Inter', 'Poppins', 'Roboto', 'Space Grotesk', 'Manrope', 'DM Sans',
      'Plus Jakarta Sans', 'Outfit', 'Playfair Display', 'Caveat', 'Bebas Neue', 'Pacifico'
    )
    or new.primary_color !~ '^#[0-9A-Fa-f]{6}$'
    or new.secondary_color !~ '^#[0-9A-Fa-f]{6}$'
    or not (
      (new.background_type = 'theme' and new.background_value = '')
      or (new.background_type = 'solid' and new.background_value ~ '^#[0-9A-Fa-f]{6}$')
      or (new.background_type = 'gradient' and new.background_value ~ '^#[0-9A-Fa-f]{6},#[0-9A-Fa-f]{6}$')
      or (
        new.background_type = 'image'
        and new.background_value ~ ('^https?://.+/storage/v1/object/public/background-assets/' || new.user_id::text || '/background-image([?].*)?$')
      )
      or (
        new.background_type = 'video'
        and new.background_value ~ ('^https?://.+/storage/v1/object/public/background-assets/' || new.user_id::text || '/background-video([?].*)?$')
      )
    ) then
    raise exception 'invalid_design' using errcode = 'P0001';
  end if;

  if effective_plan = 'free' and (
    new.theme not in ('neon', 'minimal', 'aurora')
    or new.button_style not in ('rounded', 'pill', 'square', 'outline')
    or new.font not in ('Inter', 'Poppins', 'Roboto')
    or new.background_type in ('image', 'video')
    or (upper(new.primary_color), upper(new.secondary_color)) not in (
      ('#7C3AED', '#2563EB'),
      ('#0369A1', '#22D3EE'),
      ('#059669', '#22D3EE'),
      ('#F97316', '#EC4899')
    )
  ) then
    if tg_op = 'UPDATE' and old.plan = 'pro' then
      new.theme := 'neon';
      new.primary_color := '#7C3AED';
      new.secondary_color := '#2563EB';
      new.font := 'Inter';
      new.background_type := 'theme';
      new.background_value := '';
      new.button_style := 'rounded';
    else
      raise exception 'pro_feature_required' using errcode = 'P0001';
    end if;
  end if;

  new.plan := effective_plan;
  new.show_branding := (effective_plan = 'free');
  new.primary_color := upper(new.primary_color);
  new.secondary_color := upper(new.secondary_color);
  if new.background_type in ('solid', 'gradient') then
    new.background_value := upper(new.background_value);
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_profile_plan_capabilities() from public;

drop trigger if exists profiles_enforce_plan_capabilities on public.profiles;
create trigger profiles_enforce_plan_capabilities
before insert or update on public.profiles
for each row execute function public.enforce_profile_plan_capabilities();

create or replace function public.save_profile_editor(
  profile_username text,
  profile_display_name text,
  profile_bio text,
  profile_avatar_url text,
  profile_theme text,
  profile_primary_color text,
  profile_secondary_color text,
  profile_font text,
  profile_button_style text,
  profile_background_type text,
  profile_background_value text,
  profile_links jsonb
)
returns table (
  saved_profile_id uuid,
  saved_username text,
  saved_is_published boolean
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  current_profile_id uuid;
  current_plan text := 'free';
  link_item jsonb;
  link_count integer;
  saved_background_value text;
begin
  if current_user_id is null then
    raise exception 'authentication_required' using errcode = 'P0001';
  end if;

  select profiles.id
  into current_profile_id
  from public.profiles
  where profiles.user_id = current_user_id;

  if current_profile_id is null then
    raise exception 'profile_not_found' using errcode = 'P0001';
  end if;

  if public.has_active_pro(current_user_id) then
    current_plan := 'pro';
  end if;

  if profile_username !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    or char_length(profile_username) not between 3 and 30
    or profile_username in (
      'login', 'signup', 'dashboard', 'onboarding', 'checkout', 'pricing',
      'auth', 'api', 'admin', 'settings', 'forgot-password', 'reset-password'
    ) then
    raise exception 'invalid_username' using errcode = 'P0001';
  end if;

  if char_length(btrim(profile_display_name)) not between 2 and 60 then
    raise exception 'invalid_display_name' using errcode = 'P0001';
  end if;

  if char_length(profile_bio) > 160 then
    raise exception 'invalid_bio' using errcode = 'P0001';
  end if;

  if profile_theme not in ('neon', 'minimal', 'aurora', 'sunset', 'professional', 'clean')
    or profile_button_style not in (
      'rounded', 'pill', 'square', 'outline', 'glass', 'glow',
      'liquid-glass', 'neon-outline', 'soft-3d', 'gradient'
    )
    or profile_font not in (
      'Inter', 'Poppins', 'Roboto', 'Space Grotesk', 'Manrope', 'DM Sans',
      'Plus Jakarta Sans', 'Outfit', 'Playfair Display', 'Caveat', 'Bebas Neue', 'Pacifico'
    )
    or profile_primary_color !~ '^#[0-9A-Fa-f]{6}$'
    or profile_secondary_color !~ '^#[0-9A-Fa-f]{6}$' then
    raise exception 'invalid_design' using errcode = 'P0001';
  end if;

  if not (
    (profile_background_type = 'theme' and profile_background_value = '')
    or (profile_background_type = 'solid' and profile_background_value ~ '^#[0-9A-Fa-f]{6}$')
    or (profile_background_type = 'gradient' and profile_background_value ~ '^#[0-9A-Fa-f]{6},#[0-9A-Fa-f]{6}$')
    or (
      profile_background_type = 'image'
      and profile_background_value ~ ('^https?://.+/storage/v1/object/public/background-assets/' || current_user_id::text || '/background-image([?].*)?$')
    )
    or (
      profile_background_type = 'video'
      and profile_background_value ~ ('^https?://.+/storage/v1/object/public/background-assets/' || current_user_id::text || '/background-video([?].*)?$')
    )
  ) then
    raise exception 'invalid_background' using errcode = 'P0001';
  end if;

  if current_plan = 'free' and (
    profile_theme not in ('neon', 'minimal', 'aurora')
    or profile_button_style not in ('rounded', 'pill', 'square', 'outline')
    or profile_font not in ('Inter', 'Poppins', 'Roboto')
    or profile_background_type in ('image', 'video')
    or (upper(profile_primary_color), upper(profile_secondary_color)) not in (
      ('#7C3AED', '#2563EB'),
      ('#0369A1', '#22D3EE'),
      ('#059669', '#22D3EE'),
      ('#F97316', '#EC4899')
    )
  ) then
    raise exception 'pro_feature_required' using errcode = 'P0001';
  end if;

  if profile_avatar_url is not null
    and profile_avatar_url !~ ('^https?://.+/storage/v1/object/public/avatars/' || current_user_id::text || '/avatar([?].*)?$') then
    raise exception 'invalid_avatar' using errcode = 'P0001';
  end if;

  if jsonb_typeof(profile_links) <> 'array' then
    raise exception 'invalid_links' using errcode = 'P0001';
  end if;

  link_count := jsonb_array_length(profile_links);
  if current_plan = 'free' and link_count > 3 then
    raise exception 'free_link_limit_reached' using errcode = 'P0001';
  end if;

  if (
    select count(*) <> count(distinct item->>'id')
    from jsonb_array_elements(profile_links) as item
  ) then
    raise exception 'duplicate_link_id' using errcode = 'P0001';
  end if;

  for link_item in select value from jsonb_array_elements(profile_links)
  loop
    if coalesce(link_item->>'id', '') !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$'
      or char_length(btrim(coalesce(link_item->>'title', ''))) not between 1 and 80
      or char_length(coalesce(link_item->>'url', '')) not between 4 and 2048
      or coalesce(link_item->>'url', '') !~ '^https?://[^[:space:]]+$'
      or coalesce(link_item->>'icon', '') not in (
        'link', 'website', 'instagram', 'tiktok', 'youtube', 'whatsapp',
        'facebook', 'x', 'linkedin', 'spotify', 'email'
      ) then
      raise exception 'invalid_link' using errcode = 'P0001';
    end if;
  end loop;

  if exists (
    select 1
    from public.links
    join jsonb_array_elements(profile_links) as item
      on public.links.id = (item->>'id')::uuid
    where public.links.profile_id <> current_profile_id
  ) then
    raise exception 'foreign_link_id' using errcode = 'P0001';
  end if;

  saved_background_value := case
    when profile_background_type in ('solid', 'gradient') then upper(profile_background_value)
    else profile_background_value
  end;

  update public.profiles
  set
    username = profile_username,
    display_name = btrim(profile_display_name),
    bio = btrim(profile_bio),
    avatar_url = profile_avatar_url,
    plan = current_plan,
    theme = profile_theme,
    primary_color = upper(profile_primary_color),
    secondary_color = upper(profile_secondary_color),
    font = profile_font,
    background_type = profile_background_type,
    background_value = saved_background_value,
    button_style = profile_button_style,
    show_branding = (current_plan = 'free'),
    is_published = true
  where id = current_profile_id;

  delete from public.links
  where public.links.profile_id = current_profile_id
    and not exists (
      select 1
      from jsonb_array_elements(profile_links) as item
      where (item->>'id')::uuid = public.links.id
    );

  insert into public.links (
    id,
    profile_id,
    title,
    url,
    icon,
    position,
    is_active
  )
  select
    (item.value->>'id')::uuid,
    current_profile_id,
    btrim(item.value->>'title'),
    item.value->>'url',
    item.value->>'icon',
    (item.ordinality - 1)::integer,
    coalesce((item.value->>'is_active')::boolean, true)
  from jsonb_array_elements(profile_links) with ordinality as item(value, ordinality)
  on conflict (id) do update set
    title = excluded.title,
    url = excluded.url,
    icon = excluded.icon,
    position = excluded.position,
    is_active = excluded.is_active
  where public.links.profile_id = current_profile_id;

  return query
  select current_profile_id, profile_username, true;
end;
$$;

revoke all on function public.save_profile_editor(
  text, text, text, text, text, text, text, text, text, text, text, jsonb
) from public;

grant execute on function public.save_profile_editor(
  text, text, text, text, text, text, text, text, text, text, text, jsonb
) to authenticated;

comment on function public.save_profile_editor(
  text, text, text, text, text, text, text, text, text, text, text, jsonb
) is 'Guarda el editor con tipografías, botones y fondos multimedia protegidos por el plan vigente.';
