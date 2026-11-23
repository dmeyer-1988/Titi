import 'dart:async';
import 'package:flutter/material.dart';
import '../ui/theme.dart';

bool pointInPolygon(Offset p, List<Offset> poly) {
  var c = false;
  for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    final a = poly[i], b = poly[j];
    if ((a.dy > p.dy) != (b.dy > p.dy) && p.dx < (b.dx - a.dx) * (p.dy - a.dy) / (b.dy - a.dy) + a.dx) c = !c;
  }
  return c;
}

/// Calque où l'on dessine au doigt (ou au stylet) par-dessus [child].
/// À la fin de chaque trait, [onStroke] reçoit les points (dans le repère du calque).
/// Un simple toucher donne un trait d'un seul point.
class DrawPad extends StatefulWidget {
  final Widget child;
  final bool enabled;
  final void Function(List<Offset> pts) onStroke;
  final Color color;
  const DrawPad({super.key, required this.child, required this.onStroke, this.enabled = true, this.color = C.red});
  @override
  State<DrawPad> createState() => _DrawPadState();
}

class _DrawPadState extends State<DrawPad> {
  List<Offset> pts = [];
  int? pointer;
  Timer? fade;

  @override
  void dispose() {
    fade?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Listener(
      behavior: HitTestBehavior.opaque,
      onPointerDown: (e) {
        if (!widget.enabled || pointer != null) return;
        fade?.cancel();
        pointer = e.pointer;
        setState(() => pts = [e.localPosition]);
      },
      onPointerMove: (e) {
        if (e.pointer != pointer) return;
        setState(() => pts = [...pts, e.localPosition]);
      },
      onPointerUp: (e) {
        if (e.pointer != pointer) return;
        pointer = null;
        final stroke = pts;
        widget.onStroke(stroke);
        fade = Timer(const Duration(milliseconds: 700), () {
          if (mounted) setState(() => pts = []);
        });
      },
      onPointerCancel: (e) {
        if (e.pointer == pointer) {
          pointer = null;
          setState(() => pts = []);
        }
      },
      child: Stack(children: [
        widget.child,
        Positioned.fill(child: IgnorePointer(child: CustomPaint(painter: _StrokePainter(pts, widget.color)))),
      ]),
    );
  }
}

class _StrokePainter extends CustomPainter {
  final List<Offset> pts;
  final Color color;
  _StrokePainter(this.pts, this.color);
  @override
  void paint(Canvas canvas, Size size) {
    if (pts.length < 2) return;
    final path = Path()..moveTo(pts.first.dx, pts.first.dy);
    for (final p in pts.skip(1)) {
      path.lineTo(p.dx, p.dy);
    }
    canvas.drawPath(
      path,
      Paint()
        ..color = color.withValues(alpha: 0.85)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 6
        ..strokeCap = StrokeCap.round
        ..strokeJoin = StrokeJoin.round,
    );
  }

  @override
  bool shouldRepaint(_StrokePainter old) => old.pts != pts || old.color != color;
}
