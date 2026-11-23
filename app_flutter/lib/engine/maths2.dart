// Générateurs du lot 2 : suite, tableau, paquets, nœuds, tours de cubes, capacité.
import 'question.dart';
import 'rng.dart';

// ---------------------------------------------------------------- Suite
SuiteQuestion suiteQuestion(Map<String, dynamic> c) {
  final direction = cfgStr(c, 'direction', 'up');
  if (cfgBool(c, 'oral', false)) {
    // « Compte de 1 en 1 de 47 jusqu'à 53 » : l'enfant écrit tous les nombres.
    final len = clampInt(cfgInt(c, 'length', 6), 4, 8);
    final lo = cfgInt(c, 'min', 0).clamp(0, 100);
    final hi = (cfgInt(c, 'max', 100).clamp(0, 100)).clamp(lo + len, 1000);
    final start = rnd(lo, hi - len + 1);
    var seq = List.generate(len, (i) => start + i);
    final dir = direction == 'both' ? (rng.nextDouble() < 0.3 ? 'down' : 'up') : direction;
    if (dir == 'down') seq = seq.reversed.toList();
    return SuiteQuestion(seq, List.generate(len, (i) => i), 1, oral: true);
  }
  final step = cfgInt(c, 'step', 10).clamp(1, 100);
  var len = clampInt(cfgInt(c, 'length', 6), 3, 10);
  final min = cfgInt(c, 'min', 0).clamp(0, 10000);
  final max = cfgInt(c, 'max', 100).clamp(min + step * 2, 100000);
  while (len > 3 && (len - 1) * step > max - min) {
    len--;
  }
  final span = (len - 1) * step;
  var start = rnd(min, (max - span).clamp(min, 100000));
  // Une fois sur deux, on part d'un multiple du pas (30, 40, 50…).
  if (rng.nextBool()) start = ((start / step).ceil() * step).clamp(0, max - span);
  start = start < min ? min : start;
  var seq = List.generate(len, (i) => start + i * step);
  final dir = direction == 'both' ? (rng.nextBool() ? 'up' : 'down') : direction;
  if (dir == 'down') seq = seq.reversed.toList();
  // On laisse toujours les deux premiers nombres visibles pour que l'enfant voie le pas.
  final possible = shuffled(List.generate(len - 2, (i) => i + 2));
  final blanks = possible.take(clampInt(cfgInt(c, 'blanks', 1), 1, len - 2)).toList()..sort();
  return SuiteQuestion(seq, blanks, step);
}

// ---------------------------------------------------------------- Tableau d'addition
List<int> _distinct(int n, int lo, int hi) {
  final out = shuffled(List.generate(hi - lo + 1, (i) => lo + i)).take(n).toList();
  while (out.length < n) {
    out.add(rnd(lo, hi));
  }
  return out;
}

TableQuestion tableQuestion(Map<String, dynamic> c) {
  final size = clampInt(cfgInt(c, 'size', 4), 2, 5);
  final lo = clampInt(cfgInt(c, 'min', 2), 0, 50);
  final hi = clampInt(cfgInt(c, 'max', 9), lo + 1, 50);
  final rows = _distinct(size, lo, hi), cols = _distinct(size, lo, hi);
  final all = [for (var r = 0; r < size; r++) for (var k = 0; k < size; k++) cellKey(r, k)];
  if (cfgStr(c, 'mode', 'sommes') != 'mixte') return TableQuestion(rows, cols, all);
  // Mode mixte : quelques en-têtes cachés, chacun retrouvable grâce à une somme donnée.
  final hideR = shuffled(List.generate(size, (i) => i)).take(rnd(1, (size - 2).clamp(1, size))).toList();
  final hideC = shuffled(List.generate(size, (i) => i)).take(rnd(1, (size - 2).clamp(1, size))).toList();
  final visR = [for (var i = 0; i < size; i++) if (!hideR.contains(i)) i];
  final visC = [for (var i = 0; i < size; i++) if (!hideC.contains(i)) i];
  final given = <String>{};
  for (final r in hideR) {
    given.add(cellKey(r, pick(visC)));
  }
  for (final k in hideC) {
    given.add(cellKey(pick(visR), k));
  }
  given.addAll(shuffled(all).take(size ~/ 2));
  return TableQuestion(rows, cols, [
    ...hideC.map((k) => cellKey(-1, k)),
    ...hideR.map((r) => cellKey(r, -1)),
    ...all.where((k) => !given.contains(k)),
  ]);
}

// ---------------------------------------------------------------- Paquets de 10
PaquetsQuestion paquetsQuestion(Map<String, dynamic> c) {
  final lo = cfgInt(c, 'min', 11).clamp(1, 99);
  final hi = cfgInt(c, 'max', 49).clamp(lo, 100);
  var target = rnd(lo, hi);
  if (target % 10 == 0 && rng.nextDouble() < 0.6 && target < hi) target++;
  final count = (cfgBool(c, 'extra', true) ? target + rnd(4, 12) : target).clamp(1, 100);
  final cols = count <= 24 ? 7 : count <= 50 ? 9 : 12;
  final rows = (count / cols).ceil() + 1;
  final cells = shuffled(List.generate(cols * rows, (i) => i));
  final balls = [
    for (final i in cells.take(count))
      (((i % cols) + 0.5 + (rng.nextDouble() - 0.5) * 0.4) / cols, ((i ~/ cols) + 0.5 + (rng.nextDouble() - 0.5) * 0.4) / rows),
  ];
  return PaquetsQuestion(target, cols, rows, balls);
}

// ---------------------------------------------------------------- Nœuds
const things = [
  Thing('🐱', 'le chat'), Thing('🐶', 'le chien'), Thing('🐰', 'le lapin'), Thing('🦊', 'le renard'), Thing('🐸', 'la grenouille'),
  Thing('🐢', 'la tortue'), Thing('🐭', 'la souris'), Thing('🐻', "l'ours"), Thing('🍎', 'la pomme'), Thing('⭐', "l'étoile"),
];
const nodeCols = 'ABCDEF';
String nodeName((int, int) n) => '${nodeCols[n.$1]}${n.$2 + 1}';

String moveText((int, int) m) {
  String part(int n, String pos, String neg) => n == 0 ? '' : '${n.abs()} nœud${n.abs() > 1 ? 's' : ''} ${n > 0 ? pos : neg}';
  return [part(m.$1, 'à droite', 'à gauche'), part(m.$2, 'vers le haut', 'vers le bas')].where((s) => s.isNotEmpty).join(' et ');
}

NoeudsQuestion noeudsQuestion(String skill, Map<String, dynamic> c) {
  final size = clampInt(cfgInt(c, 'size', 5), 4, 6);
  final ts = shuffled(things);
  (int, int) node() => (rnd(0, size - 1), rnd(0, size - 1));
  var at = node();
  for (var i = 0; i < 5 && at.$1 == at.$2; i++) {
    at = node();
  }
  var answer = at;
  (int, int)? move;
  if (skill == 'bouger') {
    bool ok((int, int) n) => n.$1 >= 0 && n.$2 >= 0 && n.$1 < size && n.$2 < size;
    move = (at.$1 < size - 1 ? 1 : -1, 0);
    for (var g = 0; g < 60; g++) {
      var m = (rnd(-3, 3), rnd(-2, 2));
      if (rng.nextDouble() < 0.35) m = rng.nextBool() ? (0, m.$2) : (m.$1, 0);
      if ((m.$1 != 0 || m.$2 != 0) && ok((at.$1 + m.$1, at.$2 + m.$2))) {
        move = m;
        break;
      }
    }
    answer = (at.$1 + move!.$1, at.$2 + move.$2);
  }
  final others = <(Thing, (int, int))>[];
  final busy = [at, answer];
  for (final t in ts.sublist(1, skill == 'lire' ? 4 : 3)) {
    var n = node();
    var g = 0;
    while (busy.contains(n) && g++ < 30) {
      n = node();
    }
    busy.add(n);
    others.add((t, n));
  }
  var options = <String>[];
  if (skill == 'lire') {
    final right = nodeName(at);
    final cand = <String>{
      if (at.$2 < size) '${nodeCols[at.$2]}${at.$1 + 1}',
      nodeName((at.$1, (at.$2 + 1).clamp(0, size - 1))),
      nodeName((at.$1, (at.$2 - 1).clamp(0, size - 1))),
      nodeName(((at.$1 + 1).clamp(0, size - 1), at.$2)),
      nodeName(((at.$1 - 1).clamp(0, size - 1), at.$2)),
    }..remove(right);
    final list = cand.toList();
    final first = list.isNotEmpty ? [list.first] : <String>[];
    options = shuffled([right, ...first, ...shuffled(list.skip(1)).take(3 - first.length)]);
  }
  return NoeudsQuestion(skill: skill, size: size, thing: ts.first, at: at, answer: answer, others: others, move: move, options: options);
}

// ---------------------------------------------------------------- Tours de cubes
ChateauxQuestion chateauxQuestion(Map<String, dynamic> c) {
  final towers = cfgInt(c, 'towers', 2) == 3 ? 3 : 2;
  final maxTotal = clampInt(cfgInt(c, 'maxTotal', 20), 8, 40);
  for (var g = 0; g < 200; g++) {
    if (towers == 2) {
      if (rng.nextDouble() < 0.2) {
        final x = rnd(2, (maxTotal ~/ 3).clamp(2, 6));
        return ChateauxQuestion(2, 3 * x, 'double', 0, [x, 2 * x]);
      }
      final x = rnd(2, 9), d = rnd(1, 5), total = 2 * x + d;
      if (total <= maxTotal && x + d <= 12) return ChateauxQuestion(2, total, 'plus', d, [x, x + d]);
    } else {
      final x = rnd(1, 6), d = rnd(1, 2), total = 3 * x + 3 * d;
      if (total <= maxTotal && x + 2 * d <= 12) return ChateauxQuestion(3, total, 'plus', d, [x, x + d, x + 2 * d]);
    }
  }
  return const ChateauxQuestion(2, 11, 'plus', 3, [4, 7]);
}

String ruleText(ChateauxQuestion q) {
  if (q.rule == 'double') return 'La tour de droite a 2 fois plus de cubes que la tour de gauche.';
  final cubes = '${q.d} cube${q.d > 1 ? 's' : ''}';
  return q.towers == 2 ? 'La tour de droite a $cubes de plus que la tour de gauche.' : 'Chaque tour a $cubes de plus que la tour à sa gauche.';
}

({int sum, bool totalOk, bool ruleOk}) checkChateau(ChateauxQuestion q, List<int> h) {
  final sum = h.fold<int>(0, (a, b) => a + b);
  final ruleOk = q.rule == 'double'
      ? h[1] == 2 * h[0] && h[0] > 0
      : [for (var i = 1; i < h.length; i++) h[i] - h[i - 1] == q.d].every((x) => x);
  return (sum: sum, totalOk: sum == q.total, ruleOk: ruleOk);
}

// ---------------------------------------------------------------- Capacité
const potColors = [(0xFFD6453A, 'rouge'), (0xFF2F8F55, 'vert'), (0xFF9B6FA8, 'violet'), (0xFFE07A4B, 'orange')];

CapaciteQuestion capaciteQuestion(Map<String, dynamic> c, int i) {
  final cfg = cfgStr(c, 'compare', 'mix');
  final mode = cfg == 'verser' || cfg == 'lire' ? cfg : (rng.nextBool() ? 'verser' : 'lire');
  final cols = shuffled(potColors);
  // un récipient haut et fin, un récipient bas et large : la hauteur ne suffit pas pour décider
  final tw = rnd(36, 50).toDouble(), th = rnd(120, 150).toDouble();
  final target = rng.nextDouble();
  final ww = rnd(95, 125).toDouble();
  double wh;
  if (target < 0.15) {
    wh = (tw * th / ww).roundToDouble();
  } else {
    final ratio = target < 0.575 ? rnd(125, 150) / 100 : rnd(55, 78) / 100;
    wh = (tw * th * ratio / ww).round().clamp(28, 95).toDouble();
  }
  final tallFirst = rng.nextBool();
  final pa = tallFirst ? (tw, th) : (ww, wh);
  final pb = tallFirst ? (ww, wh) : (tw, th);
  final a = Pot(pa.$1, pa.$2, cols[0].$1, cols[0].$2);
  var b = Pot(pb.$1, pb.$2, cols[1].$1, cols[1].$2);
  final ca = a.cap, cb = b.cap;
  final answer = (ca - cb).abs() / (ca > cb ? ca : cb) < 0.03 ? 'pareil' : ca > cb ? 'a' : 'b';
  if (answer == 'pareil') b = Pot(b.w, ca / b.w, b.color, b.name);
  return CapaciteQuestion(mode, a, b, answer, rng.nextInt(1 << 30) + i);
}

String explainCapacite(CapaciteQuestion q) {
  if (q.answer == 'a') return "L'eau a débordé du ${q.b.name} : le ${q.a.name} contient plus que le ${q.b.name}.";
  if (q.answer == 'b') return "Le ${q.b.name} n'est pas plein : le ${q.b.name} contient plus que le ${q.a.name}.";
  return "Le ${q.b.name} est plein juste au bord : ils contiennent autant l'un que l'autre.";
}
