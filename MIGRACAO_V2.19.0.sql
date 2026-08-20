-- Soften Performance Hub V2.19.0
-- Dois modelos financeiros + histórico de movimentação de Squad.
-- Execute UMA VEZ antes de publicar o frontend V2.19.0.

begin;

alter table public.squad_months
  add column if not exists finance_model text not null default 'squad';

alter table public.squad_months
  drop constraint if exists squad_months_finance_model_check;

alter table public.squad_months
  add constraint squad_months_finance_model_check
  check (finance_model in ('squad','individual'));

alter table public.squad_months
  add column if not exists finance_compare boolean not null default true;

alter table public.squad_months
  add column if not exists finance_comparison_snapshot jsonb not null default '{}'::jsonb;

create table if not exists public.profile_squad_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  squad_id uuid not null references public.squads(id) on delete cascade,
  technician_name text,
  valid_from_year int not null check (valid_from_year between 2020 and 2100),
  valid_from_month int not null check (valid_from_month between 1 and 12),
  valid_to_year int check (valid_to_year between 2020 and 2100),
  valid_to_month int check (valid_to_month between 1 and 12),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  note text,
  check ((valid_to_year is null and valid_to_month is null) or (valid_to_year is not null and valid_to_month is not null))
);

alter table public.profile_squad_history add column if not exists technician_name text;

create index if not exists idx_profile_squad_history_user on public.profile_squad_history(user_id,valid_from_year,valid_from_month);
create index if not exists idx_profile_squad_history_squad on public.profile_squad_history(squad_id,valid_from_year,valid_from_month);

-- Evita dois vínculos abertos simultaneamente por usuário.
create unique index if not exists idx_profile_squad_history_open_unique
on public.profile_squad_history(user_id)
where valid_to_year is null and valid_to_month is null;

-- Cria o vínculo aberto inicial para técnicos já existentes. Quando há histórico mensal
-- já ligado pelo user_id, usa a primeira competência conhecida; caso contrário usa a
-- competência de criação do perfil. Isso prepara a base para futuras movimentações.
insert into public.profile_squad_history (
  organization_id,user_id,squad_id,technician_name,
  valid_from_year,valid_from_month,note
)
select
  p.organization_id,p.user_id,p.squad_id,p.technician_name,
  coalesce(first_month.year, extract(year from p.created_at)::int),
  coalesce(first_month.month, extract(month from p.created_at)::int),
  'Vínculo atual inicializado na migração V2.19.0.'
from public.profiles p
left join lateral (
  select sm.year, sm.month
  from public.technician_monthly tm
  join public.squad_months sm on sm.id=tm.squad_month_id
  where tm.user_id=p.user_id and sm.squad_id=p.squad_id
  order by sm.year,sm.month
  limit 1
) first_month on true
where p.role='technician'
  and p.squad_id is not null
  and not exists (
    select 1 from public.profile_squad_history h
    where h.user_id=p.user_id and h.valid_to_year is null and h.valid_to_month is null
  );

alter table public.profile_squad_history enable row level security;

drop policy if exists profile_squad_history_select on public.profile_squad_history;
create policy profile_squad_history_select on public.profile_squad_history
for select to authenticated
using (
  user_id=(select auth.uid())
  or public.is_super_admin()
  or public.can_admin_squad(squad_id)
);

-- Escrita é feita somente pelas Edge Functions com service_role.
revoke insert, update, delete on public.profile_squad_history from authenticated;
grant select on public.profile_squad_history to authenticated;

comment on column public.squad_months.finance_model is 'Modelo oficial de bonificacao do mes: squad (base compartilhada) ou individual.';
comment on column public.squad_months.finance_compare is 'Quando true, exibe comparacao dos dois modelos financeiros.';
comment on column public.squad_months.finance_comparison_snapshot is 'Snapshot comparativo dos dois modelos no fechamento.';
comment on table public.profile_squad_history is 'Historico de vigencia do vinculo de usuarios a Squads. Movimentacoes futuras devem preservar meses anteriores.';

commit;
