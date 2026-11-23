import 'question.dart';
import 'rng.dart';

const minus = '−';
String opSign(String op) => op == '+' ? '+' : minus;

const _range = {1: [0, 9], 2: [10, 99], 3: [100, 999]};

/// Calculs « astuces » : amis de 10, doubles, presque-doubles, +9, ±10, dizaines, passage de la dizaine.
CalcQuestion astuceQuestion() {
  const kinds = ['amis10', 'amis10', 'double', 'presque', 'plus10', 'moins10', 'plus9', 'dizaines', 'passage', 'dizaineSup'];
  final kind = kinds[rnd(0, kinds.length - 1)];
  switch (kind) {
    case 'amis10':
      final a = rnd(1, 9);
      return CalcQuestion(op: '+', a: a, b: 10 - a, c: 10, blank: 'b', tip: 'Les amis de 10 : 1 et 9, 2 et 8, 3 et 7, 4 et 6, 5 et 5.');
    case 'double':
      final a = rnd(2, 10);
      return CalcQuestion(op: '+', a: a, b: a, c: 2 * a, blank: 'c', tip: "C'est un double : $a + $a. Tu le connais par cœur ?");
    case 'presque':
      final a = rnd(3, 9);
      return CalcQuestion(op: '+', a: a, b: a + 1, c: 2 * a + 1, blank: 'c', tip: "Presque un double : $a + ${a + 1}, c'est $a + $a = ${2 * a}, puis + 1.");
    case 'plus10':
      final a = rnd(11, 89);
      return CalcQuestion(op: '+', a: a, b: 10, c: a + 10, blank: 'c', tip: 'Avec + 10, seul le chiffre des dizaines change : il augmente de 1.');
    case 'moins10':
      final a = rnd(20, 99);
      return CalcQuestion(op: '-', a: a, b: 10, c: a - 10, blank: 'c', tip: 'Avec − 10, seul le chiffre des dizaines change : il diminue de 1.');
    case 'plus9':
      final a = rnd(11, 80);
      return CalcQuestion(op: '+', a: a, b: 9, c: a + 9, blank: 'c', tip: "+ 9, c'est + 10 puis − 1 : $a + 10 = ${a + 10}, puis − 1.");
    case 'dizaines':
      final x = rnd(1, 6), y = rnd(1, 9 - x);
      return CalcQuestion(op: '+', a: x * 10, b: y * 10, c: (x + y) * 10, blank: 'c', tip: '$x dizaines + $y dizaines = ${x + y} dizaines.');
    case 'passage':
      final a = rnd(6, 9), b = rnd(11 - a, 9);
      return CalcQuestion(op: '+', a: a, b: b, c: a + b, blank: 'c', tip: 'Passe par 10 : $a + ${10 - a} = 10, puis + ${b - (10 - a)}.');
    default:
      final a = rnd(1, 8) * 10 + rnd(1, 9);
      final up = ((a + 9) ~/ 10) * 10;
      return CalcQuestion(op: '+', a: a, b: up - a, c: up, blank: 'b', tip: "Combien pour aller jusqu'à $up ? Pense aux amis de 10 avec le ${a % 10}.");
  }
}

/// « Calculs jusqu'à N » : tous les nombres du calcul (et le résultat) restent entre 0 et N.
CalcQuestion limitedQuestion(Map<String, dynamic> c, int limite) {
  final l = limite.clamp(5, 1000);
  final opCfg = cfgStr(c, 'op', '+');
  final op = opCfg == 'mix' ? (rng.nextBool() ? '+' : '-') : opCfg;
  final top = rng.nextDouble() < 0.7 ? rnd((l / 2).ceil(), l) : rnd(2, l);
  late int a, b, res;
  if (op == '+') {
    res = top;
    a = rnd(1, top - 1);
    b = top - a;
  } else {
    a = top;
    b = rnd(1, top - 1);
    res = a - b;
  }
  final findCfg = cfgStr(c, 'find', 'resultat');
  final find = findCfg == 'mix' ? (rng.nextBool() ? 'resultat' : 'manquant') : findCfg;
  final blank = find == 'resultat' ? 'c' : (rng.nextDouble() < 0.7 ? 'b' : 'a');
  return CalcQuestion(op: op, a: a, b: b, c: res, blank: blank);
}

CalcQuestion calcQuestion(Map<String, dynamic> c) {
  if (cfgBool(c, 'astuces', false)) return astuceQuestion();
  final limite = cfgInt(c, 'limite', 0);
  if (limite > 0) return limitedQuestion(c, limite);
  var steps = cfgInts(c, 'steps');
  if (steps.isEmpty) steps = List.generate(11, (i) => i);
  final b = pick(steps);
  final opCfg = cfgStr(c, 'op', '+');
  final op = opCfg == 'mix' ? (rng.nextBool() ? '+' : '-') : opCfg;
  final digits = cfgInt(c, 'digits', 2);
  final r = _range[digits] ?? _range[2]!;
  final lo = r[0], hi = r[1];
  // Soustraction : jamais de résultat négatif.
  final a = op == '-' ? rnd((b + (digits > 1 ? lo : 0)).clamp(lo, hi), hi) : rnd(lo, hi);
  final res = op == '+' ? a + b : a - b;
  final findCfg = cfgStr(c, 'find', 'resultat');
  final find = findCfg == 'mix' ? (rng.nextBool() ? 'resultat' : 'manquant') : findCfg;
  final blank = find == 'resultat' ? 'c' : (rng.nextDouble() < 0.7 ? 'b' : 'a');
  return CalcQuestion(op: op, a: a, b: b, c: res, blank: blank);
}
