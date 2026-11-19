import 'package:flutter/material.dart';
import '../engine/question.dart';
import '../ui/theme.dart';
import 'common.dart';

/// Un drapeau en emoji : sur iPad et iPhone, ce sont les vrais drapeaux en couleur.
class Flag extends StatelessWidget {
  final String flag;
  final double size;
  const Flag(this.flag, {super.key, this.size = 56});
  @override
  Widget build(BuildContext context) => Text(flag, style: TextStyle(fontSize: size, height: 1.1));
}

class DrapeauGame extends StatefulWidget {
  final DrapeauQuestion q;
  final OnAttempt onAttempt;
  final VoidCallback onSolved;
  const DrapeauGame({super.key, required this.q, required this.onAttempt, required this.onSolved});
  @override
  State<DrapeauGame> createState() => _DrapeauGameState();
}

class _DrapeauGameState extends State<DrapeauGame> {
  final wrong = <String>{};
  bool done = false;

  void choose(String code) {
    if (done) return;
    final q = widget.q;
    final ok = code == q.answer.code;
    widget.onAttempt(q.options.firstWhere((o) => o.code == code).name, q.answer.name, ok);
    setState(() {
      if (ok) {
        done = true;
        later(this, 900, widget.onSolved);
      } else {
        wrong.add(code);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final q = widget.q;
    final showFlag = q.sens == 'nom';
    final w = MediaQuery.sizeOf(context).width;
    return Column(children: [
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 6),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(22), border: Border.all(color: C.rule, width: 3)),
        child: showFlag ? Flag(q.answer.flag, size: w < 640 ? 120 : 170) : Text(q.answer.name, style: display(44, color: C.court)),
      ),
      const SizedBox(height: 22),
      AnswerGrid(
        columns: showFlag ? 2 : 4,
        maxWidth: 660,
        children: [
          for (final o in q.options)
            AnswerCard(
              wrong: wrong.contains(o.code),
              right: done && o.code == q.answer.code,
              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
              onTap: done || wrong.contains(o.code) ? null : () => choose(o.code),
              child: showFlag
                  ? Text(o.name, textAlign: TextAlign.center, style: display(24))
                  : Column(mainAxisSize: MainAxisSize.min, children: [
                      Flag(o.flag, size: 58),
                      if (wrong.contains(o.code) || done) Text(o.name, textAlign: TextAlign.center, style: body(13, color: C.inkSoft)),
                    ]),
            ),
        ],
      ),
    ]);
  }
}
