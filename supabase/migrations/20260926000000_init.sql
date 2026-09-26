-- Les balles — schéma initial
-- À coller dans Supabase → SQL Editor → Run (ou `supabase db push`).

create extension if not exists pgcrypto;

-- Réglages du parent (code de l'espace parent)
create table if not exists public.profiles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  parent_pin text not null default '1234' check (parent_pin ~ '^[0-9]{4}$'),
  created_at timestamptz not null default now()
);

-- Enfants (un seul au départ, mais prêt pour un deuxième)
create table if not exists public.children (
  id         uuid primary key default gen_random_uuid(),
  owner      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 40),
  created_at timestamptz not null default now()
);

-- Exercices créés par le parent. `config` dépend du type (voir src/engine/types.ts).
create table if not exists public.exercises (
  id         uuid primary key default gen_random_uuid(),
  owner      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  type       text not null check (type in ('entoure', 'combien', 'suite')),
  title      text not null check (char_length(title) between 1 and 60),
  config     jsonb not null default '{}'::jsonb,
  active     boolean not null default true,
  position   int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Chaque réponse donnée par l'enfant. L'id est généré côté client pour
-- pouvoir renvoyer sans doublon les réponses faites hors ligne.
create table if not exists public.attempts (
  id            uuid primary key,
  owner         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  child_id      uuid not null references public.children(id) on delete cascade,
  exercise_id   uuid references public.exercises(id) on delete set null,
  exercise_type text not null,
  prompt        jsonb not null default '{}'::jsonb,
  expected      text not null,
  given         text not null,
  correct       boolean not null,
  first_try     boolean not null,
  created_at    timestamptz not null default now()
);

create index if not exists attempts_owner_created_idx on public.attempts (owner, created_at desc);
create index if not exists attempts_exercise_idx on public.attempts (exercise_id);
create index if not exists exercises_owner_idx on public.exercises (owner, position);

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at := now(); return new; end $$;

drop trigger if exists exercises_touch on public.exercises;
create trigger exercises_touch before update on public.exercises
  for each row execute function public.touch_updated_at();

-- Row Level Security : chaque famille ne voit que ses propres données.
alter table public.profiles  enable row level security;
alter table public.children  enable row level security;
alter table public.exercises enable row level security;
alter table public.attempts  enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own children" on public.children;
create policy "own children" on public.children
  for all using (owner = auth.uid()) with check (owner = auth.uid());

drop policy if exists "own exercises" on public.exercises;
create policy "own exercises" on public.exercises
  for all using (owner = auth.uid()) with check (owner = auth.uid());

drop policy if exists "own attempts" on public.attempts;
create policy "own attempts" on public.attempts
  for all using (owner = auth.uid()) with check (
    owner = auth.uid()
    and exists (select 1 from public.children c where c.id = child_id and c.owner = auth.uid())
  );
