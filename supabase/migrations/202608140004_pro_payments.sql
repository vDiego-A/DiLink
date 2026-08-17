create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

drop policy if exists "admin_users_select_self" on public.admin_users;
create policy "admin_users_select_self"
on public.admin_users for select
to authenticated
using (auth.uid() = user_id);

revoke all on public.admin_users from anon, authenticated;
grant select on public.admin_users to authenticated;

create or replace function public.is_dilink_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.admin_users
    where admin_users.user_id = auth.uid()
  );
$$;

revoke all on function public.is_dilink_admin() from public;
grant execute on function public.is_dilink_admin() to authenticated;

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  plan text not null default 'pro' check (plan in ('free', 'pro')),
  status text not null default 'active' check (status in ('active', 'expired', 'cancelled')),
  provider text not null default 'pago_movil',
  provider_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

alter table public.subscriptions enable row level security;

drop policy if exists "subscriptions_select_own_or_admin" on public.subscriptions;
create policy "subscriptions_select_own_or_admin"
on public.subscriptions for select
to authenticated
using (auth.uid() = user_id or public.is_dilink_admin());

revoke all on public.subscriptions from anon, authenticated;
grant select on public.subscriptions to authenticated;

create table if not exists public.payment_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  method text not null default 'pago_movil' check (method = 'pago_movil'),
  payer_phone text not null,
  reference text not null,
  amount_usd numeric(10, 2) not null default 1.99 check (amount_usd = 1.99),
  amount_ves numeric(12, 2) not null default 1500 check (amount_ves = 1500),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  reviewer_id uuid references auth.users(id) on delete set null,
  review_note text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payment_requests_phone_format check (payer_phone ~ '^[0-9]{10,15}$'),
  constraint payment_requests_reference_format check (reference ~ '^[0-9]{4,12}$'),
  constraint payment_requests_review_note_length check (review_note is null or char_length(review_note) <= 300)
);

create unique index if not exists payment_requests_one_pending_per_user_idx
  on public.payment_requests(user_id)
  where status = 'pending';

create index if not exists payment_requests_status_created_idx
  on public.payment_requests(status, created_at desc);

drop trigger if exists payment_requests_set_updated_at on public.payment_requests;
create trigger payment_requests_set_updated_at
before update on public.payment_requests
for each row execute function public.set_updated_at();

alter table public.payment_requests enable row level security;

drop policy if exists "payment_requests_select_own_or_admin" on public.payment_requests;
create policy "payment_requests_select_own_or_admin"
on public.payment_requests for select
to authenticated
using (auth.uid() = user_id or public.is_dilink_admin());

revoke all on public.payment_requests from anon, authenticated;
grant select on public.payment_requests to authenticated;

create or replace function public.has_active_pro(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.subscriptions
    where subscriptions.user_id = target_user_id
      and subscriptions.plan = 'pro'
      and subscriptions.status = 'active'
      and (
        subscriptions.current_period_end is null
        or subscriptions.current_period_end > now()
      )
  );
$$;

revoke all on function public.has_active_pro(uuid) from public;

create or replace function public.sync_my_plan()
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  effective_plan text := 'free';
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
    and (plan <> effective_plan or show_branding <> (effective_plan = 'free'));

  return effective_plan;
end;
$$;

revoke all on function public.sync_my_plan() from public;
grant execute on function public.sync_my_plan() to authenticated;

create or replace function public.apply_subscription_to_profile()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if public.has_active_pro(new.user_id) then
    new.plan := 'pro';
    new.show_branding := false;
  else
    new.plan := 'free';
    new.show_branding := true;
  end if;

  return new;
end;
$$;

revoke all on function public.apply_subscription_to_profile() from public;

drop trigger if exists profiles_apply_subscription on public.profiles;
create trigger profiles_apply_subscription
before insert on public.profiles
for each row execute function public.apply_subscription_to_profile();

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check (
  auth.uid() = user_id
  and (
    (plan = 'free' and show_branding = true)
    or (plan = 'pro' and show_branding = false)
  )
);

create or replace function public.submit_pro_payment(
  payer_phone_input text,
  payment_reference_input text
)
returns table (
  payment_id uuid,
  payment_status text,
  submitted_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  normalized_phone text;
  normalized_reference text;
  current_profile_id uuid;
  pending_id uuid;
begin
  if current_user_id is null then
    raise exception 'authentication_required' using errcode = 'P0001';
  end if;

  if public.has_active_pro(current_user_id) then
    raise exception 'already_pro' using errcode = 'P0001';
  end if;

  normalized_phone := regexp_replace(coalesce(payer_phone_input, ''), '[^0-9]', '', 'g');
  normalized_reference := regexp_replace(coalesce(payment_reference_input, ''), '[^0-9]', '', 'g');

  if normalized_phone !~ '^[0-9]{10,15}$' then
    raise exception 'invalid_payer_phone' using errcode = 'P0001';
  end if;

  if normalized_reference !~ '^[0-9]{4,12}$' then
    raise exception 'invalid_payment_reference' using errcode = 'P0001';
  end if;

  select profiles.id
  into current_profile_id
  from public.profiles
  where profiles.user_id = current_user_id;

  select payment_requests.id
  into pending_id
  from public.payment_requests
  where payment_requests.user_id = current_user_id
    and payment_requests.status = 'pending'
  for update;

  if pending_id is not null then
    update public.payment_requests
    set
      profile_id = current_profile_id,
      payer_phone = normalized_phone,
      reference = normalized_reference,
      review_note = null,
      updated_at = now()
    where id = pending_id;
  else
    insert into public.payment_requests (
      user_id,
      profile_id,
      payer_phone,
      reference
    ) values (
      current_user_id,
      current_profile_id,
      normalized_phone,
      normalized_reference
    )
    returning id into pending_id;
  end if;

  return query
  select payment_requests.id, payment_requests.status, payment_requests.created_at
  from public.payment_requests
  where payment_requests.id = pending_id;
end;
$$;

revoke all on function public.submit_pro_payment(text, text) from public;
grant execute on function public.submit_pro_payment(text, text) to authenticated;

create or replace function public.cancel_my_pending_payment()
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  cancelled_count integer;
begin
  if current_user_id is null then
    raise exception 'authentication_required' using errcode = 'P0001';
  end if;

  update public.payment_requests
  set status = 'cancelled'
  where user_id = current_user_id
    and status = 'pending';

  get diagnostics cancelled_count = row_count;
  return cancelled_count > 0;
end;
$$;

revoke all on function public.cancel_my_pending_payment() from public;
grant execute on function public.cancel_my_pending_payment() to authenticated;

create or replace function public.review_pro_payment(
  payment_request_id uuid,
  review_decision text,
  review_note_input text default null
)
returns table (
  reviewed_payment_id uuid,
  reviewed_status text,
  subscription_period_end timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_reviewer_id uuid := auth.uid();
  payment_user_id uuid;
  payment_status text;
  period_end timestamptz;
begin
  if current_reviewer_id is null or not public.is_dilink_admin() then
    raise exception 'admin_required' using errcode = 'P0001';
  end if;

  if review_decision not in ('approved', 'rejected') then
    raise exception 'invalid_review_decision' using errcode = 'P0001';
  end if;

  if review_note_input is not null and char_length(review_note_input) > 300 then
    raise exception 'invalid_review_note' using errcode = 'P0001';
  end if;

  select payment_requests.user_id, payment_requests.status
  into payment_user_id, payment_status
  from public.payment_requests
  where payment_requests.id = payment_request_id
  for update;

  if payment_user_id is null then
    raise exception 'payment_not_found' using errcode = 'P0001';
  end if;

  if payment_status <> 'pending' then
    raise exception 'payment_already_reviewed' using errcode = 'P0001';
  end if;

  update public.payment_requests
  set
    status = review_decision,
    reviewer_id = current_reviewer_id,
    review_note = nullif(btrim(coalesce(review_note_input, '')), ''),
    reviewed_at = now()
  where id = payment_request_id;

  if review_decision = 'approved' then
    period_end := now() + interval '30 days';

    insert into public.subscriptions (
      user_id,
      plan,
      status,
      provider,
      provider_subscription_id,
      current_period_end
    ) values (
      payment_user_id,
      'pro',
      'active',
      'pago_movil',
      payment_request_id::text,
      period_end
    )
    on conflict (user_id) do update set
      plan = 'pro',
      status = 'active',
      provider = 'pago_movil',
      provider_subscription_id = payment_request_id::text,
      current_period_end = period_end;

    update public.profiles
    set
      plan = 'pro',
      show_branding = false
    where user_id = payment_user_id;
  end if;

  return query
  select payment_request_id, review_decision, period_end;
end;
$$;

revoke all on function public.review_pro_payment(uuid, text, text) from public;
grant execute on function public.review_pro_payment(uuid, text, text) to authenticated;

comment on table public.payment_requests is 'Reportes de Pago Móvil para la activación manual de DiLink Pro.';
comment on table public.subscriptions is 'Fuente de verdad del acceso Pro y su vigencia.';
comment on table public.admin_users is 'Usuarios autorizados para revisar pagos; solo se administra desde Supabase.';
comment on function public.review_pro_payment(uuid, text, text) is 'Aprueba o rechaza un pago y activa Pro durante 30 días. Solo administradores.';
