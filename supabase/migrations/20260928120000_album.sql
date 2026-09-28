-- Album de vignettes : pochettes achetées avec les étoiles, vignettes obtenues.

alter table public.profiles add column if not exists pack_price int not null default 10
  check (pack_price between 1 and 100);

create table if not exists public.sticker_packs (
  id         uuid primary key default gen_random_uuid(),
  owner      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  child_id   uuid not null references public.children(id) on delete cascade,
  price      int not null check (price >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.stickers (
  id         uuid primary key default gen_random_uuid(),
  owner      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  child_id   uuid not null references public.children(id) on delete cascade,
  sticker_id int not null check (sticker_id between 1 and 500),
  source     text not null check (source in ('pack', 'echange')),
  pack_id    uuid references public.sticker_packs(id) on delete set null,
  -- true = double donné dans un échange (ne compte plus)
  traded     boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists sticker_packs_child_idx on public.sticker_packs (child_id);
create index if not exists stickers_child_idx on public.stickers (child_id);

alter table public.sticker_packs enable row level security;
alter table public.stickers enable row level security;

drop policy if exists "own packs" on public.sticker_packs;
create policy "own packs" on public.sticker_packs
  for all using (owner = auth.uid()) with check (
    owner = auth.uid() and exists (select 1 from public.children c where c.id = child_id and c.owner = auth.uid())
  );

drop policy if exists "own stickers" on public.stickers;
create policy "own stickers" on public.stickers
  for all using (owner = auth.uid()) with check (
    owner = auth.uid() and exists (select 1 from public.children c where c.id = child_id and c.owner = auth.uid())
  );
