-- Soften Performance Hub V2.21.0
-- Filtros analiticos por dia.
-- Preserva a competencia mensal para pontuacao oficial, fechamento e bonificacao.

begin;

alter table if exists public.daily_metrics
  add column if not exists notes4 integer not null default 0,
  add column if not exists notes3 integer not null default 0,
  add column if not exists notes2 integer not null default 0,
  add column if not exists notes1 integer not null default 0;

comment on column public.daily_metrics.notes4 is 'Quantidade diaria de avaliacoes nota 4 importadas do CSV.';
comment on column public.daily_metrics.notes3 is 'Quantidade diaria de avaliacoes nota 3 importadas do CSV.';
comment on column public.daily_metrics.notes2 is 'Quantidade diaria de avaliacoes nota 2 importadas do CSV.';
comment on column public.daily_metrics.notes1 is 'Quantidade diaria de avaliacoes nota 1 importadas do CSV.';

-- A funcao agregada anterior ja existia nas versoes recentes. Ela precisa ser
-- recriada para devolver tambem a composicao diaria das avaliacoes.
drop function if exists public.get_org_daily_attendance_overview();

create function public.get_org_daily_attendance_overview()
returns table (
  squad_code text,
  year integer,
  month integer,
  day integer,
  total_att bigint,
  notes5 bigint,
  notes4 bigint,
  notes3 bigint,
  notes2 bigint,
  notes1 bigint,
  total_eval bigint,
  eval_pct numeric
)
language sql
security definer
set search_path = public
as $$
  select
    s.code::text as squad_code,
    sm.year,
    sm.month,
    dm.day,
    coalesce(sum(dm.att),0)::bigint as total_att,
    coalesce(sum(dm.notes5),0)::bigint as notes5,
    coalesce(sum(dm.notes4),0)::bigint as notes4,
    coalesce(sum(dm.notes3),0)::bigint as notes3,
    coalesce(sum(dm.notes2),0)::bigint as notes2,
    coalesce(sum(dm.notes1),0)::bigint as notes1,
    coalesce(sum(dm.notes5 + dm.notes4 + dm.notes3 + dm.notes2 + dm.notes1),0)::bigint as total_eval,
    case
      when coalesce(sum(dm.att),0) = 0 then 0::numeric
      else coalesce(sum(dm.notes5 + dm.notes4 + dm.notes3 + dm.notes2 + dm.notes1),0)::numeric / sum(dm.att)::numeric
    end as eval_pct
  from public.daily_metrics dm
  join public.technician_monthly tm on tm.id = dm.technician_month_id
  join public.squad_months sm on sm.id = tm.squad_month_id
  join public.squads s on s.id = sm.squad_id
  where exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.organization_id = s.organization_id
      and coalesce(p.active, true) = true
  )
  group by s.code, sm.year, sm.month, dm.day
  order by sm.year, sm.month, dm.day, s.code;
$$;

revoke all on function public.get_org_daily_attendance_overview() from public;
grant execute on function public.get_org_daily_attendance_overview() to authenticated;

-- Versao diaria do consolidado de tecnicos usada pelo grafico geral em tela cheia.
-- Entrega somente metricas operacionais; nao expoe e-mail, bonus manuais,
-- comissao de vendas, ferias ou componentes internos do financeiro.
drop function if exists public.get_org_technician_daily_overview();

create function public.get_org_technician_daily_overview()
returns table (
  squad_code text,
  year integer,
  month integer,
  day integer,
  technician_name text,
  att bigint,
  notes5 bigint,
  notes4 bigint,
  notes3 bigint,
  notes2 bigint,
  notes1 bigint,
  total_eval bigint,
  avg_rating numeric,
  eval_pct numeric
)
language sql
security definer
set search_path = public
as $$
  select
    s.code::text as squad_code,
    sm.year,
    sm.month,
    dm.day,
    tm.technician_name::text,
    coalesce(sum(dm.att),0)::bigint as att,
    coalesce(sum(dm.notes5),0)::bigint as notes5,
    coalesce(sum(dm.notes4),0)::bigint as notes4,
    coalesce(sum(dm.notes3),0)::bigint as notes3,
    coalesce(sum(dm.notes2),0)::bigint as notes2,
    coalesce(sum(dm.notes1),0)::bigint as notes1,
    coalesce(sum(dm.notes5 + dm.notes4 + dm.notes3 + dm.notes2 + dm.notes1),0)::bigint as total_eval,
    case
      when coalesce(sum(dm.notes5 + dm.notes4 + dm.notes3 + dm.notes2 + dm.notes1),0) = 0 then 0::numeric
      else (
        sum(dm.notes5 * 5 + dm.notes4 * 4 + dm.notes3 * 3 + dm.notes2 * 2 + dm.notes1)::numeric
        / sum(dm.notes5 + dm.notes4 + dm.notes3 + dm.notes2 + dm.notes1)::numeric
      )
    end as avg_rating,
    case
      when coalesce(sum(dm.att),0) = 0 then 0::numeric
      else sum(dm.notes5 + dm.notes4 + dm.notes3 + dm.notes2 + dm.notes1)::numeric / sum(dm.att)::numeric
    end as eval_pct
  from public.daily_metrics dm
  join public.technician_monthly tm on tm.id = dm.technician_month_id
  join public.squad_months sm on sm.id = tm.squad_month_id
  join public.squads s on s.id = sm.squad_id
  where exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.organization_id = s.organization_id
      and coalesce(p.active, true) = true
  )
  group by s.code, sm.year, sm.month, dm.day, tm.technician_name
  order by sm.year, sm.month, dm.day, s.code, tm.technician_name;
$$;

revoke all on function public.get_org_technician_daily_overview() from public;
grant execute on function public.get_org_technician_daily_overview() to authenticated;

commit;
