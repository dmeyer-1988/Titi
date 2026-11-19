import 'package:flutter/material.dart';
import '../engine/question.dart';
import '../engine/sons.dart';
import '../ui/audio.dart';
import '../ui/theme.dart';
import 'common.dart';

/// Choisis « on » ou « om » pour chaque trou du mot.
class SonGame extends StatefulWidget {
  final SonQuestion q;
  final OnAttempt onAttempt;
  final VoidCallback onSolved;
  const SonGame({super.key, required this.q, required this.onAttempt, required this.onSolved});
  @override
  State<SonGame> createState() => _SonGameState();
}

class _SonGameState extends State<SonGame> {
  late final parts = parseSon(widget.q.word);
  late final blanks = [for (var i = 0; i < parts.length; i++) if (parts[i] is SonBlank) i];
  final filled = <int>{};
  bool missed = false;
  String? shake;

  int? get current => blanks.where((i) => !filled.contains(i)).firstOrNull;
  bool get done => current == null;

  void choose(String v) {
    if (done) return;
    final p = parts[current!] as SonBlank;
    final ok = v == p.blank;
    widget.onAttempt(v, p.blank, ok);
    setState(() {
      if (ok) {
        filled.add(current!);
        if (done) later(this, 900, widget.onSolved);
      } else {
        shake = v;
        missed = true;
        later(this, 450, () => setState(() => shake = null));
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final trap = isTrap(widget.q.word);
    final spans = <InlineSpan>[];
    var colorNext = false;
    for (var i = 0; i < parts.length; i++) {
      final p = parts[i];
      if (p is SonBlank) {
        final f = filled.contains(i);
        colorNext = f && p.blank == 'om';
        spans.add(WidgetSpan(
          alignment: PlaceholderAlignment.baseline,
          baseline: TextBaseline.alphabetic,
          child: Container(
            constraints: const BoxConstraints(minWidth: 70),
            margin: const EdgeInsets.symmetric(horizontal: 3),
            padding: const EdgeInsets.symmetric(horizontal: 6),
            decoration: BoxDecoration(
              border: Border(bottom: BorderSide(color: i == current ? C.court : C.rule, width: 4)),
            ),
            child: Text(f ? p.blank : ' ', textAlign: TextAlign.center, style: body(56, color: p.blank == 'om' ? C.orange : C.court, weight: FontWeight.w700)),
          ),
        ));
      } else if (p is SonText) {
        final first = p.text[0], rest = p.text.substring(1);
        final hl = colorNext && 'mbp'.contains(first);
        colorNext = false;
        spans.add(TextSpan(text: first, style: hl ? body(56, color: C.orange, weight: FontWeight.w700) : null));
        spans.add(TextSpan(text: rest));
      }
    }
    return Column(children: [
      Row(mainAxisAlignment: MainAxisAlignment.center, children: [
        IconButton.filledTonal(onPressed: () => Sounds.say(widget.q.word), icon: const Icon(Icons.volume_up_rounded, size: 28)),
        const SizedBox(width: 12),
        Flexible(
          child: FittedBox(
            fit: BoxFit.scaleDown,
            child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 8),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(18), border: Border.all(color: C.rule, width: 3)),
            child: Text.rich(TextSpan(style: body(56), children: spans)),
          ),
          ),
        ),
        if (trap && (done || missed))
          Container(
            margin: const EdgeInsets.only(left: 10),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(color: const Color(0xFFFCEBDD), borderRadius: BorderRadius.circular(999)),
            child: Text('Mot piège', style: body(14, color: C.orange, weight: FontWeight.w700)),
          ),
      ]),
      const SizedBox(height: 22),
      Row(mainAxisAlignment: MainAxisAlignment.center, children: [
        for (final v in const ['on', 'om'])
          Flexible(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 160),
              child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 10),
              child: AnswerCard(
                wrong: shake == v,
                onTap: done ? null : () => choose(v),
                child: Text(v, style: body(44, color: v == 'om' ? C.orange : C.court, weight: FontWeight.w700)),
              ),
            ),
            ),
          ),
      ]),
      if (done) ...[
        const SizedBox(height: 16),
        for (final i in blanks) Text('• ${reason(parts[i] as SonBlank, widget.q.word)}', style: body(17)),
      ],
    ]);
  }
}
