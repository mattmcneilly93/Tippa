create extension if not exists "pgcrypto";

create type group_role as enum ('admin', 'member');
create type prize_mode as enum ('none', 'sponsored', 'buy_in', 'hybrid');
create type match_status as enum ('scheduled', 'live', 'finished', 'postponed', 'cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tournaments (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  year int,
  source text not null,
  is_supported boolean not null default false,
  theme jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete restrict,
  name text not null,
  invite_code text not null unique,
  created_by uuid not null references public.profiles(id) on delete cascade,
  prize_mode prize_mode not null default 'none',
  currency text not null default 'NOK',
  sponsor_name text,
  base_prize_amount numeric(10,2),
  buy_in_amount numeric(10,2),
  buy_in_required boolean not null default false,
  payout_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role group_role not null default 'member',
  has_paid boolean not null default false,
  joined_at timestamptz not null default now(),
  unique(group_id, user_id)
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  external_id text,
  name text not null,
  short_name text,
  country_code text,
  flag_emoji text,
  created_at timestamptz not null default now(),
  unique(tournament_id, name)
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  external_id text not null,
  stage text not null,
  group_name text,
  home_team_id uuid references public.teams(id) on delete set null,
  away_team_id uuid references public.teams(id) on delete set null,
  home_team_name text not null,
  away_team_name text not null,
  kickoff_time timestamptz,
  status match_status not null default 'scheduled',
  home_score int,
  away_score int,
  manual_override boolean not null default false,
  manually_updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(tournament_id, external_id)
);

create table public.group_match_overrides (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  match_id uuid not null references public.matches(id) on delete cascade,
  kickoff_time timestamptz,
  status match_status not null default 'scheduled',
  home_score int,
  away_score int,
  manually_updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(group_id, match_id)
);

create table public.predictions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  match_id uuid not null references public.matches(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  home_score int not null check (home_score >= 0),
  away_score int not null check (away_score >= 0),
  points int not null default 0,
  exact_score boolean not null default false,
  correct_outcome boolean not null default false,
  correct_goal_difference boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(group_id, match_id, user_id)
);

create table public.group_score_settings (
  group_id uuid primary key references public.groups(id) on delete cascade,
  exact_score_points int not null default 3,
  correct_goal_difference_points int not null default 2,
  correct_outcome_points int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_group_members_user_id on public.group_members(user_id);
create index idx_group_members_group_id on public.group_members(group_id);
create index idx_group_match_overrides_group_id on public.group_match_overrides(group_id);
create index idx_group_match_overrides_match_id on public.group_match_overrides(match_id);
create index idx_matches_tournament_id on public.matches(tournament_id);
create index idx_matches_kickoff_time on public.matches(kickoff_time);
create index idx_predictions_group_id on public.predictions(group_id);
create index idx_predictions_user_id on public.predictions(user_id);
create index idx_predictions_match_id on public.predictions(match_id);

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
for each row execute function public.handle_updated_at();
create trigger groups_updated_at before update on public.groups
for each row execute function public.handle_updated_at();
create trigger matches_updated_at before update on public.matches
for each row execute function public.handle_updated_at();
create trigger group_match_overrides_updated_at before update on public.group_match_overrides
for each row execute function public.handle_updated_at();
create trigger predictions_updated_at before update on public.predictions
for each row execute function public.handle_updated_at();
create trigger group_score_settings_updated_at before update on public.group_score_settings
for each row execute function public.handle_updated_at();

create or replace function public.is_group_member(target_group_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.group_members gm
    where gm.group_id = target_group_id and gm.user_id = auth.uid()
  );
$$;

create or replace function public.is_group_admin(target_group_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.group_members gm
    where gm.group_id = target_group_id
      and gm.user_id = auth.uid()
      and gm.role = 'admin'
  );
$$;

create or replace function public.is_prediction_unlocked(target_match_id uuid)
returns boolean
language sql
stable
as $$
  select coalesce(m.kickoff_time > now(), true)
  from public.matches m
  where m.id = target_match_id
$$;

alter table public.profiles enable row level security;
alter table public.tournaments enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.teams enable row level security;
alter table public.matches enable row level security;
alter table public.group_match_overrides enable row level security;
alter table public.predictions enable row level security;
alter table public.group_score_settings enable row level security;

create policy "Users can read own profile"
on public.profiles for select to authenticated
using (id = auth.uid());

create policy "Group members can read member profiles"
on public.profiles for select to authenticated
using (
  exists (
    select 1
    from public.group_members self_member
    join public.group_members other_member
      on other_member.group_id = self_member.group_id
    where self_member.user_id = auth.uid()
      and other_member.user_id = profiles.id
  )
);

create policy "Users can update own profile"
on public.profiles for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "Users can insert own profile"
on public.profiles for insert to authenticated
with check (id = auth.uid());

create policy "Anyone authenticated can read supported tournaments"
on public.tournaments for select to authenticated
using (is_supported = true);

create policy "Group members can read groups"
on public.groups for select to authenticated
using (public.is_group_member(id));

create policy "Authenticated users can create groups"
on public.groups for insert to authenticated
with check (created_by = auth.uid());

create policy "Group admins can update groups"
on public.groups for update to authenticated
using (public.is_group_admin(id))
with check (public.is_group_admin(id));

create policy "Group members can read members"
on public.group_members for select to authenticated
using (public.is_group_member(group_id));

create policy "Users can join groups as members"
on public.group_members for insert to authenticated
with check (user_id = auth.uid() and role = 'member');

create policy "Group admins can update members"
on public.group_members for update to authenticated
using (public.is_group_admin(group_id))
with check (public.is_group_admin(group_id));

create policy "Users can delete own membership"
on public.group_members for delete to authenticated
using (user_id = auth.uid() or public.is_group_admin(group_id));

create policy "Authenticated users can read teams"
on public.teams for select to authenticated
using (true);

create policy "Authenticated users can read matches"
on public.matches for select to authenticated
using (true);

create policy "Group admins can manually update matches"
on public.matches for update to authenticated
using (
  exists (
    select 1 from public.groups g
    where g.tournament_id = matches.tournament_id
      and public.is_group_admin(g.id)
  )
)
with check (
  exists (
    select 1 from public.groups g
    where g.tournament_id = matches.tournament_id
      and public.is_group_admin(g.id)
  )
);

create policy "Group members can read match overrides"
on public.group_match_overrides for select to authenticated
using (public.is_group_member(group_id));

create policy "Group admins can write match overrides"
on public.group_match_overrides for all to authenticated
using (public.is_group_admin(group_id))
with check (public.is_group_admin(group_id));

create policy "Group members can read predictions in their groups"
on public.predictions for select to authenticated
using (public.is_group_member(group_id));

create policy "Users can insert own unlocked predictions"
on public.predictions for insert to authenticated
with check (
  user_id = auth.uid()
  and public.is_group_member(group_id)
  and public.is_prediction_unlocked(match_id)
);

create policy "Users can update own unlocked predictions"
on public.predictions for update to authenticated
using (
  user_id = auth.uid()
  and public.is_group_member(group_id)
  and public.is_prediction_unlocked(match_id)
)
with check (
  user_id = auth.uid()
  and public.is_group_member(group_id)
  and public.is_prediction_unlocked(match_id)
);

create policy "Group members can read score settings"
on public.group_score_settings for select to authenticated
using (public.is_group_member(group_id));

create policy "Group admins can update score settings"
on public.group_score_settings for update to authenticated
using (public.is_group_admin(group_id))
with check (public.is_group_admin(group_id));

insert into public.tournaments (code, name, year, source, is_supported, theme)
values (
  'world-cup-2026',
  'FIFA World Cup 2026',
  2026,
  'openfootball',
  true,
  '{
    "primary": "#101827",
    "secondary": "#E63946",
    "accent": "#F7C948",
    "background": "#F7F3EA",
    "surface": "#FFFFFF",
    "text": "#101827",
    "pattern": "north-america-soft"
  }'::jsonb
)
on conflict (code) do update set
  name = excluded.name,
  year = excluded.year,
  source = excluded.source,
  is_supported = excluded.is_supported,
  theme = excluded.theme;
