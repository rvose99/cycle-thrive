create table if not exists public.condition_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('point', 'section')),
  rating text not null check (rating in ('good', 'mediocre', 'bad')),
  reason text not null,
  description text,
  point jsonb,
  section_start jsonb,
  section_end jsonb,
  section_coords jsonb,
  created_at timestamptz not null default now()
);

alter table public.condition_reports enable row level security;

drop policy if exists "Condition reports are visible to authenticated users" on public.condition_reports;
create policy "Condition reports are visible to authenticated users"
  on public.condition_reports for select
  to authenticated
  using (true);

drop policy if exists "Users can create their own condition reports" on public.condition_reports;
create policy "Users can create their own condition reports"
  on public.condition_reports for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own condition reports" on public.condition_reports;
create policy "Users can delete their own condition reports"
  on public.condition_reports for delete
  to authenticated
  using (auth.uid() = user_id);

create index if not exists condition_reports_created_at_idx
  on public.condition_reports (created_at desc);

create index if not exists condition_reports_user_id_idx
  on public.condition_reports (user_id);
