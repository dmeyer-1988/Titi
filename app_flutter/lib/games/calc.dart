import 'package:flutter/material.dart';
import '../engine/calcul.dart';
import '../engine/question.dart';
import '../ui/theme.dart';
import 'common.dart';
import 'keypad.dart';

/// Calcul « 34 + 3 = ? » ou « 34 + ? = 37 », avec un clavier à chiffres.
class CalcGame extends StatefulWidget {
  final CalcQuestion q;
  final OnAttempt onAttempt;
  final VoidCallback onSolved;
  const CalcGame({super.key, required this.q, required this.onAttempt, required this.onSolved});
  @override
  State<CalcGame> createState() => _CalcGameState();
}

class _CalcGameState extends State<CalcGame> {
  String entry = '';
  bool done = false, shake = false, help = false;

  void press(String d) {
    if (done) return;
    final q = widget.q;
    setState(() {
      if (d == 'del') {
        if (entry.isNotEmpty) entry = entry.substring(0, entry.length - 1);
      } else if (d == 'ok') {
        if (entry.isEmpty) return;
        final ok = int.tryParse(entry) == q.answer;
        widget.onAttempt(entry, '${q.answer}', ok);
        if (ok) {
          done = true;
          later(this, 700, widget.onSolved);
        } else {
          shake = true;
          help = true;
          later(this, 450, () => setState(() { shake = false; entry = ''; }));
        }
      } else if (entry.length < 4) {
        entry = entry == '0' ? d : entry + d;
      }
    });
  }

  Widget box(String k) {
    final q = widget.q;
    final blank = q.blank == k;
    final v = k == 'a' ? q.a : k == 'b' ? q.b : q.c;
    final text = blank ? (done ? '${q.answer}' : (entry.isEmpty ? '?' : entry)) : '$v';
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      constraints: const BoxConstraints(minWidth: 84),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
      decoration: BoxDecoration(
        color: blank ? (done ? C.okSoft : Colors.white) : C.tint,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: blank ? (done ? C.ok : (shake ? C.no : C.court)) : C.rule, width: 3),
      ),
      child: Text(text, textAlign: TextAlign.center, style: display(52, color: blank ? (done ? C.ok : C.court) : C.ink)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final q = widget.q;
    final hops = help && q.tip == null && q.blank != 'a' && q.b > 0 && q.b <= 10
        ? List.generate(q.b + 1, (i) => q.op == '+' ? q.a + i : q.a - i)
        : null;
    return Column(children: [
      Wrap(alignment: WrapAlignment.center, crossAxisAlignment: WrapCrossAlignment.center, spacing: 12, runSpacing: 8, children: [
        box('a'),
        Text(opSign(q.op), style: display(48, color: C.red)),
        box('b'),
        Text('=', style: display(48, color: C.red)),
        box('c'),
      ]),
      if (help)
        Container(
          margin: const EdgeInsets.only(top: 16),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          decoration: BoxDecoration(color: const Color(0xFFFFF8E6), borderRadius: BorderRadius.circular(14), border: Border.all(color: const Color(0xFFF3DFA6), width: 2)),
          child: q.tip != null
              ? Text('Astuce : ${q.tip}', style: body(17))
              : hops != null
                  ? Wrap(spacing: 6, runSpacing: 6, crossAxisAlignment: WrapCrossAlignment.center, children: [
                      for (var i = 0; i < hops.length; i++) ...[
                        if (i > 0) Text('${opSign(q.op)}1', style: body(13, color: C.inkSoft)),
                        Text(q.blank == 'c' && i == hops.length - 1 && !done ? '?' : '${hops[i]}', style: display(22, color: i == 0 ? C.court : C.ink)),
                      ],
                    ])
                  : Text("Astuce : fais le calcul à l'envers. ${q.op == '+' ? '${q.c} $minus ${q.b} = ?' : '${q.c} + ${q.b} = ?'}", style: body(17)),
        ),
      const SizedBox(height: 18),
      Keypad(onKey: press, enabled: !done),
    ]);
  }
}
