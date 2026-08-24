-- Soften Performance Hub V2.25.0
-- Feedbacks mensais por tecnico, com RLS por organizacao/Squad e leitura opcional pelo proprio tecnico.

begin;

create table if not exists public.technician_feedbacks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  squad_id uuid not null references public.squads(id) on delete cascade,
  technician_user_id uuid null,
  technician_name text not null,
  year integer not null check (year between 2020 and 2100),
  month integer not null check (month between 1 and 12),
  summary text not null default '',
  strengths text not null default '',
  improvement_points text not null default '',
  next_month_goals text not null default '',
  manager_notes text not null default '',
  status text not null default 'draft' check (status in ('draft','finalized')),
  visible_to_technician boolean not null default false,
  generated_snapshot jsonb not null default '{}'::jsonb,
  created_by uuid null,
  updated_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  finalized_at timestamptz null,
  constraint technician_feedbacks_month_unique unique (organization_id, squad_id, year, month, technician_name)
);

create index if not exists technician_feedbacks_scope_idx
  on public.technician_feedbacks (organization_id, squad_id, year, month);

create index if not exists technician_feedbacks_technician_idx
  on public.technician_feedbacks (technician_user_id, year desc, month desc);

alter table public.technician_feedbacks enable row level security;

-- Recria as policies para que a migracao possa ser executada novamente com seguranca.
drop policy if exists technician_feedbacks_select on public.technician_feedbacks;
drop policy if exists technician_feedbacks_insert on public.technician_feedbacks;
drop policy if exists technician_feedbacks_update on public.technician_feedbacks;
drop policy if exists technician_feedbacks_delete on public.technician_feedbacks;

create policy technician_feedbacks_select
on public.technician_feedbacks
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and coalesce(p.active,true) = true
      and p.organization_id = technician_feedbacks.organization_id
      and (
        p.role = 'super_admin'
        or (p.role = 'squad_admin' and p.squad_id = technician_feedbacks.squad_id)
        or (
          p.role = 'technician'
          and technician_feedbacks.technician_user_id = auth.uid()
          and technician_feedbacks.status = 'finalized'
          and technician_feedbacks.visible_to_technician = true
        )
      )
  )
);

create policy technician_feedbacks_insert
on public.technician_feedbacks
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and coalesce(p.active,true) = true
      and p.organization_id = technician_feedbacks.organization_id
      and (
        p.role = 'super_admin'
        or (p.role = 'squad_admin' and p.squad_id = technician_feedbacks.squad_id)
      )
  )
);

create policy technician_feedbacks_update
on public.technician_feedbacks
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and coalesce(p.active,true) = true
      and p.organization_id = technician_feedbacks.organization_id
      and (
        p.role = 'super_admin'
        or (p.role = 'squad_admin' and p.squad_id = technician_feedbacks.squad_id)
      )
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and coalesce(p.active,true) = true
      and p.organization_id = technician_feedbacks.organization_id
      and (
        p.role = 'super_admin'
        or (p.role = 'squad_admin' and p.squad_id = technician_feedbacks.squad_id)
      )
  )
);

create policy technician_feedbacks_delete
on public.technician_feedbacks
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and coalesce(p.active,true) = true
      and p.organization_id = technician_feedbacks.organization_id
      and (
        p.role = 'super_admin'
        or (p.role = 'squad_admin' and p.squad_id = technician_feedbacks.squad_id)
      )
  )
);

grant select, insert, update, delete on public.technician_feedbacks to authenticated;

commit;
