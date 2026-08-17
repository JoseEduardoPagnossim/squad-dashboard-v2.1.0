-- Soften Performance Hub V2.13.0
-- Libera para usuarios autenticados da mesma organizacao:
-- 1) consolidado mensal por Squad;
-- 2) comparativo mensal dos tecnicos de todos os Squads.
-- Nao expoe e-mail, senha, bonus, desconto ou dados de autenticacao.

create or replace function public.get_org_squad_monthly_overview()
returns table (
  squad_code text,
  squad_name text,
  year integer,
  month integer,
  total_att bigint,
  total_eval bigint,
  eval_pct numeric,
  technician_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with me as (
    select p.organization_id
    from public.profiles p
    where p.user_id = (select auth.uid())
      and p.active = true
    limit 1
  )
  select
    s.code::text as squad_code,
    s.name::text as squad_name,
    sm.year,
    sm.month,
    coalesce(sum(tm.att), 0)::bigint as total_att,
    coalesce(sum(tm.total_eval), 0)::bigint as total_eval,
    case when coalesce(sum(tm.att), 0) > 0
      then coalesce(sum(tm.total_eval), 0)::numeric / sum(tm.att)::numeric
      else 0::numeric end as eval_pct,
    count(tm.id)::bigint as technician_count
  from me
  join public.squads s on s.organization_id = me.organization_id and s.active = true
  join public.squad_months sm on sm.squad_id = s.id
  left join public.technician_monthly tm on tm.squad_month_id = sm.id
  group by s.code, s.name, sm.year, sm.month
  order by sm.year, sm.month, s.code;
$$;

revoke all on function public.get_org_squad_monthly_overview() from public;
grant execute on function public.get_org_squad_monthly_overview() to authenticated;

create or replace function public.get_org_technician_monthly_overview()
returns table (
  squad_code text,
  squad_name text,
  year integer,
  month integer,
  technician_name text,
  att bigint,
  total_eval bigint,
  avg_rating numeric,
  eval_pct numeric,
  points numeric,
  status text
)
language sql
stable
security definer
set search_path = public
as $$
  with me as (
    select p.organization_id
    from public.profiles p
    where p.user_id = (select auth.uid())
      and p.active = true
    limit 1
  )
  select
    s.code::text as squad_code,
    s.name::text as squad_name,
    sm.year,
    sm.month,
    tm.technician_name::text,
    coalesce(tm.att,0)::bigint as att,
    coalesce(tm.total_eval,0)::bigint as total_eval,
    coalesce(tm.avg_rating,0)::numeric as avg_rating,
    coalesce(tm.eval_pct,0)::numeric as eval_pct,
    coalesce(tm.points,0)::numeric as points,
    coalesce(tm.status,'')::text as status
  from me
  join public.squads s on s.organization_id = me.organization_id and s.active = true
  join public.squad_months sm on sm.squad_id = s.id
  join public.technician_monthly tm on tm.squad_month_id = sm.id
  where nullif(btrim(tm.technician_name), '') is not null
  order by sm.year, sm.month, s.code, tm.technician_name;
$$;

revoke all on function public.get_org_technician_monthly_overview() from public;
grant execute on function public.get_org_technician_monthly_overview() to authenticated;
