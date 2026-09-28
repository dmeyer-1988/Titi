-- Équipes de copains : objectif commun, régularité de la semaine, échanges de doubles.
-- Chaque famille ne voit que ses propres données, plus les chiffres agrégés de son équipe.

create table if not exists public.teams (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 40),
  code       text not null unique,
  goal       int not null default 200 check (goal between 10 and 10000),
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.team_members (
  team_id   uuid not null references public.teams(id) on delete cascade,
  child_id  uuid not null unique references public.children(id) on delete cascade,
  owner     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  pseudo    text not null check (char_length(pseudo) between 1 and 20),
  avatar    text not null default '🦁' check (char_length(avatar) <= 8),
  joined_at timestamptz not null default now(),
  primary key (team_id, child_id)
);

create table if not exists public.sticker_offers (
  id           uuid primary key default gen_random_uuid(),
  team_id      uuid not null references public.teams(id) on delete cascade,
  from_child   uuid not null references public.children(id) on delete cascade,
  from_owner   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  give_sticker int not null check (give_sticker between 1 and 500),
  want_sticker int not null check (want_sticker between 1 and 500 and want_sticker <> give_sticker),
  status       text not null default 'open' check (status in ('open', 'accepted', 'cancelled')),
  to_child     uuid references public.children(id) on delete set null,
  created_at   timestamptz not null default now(),
  done_at      timestamptz
);

create table if not exists public.team_bonus_claims (
  team_id  uuid not null references public.teams(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  week     date not null,
  primary key (team_id, child_id, week)
);

create index if not exists team_members_owner_idx on public.team_members (owner);
create index if not exists sticker_offers_team_idx on public.sticker_offers (team_id, status);

-- Lundi de la semaine en cours, heure suisse.
create or replace function public.week_start() returns timestamptz
language sql stable set search_path = '' as $$
  select (date_trunc('week', now() at time zone 'Europe/Zurich')) at time zone 'Europe/Zurich'
$$;

create or replace function public.is_team_member(t uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.team_members m where m.team_id = t and m.owner = auth.uid())
$$;

alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.sticker_offers enable row level security;
alter table public.team_bonus_claims enable row level security;

drop policy if exists "see my teams" on public.teams;
create policy "see my teams" on public.teams for select using (public.is_team_member(id) or created_by = auth.uid());
drop policy if exists "creator edits team" on public.teams;
create policy "creator edits team" on public.teams for update using (created_by = auth.uid()) with check (created_by = auth.uid());

drop policy if exists "see teammates" on public.team_members;
create policy "see teammates" on public.team_members for select using (public.is_team_member(team_id));
drop policy if exists "edit my member" on public.team_members;
create policy "edit my member" on public.team_members for update using (owner = auth.uid()) with check (owner = auth.uid());
drop policy if exists "leave team" on public.team_members;
create policy "leave team" on public.team_members for delete using (owner = auth.uid());

drop policy if exists "see team offers" on public.sticker_offers;
create policy "see team offers" on public.sticker_offers for select using (public.is_team_member(team_id));
drop policy if exists "make offer" on public.sticker_offers;
create policy "make offer" on public.sticker_offers for insert with check (
  from_owner = auth.uid() and status = 'open'
  and exists (select 1 from public.team_members m where m.team_id = sticker_offers.team_id and m.child_id = sticker_offers.from_child and m.owner = auth.uid())
);
drop policy if exists "cancel my offer" on public.sticker_offers;
create policy "cancel my offer" on public.sticker_offers for update
  using (from_owner = auth.uid() and status = 'open') with check (from_owner = auth.uid() and status = 'cancelled');

drop policy if exists "see my claims" on public.team_bonus_claims;
create policy "see my claims" on public.team_bonus_claims for select
  using (exists (select 1 from public.children c where c.id = child_id and c.owner = auth.uid()));

-- Code d'équipe lisible : 6 caractères sans 0/O ni 1/I.
create or replace function public.new_team_code() returns text
language plpgsql volatile set search_path = '' as $$
declare alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; c text; i int;
begin
  loop
    c := '';
    for i in 1..6 loop c := c || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1); end loop;
    exit when not exists (select 1 from public.teams t where t.code = c);
  end loop;
  return c;
end $$;

create or replace function public.create_team(p_name text, p_child uuid, p_pseudo text, p_avatar text) returns json
language plpgsql security definer set search_path = '' as $$
declare t public.teams;
begin
  if not exists (select 1 from public.children c where c.id = p_child and c.owner = auth.uid()) then
    raise exception 'enfant inconnu';
  end if;
  if exists (select 1 from public.team_members m where m.child_id = p_child) then
    raise exception 'deja dans une equipe';
  end if;
  insert into public.teams (name, code, created_by) values (trim(p_name), public.new_team_code(), auth.uid()) returning * into t;
  insert into public.team_members (team_id, child_id, owner, pseudo, avatar) values (t.id, p_child, auth.uid(), trim(p_pseudo), p_avatar);
  return json_build_object('id', t.id, 'code', t.code);
end $$;

create or replace function public.join_team(p_code text, p_child uuid, p_pseudo text, p_avatar text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare t uuid;
begin
  if not exists (select 1 from public.children c where c.id = p_child and c.owner = auth.uid()) then
    raise exception 'enfant inconnu';
  end if;
  select id into t from public.teams where code = upper(trim(p_code));
  if t is null then raise exception 'code inconnu'; end if;
  if exists (select 1 from public.team_members m where m.child_id = p_child) then
    raise exception 'deja dans une equipe';
  end if;
  if (select count(*) from public.team_members m where m.team_id = t) >= 30 then
    raise exception 'equipe complete';
  end if;
  insert into public.team_members (team_id, child_id, owner, pseudo, avatar) values (t, p_child, auth.uid(), trim(p_pseudo), p_avatar);
  return t;
end $$;

-- Tableau de la semaine : jours joués (masque lun=1 … dim=64), étoiles, objectif commun.
create or replace function public.team_board(p_team uuid, p_child uuid) returns json
language plpgsql stable security definer set search_path = '' as $$
declare w timestamptz := public.week_start(); res json;
begin
  if not public.is_team_member(p_team) then raise exception 'pas membre'; end if;
  with m as (
    select tm.child_id, tm.pseudo, tm.avatar, tm.owner = auth.uid() as mine,
      coalesce((select bit_or(1 << (extract(isodow from (a.created_at at time zone 'Europe/Zurich'))::int - 1))
                from public.attempts a where a.child_id = tm.child_id and a.created_at >= w), 0) as days,
      (select count(*) from public.attempts a where a.child_id = tm.child_id and a.created_at >= w and a.correct and a.first_try)::int as stars
    from public.team_members tm where tm.team_id = p_team
  )
  select json_build_object(
    'goal', (select goal from public.teams where id = p_team),
    'total', coalesce((select sum(stars) from m), 0),
    'claimed', exists (select 1 from public.team_bonus_claims c where c.team_id = p_team and c.child_id = p_child and c.week = w::date),
    'members', coalesce((select json_agg(json_build_object('child_id', child_id, 'pseudo', pseudo, 'avatar', avatar, 'mine', mine, 'days', days, 'stars', stars)) from m), '[]'::json)
  ) into res;
  return res;
end $$;

-- Accepter une offre : chacun donne un double et reçoit la vignette de l'autre.
create or replace function public.accept_offer(p_offer uuid, p_child uuid) returns int
language plpgsql security definer set search_path = '' as $$
declare o public.sticker_offers; mine uuid; theirs uuid;
begin
  select * into o from public.sticker_offers where id = p_offer for update;
  if o.id is null or o.status <> 'open' then raise exception 'offre plus disponible'; end if;
  if o.from_child = p_child then raise exception 'propre offre'; end if;
  if not exists (select 1 from public.team_members m where m.team_id = o.team_id and m.child_id = p_child and m.owner = auth.uid()) then
    raise exception 'pas membre';
  end if;
  if (select count(*) from public.stickers s where s.child_id = p_child and s.sticker_id = o.want_sticker and not s.traded) < 2 then
    raise exception 'pas de double';
  end if;
  if (select count(*) from public.stickers s where s.child_id = o.from_child and s.sticker_id = o.give_sticker and not s.traded) < 2 then
    update public.sticker_offers set status = 'cancelled', done_at = now() where id = o.id;
    return -1;
  end if;
  select id into mine from public.stickers s where s.child_id = p_child and s.sticker_id = o.want_sticker and not s.traded order by created_at desc limit 1;
  select id into theirs from public.stickers s where s.child_id = o.from_child and s.sticker_id = o.give_sticker and not s.traded order by created_at desc limit 1;
  update public.stickers set traded = true where id in (mine, theirs);
  insert into public.stickers (owner, child_id, sticker_id, source) values
    (auth.uid(), p_child, o.give_sticker, 'echange'),
    (o.from_owner, o.from_child, o.want_sticker, 'echange');
  update public.sticker_offers set status = 'accepted', to_child = p_child, done_at = now() where id = o.id;
  return o.give_sticker;
end $$;

-- Pochette bonus quand l'équipe atteint son objectif : une par enfant et par semaine.
create or replace function public.claim_team_bonus(p_team uuid, p_child uuid, p_ids int[]) returns void
language plpgsql security definer set search_path = '' as $$
declare w timestamptz := public.week_start(); total int; g int; pack uuid;
begin
  if not exists (select 1 from public.team_members m where m.team_id = p_team and m.child_id = p_child and m.owner = auth.uid()) then
    raise exception 'pas membre';
  end if;
  if coalesce(array_length(p_ids, 1), 0) <> 5 or exists (select 1 from unnest(p_ids) x where x < 1 or x > 500) then
    raise exception 'pochette invalide';
  end if;
  select goal into g from public.teams where id = p_team;
  select count(*) into total from public.attempts a join public.team_members tm on tm.child_id = a.child_id
    where tm.team_id = p_team and a.created_at >= w and a.correct and a.first_try;
  if total < g then raise exception 'objectif pas atteint'; end if;
  insert into public.team_bonus_claims (team_id, child_id, week) values (p_team, p_child, w::date);
  insert into public.sticker_packs (owner, child_id, price) values (auth.uid(), p_child, 0) returning id into pack;
  insert into public.stickers (owner, child_id, sticker_id, source, pack_id) select auth.uid(), p_child, x, 'pack', pack from unnest(p_ids) x;
end $$;

revoke execute on function public.create_team(text, uuid, text, text) from public, anon;
revoke execute on function public.join_team(text, uuid, text, text) from public, anon;
revoke execute on function public.team_board(uuid, uuid) from public, anon;
revoke execute on function public.accept_offer(uuid, uuid) from public, anon;
revoke execute on function public.claim_team_bonus(uuid, uuid, int[]) from public, anon;
revoke execute on function public.is_team_member(uuid) from public, anon;
revoke execute on function public.new_team_code() from public, anon, authenticated;
grant execute on function public.create_team(text, uuid, text, text) to authenticated;
grant execute on function public.join_team(text, uuid, text, text) to authenticated;
grant execute on function public.team_board(uuid, uuid) to authenticated;
grant execute on function public.accept_offer(uuid, uuid) to authenticated;
grant execute on function public.claim_team_bonus(uuid, uuid, int[]) to authenticated;
grant execute on function public.is_team_member(uuid) to authenticated;
