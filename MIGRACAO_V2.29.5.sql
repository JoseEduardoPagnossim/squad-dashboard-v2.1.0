-- Soften Performance Hub V2.29.5
-- Atendimentos nao elegiveis a avaliacao.
-- Mantem a producao integral e retira somente atendimentos sem envio de e-mail
-- dos denominadores de % de avaliacao e % de Notas 5.

begin;

alter table if exists public.technician_monthly
  add column if not exists evaluation_excluded_att numeric(12,2) not null default 0;

comment on column public.technician_monthly.evaluation_excluded_att is
  'Atendimentos da competencia que nao disparam e-mail de avaliacao. Permanecem na producao e sao retirados apenas dos denominadores das taxas de avaliacao/Notas 5.';

-- Consolidado mensal por Squad: taxa usa a base elegivel da competencia.
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
      when coalesce(sum(greatest(tm.att - coalesce(tm.evaluation_excluded_att,0),0)),0) > 0
        then coalesce(sum(tm.total_eval),0)::numeric
             / sum(greatest(tm.att - coalesce(tm.evaluation_excluded_att,0),0))::numeric
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

-- Ranking do tecnico: o ajuste e mensal, portanto e aplicado somente para
-- competencias inteiras contidas no intervalo. Recortes parciais continuam brutos.
drop function if exists public.get_my_squad_game_ranking(date,date);

create function public.get_my_squad_game_ranking(
  p_start_date date,
  p_end_date date
)
returns table (
  technician_name text,
  att bigint,
  notes5 bigint,
  notes4 bigint,
  notes3 bigint,
  notes2 bigint,
  notes1 bigint,
  total_eval bigint,
  avg_rating numeric,
  eval_pct numeric,
  points numeric,
  goals_hit integer,
  status text,
  ranking bigint,
  exclude_from_group_count boolean
)
language sql
security definer
set search_path = public
as $$
  with me as (
    select p.organization_id, p.squad_id, p.role
    from public.profiles p
    where p.user_id = auth.uid()
      and coalesce(p.active,true) = true
    limit 1
  ), bounds as (
    select least(p_start_date,p_end_date) as date_from,
           greatest(p_start_date,p_end_date) as date_to
  ), base as (
    select
      tm.technician_name::text as technician_name,
      coalesce(sum(dm.att),0)::bigint as att,
      coalesce(sum(dm.notes5),0)::bigint as notes5,
      coalesce(sum(dm.notes4),0)::bigint as notes4,
      coalesce(sum(dm.notes3),0)::bigint as notes3,
      coalesce(sum(dm.notes2),0)::bigint as notes2,
      coalesce(sum(dm.notes1),0)::bigint as notes1,
      bool_and(coalesce(tfm.exclude_from_group_count,false)) as exclude_from_group_count
    from me
    join bounds b on true
    join public.squad_months sm on sm.squad_id = me.squad_id
    join public.technician_monthly tm on tm.squad_month_id = sm.id
    join public.daily_metrics dm on dm.technician_month_id = tm.id
    left join public.technician_finance_monthly tfm on tfm.technician_month_id = tm.id
    where me.squad_id is not null
      and me.role in ('technician','squad_admin')
      and make_date(sm.year,sm.month,dm.day) between b.date_from and b.date_to
      and dm.day <= coalesce(sm.latest_day,dm.day)
    group by tm.technician_name
  ), monthly_excluded as (
    select
      tm.technician_name::text as technician_name,
      coalesce(sum(
        case
          when b.date_from <= make_date(sm.year,sm.month,1)
           and b.date_to >= make_date(sm.year,sm.month,least(
             coalesce(sm.latest_day, extract(day from (date_trunc('month',make_date(sm.year,sm.month,1)) + interval '1 month - 1 day'))::int),
             extract(day from (date_trunc('month',make_date(sm.year,sm.month,1)) + interval '1 month - 1 day'))::int
           ))
          then greatest(coalesce(tm.evaluation_excluded_att,0),0)
          else 0
        end
      ),0)::numeric as evaluation_excluded_att
    from me
    join bounds b on true
    join public.squad_months sm on sm.squad_id = me.squad_id
    join public.technician_monthly tm on tm.squad_month_id = sm.id
    where me.squad_id is not null
      and me.role in ('technician','squad_admin')
      and make_date(sm.year,sm.month,1) <= b.date_to
      and make_date(sm.year,sm.month,least(
            coalesce(sm.latest_day, extract(day from (date_trunc('month',make_date(sm.year,sm.month,1)) + interval '1 month - 1 day'))::int),
            extract(day from (date_trunc('month',make_date(sm.year,sm.month,1)) + interval '1 month - 1 day'))::int
          )) >= b.date_from
    group by tm.technician_name
  ), metrics as (
    select
      b.*,
      (b.notes5+b.notes4+b.notes3+b.notes2+b.notes1)::bigint as total_eval,
      case when (b.notes5+b.notes4+b.notes3+b.notes2+b.notes1)=0 then 0::numeric
        else trunc(((b.notes5*5+b.notes4*4+b.notes3*3+b.notes2*2+b.notes1)::numeric/(b.notes5+b.notes4+b.notes3+b.notes2+b.notes1)::numeric),2)
      end as avg_rating,
      greatest(b.att::numeric - coalesce(e.evaluation_excluded_att,0),0) as eligible_att,
      case when greatest(b.att::numeric - coalesce(e.evaluation_excluded_att,0),0)=0 then 0::numeric
        else round(((b.notes5+b.notes4+b.notes3+b.notes2+b.notes1)::numeric
          / greatest(b.att::numeric - coalesce(e.evaluation_excluded_att,0),0)),4)
      end as eval_pct
    from base b
    left join monthly_excluded e on e.technician_name = b.technician_name
    where b.att>0 or (b.notes5+b.notes4+b.notes3+b.notes2+b.notes1)>0
  ), population as (
    select
      count(*)::numeric as active_count,
      count(*) filter (where not exclude_from_group_count)::numeric as counted_count,
      sum(att)::numeric as total_att,
      sum(total_eval)::numeric as total_eval
    from metrics
  ), refs as (
    select
      round(p.total_att / greatest(case when p.counted_count>0 then p.counted_count else p.active_count end,1),0) as ref_att,
      round(p.total_eval / greatest(case when p.counted_count>0 then p.counted_count else p.active_count end,1),0) as ref_total_eval,
      coalesce(
        trunc(avg(m.avg_rating) filter (where not m.exclude_from_group_count),2),
        trunc(avg(m.avg_rating),2),
        0::numeric
      ) as ref_avg,
      coalesce(
        round(avg(m.eval_pct) filter (where not m.exclude_from_group_count),4),
        round(avg(m.eval_pct),4),
        0::numeric
      ) as ref_eval_pct
    from metrics m cross join population p
    group by p.total_att,p.total_eval,p.counted_count,p.active_count
  ), scored as (
    select
      m.*,
      ((case when m.att>=r.ref_att then 1 else 0 end)+
       (case when m.total_eval>=r.ref_total_eval then 1 else 0 end)+
       (case when m.avg_rating>=r.ref_avg then 1 else 0 end)+
       (case when m.eval_pct>=r.ref_eval_pct then 1 else 0 end))::integer as goals_hit,
      round(
        m.att::numeric*m.avg_rating
        + case when m.att>=r.ref_att then 20 else -20 end
        + case when m.total_eval>=r.ref_total_eval then 30 else -30 end
        + case when m.avg_rating>=r.ref_avg then 40 else -40 end
        + case when m.eval_pct>=r.ref_eval_pct then 35 else -35 end
      ,2) as points
    from metrics m cross join refs r
  ), ranked as (
    select s.*, row_number() over(order by s.points desc, s.att desc, s.technician_name asc) as ranking
    from scored s
  )
  select
    r.technician_name,r.att,r.notes5,r.notes4,r.notes3,r.notes2,r.notes1,r.total_eval,
    r.avg_rating,r.eval_pct,r.points,r.goals_hit,
    case when r.goals_hit>=2 then 'ACIMA' else 'ABAIXO' end::text as status,
    r.ranking,
    r.exclude_from_group_count
  from ranked r
  order by r.ranking;
$$;

revoke all on function public.get_my_squad_game_ranking(date,date) from public;
grant execute on function public.get_my_squad_game_ranking(date,date) to authenticated;

commit;
