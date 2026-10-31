-- Consentement de l'adulte qui crée le compte (voir la politique de confidentialité).
alter table public.profiles add column consented_at timestamptz;
