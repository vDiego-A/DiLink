alter table public.profiles
  alter column background_type set default 'theme',
  alter column background_value set default '';

update public.profiles
set
  background_type = 'theme',
  background_value = ''
where background_type = 'gradient'
  and background_value = 'linear-gradient(145deg, #160B2D, #071426)';

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
    or new.button_style not in ('rounded', 'pill', 'square', 'outline', 'glass', 'glow')
    or new.font not in ('Inter', 'Poppins', 'Roboto', 'Space Grotesk', 'Manrope', 'DM Sans', 'Plus Jakarta Sans', 'Outfit')
    or new.primary_color !~ '^#[0-9A-Fa-f]{6}$'
    or new.secondary_color !~ '^#[0-9A-Fa-f]{6}$'
    or not (
      (new.background_type = 'theme' and new.background_value = '')
      or (new.background_type = 'solid' and new.background_value ~ '^#[0-9A-Fa-f]{6}$')
      or (new.background_type = 'gradient' and new.background_value ~ '^#[0-9A-Fa-f]{6},#[0-9A-Fa-f]{6}$')
    ) then
    raise exception 'invalid_design' using errcode = 'P0001';
  end if;

  if effective_plan = 'free' and (
    new.theme not in ('neon', 'minimal', 'aurora')
    or new.button_style not in ('rounded', 'pill', 'square', 'outline')
    or new.font not in ('Inter', 'Poppins', 'Roboto')
    or new.background_type <> 'theme'
    or new.background_value <> ''
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
  new.background_value := upper(new.background_value);
  return new;
end;
$$;

revoke all on function public.enforce_profile_plan_capabilities() from public;

drop trigger if exists profiles_apply_subscription on public.profiles;
drop trigger if exists profiles_enforce_plan_capabilities on public.profiles;
create trigger profiles_enforce_plan_capabilities
before insert or update on public.profiles
for each row execute function public.enforce_profile_plan_capabilities();

create or replace function public.sync_my_plan()
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  effective_plan text := 'free';
  current_profile_id uuid;
begin
  if current_user_id is null then
    raise exception 'authentication_required' using errcode = 'P0001';
  end if;

  update public.subscriptions
  set status = 'expired'
  where user_id = current_user_id
    and status = 'active'
    and current_period_end is not null
    and current_period_end <= now();

  if public.has_active_pro(current_user_id) then
    effective_plan := 'pro';
  end if;

  update public.profiles
  set
    plan = effective_plan,
    show_branding = (effective_plan = 'free')
  where user_id = current_user_id
    and (plan <> effective_plan or show_branding <> (effective_plan = 'free'))
  returning id into current_profile_id;

  if effective_plan = 'free' then
    if current_profile_id is null then
      select id into current_profile_id
      from public.profiles
      where user_id = current_user_id;
    end if;

    update public.links
    set is_active = false
    where profile_id = current_profile_id
      and position >= 3
      and is_active = true;
  end if;

  return effective_plan;
end;
$$;

revoke all on function public.sync_my_plan() from public;
grant execute on function public.sync_my_plan() to authenticated;

drop function if exists public.save_profile_editor(
  text, text, text, text, text, text, text, text, text, jsonb
);

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
    or profile_button_style not in ('rounded', 'pill', 'square', 'outline', 'glass', 'glow')
    or profile_font not in ('Inter', 'Poppins', 'Roboto', 'Space Grotesk', 'Manrope', 'DM Sans', 'Plus Jakarta Sans', 'Outfit')
    or profile_primary_color !~ '^#[0-9A-Fa-f]{6}$'
    or profile_secondary_color !~ '^#[0-9A-Fa-f]{6}$' then
    raise exception 'invalid_design' using errcode = 'P0001';
  end if;

  if current_plan = 'free' then
    if profile_theme not in ('neon', 'minimal', 'aurora')
      or profile_button_style not in ('rounded', 'pill', 'square', 'outline')
      or profile_font not in ('Inter', 'Poppins', 'Roboto')
      or profile_background_type <> 'theme'
      or profile_background_value <> ''
      or (upper(profile_primary_color), upper(profile_secondary_color)) not in (
        ('#7C3AED', '#2563EB'),
        ('#0369A1', '#22D3EE'),
        ('#059669', '#22D3EE'),
        ('#F97316', '#EC4899')
      ) then
      raise exception 'pro_feature_required' using errcode = 'P0001';
    end if;
  else
    if not (
      (profile_background_type = 'theme' and profile_background_value = '')
      or (profile_background_type = 'solid' and profile_background_value ~ '^#[0-9A-Fa-f]{6}$')
      or (profile_background_type = 'gradient' and profile_background_value ~ '^#[0-9A-Fa-f]{6},#[0-9A-Fa-f]{6}$')
    ) then
      raise exception 'invalid_background' using errcode = 'P0001';
    end if;
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
    plan = current_plan,
    theme = profile_theme,
    primary_color = upper(profile_primary_color),
    secondary_color = upper(profile_secondary_color),
    font = profile_font,
    background_type = profile_background_type,
    background_value = upper(profile_background_value),
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
) is 'Guarda el editor de forma atómica y aplica las capacidades Free o Pro desde la suscripción vigente.';

create or replace function public.enforce_free_link_limit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  profile_owner_id uuid;
  current_link_count integer;
begin
  if exists (select 1 from public.links where id = new.id) then
    return new;
  end if;

  select user_id into profile_owner_id
  from public.profiles
  where id = new.profile_id;

  if not public.has_active_pro(profile_owner_id) then
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
