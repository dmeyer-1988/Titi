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
