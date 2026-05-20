drop policy if exists "Condition reports are visible to authenticated users" on public.condition_reports;

create policy "Condition reports are visible to everyone"
  on public.condition_reports for select
  to anon, authenticated
  using (true);
