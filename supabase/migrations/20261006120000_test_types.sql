alter table public.exercises drop constraint if exists exercises_type_check;
alter table public.exercises add constraint exercises_type_check
  check (type in ('entoure','combien','paquets','suite','table','calcul','noeuds','chateaux','capacite','alphabet','son'));
