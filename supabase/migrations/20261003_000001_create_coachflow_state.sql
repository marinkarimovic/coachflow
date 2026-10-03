-- CoachFlow · Phase 1: persönliche Cloud-Sicherung der bestehenden PWA
-- Stand: 2026-10-03 · Nur auf dem ausdrücklich gewählten CoachFlow-Supabase-Projekt ausführen.
-- Migration bewusst NICHT idempotent: eine bestehende gleichnamige Tabelle wird NICHT geändert.
-- Keine echten Kindernamen als Demo-Daten in diese oder öffentliche Repositories schreiben.

begin;

create table public.coachflow_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null,
  revision bigint not null default 1 check (revision >= 1),
  updated_at timestamptz not null default now(),
  constraint coachflow_state_is_object check (jsonb_typeof(state) = 'object'),
  constraint coachflow_state_size_limit check (pg_column_size(state) <= 2097152)
);

alter table public.coachflow_state enable row level security;

revoke all on table public.coachflow_state from public, anon, authenticated;
grant select, insert, update, delete on table public.coachflow_state to authenticated;

create policy cf_state_select_own
  on public.coachflow_state for select to authenticated
  using ((select auth.uid()) = user_id);

create policy cf_state_insert_own
  on public.coachflow_state for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy cf_state_update_own
  on public.coachflow_state for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy cf_state_delete_own
  on public.coachflow_state for delete to authenticated
  using ((select auth.uid()) = user_id);

comment on table public.coachflow_state is
  'Phase-1 user-owned snapshot; not a shared team collaboration table. Never expose to anon.';

commit;
