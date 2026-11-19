import 'dart:math';

final rng = Random();

/// Entier au hasard entre a et b (compris).
int rnd(int a, int b) => b <= a ? a : a + rng.nextInt(b - a + 1);

List<T> shuffled<T>(Iterable<T> it) => List<T>.of(it)..shuffle(rng);

T pick<T>(List<T> l) => l[rng.nextInt(l.length)];

int clampInt(num n, int lo, int hi) => n.clamp(lo, hi).toInt();

/// Lecture tolérante d'une config venue de la base (JSON).
int cfgInt(Map<String, dynamic> c, String k, int def) {
  final v = c[k];
  if (v is num) return v.toInt();
  if (v is String) return int.tryParse(v) ?? def;
  return def;
}

bool cfgBool(Map<String, dynamic> c, String k, bool def) {
  final v = c[k];
  return v is bool ? v : def;
}

String cfgStr(Map<String, dynamic> c, String k, String def) {
  final v = c[k];
  return v is String ? v : def;
}

List<String> cfgStrings(Map<String, dynamic> c, String k) {
  final v = c[k];
  return v is List ? v.whereType<String>().toList() : <String>[];
}

List<int> cfgInts(Map<String, dynamic> c, String k) {
  final v = c[k];
  return v is List ? v.whereType<num>().map((e) => e.toInt()).toList() : <int>[];
}
