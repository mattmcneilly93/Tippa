-- Fix: player knockout saves crash after the first knockout kickoff.
--
-- The old RLS write policies gated knockout writes on knockout_unlocked(),
-- which uses the single global knockout_locked_at (the first knockout kickoff).
-- Once that time passed, the database rejected every player's knockout save even
-- though the app locks per match. This aligns RLS with the app's per-match lock:
-- a knockout match stays writable until 1 hour before its own kickoff.
--
-- Safe to run on a live database; no redeploy needed. Run in the Supabase SQL editor.

create or replace function public.knockout_match_open(target_group_id uuid, target_match_id uuid)
returns boolean
language sql
stable
as $$
  select
    exists (
      select 1 from public.group_prediction_settings gps
      where gps.group_id = target_group_id and gps.knockout_opened_at is not null
    )
    and exists (
      select 1 from public.matches m
      where m.id = target_match_id
        and (m.kickoff_time is null or m.kickoff_time - interval '1 hour' > now())
    );
$$;

drop policy if exists "Users can write own unlocked knockout predictions" on public.knockout_prediction_entries;
create policy "Users can write own unlocked knockout predictions" on public.knockout_prediction_entries for all to authenticated using (
  user_id = auth.uid() and public.is_group_member(group_id) and public.knockout_match_open(group_id, source_match_id)
) with check (
  user_id = auth.uid() and public.is_group_member(group_id) and public.knockout_match_open(group_id, source_match_id)
);

drop policy if exists "Users can write own unlocked match predictions" on public.match_predictions;
create policy "Users can write own unlocked match predictions" on public.match_predictions for all to authenticated using (
  user_id = auth.uid()
  and public.is_group_member(group_id)
  and (
    (prediction_phase = 'group' and public.group_stage_unlocked(group_id))
    or (prediction_phase = 'knockout' and public.knockout_match_open(group_id, match_id))
  )
) with check (
  user_id = auth.uid()
  and public.is_group_member(group_id)
  and (
    (prediction_phase = 'group' and public.group_stage_unlocked(group_id))
    or (prediction_phase = 'knockout' and public.knockout_match_open(group_id, match_id))
  )
);
