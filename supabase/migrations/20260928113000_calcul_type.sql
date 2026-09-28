-- Nouveau type d'exercice : calcul (+n / −n, résultat ou nombre manquant).
alter table public.exercises drop constraint if exists exercises_type_check;
alter table public.exercises add constraint exercises_type_check
  check (type in ('entoure', 'combien', 'suite', 'table', 'calcul', 'alphabet', 'son'));
