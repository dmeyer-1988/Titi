import 'dart:async';
import 'package:flutter/widgets.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../config.dart';
import 'demo.dart';
import 'models.dart';
import 'store.dart' as store;

/// L'état de l'app : session, famille (enfants + exercices), enfant choisi, étoiles.
class AppState extends ChangeNotifier {
  bool ready = false;
  String? uid;
  Family? family;
  bool loadError = false;
  String? childId;
  Map<String, int> stars = {};
  int earned = 0;
  int spent = 0;
  StreamSubscription<AuthState>? _sub;
  /// true = pas de serveur (mode démo, tests) : rien n'est envoyé à Supabase.
  bool local = demoMode;

  int get wallet => (earned - spent).clamp(0, 1 << 30);

  Child? get child {
    final f = family;
    if (f == null || f.children.isEmpty) return null;
    return f.children.firstWhere((c) => c.id == childId, orElse: () => f.children.first);
  }

  Future<void> start() async {
    if (demoMode) {
      uid = 'demo';
      family = demoFamily;
      childId = demoFamily.children.first.id;
      earned = 7;
      ready = true;
      notifyListeners();
      return;
    }
    final prefs = await SharedPreferences.getInstance();
    childId = prefs.getString(store.childKey);
    final auth = Supabase.instance.client.auth;
    _sub = auth.onAuthStateChange.listen((s) => _setUser(s.session?.user.id));
    await _setUser(auth.currentSession?.user.id);
    ready = true;
    notifyListeners();
  }

  Future<void> _setUser(String? id) async {
    if (id == uid) return;
    uid = id;
    family = null;
    notifyListeners();
    if (id == null) return;
    family = await store.readCache(id);
    notifyListeners();
    await refresh();
    unawaited(store.flushQueue());
  }

  Future<void> refresh() async {
    final id = uid;
    if (id == null || local) return;
    try {
      family = await store.fetchFamily(id);
      loadError = false;
    } catch (_) {
      loadError = true;
    }
    notifyListeners();
    await loadStars();
  }

  Future<void> loadStars() async {
    final c = child;
    if (c == null || local) return;
    try {
      final s = await store.fetchStars(c.id);
      stars = s.byExercise;
      earned = s.total;
      spent = await store.fetchSpentStars(c.id);
      notifyListeners();
    } catch (_) {/* hors ligne : on garde les étoiles affichées */}
  }

  Future<void> pickChild(String id) async {
    childId = id;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(store.childKey, id);
    await loadStars();
  }

  Future<void> record(AttemptDraft a) async {
    final c = child;
    if (c == null) return;
    if (a.firstTry && a.correct) {
      earned++;
      if (a.exerciseId != null) stars[a.exerciseId!] = (stars[a.exerciseId!] ?? 0) + 1;
      notifyListeners();
    }
    if (!local) await store.recordAttempt(c.id, a);
  }

  Future<void> signOut() async {
    if (!local) await Supabase.instance.client.auth.signOut();
  }

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }
}

/// Donne accès à l'état depuis n'importe quel écran : AppScope.of(context).
class AppScope extends InheritedNotifier<AppState> {
  const AppScope({super.key, required AppState state, required super.child}) : super(notifier: state);
  static AppState of(BuildContext context) => context.dependOnInheritedWidgetOfExactType<AppScope>()!.notifier!;
}
