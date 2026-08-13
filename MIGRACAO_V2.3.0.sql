-- Soften Performance Hub V2.3.0
-- Execute apenas uma vez em projetos que ja estavam na V2.2.x.

alter table public.squad_months
  add column if not exists score_settings jsonb not null default '{}'::jsonb;

comment on column public.squad_months.score_settings is
  'Parametros opcionais da pontuacao mensal. Campos nulos usam automaticamente a media do Squad.';
