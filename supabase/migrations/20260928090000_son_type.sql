-- Nouveau type d'exercice : le son [on] (on / om).
alter table public.exercises drop constraint if exists exercises_type_check;
alter table public.exercises add constraint exercises_type_check
  check (type in ('entoure', 'combien', 'suite', 'table', 'alphabet', 'son'));
