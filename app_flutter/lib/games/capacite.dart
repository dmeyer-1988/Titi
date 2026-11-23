import 'package:flutter/material.dart';
import '../engine/question.dart';
import '../ui/audio.dart';
import '../ui/theme.dart';
import 'common.dart';

const _water = Color(0xFF6FB7E8);

/// Qui contient le plus ? On remplit le premier récipient et on le verse dans l'autre.
class CapaciteGame extends StatefulWidget {
  final CapaciteQuestion q;
  final OnAttempt onAttempt;
  final VoidCallback onSolved;
  const CapaciteGame({super.key, required this.q, required this.onAttempt, required this.onSolved});
  @override
  State<CapaciteGame> createState() => _CapaciteGameState();
}

class _CapaciteGameState extends State<CapaciteGame> with SingleTickerProviderStateMixin {
  late final AnimationController pour = AnimationController(vsync: this, duration: const Duration(milliseconds: 2000), value: widget.q.mode == 'lire' ? 1 : 0)
    ..addStatusListener((s) {
      if (s == AnimationStatus.completed && widget.q.a.cap > widget.q.b.cap) Sounds.bad();
    });
  final wrong = <String>{};
  bool done = false;

  @override
  void dispose() {
    pour.dispose();
    super.dispose();
  }

  String nameOf(String g) => g == 'a' ? widget.q.a.name : g == 'b' ? widget.q.b.name : 'pareil';

  void answer(String g) {
    if (done) return;
    final ok = g == widget.q.answer;
    widget.onAttempt(nameOf(g), nameOf(widget.q.answer), ok);
    setState(() {
      if (ok) {
        done = true;
        later(this, 700, widget.onSolved);
      } else {
        wrong.add(g);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final q = widget.q;
    return AnimatedBuilder(
      animation: pour,
      builder: (context, _) {
        final t = pour.value;
        final after = t >= 1;
        return Column(children: [
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 560),
            child: AspectRatio(aspectRatio: 370 / 230, child: CustomPaint(painter: _PotsPainter(q, t, pour.isAnimating))),
          ),
          if (q.mode == 'lire')
            Padding(
              padding: const EdgeInsets.only(top: 6),
              child: Text.rich(
                TextSpan(style: body(18), children: [
                  const TextSpan(text: 'On a rempli le '),
                  TextSpan(text: q.a.name, style: body(18, color: Color(q.a.color), weight: FontWeight.w700)),
                  const TextSpan(text: " jusqu'en haut, puis on l'a versé dans le "),
                  TextSpan(text: q.b.name, style: body(18, color: Color(q.b.color), weight: FontWeight.w700)),
                  const TextSpan(text: '. Regarde bien !'),
                ]),
                textAlign: TextAlign.center,
              ),
            ),
          const SizedBox(height: 14),
          if (!after)
            BigButton(pour.isAnimating ? 'Ça coule…' : 'Verser le ${q.a.name} dans le ${q.b.name}', onPressed: pour.isAnimating ? null : () { Sounds.tick(3); pour.forward(); })
          else ...[
            Text('Lequel contient le plus ?', style: display(26)),
            const SizedBox(height: 10),
            AnswerGrid(columns: 3, maxWidth: 560, children: [
              for (final g in const ['a', 'b', 'pareil'])
                AnswerCard(
                  wrong: wrong.contains(g),
                  right: done && g == q.answer,
                  onTap: done || wrong.contains(g) ? null : () => answer(g),
                  child: Text(g == 'pareil' ? 'Pareil' : 'Le ${nameOf(g)}', style: display(24, color: g == 'a' ? Color(q.a.color) : g == 'b' ? Color(q.b.color) : C.ink)),
                ),
            ]),
          ],
        ]);
      },
    );
  }
}

class _PotsPainter extends CustomPainter {
  final CapaciteQuestion q;
  final double t;
  final bool pouring;
  _PotsPainter(this.q, this.t, this.pouring);

  static const base = 205.0, xa = 100.0, xb = 270.0;

  void _pot(Canvas c, Pot p, double cx, double level, double overflow) {
    final x0 = cx - p.w / 2, x1 = cx + p.w / 2, top = base - p.h;
    final lh = level.clamp(0.0, 1.0) * p.h;
    final water = Paint()..color = _water;
    if (overflow > 0) {
      final f = (overflow * 3).clamp(0.0, 1.0);
      c.drawRRect(RRect.fromRectAndRadius(Rect.fromLTWH(x0 - 6, top - 2, 4, (base - top) * f), const Radius.circular(2)), water);
      c.drawRRect(RRect.fromRectAndRadius(Rect.fromLTWH(x1 + 2, top - 2, 4, (base - top) * f), const Radius.circular(2)), water);
      c.drawOval(Rect.fromCenter(center: Offset(cx, base + 9), width: p.w + 24 + overflow * 80, height: 10 + overflow * 6), Paint()..color = _water.withValues(alpha: 0.8));
    }
    c.drawRect(Rect.fromLTWH(x0, base - lh, p.w, lh), water);
    if (lh > 0) c.drawRect(Rect.fromLTWH(x0, base - lh, p.w, 3), Paint()..color = Colors.white.withValues(alpha: 0.6));
    final wall = Path()
      ..moveTo(x0 - 3, top - 6)
      ..lineTo(x0 - 3, base + 3)
      ..lineTo(x1 + 3, base + 3)
      ..lineTo(x1 + 3, top - 6);
    c.drawPath(wall, Paint()..color = Color(p.color)..style = PaintingStyle.stroke..strokeWidth = 6..strokeJoin = StrokeJoin.round..strokeCap = StrokeCap.round);
  }

  @override
  void paint(Canvas canvas, Size size) {
    canvas.scale(size.width / 370, size.height / 230);
    canvas.drawLine(const Offset(10, base + 4), const Offset(360, base + 4), Paint()..color = const Color(0xFFC9D3DC)..strokeWidth = 3);
    final ca = q.a.cap, cb = q.b.cap;
    final poured = t * ca;
    final inB = poured < cb ? poured : cb;
    final overflow = poured > cb ? (poured - cb) / ca : 0.0;
    _pot(canvas, q.a, xa, (ca - poured) / ca, 0);
    _pot(canvas, q.b, xb, inB / cb, overflow);
    if (pouring && t < 1) {
      final stream = Path()
        ..moveTo(xa, base - q.a.h - 8)
        ..quadraticBezierTo((xa + xb) / 2, base - 190, xb, base - q.b.h - 4);
      canvas.drawPath(stream, Paint()..color = _water..style = PaintingStyle.stroke..strokeWidth = 5..strokeCap = StrokeCap.round);
    }
    if (t >= 1 && overflow > 0) {
      final tp = TextPainter(
        text: TextSpan(text: 'Ça déborde !', style: display(20, color: C.no)),
        textDirection: TextDirection.ltr,
      )..layout();
      tp.paint(canvas, Offset(xb - tp.width / 2, base - q.b.h - 40));
    }
  }

  @override
  bool shouldRepaint(_PotsPainter old) => old.t != t || old.pouring != pouring || old.q != q;
}
