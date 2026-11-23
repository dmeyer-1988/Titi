import 'package:flutter/material.dart';
import '../engine/maths2.dart';
import '../engine/question.dart';
import '../ui/theme.dart';
import 'common.dart';

/// Quadrillage : colonnes A, B, C… en bas, lignes 1, 2, 3… à gauche (1 en bas).
class NoeudsGame extends StatefulWidget {
  final NoeudsQuestion q;
  final OnAttempt onAttempt;
  final VoidCallback onSolved;
  const NoeudsGame({super.key, required this.q, required this.onAttempt, required this.onSolved});
  @override
  State<NoeudsGame> createState() => _NoeudsGameState();
}

class _NoeudsGameState extends State<NoeudsGame> {
  (int, int)? missed;
  final picked = <String>{};
  bool done = false;

  void solved() {
    setState(() => done = true);
    later(this, widget.q.skill == 'bouger' ? 1100 : 700, widget.onSolved);
  }

  void tapNode((int, int) n) {
    if (done || widget.q.skill == 'lire') return;
    final ok = n == widget.q.answer;
    widget.onAttempt(nodeName(n), nodeName(widget.q.answer), ok);
    if (ok) {
      solved();
    } else {
      setState(() => missed = n);
    }
  }

  void choose(String o) {
    if (done) return;
    final ok = o == nodeName(widget.q.at);
    widget.onAttempt(o, nodeName(widget.q.at), ok);
    if (ok) {
      solved();
    } else {
      setState(() => picked.add(o));
    }
  }

  @override
  Widget build(BuildContext context) {
    final q = widget.q;
    final n = q.size;
    final maxSide = (MediaQuery.sizeOf(context).height - 330).clamp(260.0, 520.0);
    return Column(children: [
      LayoutBuilder(builder: (context, box) {
        final side = box.maxWidth.clamp(0.0, maxSide);
        // marges : à gauche pour les chiffres, en bas pour les lettres
        final ml = side * 0.12, mb = side * 0.11, mt = side * 0.05, mr = side * 0.05;
        final u = (side - ml - mr) / (n - 1);
        final h = mt + u * (n - 1) + mb;
        Offset pos((int, int) p) => Offset(ml + p.$1 * u, mt + (n - 1 - p.$2) * u);
        (int, int)? hit(Offset o) {
          final c = ((o.dx - ml) / u).round(), r = n - 1 - ((o.dy - mt) / u).round();
          if (c < 0 || r < 0 || c >= n || r >= n) return null;
          return (o - pos((c, r))).distance <= u * 0.48 ? (c, r) : null;
        }

        final thingAt = q.skill == 'placer' ? (done ? q.answer : null) : (q.skill == 'bouger' && done ? q.answer : q.at);
        Widget emoji(String e, (int, int) p, {double op = 1}) => Positioned(
              left: pos(p).dx - u * 0.36,
              top: pos(p).dy - u * 0.36,
              child: Opacity(opacity: op, child: SizedBox(width: u * 0.72, height: u * 0.72, child: FittedBox(child: Text(e)))),
            );
        return SizedBox(
          width: side,
          height: h,
          child: GestureDetector(
            onTapUp: (d) {
              final p = hit(d.localPosition);
              if (p != null) tapNode(p);
            },
            child: Stack(clipBehavior: Clip.none, children: [
              Positioned.fill(
                child: CustomPaint(
                  painter: _GridPainter(n: n, pos: pos, u: u, miss: done ? null : missed, hit: done ? q.answer : null,
                      trail: q.skill == 'bouger' && done && q.move != null ? [q.at, (q.at.$1 + q.move!.$1, q.at.$2), q.answer] : null),
                ),
              ),
              for (var i = 0; i < n; i++) ...[
                Positioned(left: pos((i, 0)).dx - 20, top: pos((i, 0)).dy + mb * 0.25, child: SizedBox(width: 40, child: Text(nodeCols[i], textAlign: TextAlign.center, style: display(26)))),
                Positioned(left: ml * 0.15, top: pos((0, i)).dy - 18, child: SizedBox(width: ml * 0.6, child: Text('${i + 1}', textAlign: TextAlign.center, style: display(26)))),
              ],
              if (q.skill == 'bouger') emoji(q.thing.emoji, q.at, op: 0.35),
              for (final (t, p) in q.others) emoji(t.emoji, p),
              if (thingAt != null) emoji(q.thing.emoji, thingAt),
            ]),
          ),
        );
      }),
      if (q.skill == 'lire') ...[
        const SizedBox(height: 16),
        AnswerGrid(columns: 4, maxWidth: 620, children: [
          for (final o in q.options)
            AnswerCard(
              wrong: picked.contains(o),
              right: done && o == nodeName(q.at),
              onTap: done || picked.contains(o) ? null : () => choose(o),
              child: Text(o, style: display(36)),
            ),
        ]),
      ],
    ]);
  }
}

class _GridPainter extends CustomPainter {
  final int n;
  final Offset Function((int, int)) pos;
  final double u;
  final (int, int)? miss, hit;
  final List<(int, int)>? trail;
  _GridPainter({required this.n, required this.pos, required this.u, this.miss, this.hit, this.trail});

  @override
  void paint(Canvas canvas, Size size) {
    final line = Paint()..color = const Color(0xFF9FB3C6)..strokeWidth = 2;
    for (var i = 0; i < n; i++) {
      canvas.drawLine(pos((i, 0)), pos((i, n - 1)), line);
      canvas.drawLine(pos((0, i)), pos((n - 1, i)), line);
    }
    final dot = Paint()..color = C.court;
    for (var c = 0; c < n; c++) {
      for (var r = 0; r < n; r++) {
        canvas.drawCircle(pos((c, r)), 5, dot);
      }
    }
    if (trail != null) {
      final p = Path()..moveTo(pos(trail![0]).dx, pos(trail![0]).dy);
      for (final t in trail!.skip(1)) {
        p.lineTo(pos(t).dx, pos(t).dy);
      }
      canvas.drawPath(p, Paint()..color = C.gold..style = PaintingStyle.stroke..strokeWidth = 6..strokeCap = StrokeCap.round);
    }
    if (miss != null) canvas.drawCircle(pos(miss!), u * 0.34, Paint()..color = C.no..style = PaintingStyle.stroke..strokeWidth = 4);
    if (hit != null) canvas.drawCircle(pos(hit!), u * 0.46, Paint()..color = C.ok..style = PaintingStyle.stroke..strokeWidth = 5);
  }

  @override
  bool shouldRepaint(_GridPainter old) => true;
}
