-- Soften Performance Hub V2.11.0
-- Visão mensal consolidada por Squad para usuários autenticados da mesma organização.
-- Retorna apenas dados agregados de equipe; não expõe técnicos de outros Squads.

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
    case
      when coalesce(sum(tm.att), 0) > 0
        then coalesce(sum(tm.total_eval), 0)::numeric / sum(tm.att)::numeric
      else 0::numeric
    end as eval_pct,
    count(tm.id)::bigint as technician_count
  from me
  join public.squads s
    on s.organization_id = me.organization_id
   and s.active = true
  join public.squad_months sm
    on sm.squad_id = s.id
  left join public.technician_monthly tm
    on tm.squad_month_id = sm.id
  group by s.code, s.name, sm.year, sm.month
  order by sm.year, sm.month, s.code;
$$;

revoke all on function public.get_org_squad_monthly_overview() from public;
grant execute on function public.get_org_squad_monthly_overview() to authenticated;
