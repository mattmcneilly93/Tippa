-- Fix: knockout games decided in extra time or on penalties weren't scoring.
--
-- The adapter only read the full-time ("ft") score, so a match tied after 90
-- but won in extra time was stored as a draw (no winner), and penalty shootouts
-- had no place to record the result. Store the after-extra-time score as the
-- on-field result and keep the penalty shootout separately so the winner can be
-- resolved on a level score.
--
-- Run in the Supabase SQL editor, then hit "Sync now" on the admin page to
-- repopulate scores (sync recalculates points automatically).

alter table public.matches add column if not exists home_penalties int;
alter table public.matches add column if not exists away_penalties int;
