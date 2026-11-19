import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'theme.dart';

const _ballSvg = '''<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
<defs><radialGradient id="felt" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#F2F59A"/><stop offset=".6" stop-color="#DCE54A"/><stop offset="1" stop-color="#B9C236"/></radialGradient></defs>
<circle cx="20" cy="20" r="18" fill="url(#felt)" stroke="#6F7530" stroke-width="1.6"/>
<path d="M7 11 C 17 15, 17 25, 7 30" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>
<path d="M33 10 C 23 15, 23 25, 33 30" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>
</svg>''';

const _starSvg = '''<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
<defs><linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE27A"/><stop offset="1" stop-color="#F5B82E"/></linearGradient></defs>
<path d="M20 3.5l4.9 10.4 11.3 1.4-8.3 7.8 2.1 11.2L20 28.8 10 34.3l2.1-11.2-8.3-7.8 11.3-1.4z" fill="url(#gold)" stroke="#C98A12" stroke-width="1.8" stroke-linejoin="round"/>
<path d="M14.5 15.5l3.6-.5" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/>
</svg>''';

class Ball extends StatelessWidget {
  final double size;
  const Ball({super.key, this.size = 28});
  @override
  Widget build(BuildContext context) => SvgPicture.string(_ballSvg, width: size, height: size);
}

/// L'étoile gagnée (récompense).
class StarIcon extends StatelessWidget {
  final double size;
  const StarIcon({super.key, this.size = 28});
  @override
  Widget build(BuildContext context) => SvgPicture.string(_starSvg, width: size, height: size);
}

/// Un paquet de 10 balles (4-2-4), comme sur la fiche.
class Pack extends StatelessWidget {
  final double b;
  final String? tag;
  const Pack({super.key, this.b = 28, this.tag});
  @override
  Widget build(BuildContext context) {
    final step = b / 2 + 1;
    Widget at(double col, int row) => Positioned(left: col * step, top: row * (b + 1), child: Ball(size: b));
    return SizedBox(
      width: step * 8,
      height: (b + 1) * 3,
      child: Stack(clipBehavior: Clip.none, children: [
        for (var i = 0; i < 4; i++) at(i * 2.0, 0),
        at(1, 1),
        at(5, 1),
        for (var i = 0; i < 4; i++) at(i * 2.0, 2),
        if (tag != null)
          Positioned(left: 0, right: 0, top: -14, child: Center(child: _Tag(tag!))),
      ]),
    );
  }
}

class _Tag extends StatelessWidget {
  final String text;
  final Color color;
  const _Tag(this.text, {this.color = C.court});
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
        decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(999)),
        child: Text(text, style: display(16, color: Colors.white)),
      );
}

/// Une collection de n balles : paquets de 10 + balles seules.
/// [counted] = paquets déjà étiquetés (10, 20, 30…) pendant le comptage.
class Collection extends StatelessWidget {
  final int n;
  final int counted;
  final bool showUnits;
  final double b;
  const Collection({super.key, required this.n, this.counted = 0, this.showUnits = false, this.b = 28});
  @override
  Widget build(BuildContext context) {
    final packs = n ~/ 10, units = n % 10;
    return Wrap(
      alignment: WrapAlignment.center,
      crossAxisAlignment: WrapCrossAlignment.center,
      spacing: b * 0.8,
      runSpacing: b * 0.9,
      children: [
        for (var i = 0; i < packs; i++) Pack(b: b, tag: i < counted ? '${(i + 1) * 10}' : null),
        if (units > 0)
          Stack(clipBehavior: Clip.none, children: [
            SizedBox(
              width: (b + 2) * 5,
              child: Wrap(runSpacing: 3, children: [for (var i = 0; i < units; i++) Padding(padding: const EdgeInsets.only(right: 2), child: Ball(size: b))]),
            ),
            if (showUnits) Positioned(left: 0, right: 0, top: -16, child: Center(child: _Tag('+$units', color: C.red))),
          ]),
      ],
    );
  }
}
