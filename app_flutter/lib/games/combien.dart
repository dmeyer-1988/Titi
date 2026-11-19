import 'package:flutter/material.dart';
import '../engine/question.dart';
import '../engine/words.dart';
import '../ui/audio.dart';
import '../ui/balls.dart';
import '../ui/theme.dart';
import 'common.dart';

/// « Combien de balles ? » — une collection, trois réponses. Après la bonne réponse, on compte 10, 20, 30… +4.
class CombienGame extends StatefulWidget {
  final CollectionQuestion q;
  final OnAttempt onAttempt;
  final VoidCallback onSolved;
  const CombienGame({super.key, required this.q, required this.onAttempt, required this.onSolved});
  @override
  State<CombienGame> createState() => _CombienGameState();
}

class _CombienGameState extends State<CombienGame> {
  final wrong = <int>{};
  bool done = false;
  int counted = 0;
  bool showUnits = false;

  void _countAlong() {
    final n = widget.q.target, packs = n ~/ 10, units = n % 10;
    const step = 380;
    for (var i = 1; i <= packs; i++) {
      later(this, i * step, () { setState(() => counted = i); Sounds.tick(i); });
    }
    var t = (packs + 1) * step;
    if (units > 0) {
      later(this, t, () { setState(() => showUnits = true); Sounds.tick(packs + 4); });
      t += step;
    }
    later(this, t, widget.onSolved);
  }

  @override
  Widget build(BuildContext context) {
    final q = widget.q;
    return Column(children: [
      Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 30, horizontal: 16),
        decoration: BoxDecoration(color: C.tint, borderRadius: BorderRadius.circular(18)),
        child: Collection(n: q.target, counted: counted, showUnits: showUnits),
      ),
      const SizedBox(height: 18),
      AnswerGrid(columns: 3, children: [
        for (var i = 0; i < q.options.length; i++)
          AnswerCard(
            wrong: wrong.contains(i),
            right: done && q.options[i] == q.target,
            onTap: done || wrong.contains(i)
                ? null
                : () {
                    final ok = q.options[i] == q.target;
                    widget.onAttempt('${q.options[i]}', '${q.target}', ok);
                    setState(() {
                      if (ok) {
                        done = true;
                        _countAlong();
                      } else {
                        wrong.add(i);
                      }
                    });
                  },
            child: Column(children: [
              Text('${q.options[i]}', style: display(44)),
              Text(words(q.options[i]), style: body(15, color: C.inkSoft), textAlign: TextAlign.center),
            ]),
          ),
      ]),
    ]);
  }
}
