create or replace function public.has_active_pro(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    exists (
      select 1
      from public.admin_users
      where admin_users.user_id = target_user_id
    )
    or exists (
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

update public.profiles
set
  plan = 'pro',
  show_branding = false
where user_id in (select user_id from public.admin_users);

comment on function public.has_active_pro(uuid) is 'Comprueba una suscripción Pro vigente o el acceso administrativo interno.';
