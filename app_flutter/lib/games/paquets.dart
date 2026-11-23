import 'package:flutter/material.dart';
import '../engine/question.dart';
import '../ui/audio.dart';
import '../ui/balls.dart';
import '../ui/theme.dart';
import 'common.dart';
import 'drawpad.dart';

const _groupColors = [Color(0xFF2D6A9F), Color(0xFFD6453A), Color(0xFF2F8F55), Color(0xFF9B6FA8), Color(0xFFE07A4B), Color(0xFFB7791F), Color(0xFF3F7A8C), Color(0xFFC4602A), Color(0xFF6A3DB8), Color(0xFF1F2328)];

/// « Fais des paquets de 10 » : on entoure 10 balles au doigt, on touche des balles seules, puis on valide.
class PaquetsGame extends StatefulWidget {
  final PaquetsQuestion q;
  final OnAttempt onAttempt;
  final VoidCallback onSolved;
  final void Function(String msg) onNudge;
  const PaquetsGame({super.key, required this.q, required this.onAttempt, required this.onSolved, required this.onNudge});
  @override
  State<PaquetsGame> createState() => _PaquetsGameState();
}

class _PaquetsGameState extends State<PaquetsGame> {
  final groups = <({List<int> ids, List<Offset> path})>[]; // path en fractions du terrain
  final singles = <int>[];
  bool done = false;
  Size field = Size.zero;
  // un bord vide tout autour (M cases) pour pouvoir tourner autour des balles du bord
  static const m = 0.9;

  late final int cols = widget.q.cols, rows = widget.q.rows;
  double get gw => cols + 2 * m;
  double get gh => rows + 2 * m;
  Offset ballAt(int i) {
    final (x, y) = widget.q.balls[i];
    return Offset((x * cols + m) / gw, (y * rows + m) / gh);
  }

  Set<int> get grouped => {for (final g in groups) ...g.ids};
  int get total => groups.length * 10 + singles.length;

  void onStroke(List<Offset> pts) {
    if (done || field == Size.zero) return;
    final xs = pts.map((p) => p.dx), ys = pts.map((p) => p.dy);
    final small = xs.reduce((a, b) => a > b ? a : b) - xs.reduce((a, b) => a < b ? a : b) < 26 &&
        ys.reduce((a, b) => a > b ? a : b) - ys.reduce((a, b) => a < b ? a : b) < 26;
    Offset norm(Offset p) => Offset(p.dx / field.width, p.dy / field.height);
    if (small) {
      final p = norm(pts.first);
      final gi = groups.indexWhere((g) => pointInPolygon(p, g.path));
      if (gi >= 0) {
        setState(() => groups.removeAt(gi));
        Sounds.tick(1);
        return;
      }
      var best = -1;
      var bd = double.infinity;
      for (var i = 0; i < widget.q.balls.length; i++) {
        if (grouped.contains(i)) continue;
        final b = ballAt(i);
        final d = Offset((b.dx - p.dx) * field.width, (b.dy - p.dy) * field.height).distance;
        if (d < bd) {
          bd = d;
          best = i;
        }
      }
      if (best < 0 || bd > field.width / gw * 0.75) return;
      if (singles.contains(best)) {
        setState(() => singles.remove(best));
        Sounds.tick(2);
        return;
      }
      if (singles.length >= 9) {
        widget.onNudge('Pas plus de 9 balles seules : avec 10, fais plutôt un paquet !');
        Sounds.bad();
        return;
      }
      setState(() => singles.add(best));
      Sounds.tick(4);
      return;
    }
    final poly = pts.map(norm).toList();
    final inside = [for (var i = 0; i < widget.q.balls.length; i++) if (!grouped.contains(i) && pointInPolygon(ballAt(i), poly)) i];
    if (inside.length == 10) {
      setState(() {
        groups.add((ids: inside, path: poly));
        singles.removeWhere(inside.contains);
      });
      Sounds.good();
    } else if (inside.isNotEmpty) {
      widget.onNudge('Il y a ${inside.length} balle${inside.length > 1 ? 's' : ''} dans ton rond. Il en faut exactement 10 pour un paquet.');
      Sounds.bad();
    }
  }

  void check() {
    final ok = total == widget.q.target;
    widget.onAttempt('$total', '${widget.q.target}', ok);
    if (ok) {
      setState(() => done = true);
      later(this, 500, widget.onSolved);
    }
  }

  @override
  Widget build(BuildContext context) {
    final q = widget.q;
    final maxH = MediaQuery.sizeOf(context).height - 360;
    return Column(children: [
      LayoutBuilder(builder: (context, box) {
        var w = box.maxWidth.clamp(0.0, 760.0);
        if (w * gh / gw > maxH && maxH > 200) w = maxH * gw / gh;
        final h = w * gh / gw;
        field = Size(w, h);
        final bs = w / gw * 0.64;
        final groupOf = <int, int>{};
        for (var g = 0; g < groups.length; g++) {
          for (final i in groups[g].ids) {
            groupOf[i] = g;
          }
        }
        return Center(
          child: Container(
            width: w,
            height: h,
            decoration: BoxDecoration(color: C.tint, borderRadius: BorderRadius.circular(18), border: Border.all(color: C.rule, width: 2)),
            clipBehavior: Clip.antiAlias,
            child: DrawPad(
              enabled: !done,
              onStroke: onStroke,
              child: SizedBox(
                width: w,
                height: h,
                child: Stack(children: [
                  Positioned.fill(child: CustomPaint(painter: _LoopsPainter(groups.map((g) => g.path).toList()))),
                  for (var i = 0; i < q.balls.length; i++)
                    Positioned(
                      left: ballAt(i).dx * w - bs / 2,
                      top: ballAt(i).dy * h - bs / 2 - (singles.contains(i) ? 3 : 0),
                      child: Container(
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          boxShadow: groupOf[i] != null
                              ? [BoxShadow(color: _groupColors[groupOf[i]! % 10], spreadRadius: 3)]
                              : singles.contains(i)
                                  ? const [BoxShadow(color: C.gold, spreadRadius: 4)]
                                  : null,
                        ),
                        child: Ball(size: bs),
                      ),
                    ),
                  for (var g = 0; g < groups.length; g++)
                    Builder(builder: (_) {
                      final ids = groups[g].ids;
                      final cx = ids.fold<double>(0, (a, i) => a + ballAt(i).dx) / ids.length;
                      final cy = ids.fold<double>(0, (a, i) => a + ballAt(i).dy) / ids.length;
                      return Positioned(
                        left: cx * w - 20,
                        top: cy * h - 15,
                        child: Container(
                          width: 40,
                          alignment: Alignment.center,
                          padding: const EdgeInsets.symmetric(vertical: 3),
                          decoration: BoxDecoration(color: _groupColors[g % 10], borderRadius: BorderRadius.circular(999)),
                          child: Text('10', style: display(18, color: Colors.white)),
                        ),
                      );
                    }),
                ]),
              ),
            ),
          ),
        );
      }),
      const SizedBox(height: 14),
      Wrap(alignment: WrapAlignment.spaceBetween, crossAxisAlignment: WrapCrossAlignment.center, spacing: 16, runSpacing: 12, children: [
        Wrap(crossAxisAlignment: WrapCrossAlignment.center, spacing: 8, children: [
          _chip('${groups.length}', ' paquet${groups.length > 1 ? 's' : ''} de 10', C.court),
          Text('+', style: display(24, color: C.inkSoft)),
          _chip('${singles.length}', ' balle${singles.length > 1 ? 's' : ''}', const Color(0xFFB7791F)),
          Text('=', style: display(24, color: C.inkSoft)),
          Container(
            constraints: const BoxConstraints(minWidth: 56),
            alignment: Alignment.center,
            padding: const EdgeInsets.symmetric(horizontal: 10),
            decoration: BoxDecoration(
              color: total == q.target ? C.okSoft : Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: total == q.target ? C.ok : C.rule, width: 2),
            ),
            child: Text('$total', style: display(30, color: total == q.target ? C.ok : C.ink)),
          ),
        ]),
        Wrap(spacing: 10, children: [
          BigButton('Recommencer', ghost: true, onPressed: done || total == 0 ? null : () => setState(() { groups.clear(); singles.clear(); })),
          BigButton("C'est bon !", onPressed: done || total == 0 ? null : check),
        ]),
      ]),
    ]);
  }

  Widget _chip(String n, String label, Color c) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: C.rule, width: 2)),
        child: Text.rich(TextSpan(children: [TextSpan(text: n, style: display(22, color: c)), TextSpan(text: label, style: body(16))])),
      );
}

class _LoopsPainter extends CustomPainter {
  final List<List<Offset>> loops;
  _LoopsPainter(this.loops);
  @override
  void paint(Canvas canvas, Size size) {
    for (var g = 0; g < loops.length; g++) {
      final pts = loops[g];
      if (pts.length < 3) continue;
      final path = Path()..moveTo(pts.first.dx * size.width, pts.first.dy * size.height);
      for (final p in pts.skip(1)) {
        path.lineTo(p.dx * size.width, p.dy * size.height);
      }
      path.close();
      final c = _groupColors[g % 10];
      canvas.drawPath(path, Paint()..color = c.withValues(alpha: 0.1));
      canvas.drawPath(path, Paint()..color = c..style = PaintingStyle.stroke..strokeWidth = 3..strokeJoin = StrokeJoin.round);
    }
  }

  @override
  bool shouldRepaint(_LoopsPainter old) => true;
}
