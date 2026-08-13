-- SOFTEN PERFORMANCE HUB V2.4.0
-- BOOTSTRAP UNICO DO PRIMEIRO ADMIN GERAL
--
-- Antes de executar:
-- 1) Crie SOMENTE o primeiro usuário em Supabase > Authentication > Users.
-- 2) Copie o UUID desse usuário.
-- 3) Troque UUID_DO_PRIMEIRO_ADMIN abaixo pelo UUID real.
--
-- Depois deste bootstrap, os demais usuários são criados pela interface
-- Usuários > Criar usuário dentro do próprio Performance Hub.

insert into public.profiles (
  user_id,
  organization_id,
  squad_id,
  full_name,
  email,
  role,
  technician_name,
  active
)
select
  u.id,
  '10000000-0000-0000-0000-000000000001',
  null,
  coalesce(u.raw_user_meta_data->>'full_name', 'Administrador Geral'),
  u.email,
  'super_admin',
  null,
  true
from auth.users u
where u.id = 'UUID_DO_PRIMEIRO_ADMIN'
on conflict (user_id) do update set
  full_name = excluded.full_name,
  email = excluded.email,
  role = 'super_admin',
  squad_id = null,
  technician_name = null,
  active = true,
  updated_at = now();
