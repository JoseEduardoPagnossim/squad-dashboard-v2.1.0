-- Soften Performance Hub V2.18.0
-- Bonificacao financeira separada da gamificacao + comissao manual do Admin Geral.
-- Execute UMA VEZ antes de publicar o frontend V2.18.0.

begin;

alter table public.squad_months
  add column if not exists finance_settings jsonb not null default '{}'::jsonb;

alter table public.squad_months
  add column if not exists finance_month_data jsonb not null default '{}'::jsonb;

create table if not exists public.technician_finance_monthly (
  id uuid primary key default gen_random_uuid(),
  technician_month_id uuid not null unique references public.technician_monthly(id) on delete cascade,
  manual_bonus numeric(14,2) not null default 0,
  sales_commission numeric(14,2) not null default 0,
  vacation boolean not null default false,
  calculated jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.super_admin_commissions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  year int not null check (year between 2020 and 2100),
  month int not null check (month between 1 and 12),
  amount numeric(14,2) not null default 0,
  notes text,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (organization_id,user_id,year,month)
);

create index if not exists idx_tech_finance_month on public.technician_finance_monthly(technician_month_id);
create index if not exists idx_super_admin_commission_period on public.super_admin_commissions(organization_id,year,month);

alter table public.technician_finance_monthly enable row level security;
alter table public.super_admin_commissions enable row level security;

drop policy if exists tech_finance_select on public.technician_finance_monthly;
create policy tech_finance_select on public.technician_finance_monthly
for select to authenticated
using (
  exists (
    select 1
    from public.technician_monthly tm
    join public.squad_months sm on sm.id=tm.squad_month_id
    where tm.id=technician_finance_monthly.technician_month_id
      and (tm.user_id=(select auth.uid()) or public.can_admin_squad(sm.squad_id))
  )
);

drop policy if exists tech_finance_insert on public.technician_finance_monthly;
create policy tech_finance_insert on public.technician_finance_monthly
for insert to authenticated
with check (
  exists (
    select 1
    from public.technician_monthly tm
    join public.squad_months sm on sm.id=tm.squad_month_id
    where tm.id=technician_finance_monthly.technician_month_id
      and public.can_admin_squad(sm.squad_id)
  )
);

drop policy if exists tech_finance_update on public.technician_finance_monthly;
create policy tech_finance_update on public.technician_finance_monthly
for update to authenticated
using (
  exists (
    select 1
    from public.technician_monthly tm
    join public.squad_months sm on sm.id=tm.squad_month_id
    where tm.id=technician_finance_monthly.technician_month_id
      and public.can_admin_squad(sm.squad_id)
  )
)
with check (
  exists (
    select 1
    from public.technician_monthly tm
    join public.squad_months sm on sm.id=tm.squad_month_id
    where tm.id=technician_finance_monthly.technician_month_id
      and public.can_admin_squad(sm.squad_id)
  )
);

drop policy if exists tech_finance_delete on public.technician_finance_monthly;
create policy tech_finance_delete on public.technician_finance_monthly
for delete to authenticated
using (
  exists (
    select 1
    from public.technician_monthly tm
    join public.squad_months sm on sm.id=tm.squad_month_id
    where tm.id=technician_finance_monthly.technician_month_id
      and public.can_admin_squad(sm.squad_id)
  )
);

drop policy if exists super_admin_commission_select on public.super_admin_commissions;
create policy super_admin_commission_select on public.super_admin_commissions
for select to authenticated
using (public.is_super_admin() and organization_id=(select (public.current_profile()).organization_id));

drop policy if exists super_admin_commission_insert on public.super_admin_commissions;
create policy super_admin_commission_insert on public.super_admin_commissions
for insert to authenticated
with check (
  public.is_super_admin()
  and organization_id=(select (public.current_profile()).organization_id)
  and user_id=(select auth.uid())
);

drop policy if exists super_admin_commission_update on public.super_admin_commissions;
create policy super_admin_commission_update on public.super_admin_commissions
for update to authenticated
using (
  public.is_super_admin()
  and organization_id=(select (public.current_profile()).organization_id)
  and user_id=(select auth.uid())
)
with check (
  public.is_super_admin()
  and organization_id=(select (public.current_profile()).organization_id)
  and user_id=(select auth.uid())
);

comment on column public.squad_months.finance_settings is 'Faixas e parametros da bonificacao financeira vigentes para o Squad/mes.';
comment on column public.squad_months.finance_month_data is 'Dados mensais do financeiro, como clientes no inicio e cancelamentos.';
comment on table public.technician_finance_monthly is 'Dados financeiros mensais protegidos: visiveis apenas ao proprio tecnico ou admins do Squad.';
comment on table public.super_admin_commissions is 'Comissao mensal manual dos usuarios Admin Geral.';

commit;
