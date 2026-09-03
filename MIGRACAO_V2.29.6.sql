-- Soften Performance Hub V2.29.6
-- Consolidação de status operacional x bonificação.
-- 1) O status usa todos os técnicos com produção (2 de 4 = ACIMA).
-- 2) "Desconsiderar na quantidade do Squad" passa a ser exclusivamente financeiro.
-- 3) A RPC do ranking do próprio técnico usa a base elegível de avaliação em competências completas.
-- Não altera estrutura de tabelas.

begin;

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
    select least(p_start_date,p_end_date) as dt_start,
           greatest(p_start_date,p_end_date) as dt_end
  ), month_segments as (
    select
      tm.technician_name::text as technician_name,
      sm.id as squad_month_id,
      make_date(sm.year,sm.month,1) as month_start,
      make_date(sm.year,sm.month,greatest(1,coalesce(sm.latest_day,1))) as month_end,
      case
        when b.dt_start <= make_date(sm.year,sm.month,1)
         and b.dt_end >= make_date(sm.year,sm.month,greatest(1,coalesce(sm.latest_day,1)))
        then coalesce(tm.att,0)::bigint
        else coalesce(sum(dm.att),0)::bigint
      end as att,
      case
        when b.dt_start <= make_date(sm.year,sm.month,1)
         and b.dt_end >= make_date(sm.year,sm.month,greatest(1,coalesce(sm.latest_day,1)))
        then coalesce(tm.notes5,0)::bigint
        else coalesce(sum(dm.notes5),0)::bigint
      end as notes5,
      case
        when b.dt_start <= make_date(sm.year,sm.month,1)
         and b.dt_end >= make_date(sm.year,sm.month,greatest(1,coalesce(sm.latest_day,1)))
        then coalesce(tm.notes4,0)::bigint
        else coalesce(sum(dm.notes4),0)::bigint
      end as notes4,
      case
        when b.dt_start <= make_date(sm.year,sm.month,1)
         and b.dt_end >= make_date(sm.year,sm.month,greatest(1,coalesce(sm.latest_day,1)))
        then coalesce(tm.notes3,0)::bigint
        else coalesce(sum(dm.notes3),0)::bigint
      end as notes3,
      case
        when b.dt_start <= make_date(sm.year,sm.month,1)
         and b.dt_end >= make_date(sm.year,sm.month,greatest(1,coalesce(sm.latest_day,1)))
        then coalesce(tm.notes2,0)::bigint
        else coalesce(sum(dm.notes2),0)::bigint
      end as notes2,
      case
        when b.dt_start <= make_date(sm.year,sm.month,1)
         and b.dt_end >= make_date(sm.year,sm.month,greatest(1,coalesce(sm.latest_day,1)))
        then coalesce(tm.notes1,0)::bigint
        else coalesce(sum(dm.notes1),0)::bigint
      end as notes1,
      case
        when b.dt_start <= make_date(sm.year,sm.month,1)
         and b.dt_end >= make_date(sm.year,sm.month,greatest(1,coalesce(sm.latest_day,1)))
        then greatest(0,coalesce(tm.evaluation_excluded_att,0))::bigint
        else 0::bigint
      end as evaluation_excluded_att,
      coalesce(tfm.exclude_from_group_count,false) as exclude_from_group_count
    from me
    cross join bounds b
    join public.squad_months sm on sm.squad_id = me.squad_id
    join public.technician_monthly tm on tm.squad_month_id = sm.id
    left join public.technician_finance_monthly tfm on tfm.technician_month_id = tm.id
    left join public.daily_metrics dm
      on dm.technician_month_id = tm.id
     and dm.day <= coalesce(sm.latest_day,dm.day)
     and make_date(sm.year,sm.month,dm.day) between b.dt_start and b.dt_end
    where me.squad_id is not null
      and me.role in ('technician','squad_admin')
      and make_date(sm.year,sm.month,1) <= b.dt_end
      and make_date(sm.year,sm.month,greatest(1,coalesce(sm.latest_day,1))) >= b.dt_start
    group by tm.id,tm.technician_name,tm.att,tm.notes5,tm.notes4,tm.notes3,tm.notes2,tm.notes1,
             tm.evaluation_excluded_att,tfm.exclude_from_group_count,sm.id,sm.year,sm.month,sm.latest_day,
             b.dt_start,b.dt_end
  ), base as (
    select
      ms.technician_name,
      coalesce(sum(ms.att),0)::bigint as att,
      coalesce(sum(ms.notes5),0)::bigint as notes5,
      coalesce(sum(ms.notes4),0)::bigint as notes4,
      coalesce(sum(ms.notes3),0)::bigint as notes3,
      coalesce(sum(ms.notes2),0)::bigint as notes2,
      coalesce(sum(ms.notes1),0)::bigint as notes1,
      coalesce(sum(ms.evaluation_excluded_att),0)::bigint as evaluation_excluded_att,
      bool_and(ms.exclude_from_group_count) as exclude_from_group_count
    from month_segments ms
    group by ms.technician_name
  ), metrics_pre as (
    select
      b.*,
      (b.notes5+b.notes4+b.notes3+b.notes2+b.notes1)::bigint as total_eval,
      case when (b.notes5+b.notes4+b.notes3+b.notes2+b.notes1)=0 then 0::numeric
        else trunc(((b.notes5*5+b.notes4*4+b.notes3*3+b.notes2*2+b.notes1)::numeric/
          (b.notes5+b.notes4+b.notes3+b.notes2+b.notes1)::numeric),2)
      end as avg_rating
    from base b
    where b.att>0 or (b.notes5+b.notes4+b.notes3+b.notes2+b.notes1)>0
  ), metrics as (
    select
      mp.*,
      greatest(
        0,
        mp.att - least(
          greatest(0,mp.evaluation_excluded_att),
          greatest(0,mp.att-mp.total_eval)
        )
      )::bigint as eligible_att,
      case
        when greatest(0,mp.att-least(greatest(0,mp.evaluation_excluded_att),greatest(0,mp.att-mp.total_eval)))=0 then 0::numeric
        else round(
          mp.total_eval::numeric /
          greatest(0,mp.att-least(greatest(0,mp.evaluation_excluded_att),greatest(0,mp.att-mp.total_eval)))::numeric,
          4
        )
      end as eval_pct
    from metrics_pre mp
  ), refs as (
    select
      coalesce(round(avg(m.att::numeric),0),0::numeric) as ref_att,
      coalesce(round(avg(m.total_eval::numeric),0),0::numeric) as ref_total_eval,
      coalesce(trunc(avg(m.avg_rating),2),0::numeric) as ref_avg,
      coalesce(round(avg(m.eval_pct),4),0::numeric) as ref_eval_pct
    from metrics m
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
        + case when m.eval_pct>=r.ref_eval_pct then 35 else -35 end,
        2
      ) as points
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
