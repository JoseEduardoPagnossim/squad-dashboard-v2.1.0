-- Soften Performance Hub V2.20.5
-- Permite retirar um técnico apenas do denominador da quantidade de técnicos
-- usada no modelo financeiro Base do Squad, preservando seus atendimentos e notas.

alter table if exists public.technician_finance_monthly
  add column if not exists exclude_from_group_count boolean not null default false;

comment on column public.technician_finance_monthly.exclude_from_group_count is
  'Quando true, os dados do técnico continuam nos totais do mês, mas ele não entra na quantidade de técnicos usada para a média de atendimentos/técnico/dia da Base do Squad.';
