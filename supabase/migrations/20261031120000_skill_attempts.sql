-- Compétences de la carte (chemin des jeux) : chaque réponse peut être
-- rattachée à la compétence travaillée, pour mesurer la maîtrise.
alter table public.attempts add column skill_id text;

create index if not exists attempts_skill_idx on public.attempts (skill_id);
