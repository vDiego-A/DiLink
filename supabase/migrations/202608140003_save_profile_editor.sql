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
  current_plan text;
  link_item jsonb;
  link_count integer;
begin
  if current_user_id is null then
    raise exception 'authentication_required' using errcode = 'P0001';
  end if;

  select profiles.id, profiles.plan
  into current_profile_id, current_plan
  from public.profiles
  where profiles.user_id = current_user_id;

  if current_profile_id is null then
    raise exception 'profile_not_found' using errcode = 'P0001';
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

  if profile_theme not in ('neon', 'minimal', 'aurora')
    or profile_button_style not in ('rounded', 'pill', 'square', 'outline')
    or profile_font not in ('Inter', 'Poppins', 'Roboto')
    or profile_primary_color !~ '^#[0-9A-Fa-f]{6}$'
    or profile_secondary_color !~ '^#[0-9A-Fa-f]{6}$' then
    raise exception 'invalid_design' using errcode = 'P0001';
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

  update public.profiles
  set
    username = profile_username,
    display_name = btrim(profile_display_name),
    bio = btrim(profile_bio),
    avatar_url = profile_avatar_url,
    theme = profile_theme,
    primary_color = upper(profile_primary_color),
    secondary_color = upper(profile_secondary_color),
    font = profile_font,
    button_style = profile_button_style,
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
  text, text, text, text, text, text, text, text, text, jsonb
) from public;

grant execute on function public.save_profile_editor(
  text, text, text, text, text, text, text, text, text, jsonb
) to authenticated;

comment on function public.save_profile_editor(
  text, text, text, text, text, text, text, text, text, jsonb
) is 'Guarda y publica de forma atómica el perfil y los enlaces del usuario autenticado.';
