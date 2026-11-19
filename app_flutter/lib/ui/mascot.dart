import 'package:flutter/material.dart';
import 'audio.dart';
import 'otter.dart';
import 'theme.dart';

/// Bigou avec sa bulle. Toucher la loutre lui fait relire sa bulle.
class Mascot extends StatefulWidget {
  final Mood mood;
  final Widget? text;
  final String? speak;
  final double size;
  const Mascot({super.key, required this.mood, this.text, this.speak, this.size = 90});
  @override
  State<Mascot> createState() => _MascotState();
}

class _MascotState extends State<Mascot> {
  int hop = 0;

  @override
  void didUpdateWidget(covariant Mascot old) {
    super.didUpdateWidget(old);
    if (old.mood != widget.mood || old.speak != widget.speak) hop++;
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        GestureDetector(
          onTap: () {
            setState(() => hop++);
            if (widget.speak != null) Sounds.say(widget.speak!);
          },
          child: TweenAnimationBuilder<double>(
            key: ValueKey(hop),
            tween: Tween(begin: 0, end: 1),
            duration: const Duration(milliseconds: 450),
            builder: (_, t, child) => Transform.translate(offset: Offset(0, -14 * (4 * t * (1 - t))), child: child),
            child: Otter(mood: widget.mood, size: widget.size),
          ),
        ),
        if (widget.text != null)
          Flexible(
            child: Container(
              margin: const EdgeInsets.only(left: 8),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: C.rule, width: 2),
              ),
              child: DefaultTextStyle(style: body(17), child: widget.text!),
            ),
          ),
      ],
    );
  }
}
