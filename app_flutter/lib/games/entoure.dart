import 'package:flutter/material.dart';
import '../engine/question.dart';
import '../ui/audio.dart';
import '../ui/balls.dart';
import '../ui/theme.dart';
import 'common.dart';
import 'drawpad.dart';

/// « Entoure la collection de N balles » — au doigt, ou d'un simple toucher.
class EntoureGame extends StatefulWidget {
  final CollectionQuestion q;
  final OnAttempt onAttempt;
  final VoidCallback onSolved;
  final void Function(String msg) onNudge;
  const EntoureGame({super.key, required this.q, required this.onAttempt, required this.onSolved, required this.onNudge});
  @override
  State<EntoureGame> createState() => _EntoureGameState();
}

class _EntoureGameState extends State<EntoureGame> {
  final wrong = <int>{};
  int? right;
  int counted = 0;
  bool showUnits = false;
  final padKey = GlobalKey();
  late final cardKeys = List.generate(widget.q.options.length, (_) => GlobalKey());

  Rect _rect(int i) {
    final pad = padKey.currentContext!.findRenderObject() as RenderBox;
    final box = cardKeys[i].currentContext!.findRenderObject() as RenderBox;
    final tl = pad.globalToLocal(box.localToGlobal(Offset.zero));
    return tl & box.size;
  }

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

  void choose(int i) {
    final q = widget.q;
    final ok = q.options[i] == q.target;
    widget.onAttempt('${q.options[i]}', '${q.target}', ok);
    setState(() {
      if (ok) {
        right = i;
        _countAlong();
      } else {
        wrong.add(i);
      }
    });
  }

  void onStroke(List<Offset> pts) {
    if (right != null) return;
    final open = [for (var i = 0; i < widget.q.options.length; i++) if (!wrong.contains(i)) i];
    final xs = pts.map((p) => p.dx), ys = pts.map((p) => p.dy);
    final w = xs.reduce((a, b) => a > b ? a : b) - xs.reduce((a, b) => a < b ? a : b);
    final h = ys.reduce((a, b) => a > b ? a : b) - ys.reduce((a, b) => a < b ? a : b);
    final List<int> hits;
    if (w < 30 && h < 30) {
      hits = open.where((i) => _rect(i).contains(pts.first)).toList(); // simple toucher
    } else {
      hits = open.where((i) => pointInPolygon(_rect(i).center, pts)).toList();
    }
    if (hits.length == 1) {
      choose(hits.first);
    } else {
      widget.onNudge(hits.length > 1 ? "Fais un rond autour d'une seule collection." : 'Fais un grand rond tout autour des balles.');
    }
  }

  @override
  Widget build(BuildContext context) {
    final q = widget.q;
    return Column(children: [
      Row(mainAxisAlignment: MainAxisAlignment.center, children: [
        Text('Voici 10 balles de tennis : ', style: body(17, color: C.inkSoft)),
        const Pack(b: 18),
      ]),
      const SizedBox(height: 14),
      DrawPad(
        key: padKey,
        enabled: right == null,
        onStroke: onStroke,
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: LayoutBuilder(builder: (context, box) {
            const gap = 26.0;
            final cols = box.maxWidth < 520 ? 1 : 2;
            final w = (box.maxWidth - gap * (cols - 1)) / cols;
            final b = cols == 1 ? 20.0 : 19.0;
            return Wrap(spacing: gap, runSpacing: gap, children: [
              for (var i = 0; i < q.options.length; i++)
                AnimatedOpacity(
                  key: cardKeys[i],
                  duration: const Duration(milliseconds: 250),
                  opacity: wrong.contains(i) ? 0.35 : 1,
                  child: Container(
                    width: w,
                    constraints: const BoxConstraints(minHeight: 140),
                    alignment: Alignment.center,
                    padding: const EdgeInsets.symmetric(vertical: 26, horizontal: 20),
                    decoration: BoxDecoration(
                      color: right == i ? C.okSoft : C.tint,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: right == i ? C.ok : Colors.transparent, width: 3),
                    ),
                    child: Collection(n: q.options[i], b: b, counted: right == i ? counted : 0, showUnits: right == i && showUnits),
                  ),
                ),
            ]);
          }),
        ),
      ),
    ]);
  }
}
