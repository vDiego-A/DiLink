create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  link_id uuid references public.links(id) on delete set null,
  event_type text not null check (event_type in ('profile_view', 'link_click')),
  referrer_host text,
  device_type text not null default 'desktop',
  created_at timestamptz not null default now(),
  constraint analytics_referrer_length check (referrer_host is null or char_length(referrer_host) <= 160),
  constraint analytics_device_type_check check (device_type in ('desktop', 'mobile', 'tablet'))
);

alter table public.analytics_events
  add column if not exists referrer_host text;

alter table public.analytics_events
  add column if not exists device_type text not null default 'desktop';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'analytics_referrer_length'
      and conrelid = 'public.analytics_events'::regclass
  ) then
    alter table public.analytics_events
      add constraint analytics_referrer_length
      check (referrer_host is null or char_length(referrer_host) <= 160);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'analytics_device_type_check'
      and conrelid = 'public.analytics_events'::regclass
  ) then
    alter table public.analytics_events
      add constraint analytics_device_type_check
      check (device_type in ('desktop', 'mobile', 'tablet'));
  end if;
end;
$$;

create index if not exists analytics_events_profile_created_idx
  on public.analytics_events(profile_id, created_at desc);

create index if not exists analytics_events_link_created_idx
  on public.analytics_events(link_id, created_at desc)
  where link_id is not null;

alter table public.analytics_events enable row level security;

revoke all on table public.analytics_events from anon, authenticated;

create or replace function public.track_public_analytics_event(
  target_profile_id uuid,
  target_link_id uuid,
  target_event_type text,
  referrer_input text default null,
  device_type_input text default 'desktop'
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  safe_referrer text;
  safe_device text;
begin
  if target_event_type not in ('profile_view', 'link_click') then
    return false;
  end if;

  if not exists (
    select 1
    from public.profiles
    where profiles.id = target_profile_id
      and profiles.is_published = true
  ) then
    return false;
  end if;

  if target_event_type = 'link_click' then
    if target_link_id is null or not exists (
      select 1
      from public.links
      where links.id = target_link_id
        and links.profile_id = target_profile_id
        and links.is_active = true
    ) then
      return false;
    end if;
  else
    target_link_id := null;
  end if;

  safe_referrer := nullif(left(btrim(coalesce(referrer_input, '')), 160), '');
  safe_device := case
    when device_type_input in ('desktop', 'mobile', 'tablet') then device_type_input
    else 'desktop'
  end;

  insert into public.analytics_events (
    profile_id,
    link_id,
    event_type,
    referrer_host,
    device_type
  ) values (
    target_profile_id,
    target_link_id,
    target_event_type,
    safe_referrer,
    safe_device
  );

  return true;
end;
$$;

create or replace function public.get_my_analytics_overview(target_profile_id uuid)
returns table (
  total_views bigint,
  total_clicks bigint,
  period_views bigint,
  period_clicks bigint
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null or not exists (
    select 1
    from public.profiles
    where profiles.id = target_profile_id
      and profiles.user_id = auth.uid()
  ) then
    raise exception 'analytics_access_denied' using errcode = 'P0001';
  end if;

  return query
  select
    count(*) filter (where analytics_events.event_type = 'profile_view'),
    count(*) filter (where analytics_events.event_type = 'link_click'),
    count(*) filter (
      where analytics_events.event_type = 'profile_view'
        and analytics_events.created_at >= now() - interval '30 days'
    ),
    count(*) filter (
      where analytics_events.event_type = 'link_click'
        and analytics_events.created_at >= now() - interval '30 days'
    )
  from public.analytics_events
  where analytics_events.profile_id = target_profile_id;
end;
$$;

create or replace function public.get_my_analytics_daily(
  target_profile_id uuid,
  days_input integer default 30
)
returns table (
  event_day date,
  views bigint,
  clicks bigint
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  safe_days integer := greatest(7, least(coalesce(days_input, 30), 90));
begin
  if auth.uid() is null or not exists (
    select 1
    from public.profiles
    where profiles.id = target_profile_id
      and profiles.user_id = auth.uid()
  ) then
    raise exception 'analytics_access_denied' using errcode = 'P0001';
  end if;

  if not public.has_active_pro(auth.uid()) then
    raise exception 'pro_feature_required' using errcode = 'P0001';
  end if;

  return query
  with days as (
    select generate_series(
      current_date - (safe_days - 1),
      current_date,
      interval '1 day'
    )::date as day
  )
  select
    days.day,
    count(analytics_events.id) filter (where analytics_events.event_type = 'profile_view'),
    count(analytics_events.id) filter (where analytics_events.event_type = 'link_click')
  from days
  left join public.analytics_events
    on analytics_events.profile_id = target_profile_id
    and analytics_events.created_at >= days.day
    and analytics_events.created_at < days.day + interval '1 day'
  group by days.day
  order by days.day;
end;
$$;

create or replace function public.get_my_link_analytics(
  target_profile_id uuid,
  days_input integer default 30
)
returns table (
  analytics_link_id uuid,
  analytics_link_title text,
  click_count bigint
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  safe_days integer := greatest(7, least(coalesce(days_input, 30), 90));
begin
  if auth.uid() is null or not exists (
    select 1
    from public.profiles
    where profiles.id = target_profile_id
      and profiles.user_id = auth.uid()
  ) then
    raise exception 'analytics_access_denied' using errcode = 'P0001';
  end if;

  if not public.has_active_pro(auth.uid()) then
    raise exception 'pro_feature_required' using errcode = 'P0001';
  end if;

  return query
  select
    links.id,
    links.title,
    count(analytics_events.id)
  from public.links
  left join public.analytics_events
    on analytics_events.link_id = links.id
    and analytics_events.event_type = 'link_click'
    and analytics_events.created_at >= now() - make_interval(days => safe_days)
  where links.profile_id = target_profile_id
  group by links.id, links.title, links.position
  order by count(analytics_events.id) desc, links.position;
end;
$$;

revoke all on function public.track_public_analytics_event(uuid, uuid, text, text, text) from public;
revoke all on function public.get_my_analytics_overview(uuid) from public;
revoke all on function public.get_my_analytics_daily(uuid, integer) from public;
revoke all on function public.get_my_link_analytics(uuid, integer) from public;

grant execute on function public.track_public_analytics_event(uuid, uuid, text, text, text) to anon, authenticated;
grant execute on function public.get_my_analytics_overview(uuid) to authenticated;
grant execute on function public.get_my_analytics_daily(uuid, integer) to authenticated;
grant execute on function public.get_my_link_analytics(uuid, integer) to authenticated;

comment on table public.analytics_events is 'Eventos mínimos de visitas públicas y clics de DiLink.';
comment on function public.track_public_analytics_event(uuid, uuid, text, text, text) is 'Registra solamente eventos válidos de perfiles publicados.';
comment on function public.get_my_analytics_overview(uuid) is 'Entrega el resumen básico al propietario del perfil.';
comment on function public.get_my_analytics_daily(uuid, integer) is 'Entrega la serie diaria únicamente a cuentas Pro.';
comment on function public.get_my_link_analytics(uuid, integer) is 'Entrega clics por enlace únicamente a cuentas Pro.';
