import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const configured = Boolean(url && key)

export const supabase = createClient(url || 'http://localhost', key || 'missing', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // Connexion par code à 6 chiffres : pas de lien magique qui s'ouvrirait
    // dans Safari au lieu de l'app installée sur l'écran d'accueil.
    detectSessionInUrl: false,
    storageKey: 'balles-auth',
  },
})
