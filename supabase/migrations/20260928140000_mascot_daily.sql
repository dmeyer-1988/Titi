-- Nom de la mascotte (par enfant) et défi du jour (2 étoiles bonus, une fois par jour).
alter table public.children add column if not exists mascot_name text not null default 'Loulou'
  check (char_length(mascot_name) between 1 and 20);

create table if not exists public.daily_challenges (
  child_id   uuid not null references public.children(id) on delete cascade,
  owner      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  day        date not null,
  bonus      int not null default 2 check (bonus between 0 and 10),
  created_at timestamptz not null default now(),
  primary key (child_id, day)
);

alter table public.daily_challenges enable row level security;
drop policy if exists "own daily" on public.daily_challenges;
create policy "own daily" on public.daily_challenges
  for all using (owner = auth.uid()) with check (
    owner = auth.uid() and exists (select 1 from public.children c where c.id = child_id and c.owner = auth.uid())
  );
