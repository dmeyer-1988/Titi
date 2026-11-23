// Les questions produites par le moteur (une classe par sorte de question).
import 'geo.dart';

sealed class Question {
  const Question();
  /// Clé pour éviter deux fois la même question dans une partie.
  String get key;
  /// Ce qu'on enregistre dans attempts.prompt.
  Map<String, dynamic> toJson();
}

/// « Combien de balles ? » (et plus tard « Entoure »).
class CollectionQuestion extends Question {
  final int target;
  final List<int> options;
  const CollectionQuestion(this.target, this.options);
  @override
  String get key => 'c$target';
  @override
  Map<String, dynamic> toJson() => {'kind': 'collection', 'target': target, 'options': options};
}

/// a op b = c ; [blank] = la case que l'enfant doit trouver ('a', 'b' ou 'c').
class CalcQuestion extends Question {
  final String op; // '+' ou '-'
  final int a, b, c;
  final String blank;
  /// « Calculer efficacement » : l'astuce montrée après une erreur.
  final String? tip;
  const CalcQuestion({required this.op, required this.a, required this.b, required this.c, required this.blank, this.tip});
  int get answer => blank == 'a' ? a : blank == 'b' ? b : c;
  @override
  String get key => 'k$a$op$b$blank';
  @override
  Map<String, dynamic> toJson() => {'kind': 'calc', 'op': op, 'a': a, 'b': b, 'c': c, 'blank': blank, if (tip != null) 'tip': tip};
}

/// Le son [on] : choisir « on » ou « om ».
class SonQuestion extends Question {
  final String word;
  const SonQuestion(this.word);
  @override
  String get key => 'o$word';
  @override
  Map<String, dynamic> toJson() => {'kind': 'son', 'word': word};
}

/// Les drapeaux : 'nom' = on voit le drapeau ; 'drapeau' = on voit le nom.
class DrapeauQuestion extends Question {
  final String sens;
  final Country answer;
  final List<Country> options;
  const DrapeauQuestion(this.sens, this.answer, this.options);
  @override
  String get key => 'f${answer.code}';
  @override
  Map<String, dynamic> toJson() => {'kind': 'drapeau', 'sens': sens, 'answer': answer.code, 'options': options.map((o) => o.code).toList()};
}

/// « Complète la suite » (et la version à l'oral : toutes les cases vides).
class SuiteQuestion extends Question {
  final List<int> seq;
  final List<int> blanks;
  final int step;
  final bool oral;
  const SuiteQuestion(this.seq, this.blanks, this.step, {this.oral = false});
  bool get down => seq.length > 1 && seq[1] < seq[0];
  @override
  String get key => 's${seq.join(',')}|${blanks.join(',')}';
  @override
  Map<String, dynamic> toJson() => {'kind': 'suite', 'seq': seq, 'blanks': blanks, 'step': step, if (oral) 'oral': true};
}

/// Tableau d'addition. Les cases sont repérées par "r,c" : r = -1 pour la ligne d'en-tête, c = -1 pour la colonne.
class TableQuestion extends Question {
  final List<int> rows, cols;
  final List<String> blanks;
  const TableQuestion(this.rows, this.cols, this.blanks);
  int value(int r, int c) => r == -1 ? cols[c] : c == -1 ? rows[r] : rows[r] + cols[c];
  @override
  String get key => 't${rows.join(',')}|${cols.join(',')}';
  @override
  Map<String, dynamic> toJson() => {'kind': 'table', 'rows': rows, 'cols': cols, 'blanks': blanks};
}

String cellKey(int r, int c) => '$r,$c';

/// « Fais des paquets de 10 » : balles en vrac, positions en fraction (0-1) du terrain.
class PaquetsQuestion extends Question {
  final int target, cols, rows;
  final List<(double, double)> balls;
  const PaquetsQuestion(this.target, this.cols, this.rows, this.balls);
  @override
  String get key => 'p$target';
  @override
  Map<String, dynamic> toJson() => {'kind': 'paquets', 'target': target, 'count': balls.length};
}

/// Un objet posé sur le quadrillage des nœuds.
class Thing {
  final String emoji, name;
  const Thing(this.emoji, this.name);
}

/// Les nœuds : (colonne 0 = A, ligne 0 = 1 en bas).
class NoeudsQuestion extends Question {
  final String skill; // lire | placer | bouger
  final int size;
  final Thing thing;
  final (int, int) at, answer;
  final List<(Thing, (int, int))> others;
  final (int, int)? move;
  final List<String> options;
  const NoeudsQuestion({required this.skill, required this.size, required this.thing, required this.at, required this.answer, required this.others, this.move, this.options = const []});
  @override
  String get key => 'n$skill${at.$1}${at.$2}${answer.$1}${answer.$2}';
  @override
  Map<String, dynamic> toJson() => {'kind': 'noeuds', 'skill': skill, 'size': size, 'at': [at.$1, at.$2], 'answer': [answer.$1, answer.$2]};
}

/// Les tours de cubes : deux conditions à respecter, par essais successifs.
class ChateauxQuestion extends Question {
  final int towers, total, d;
  final String rule; // plus | double
  final List<int> answer;
  const ChateauxQuestion(this.towers, this.total, this.rule, this.d, this.answer);
  @override
  String get key => 'h${answer.join(',')}$rule';
  @override
  Map<String, dynamic> toJson() => {'kind': 'chateaux', 'towers': towers, 'total': total, 'rule': rule, 'd': d, 'answer': answer};
}

/// Un récipient vu de face : largeur et hauteur intérieures. Sa capacité = w × h.
class Pot {
  final double w, h;
  final int color;
  final String name;
  const Pot(this.w, this.h, this.color, this.name);
  double get cap => w * h;
}

/// Qui contient le plus ? a est rempli puis versé dans b.
class CapaciteQuestion extends Question {
  final String mode; // verser | lire
  final Pot a, b;
  final String answer; // a | b | pareil
  final int seed;
  const CapaciteQuestion(this.mode, this.a, this.b, this.answer, this.seed);
  @override
  String get key => 'v$seed';
  @override
  Map<String, dynamic> toJson() => {'kind': 'capacite', 'mode': mode, 'a': [a.w, a.h, a.name], 'b': [b.w, b.h, b.name], 'answer': answer};
}
