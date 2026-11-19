// Supabase : mêmes valeurs publiques que la version web (la clé « publishable »
// est faite pour être dans l'app ; les données sont protégées par la RLS).
// On peut les remplacer à la compilation : --dart-define=SUPABASE_URL=… --dart-define=SUPABASE_ANON_KEY=…
const supabaseUrl = String.fromEnvironment('SUPABASE_URL', defaultValue: 'https://vssvylctykrccdhxkwgu.supabase.co');
const supabaseAnonKey = String.fromEnvironment('SUPABASE_ANON_KEY', defaultValue: 'sb_publishable_84ehk0bMWsk58c2zVlzktA_10HPudQZ');

/// Mode démo (captures d'écran de la CI, essais sans compte) : pas de réseau, une famille fictive.
const demoMode = bool.fromEnvironment('DEMO');
