import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'config.dart';
import 'data/app_state.dart';
import 'engine/geo.dart';
import 'screens/home.dart';
import 'screens/login.dart';
import 'screens/setup.dart';
import 'ui/balls.dart';
import 'ui/theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await GeoData.load();
  if (!demoMode) {
    await Supabase.initialize(url: supabaseUrl, anonKey: supabaseAnonKey /* publishableKey quand supabase_flutter 3 sera stable */);
  }
  final state = AppState();
  runApp(LesBallesApp(state: state));
  await state.start();
}

class LesBallesApp extends StatelessWidget {
  final AppState state;
  const LesBallesApp({super.key, required this.state});
  @override
  Widget build(BuildContext context) {
    return AppScope(
      state: state,
      child: MaterialApp(
        title: 'Les balles',
        debugShowCheckedModeBanner: false,
        theme: appTheme(),
        home: const Root(),
      ),
    );
  }
}

/// Choisit l'écran de départ : connexion, première utilisation ou accueil.
class Root extends StatelessWidget {
  const Root({super.key});
  @override
  Widget build(BuildContext context) {
    final s = AppScope.of(context);
    if (!s.ready) return const _Splash();
    if (s.uid == null) return const LoginScreen();
    if (s.family == null) return const _Splash();
    if (s.family!.children.isEmpty) return const SetupScreen();
    return const HomeScreen();
  }
}

class _Splash extends StatelessWidget {
  const _Splash();
  @override
  Widget build(BuildContext context) => const Scaffold(backgroundColor: C.court, body: Center(child: Ball(size: 90)));
}
