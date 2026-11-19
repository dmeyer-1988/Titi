// Registre des types d'exercices : métadonnées + générateur. Seuls les types déjà
// portés en Flutter sont listés ; les autres restent visibles dans la version web.
import '../data/models.dart';
import 'calcul.dart';
import 'geo.dart';
import 'question.dart';
import 'rng.dart';
import 'sons.dart';

class Subject {
  final String id, label, tagline;
  const Subject(this.id, this.label, this.tagline);
}

const subjects = [
  Subject('maths', 'Maths', 'Nombres et opérations'),
  Subject('francais', 'Français', 'Lire et écrire'),
  Subject('geo', 'Géographie', 'Le monde et la Suisse'),
];

class TypeDef {
  final String subject, label;
  final List<Question> Function(Map<String, dynamic> config) make;
  const TypeDef(this.subject, this.label, this.make);
}

/// n questions sans doublon (au prix de quelques essais).
List<Question> uniqueRound(int n, Question Function(int i) gen) {
  final out = <Question>[];
  final seen = <String>{};
  for (var i = 0; i < n; i++) {
    var q = gen(i);
    var guard = 0;
    while (seen.contains(q.key) && guard++ < 20) {
      q = gen(i);
    }
    seen.add(q.key);
    out.add(q);
  }
  return out;
}

// ---------- collections ----------
int collectionTarget(Map<String, dynamic> c) {
  final min = clampInt(cfgInt(c, 'min', 10), 1, 100);
  final max = clampInt(cfgInt(c, 'max', 90), min, 100);
  if (cfgBool(c, 'onlyTens', false)) {
    final lo = (min / 10).ceil().clamp(1, 10);
    final hi = (max ~/ 10).clamp(lo, 10);
    return rnd(lo, hi) * 10;
  }
  var n = rnd(min, max);
  // Les dizaines entières sont plus faciles : on les garde rares en mode mixte.
  for (var i = 0; i < 3 && n % 10 == 0 && min != max; i++) {
    n = rnd(min, max);
  }
  return n;
}

List<int> collectionOptions(int t, bool onlyTens, int count) {
  final tens = t ~/ 10, units = t % 10;
  final cand = (onlyTens
          ? [t - 10, t + 10, t - 20, t + 20, t + 5, t - 5]
          : [t + 10, t - 10, t + 1, t - 1, t + 2, t - 2, units * 10 + tens])
      .where((x) => x >= 1 && x <= 100 && x != t)
      .toSet()
      .toList()
    ..shuffle(rng);
  final picked = cand.take(count - 1).toList();
  var guard = 0;
  while (picked.length < count - 1 && guard++ < 100) {
    final x = rnd((t - 25).clamp(1, 100), (t + 25).clamp(1, 100));
    if (x != t && !picked.contains(x)) picked.add(x);
  }
  return shuffled([t, ...picked]);
}

// ---------- drapeaux ----------
List<Question> drapeauxRound(Map<String, dynamic> c) {
  final pool = flagPool(cfgStr(c, 'niveau', 'facile'));
  if (pool.length < 4) return [];
  final n = clampInt(cfgInt(c, 'questions', 10), 1, 30);
  final sensCfg = cfgStr(c, 'sens', 'mix');
  final answers = shuffled(pool);
  while (answers.length < n) {
    answers.addAll(shuffled(pool));
  }
  return List<Question>.generate(n, (i) {
    final answer = answers[i];
    final sens = sensCfg == 'mix' ? (i.isOdd ? 'drapeau' : 'nom') : sensCfg;
    // distracteurs : de préférence du même continent
    final near = shuffled(pool.where((x) => x.code != answer.code && x.cont == answer.cont));
    final far = shuffled(pool.where((x) => x.code != answer.code && x.cont != answer.cont));
    final others = <Country>[];
    for (final x in [...near.take(2), ...far, ...near.skip(2)]) {
      if (others.length == 3) break;
      if (!others.contains(x)) others.add(x);
    }
    return DrapeauQuestion(sens, answer, shuffled([answer, ...others]));
  });
}

final Map<String, TypeDef> types = {
  'combien': TypeDef('maths', 'Combien ?', (c) {
    final onlyTens = cfgBool(c, 'onlyTens', false);
    return uniqueRound(clampInt(cfgInt(c, 'questions', 10), 3, 20), (_) {
      final t = collectionTarget(c);
      return CollectionQuestion(t, collectionOptions(t, onlyTens, 3));
    });
  }),
  'calcul': TypeDef('maths', 'Calcul', (c) => uniqueRound(clampInt(cfgInt(c, 'questions', 10), 3, 20), (_) => calcQuestion(c))),
  'son': TypeDef('francais', 'Le son on / om', sonRound),
  'drapeaux': TypeDef('geo', 'Les drapeaux', drapeauxRound),
};

bool isSupported(Exercise e) => types.containsKey(e.type);

String subjectOf(String type) => types[type]?.subject ?? '';

List<Question> makeRound(Exercise ex) => types[ex.type]?.make(ex.config) ?? const [];
