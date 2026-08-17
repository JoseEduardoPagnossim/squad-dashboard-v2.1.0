-- Soften Performance Hub V2.14.0
-- Consolidado diario de atendimentos por Squad para usuarios autenticados da mesma organizacao.
-- Retorna somente totais agregados por Squad/dia. Nao expoe dados individuais.

create or replace function public.get_org_daily_attendance_overview()
returns table (
  squad_code text,
  year integer,
  month integer,
  day integer,
  total_att bigint
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
    sm.year,
    sm.month,
    dm.day,
    coalesce(sum(dm.att),0)::bigint as total_att
  from me
  join public.squads s
    on s.organization_id = me.organization_id
   and s.active = true
  join public.squad_months sm
    on sm.squad_id = s.id
  join public.technician_monthly tm
    on tm.squad_month_id = sm.id
  join public.daily_metrics dm
    on dm.technician_month_id = tm.id
   and dm.day <= sm.latest_day
   and coalesce(dm.off,false) = false
  group by s.code, sm.year, sm.month, dm.day
  order by sm.year, sm.month, dm.day, s.code;
$$;

revoke all on function public.get_org_daily_attendance_overview() from public;
grant execute on function public.get_org_daily_attendance_overview() to authenticated;
