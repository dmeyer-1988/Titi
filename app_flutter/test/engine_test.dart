import 'package:flutter_test/flutter_test.dart';
import 'package:bigou/engine/calcul.dart';
import 'package:bigou/engine/geo.dart';
import 'package:bigou/engine/question.dart';
import 'package:bigou/engine/registry.dart';
import 'package:bigou/engine/sons.dart';
import 'package:bigou/engine/words.dart';
import 'package:bigou/data/models.dart';

Exercise ex(String type, Map<String, dynamic> config) => Exercise(id: 't', type: type, title: 't', config: config);

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  setUpAll(GeoData.load);

  test('nombres en lettres (Suisse romande)', () {
    expect(words(71), 'septante-et-un');
    expect(words(80), 'huitante');
    expect(words(97), 'nonante-sept');
    expect(words(17), 'dix-sept');
    expect(words(200), 'deux-cents');
  });

  test('combien : 3 options distinctes dont la bonne, dans les bornes', () {
    for (var i = 0; i < 50; i++) {
      for (final q in makeRound(ex('combien', {'min': 11, 'max': 59, 'onlyTens': false, 'questions': 10}))) {
        q as CollectionQuestion;
        expect(q.options.toSet().length, 3);
        expect(q.options, contains(q.target));
        expect(q.target, inInclusiveRange(11, 59));
      }
    }
  });

  test('calcul : résultats justes, jamais négatifs', () {
    for (var i = 0; i < 300; i++) {
      final q = calcQuestion({'op': 'mix', 'steps': [0, 3, 7, 10], 'digits': 2, 'find': 'mix'});
      expect(q.op == '+' ? q.a + q.b : q.a - q.b, q.c);
      expect(q.c, greaterThanOrEqualTo(0));
      final a = astuceQuestion();
      expect(a.op == '+' ? a.a + a.b : a.a - a.b, a.c);
      expect(a.tip, isNotNull);
    }
  });

  test('calculs jusqu’à N : tout reste entre 0 et N', () {
    for (final l in [10, 20, 30, 100]) {
      for (var i = 0; i < 300; i++) {
        final q = calcQuestion({'op': 'mix', 'find': 'mix', 'steps': [2, 5, 9], 'limite': l});
        expect([2, 5, 9], contains(q.b));
        for (final n in [q.a, q.b, q.c]) {
          expect(n, inInclusiveRange(0, l));
        }
        expect(q.op == '+' ? q.a + q.b : q.a - q.b, q.c);
      }
    }
  });

  test('son on/om : règle et mots pièges', () {
    expect(hasSon('ombre'), isTrue);
    expect(isTrap('bonbon'), isTrue);
    expect(isTrap('pompon'), isFalse);
    expect(isTrap('prénom'), isTrue);
    expect(hasSon('bonne'), isFalse);
    final r = makeRound(ex('son', {'focus': ['ombre', 'bonbon'], 'extra': false, 'questions': 6}));
    expect(r, hasLength(6));
  });

  test('drapeaux : 4 options distinctes dont la bonne', () {
    expect(GeoData.countries.length, greaterThan(150));
    for (final niveau in ['facile', 'europe', 'monde']) {
      for (final q in makeRound(ex('drapeaux', {'niveau': niveau, 'sens': 'mix', 'questions': 20}))) {
        q as DrapeauQuestion;
        expect(q.options.map((o) => o.code).toSet().length, 4);
        expect(q.options.map((o) => o.code), contains(q.answer.code));
      }
    }
  });

  test('types inconnus : pas de questions (jeu encore dans la version web)', () {
    expect(makeRound(ex('dictee', {})), isEmpty);
    expect(isSupported(ex('dictee', {})), isFalse);
  });
}
