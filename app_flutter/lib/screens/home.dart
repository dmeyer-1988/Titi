import 'package:flutter/material.dart';
import '../data/app_state.dart';
import '../data/models.dart';
import '../engine/registry.dart';
import '../games/drapeau.dart';
import '../ui/balls.dart';
import '../ui/mascot.dart';
import '../ui/otter.dart';
import '../ui/theme.dart';
import 'runner.dart';

const _subjectColor = {'maths': C.court, 'francais': C.orange, 'geo': C.geo};
const _subjectBg = {'maths': C.courtSoft, 'francais': Color(0xFFFBE7D6), 'geo': Color(0xFFE3F1EA)};

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  String _greeting(AppState s) {
    final h = DateTime.now().hour;
    final hello = h < 12 ? 'Bonjour' : h < 18 ? 'Salut' : 'Bonsoir';
    final c = s.child!;
    final missing = s.family!.packPrice - s.wallet;
    if (s.wallet >= s.family!.packPrice) return 'Tu as ${s.wallet} étoiles : tu peux ouvrir une pochette dans ton album !';
    if (missing > 0 && missing <= 5) return 'Plus que $missing étoile${missing > 1 ? 's' : ''} pour une nouvelle pochette !';
    return '$hello ${c.name} ! C’est moi, ${c.mascotName ?? 'Bigou'}. On joue ensemble ?';
  }

  @override
  Widget build(BuildContext context) {
    final s = AppScope.of(context);
    final f = s.family!;
    final active = f.exercises.where((e) => e.active).toList();
    final narrow = MediaQuery.sizeOf(context).width < 640;
    return Scaffold(
      body: Sheet(
        child: RefreshIndicator(
          onRefresh: s.refresh,
          child: ListView(padding: const EdgeInsets.all(20), children: [
            Row(children: [
              Expanded(child: Mascot(mood: Mood.hello, size: narrow ? 70 : 100, speak: _greeting(s), text: Text(_greeting(s)))),
              _StarsPill(s.wallet),
            ]),
            if (f.children.length > 1)
              Padding(
                padding: const EdgeInsets.only(top: 12),
                child: Wrap(spacing: 8, children: [
                  for (final c in f.children)
                    ChoiceChip(label: Text(c.name), selected: c.id == s.child!.id, onSelected: (_) => s.pickChild(c.id)),
                ]),
              ),
            const SizedBox(height: 18),
            LayoutBuilder(builder: (context, box) {
              final cols = box.maxWidth < 560 ? 1 : 2;
              const gap = 16.0;
              final w = (box.maxWidth - gap * (cols - 1)) / cols;
              return Wrap(spacing: gap, runSpacing: gap, children: [
                for (final sub in subjects)
                  SizedBox(width: w, child: _SubjectTile(subject: sub, games: active.where((e) => subjectOf(e.type) == sub.id).toList(), compact: cols == 1)),
              ]);
            }),
            const SizedBox(height: 18),
            if (s.loadError) Text('Hors ligne · les réponses seront envoyées plus tard', style: body(14, color: C.inkSoft)),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton.icon(
                onPressed: () => showDialog<void>(
                  context: context,
                  builder: (_) => AlertDialog(
                    title: const Text('Espace parent'),
                    content: const Text("Pour l'instant, l'espace parent (créer les exercices, suivre les progrès) se trouve dans la version web de l'app. Il arrivera ici dans une prochaine version."),
                    actions: [
                      TextButton(onPressed: () { Navigator.pop(context); s.signOut(); }, child: const Text('Se déconnecter')),
                      TextButton(onPressed: () => Navigator.pop(context), child: const Text('OK')),
                    ],
                  ),
                ),
                icon: const Icon(Icons.lock_outline_rounded, size: 18),
                label: const Text('Espace parent'),
              ),
            ),
          ]),
        ),
      ),
    );
  }
}

class _StarsPill extends StatelessWidget {
  final int n;
  const _StarsPill(this.n);
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(color: const Color(0xFFFFF4D1), borderRadius: BorderRadius.circular(999)),
        child: Row(mainAxisSize: MainAxisSize.min, children: [const StarIcon(size: 26), const SizedBox(width: 6), Text('$n', style: display(24, color: C.court))]),
      );
}

class _SubjectArt extends StatelessWidget {
  final String id;
  final double scale;
  const _SubjectArt(this.id, {this.scale = 1});
  @override
  Widget build(BuildContext context) {
    if (id == 'maths') {
      return Row(mainAxisSize: MainAxisSize.min, children: [
        Pack(b: 22 * scale),
        SizedBox(width: 10 * scale),
        Text('+', style: display(48 * scale, color: C.red)),
        SizedBox(width: 10 * scale),
        Container(
          padding: EdgeInsets.symmetric(horizontal: 14 * scale),
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14), border: Border.all(color: C.court, width: 2.5)),
          child: Text('7', style: display(48 * scale, color: C.court)),
        ),
      ]);
    }
    if (id == 'geo') {
      return Row(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.end, children: [
        Text('🌍', style: TextStyle(fontSize: 62 * scale)),
        Text('🇨🇭', style: TextStyle(fontSize: 34 * scale)),
      ]);
    }
    return Row(mainAxisSize: MainAxisSize.min, children: [
      for (final (i, l) in ['A', 'b', 'c'].indexed)
        Transform.rotate(
          angle: i == 1 ? -0.1 : i == 2 ? 0.09 : 0,
          child: Container(
            margin: EdgeInsets.only(right: 8 * scale),
            width: 64 * scale,
            height: 70 * scale,
            alignment: Alignment.center,
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14), boxShadow: const [BoxShadow(color: Color(0xFFEFC9A8), offset: Offset(0, 3))]),
            child: Text(l, style: display(54 * scale, color: C.orange)),
          ),
        ),
    ]);
  }
}

class _SubjectTile extends StatelessWidget {
  final Subject subject;
  final List<Exercise> games;
  final bool compact;
  const _SubjectTile({required this.subject, required this.games, required this.compact});

  @override
  Widget build(BuildContext context) {
    final s = AppScope.of(context);
    final playable = games.where(isSupported).toList();
    final starsN = playable.fold<int>(0, (a, e) => a + (s.stars[e.id] ?? 0));
    final empty = playable.isEmpty;
    final name = Text(subject.label, style: display(compact ? 26 : 32, color: _subjectColor[subject.id]!));
    final meta = Row(children: [
      Text(empty ? 'Bientôt' : '${playable.length} jeu${playable.length > 1 ? 'x' : ''} · ', style: body(15, color: C.inkSoft)),
      if (!empty) ...[const StarIcon(size: 16), Text(' $starsN', style: body(15, color: C.inkSoft))],
    ]);
    return Opacity(
      opacity: empty ? 0.55 : 1,
      child: Material(
        color: _subjectBg[subject.id],
        borderRadius: BorderRadius.circular(22),
        child: InkWell(
          borderRadius: BorderRadius.circular(22),
          onTap: empty ? null : () => Navigator.of(context).push(MaterialPageRoute<void>(builder: (_) => SubjectScreen(subject: subject))),
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: compact
                ? Row(children: [
                    SizedBox(width: 110, child: FittedBox(fit: BoxFit.scaleDown, alignment: Alignment.centerLeft, child: _SubjectArt(subject.id, scale: 0.7))),
                    const SizedBox(width: 12),
                    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [name, meta])),
                  ])
                : Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    SizedBox(height: 80, child: FittedBox(fit: BoxFit.scaleDown, alignment: Alignment.centerLeft, child: _SubjectArt(subject.id))),
                    const SizedBox(height: 8),
                    name,
                    meta,
                  ]),
          ),
        ),
      ),
    );
  }
}

/// Les jeux d'une matière.
class SubjectScreen extends StatelessWidget {
  final Subject subject;
  const SubjectScreen({super.key, required this.subject});

  @override
  Widget build(BuildContext context) {
    final s = AppScope.of(context);
    final all = s.family!.exercises.where((e) => e.active && subjectOf(e.type) == subject.id).toList();
    final games = all.where(isSupported).toList();
    return Scaffold(
      body: Sheet(
        child: ListView(padding: const EdgeInsets.all(20), children: [
          Row(children: [
            TextButton.icon(
              onPressed: () => Navigator.of(context).pop(),
              icon: const Icon(Icons.chevron_left_rounded),
              label: Text('Accueil', style: body(16)),
              style: TextButton.styleFrom(backgroundColor: C.tint, foregroundColor: C.ink),
            ),
            const Spacer(),
            _StarsPill(s.wallet),
          ]),
          const SizedBox(height: 10),
          Text(subject.label, style: display(48, color: _subjectColor[subject.id]!)),
          Text('Choisis un jeu.', style: body(20)),
          const SizedBox(height: 16),
          LayoutBuilder(builder: (context, box) {
            final cols = box.maxWidth < 500 ? 1 : box.maxWidth < 820 ? 2 : 3;
            const gap = 14.0;
            final w = (box.maxWidth - gap * (cols - 1)) / cols;
            return Wrap(spacing: gap, runSpacing: gap, children: [
              for (final ex in games) SizedBox(width: w, child: _GameCard(ex: ex, stars: s.stars[ex.id] ?? 0)),
            ]);
          }),
        ]),
      ),
    );
  }
}

class _GameCard extends StatelessWidget {
  final Exercise ex;
  final int stars;
  const _GameCard({required this.ex, required this.stars});

  Widget _thumb() {
    switch (ex.type) {
      case 'combien':
        return Stack(clipBehavior: Clip.none, children: [const Pack(b: 18), Positioned(right: -18, top: -6, child: Text('?', style: display(30, color: C.red)))]);
      case 'calcul':
        final astuces = ex.config['astuces'] == true;
        return Text(astuces ? '7 + ? = 10' : '34 + 3 = ?', style: display(28, color: C.court));
      case 'son':
        return Text.rich(TextSpan(style: body(32), children: [
          const TextSpan(text: 'p'),
          TextSpan(text: 'om', style: body(32, color: C.orange, weight: FontWeight.w700)),
          const TextSpan(text: 'p'),
          TextSpan(text: 'on', style: body(32, color: C.court, weight: FontWeight.w700)),
        ]));
      case 'entoure':
        return Stack(clipBehavior: Clip.none, children: [
          const Pack(b: 18),
          Positioned(left: -8, top: -8, right: -8, bottom: -8, child: DecoratedBox(decoration: BoxDecoration(border: Border.all(color: C.red, width: 3), borderRadius: BorderRadius.circular(40)))),
        ]);
      case 'paquets':
        return Wrap(spacing: 2, runSpacing: 2, children: [for (var i = 0; i < 12; i++) const Ball(size: 14)]);
      case 'suite':
        final st = (ex.config['step'] as num?)?.toInt() ?? 10;
        return ex.config['oral'] == true
            ? Text('🔊 □ □', style: display(28, color: C.court))
            : Text('${st * 2}  ${st * 3}  □', style: display(28, color: C.court));
      case 'table':
        return Text('+ │ 3  7\n6 │ 9  ?', style: display(18, color: C.court));
      case 'noeuds':
        return Text('A1 · C4', style: display(28, color: C.court));
      case 'chateaux':
        return Row(crossAxisAlignment: CrossAxisAlignment.end, mainAxisSize: MainAxisSize.min, children: [
          for (final (n, c) in const [(3, C.court), (5, C.red)])
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: Column(mainAxisSize: MainAxisSize.min, children: [for (var i = 0; i < n; i++) Container(width: 26, height: 9, margin: const EdgeInsets.only(top: 2), color: c)]),
            ),
        ]);
      case 'capacite':
        return Row(crossAxisAlignment: CrossAxisAlignment.end, mainAxisSize: MainAxisSize.min, children: [
          Container(width: 18, height: 50, decoration: BoxDecoration(color: const Color(0xFF6FB7E8), border: Border.all(color: C.red, width: 3))),
          const SizedBox(width: 12),
          Container(width: 44, height: 24, decoration: BoxDecoration(color: const Color(0xFF6FB7E8), border: Border.all(color: C.ok, width: 3))),
        ]);
      case 'drapeaux':
        return const Row(mainAxisSize: MainAxisSize.min, children: [Flag('🇨🇭', size: 30), Flag('🇫🇷', size: 30), Flag('🇯🇵', size: 30)]);
      default:
        return const SizedBox.shrink();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      color: C.tint,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: () => Navigator.of(context).push(MaterialPageRoute<void>(builder: (_) => RunnerScreen(exercise: ex))),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            SizedBox(height: 64, child: Align(alignment: Alignment.centerLeft, child: _thumb())),
            const SizedBox(height: 10),
            Text(ex.title, style: display(22)),
            const SizedBox(height: 6),
            Row(children: [
              Expanded(child: Text(types[ex.type]?.label ?? ex.type, style: body(14, color: C.inkSoft))),
              const StarIcon(size: 16),
              Text(' $stars', style: body(14, color: C.inkSoft, weight: FontWeight.w700)),
            ]),
          ]),
        ),
      ),
    );
  }
}
