-- Corrige les avertissements de sécurité Supabase.
create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$ begin new.updated_at := now(); return new; end $$;

-- Fonction créée par l'option « RLS automatique » de Supabase : pas besoin qu'elle soit appelable via l'API.
do $$ begin
  if exists (select 1 from pg_proc where proname = 'rls_auto_enable' and pronamespace = 'public'::regnamespace) then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end $$;
