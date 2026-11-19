import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../ui/theme.dart';

typedef OnAttempt = void Function(String given, String expected, bool correct);

/// Bouton-réponse (carte blanche) : s'estompe et tremble si faux, devient vert si juste.
class AnswerCard extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;
  final bool wrong, right;
  final EdgeInsets padding;
  const AnswerCard({super.key, required this.child, this.onTap, this.wrong = false, this.right = false, this.padding = const EdgeInsets.symmetric(vertical: 16, horizontal: 10)});
  @override
  State<AnswerCard> createState() => _AnswerCardState();
}

class _AnswerCardState extends State<AnswerCard> with SingleTickerProviderStateMixin {
  late final AnimationController _shake = AnimationController(vsync: this, duration: const Duration(milliseconds: 400));

  @override
  void didUpdateWidget(covariant AnswerCard old) {
    super.didUpdateWidget(old);
    if (widget.wrong && !old.wrong) _shake.forward(from: 0);
  }

  @override
  void dispose() {
    _shake.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _shake,
      builder: (_, child) => Transform.translate(offset: Offset(8 * math.sin(_shake.value * math.pi * 5) * (1 - _shake.value), 0), child: child),
      child: AnimatedOpacity(
        duration: const Duration(milliseconds: 200),
        opacity: widget.wrong ? 0.4 : 1,
        child: Material(
          color: Colors.transparent,
          borderRadius: BorderRadius.circular(18),
          child: InkWell(
            borderRadius: BorderRadius.circular(18),
            onTap: widget.onTap,
            child: Container(
              padding: widget.padding,
              decoration: BoxDecoration(
                color: widget.right ? C.okSoft : Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: widget.right ? C.ok : C.rule, width: 3),
                boxShadow: widget.right ? null : const [BoxShadow(color: C.rule, offset: Offset(0, 4))],
              ),
              child: Center(child: widget.child),
            ),
          ),
        ),
      ),
    );
  }
}

/// Grille de réponses qui s'adapte à la largeur.
class AnswerGrid extends StatelessWidget {
  final List<Widget> children;
  final int columns;
  final double maxWidth;
  const AnswerGrid({super.key, required this.children, this.columns = 3, this.maxWidth = 700});
  @override
  Widget build(BuildContext context) {
    return ConstrainedBox(
      constraints: BoxConstraints(maxWidth: maxWidth),
      child: LayoutBuilder(builder: (context, box) {
        final cols = box.maxWidth < 420 && columns > 2 ? 2 : columns;
        const gap = 14.0;
        final w = (box.maxWidth - gap * (cols - 1)) / cols;
        return Wrap(spacing: gap, runSpacing: gap, alignment: WrapAlignment.center, children: [for (final c in children) SizedBox(width: w, child: c)]);
      }),
    );
  }
}

/// Appelle [f] après [ms] millisecondes, sauf si le widget a disparu.
void later(State s, int ms, VoidCallback f) {
  Timer(Duration(milliseconds: ms), () {
    if (s.mounted) f();
  });
}
