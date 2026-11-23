import 'package:flutter/material.dart';
import '../ui/theme.dart';

/// Clavier à chiffres : 1-9, effacer, 0, OK.
class Keypad extends StatelessWidget {
  final void Function(String d) onKey;
  final bool enabled;
  final bool okEnabled;
  final double keyW, keyH;
  const Keypad({super.key, required this.onKey, this.enabled = true, this.okEnabled = true, this.keyW = 86, this.keyH = 70});

  Widget _key(String label, String d, {Color? color, bool on = true}) => SizedBox(
        width: keyW,
        height: keyH,
        child: Opacity(
          opacity: on ? 1 : 0.45,
          child: Material(
            color: color ?? Colors.white,
            borderRadius: BorderRadius.circular(16),
            child: InkWell(
              borderRadius: BorderRadius.circular(16),
              onTap: enabled && on ? () => onKey(d) : null,
              child: Container(
                alignment: Alignment.center,
                decoration: BoxDecoration(borderRadius: BorderRadius.circular(16), border: Border.all(color: color ?? C.rule, width: 2)),
                child: Text(label, style: display(keyH * 0.43, color: color == null ? C.ink : Colors.white)),
              ),
            ),
          ),
        ),
      );

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: keyW * 3 + 24,
      child: Wrap(spacing: 12, runSpacing: 12, children: [
        for (final d in const ['1', '2', '3', '4', '5', '6', '7', '8', '9']) _key(d, d),
        _key('⌫', 'del', color: C.inkSoft),
        _key('0', '0'),
        _key('OK', 'ok', color: C.court, on: okEnabled),
      ]),
    );
  }
}
