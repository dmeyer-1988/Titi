-- Niveau scolaire de l'enfant (HarmoS 1P–8P).
-- Utilisé pour adapter les exercices de départ et, plus tard, les recommandations.
-- Les comptes existants (4e HarmoS) gardent la valeur par défaut.
alter table public.children
  add column level smallint not null default 4 check (level between 1 and 8);
