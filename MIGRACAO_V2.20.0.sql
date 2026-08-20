-- Soften Performance Hub V2.20.0
-- Transicao financeira para tecnicos + teto global do modelo Individual + ranking financeiro do Squad.
-- Execute UMA VEZ antes de publicar o frontend V2.20.0.

begin;

alter table public.squad_months
  add column if not exists finance_technician_compare boolean not null default false;

alter table public.squad_months
  add column if not exists finance_individual_cap numeric(14,2) not null default 7000;

alter table public.squad_months
  drop constraint if exists squad_months_finance_individual_cap_check;

alter table public.squad_months
  add constraint squad_months_finance_individual_cap_check
  check (finance_individual_cap >= 0);

comment on column public.squad_months.finance_technician_compare is
  'Quando true, o tecnico visualiza uma simulacao do modelo financeiro alternativo no Meu desempenho.';

comment on column public.squad_months.finance_individual_cap is
  'Teto da soma mensal paga aos tecnicos do Squad quando calculado o modelo Individual.';

-- Ranking financeiro: tecnicos podem ver apenas nome + valor oficial dos colegas do proprio Squad.
-- Nao expoe bonus manual, vendas, desconto, redistribuicao, teto ou demais componentes internos.
create or replace function public.get_my_squad_finance_ranking(p_year int, p_month int)
returns table (
  technician_name text,
  amount numeric,
  ranking bigint,
  finance_model text
)
language sql
security definer
set search_path = public
as $$
  with me as (
    select p.organization_id, p.squad_id, p.role
    from public.profiles p
    where p.user_id = auth.uid()
      and p.active = true
    limit 1
  ), rows as (
    select
      tm.technician_name,
      coalesce((tf.calculated->>'final')::numeric, 0) as amount,
      sm.finance_model
    from me
    join public.squad_months sm
      on sm.squad_id = me.squad_id
     and sm.year = p_year
     and sm.month = p_month
    join public.technician_monthly tm on tm.squad_month_id = sm.id
    left join public.technician_finance_monthly tf on tf.technician_month_id = tm.id
    where me.squad_id is not null
      and me.role in ('technician','squad_admin')
  )
  select
    r.technician_name,
    r.amount,
    dense_rank() over (order by r.amount desc) as ranking,
    r.finance_model
  from rows r
  order by amount desc, technician_name asc;
$$;

revoke all on function public.get_my_squad_finance_ranking(int,int) from public;
grant execute on function public.get_my_squad_finance_ranking(int,int) to authenticated;

commit;
