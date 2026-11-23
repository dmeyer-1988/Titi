import 'package:flutter/material.dart';
import '../engine/question.dart';
import '../ui/theme.dart';
import 'common.dart';
import 'keypad.dart';

/// « Complète la suite » : cases vides à remplir avec un clavier à chiffres.
class SuiteGame extends StatefulWidget {
  final SuiteQuestion q;
  final OnAttempt onAttempt;
  final VoidCallback onSolved;
  const SuiteGame({super.key, required this.q, required this.onAttempt, required this.onSolved});
  @override
  State<SuiteGame> createState() => _SuiteGameState();
}

class _SuiteGameState extends State<SuiteGame> {
  final filled = <int, int>{};
  String entry = '';
  bool shake = false;

  int? get current => widget.q.blanks.where((b) => !filled.containsKey(b)).firstOrNull;
  bool get done => current == null;

  void press(String d) {
    if (done) return;
    setState(() {
      if (d == 'del') {
        if (entry.isNotEmpty) entry = entry.substring(0, entry.length - 1);
      } else if (d == 'ok') {
        if (entry.isEmpty) return;
        final v = int.tryParse(entry), expected = widget.q.seq[current!];
        final ok = v == expected;
        widget.onAttempt(entry, '$expected', ok);
        if (ok) {
          filled[current!] = v!;
          entry = '';
          if (done) later(this, 700, widget.onSolved);
        } else {
          shake = true;
          later(this, 450, () => setState(() { shake = false; entry = ''; }));
        }
      } else if (entry.length < 3) {
        entry = entry == '0' ? d : entry + d;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final q = widget.q;
    final narrow = MediaQuery.sizeOf(context).width < 640;
    return Column(children: [
      FittedBox(fit: BoxFit.scaleDown, child: Row(mainAxisSize: MainAxisSize.min, children: [
        for (var i = 0; i < q.seq.length; i++) ...[
          () {
            final blank = q.blanks.contains(i), cur = i == current, ok = filled.containsKey(i);
            final text = !blank ? '${q.seq[i]}' : ok ? '${filled[i]}' : cur ? entry : '';
            return AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              width: narrow ? 64 : 84,
              height: narrow ? 56 : 70,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: ok ? C.okSoft : blank ? Colors.white : C.tint,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: ok ? C.ok : cur ? (shake ? C.no : C.court) : C.rule, width: cur ? 3.5 : 2.5),
              ),
              child: Text(text, style: display(narrow ? 28 : 36, color: ok ? C.ok : blank ? C.court : C.ink)),
            );
          }(),
          if (i < q.seq.length - 1)
            SizedBox(
              width: narrow ? 26 : 36,
              child: AnimatedOpacity(
                duration: const Duration(milliseconds: 300),
                opacity: done && !q.oral ? 1 : 0,
                child: Text('${q.down ? '−' : '+'}${q.step}', textAlign: TextAlign.center, style: body(13, color: C.red, weight: FontWeight.w700)),
              ),
            ),
        ],
      ])),
      const SizedBox(height: 22),
      Keypad(onKey: press, enabled: !done, okEnabled: entry.isNotEmpty),
    ]);
  }
}
