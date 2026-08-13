-- Soften Performance Hub V2.4.0
-- Execute UMA VEZ em projetos que ja estavam na V2.3.0.
-- Esta migracao nao apaga usuarios, meses ou metricas existentes.

begin;

alter table public.squad_months
  add column if not exists is_closed boolean not null default false;

alter table public.squad_months
  add column if not exists closed_at timestamptz;

alter table public.squad_months
  add column if not exists closed_by uuid references auth.users(id) on delete set null;

alter table public.squad_months
  add column if not exists closed_snapshot jsonb not null default '{}'::jsonb;

comment on column public.squad_months.is_closed is
  'Indica se o mes foi fechado e esta protegido contra alteracoes pelo painel.';
comment on column public.squad_months.closed_at is
  'Data/hora do ultimo fechamento do mes.';
comment on column public.squad_months.closed_by is
  'Usuario administrador que realizou o ultimo fechamento.';
comment on column public.squad_months.closed_snapshot is
  'Snapshot oficial da pontuacao, referencias e ranking no fechamento mensal.';

commit;
