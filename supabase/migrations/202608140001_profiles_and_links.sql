create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text not null default '',
  bio text not null default '',
  avatar_url text,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  theme text not null default 'neon',
  primary_color text not null default '#7C3AED',
  secondary_color text not null default '#2563EB',
  font text not null default 'Inter',
  background_type text not null default 'gradient',
  background_value text not null default 'linear-gradient(145deg, #160B2D, #071426)',
  button_style text not null default 'rounded',
  show_branding boolean not null default true,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_length check (char_length(username) between 3 and 30),
  constraint profiles_username_format check (username ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint profiles_username_reserved check (
    username not in (
      'login', 'signup', 'dashboard', 'onboarding', 'checkout', 'pricing',
      'auth', 'api', 'admin', 'settings', 'forgot-password', 'reset-password'
    )
  )
);

create table if not exists public.links (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  url text not null,
  icon text not null default 'link',
  position integer not null default 0 check (position >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint links_title_length check (char_length(title) between 1 and 80),
  constraint links_url_length check (char_length(url) between 4 and 2048)
);

create index if not exists links_profile_position_idx
  on public.links(profile_id, position);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists links_set_updated_at on public.links;
create trigger links_set_updated_at
before update on public.links
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.links enable row level security;

create policy "profiles_select_own"
on public.profiles for select
to authenticated
using (auth.uid() = user_id);

create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check (auth.uid() = user_id);

create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "links_select_own"
on public.links for select
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = links.profile_id
      and profiles.user_id = auth.uid()
  )
);

create policy "links_insert_own"
on public.links for insert
to authenticated
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = links.profile_id
      and profiles.user_id = auth.uid()
  )
);

create policy "links_update_own"
on public.links for update
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = links.profile_id
      and profiles.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = links.profile_id
      and profiles.user_id = auth.uid()
  )
);

create policy "links_delete_own"
on public.links for delete
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = links.profile_id
      and profiles.user_id = auth.uid()
  )
);

create or replace function public.is_profile_published(target_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = target_profile_id
      and is_published = true
  );
$$;

create or replace function public.get_public_profile(profile_username text)
returns table (
  id uuid,
  username text,
  display_name text,
  bio text,
  avatar_url text,
  plan text,
  theme text,
  primary_color text,
  secondary_color text,
  font text,
  background_type text,
  background_value text,
  button_style text,
  show_branding boolean,
  is_published boolean,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    profiles.id,
    profiles.username,
    profiles.display_name,
    profiles.bio,
    profiles.avatar_url,
    profiles.plan,
    profiles.theme,
    profiles.primary_color,
    profiles.secondary_color,
    profiles.font,
    profiles.background_type,
    profiles.background_value,
    profiles.button_style,
    profiles.show_branding,
    profiles.is_published,
    profiles.created_at,
    profiles.updated_at
  from public.profiles
  where profiles.username = lower(profile_username)
    and profiles.is_published = true
  limit 1;
$$;

create policy "links_select_published"
on public.links for select
to anon, authenticated
using (
  is_active = true
  and public.is_profile_published(profile_id)
);

revoke all on function public.is_profile_published(uuid) from public;
revoke all on function public.get_public_profile(text) from public;

grant execute on function public.is_profile_published(uuid) to anon, authenticated;
grant execute on function public.get_public_profile(text) to anon, authenticated;
grant select on public.links to anon;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.links to authenticated;
