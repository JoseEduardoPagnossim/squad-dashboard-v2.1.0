-- Soften Performance Hub V2.24.2
-- Ranking do game para técnicos: expõe somente o consolidado/ranking do próprio Squad.

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
  ranking bigint
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
  ), base as (
    select
      tm.technician_name::text as technician_name,
      coalesce(sum(dm.att),0)::bigint as att,
      coalesce(sum(dm.notes5),0)::bigint as notes5,
      coalesce(sum(dm.notes4),0)::bigint as notes4,
      coalesce(sum(dm.notes3),0)::bigint as notes3,
      coalesce(sum(dm.notes2),0)::bigint as notes2,
      coalesce(sum(dm.notes1),0)::bigint as notes1
    from me
    join public.squad_months sm on sm.squad_id = me.squad_id
    join public.technician_monthly tm on tm.squad_month_id = sm.id
    join public.daily_metrics dm on dm.technician_month_id = tm.id
    where me.squad_id is not null
      and me.role in ('technician','squad_admin')
      and make_date(sm.year,sm.month,dm.day) between least(p_start_date,p_end_date) and greatest(p_start_date,p_end_date)
      and dm.day <= coalesce(sm.latest_day,dm.day)
    group by tm.technician_name
  ), metrics as (
    select
      b.*,
      (b.notes5+b.notes4+b.notes3+b.notes2+b.notes1)::bigint as total_eval,
      case when (b.notes5+b.notes4+b.notes3+b.notes2+b.notes1)=0 then 0::numeric
        else trunc(((b.notes5*5+b.notes4*4+b.notes3*3+b.notes2*2+b.notes1)::numeric/(b.notes5+b.notes4+b.notes3+b.notes2+b.notes1)::numeric),2)
      end as avg_rating,
      case when b.att=0 then 0::numeric
        else round(((b.notes5+b.notes4+b.notes3+b.notes2+b.notes1)::numeric/b.att::numeric),4)
      end as eval_pct
    from base b
    where b.att>0 or (b.notes5+b.notes4+b.notes3+b.notes2+b.notes1)>0
  ), refs as (
    select
      round(avg(att)::numeric,0) as ref_att,
      round(avg(total_eval)::numeric,0) as ref_total_eval,
      trunc(avg(avg_rating)::numeric,2) as ref_avg,
      round(avg(eval_pct)::numeric,4) as ref_eval_pct
    from metrics
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
    r.ranking
  from ranked r
  order by r.ranking;
$$;

revoke all on function public.get_my_squad_game_ranking(date,date) from public;
grant execute on function public.get_my_squad_game_ranking(date,date) to authenticated;

commit;
