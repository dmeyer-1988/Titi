// Captures d'écran de l'app (lancées par la CI avec --update-goldens, puis publiées
// sur la branche « flutter-shots » pour vérifier le rendu sans iPad).
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:bigou/data/app_state.dart';
import 'package:bigou/data/demo.dart';
import 'package:bigou/engine/geo.dart';
import 'package:bigou/engine/registry.dart';
import 'package:bigou/screens/home.dart';
import 'package:bigou/screens/runner.dart';
import 'package:bigou/ui/audio.dart';
import 'package:bigou/ui/theme.dart';

Future<void> loadFonts() async {
  final andika = FontLoader('Andika')
    ..addFont(rootBundle.load('assets/fonts/Andika-Regular.ttf'))
    ..addFont(rootBundle.load('assets/fonts/Andika-Bold.ttf'));
  final baloo = FontLoader('Baloo2')..addFont(rootBundle.load('assets/fonts/Baloo2.ttf'));
  await Future.wait([andika.load(), baloo.load()]);
}

AppState demoState() => AppState()
  ..local = true
  ..ready = true
  ..uid = 'demo'
  ..family = demoFamily
  ..childId = demoFamily.children.first.id
  ..earned = 7;

Widget wrap(AppState s, Widget home) => AppScope(
      state: s,
      child: MaterialApp(debugShowCheckedModeBanner: false, theme: appTheme(), home: home),
    );

/// Laisse le temps aux SVG (Bigou, balles) de se dessiner.
Future<void> settle(WidgetTester t) async {
  for (var i = 0; i < 6; i++) {
    await t.runAsync(() => Future<void>.delayed(const Duration(milliseconds: 60)));
    await t.pump(const Duration(milliseconds: 100));
  }
}

const sizes = {'ipad': Size(1180, 820), 'phone': Size(390, 844)};

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  setUpAll(() async {
    Sounds.muted = true;
    await loadFonts();
    await GeoData.load();
  });

  for (final e in sizes.entries) {
    testWidgets('accueil ${e.key}', (t) async {
      await t.binding.setSurfaceSize(e.value);
      await t.pumpWidget(wrap(demoState(), const HomeScreen()));
      await settle(t);
      await expectLater(find.byType(MaterialApp), matchesGoldenFile('goldens/home_${e.key}.png'));
    });

    testWidgets('matière ${e.key}', (t) async {
      await t.binding.setSurfaceSize(e.value);
      await t.pumpWidget(wrap(demoState(), SubjectScreen(subject: subjects.first)));
      await settle(t);
      await expectLater(find.byType(MaterialApp), matchesGoldenFile('goldens/maths_${e.key}.png'));
    });

    for (final ex in demoFamily.exercises.where(isSupported)) {
      testWidgets('jeu ${ex.id} ${e.key}', (t) async {
        await t.binding.setSurfaceSize(e.value);
        await t.pumpWidget(wrap(demoState(), RunnerScreen(exercise: ex)));
        await settle(t);
        await expectLater(find.byType(MaterialApp), matchesGoldenFile('goldens/game_${ex.id}_${e.key}.png'));
        if (ex.type == 'son') {
          await t.tap(find.text("J'ai compris, on joue !"));
          await settle(t);
          await expectLater(find.byType(MaterialApp), matchesGoldenFile('goldens/game_${ex.id}b_${e.key}.png'));
        }
        if (ex.type == 'calcul') {
          // une mauvaise réponse : l'aide apparaît
          await t.tap(find.text('9').last);
          await t.tap(find.text('OK'));
          await settle(t);
          await t.pump(const Duration(milliseconds: 500));
          await expectLater(find.byType(MaterialApp), matchesGoldenFile('goldens/game_${ex.id}b_${e.key}.png'));
        }
      });
    }
  }
}
