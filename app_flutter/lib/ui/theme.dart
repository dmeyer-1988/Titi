import 'package:flutter/material.dart';

/// Les couleurs de la version web (styles.css).
class C {
  static const court = Color(0xFF2D6A9F);
  static const courtDeep = Color(0xFF23547E);
  static const courtSoft = Color(0xFFE7EFF6);
  static const paper = Color(0xFFFDFDFB);
  static const tint = Color(0xFFF2F5F8);
  static const ink = Color(0xFF24303F);
  static const inkSoft = Color(0xFF5E6B7A);
  static const rule = Color(0xFFDCE3EA);
  static const red = Color(0xFFD6453A);
  static const redDeep = Color(0xFFA8322A);
  static const gold = Color(0xFFF6C945);
  static const ok = Color(0xFF2F8F55);
  static const okSoft = Color(0xFFE8F5EC);
  static const no = Color(0xFFC4453B);
  static const orange = Color(0xFFC4602A);
  static const geo = Color(0xFF2F8F55);
}

/// Titres : Baloo 2 (police variable, on règle la graisse avec l'axe « wght »).
TextStyle display(double size, {Color color = C.ink, double weight = 800}) => TextStyle(
      fontFamily: 'Baloo2',
      fontSize: size,
      color: color,
      height: 1.05,
      fontVariations: [FontVariation('wght', weight)],
    );

TextStyle body(double size, {Color color = C.ink, FontWeight weight = FontWeight.w400}) =>
    TextStyle(fontFamily: 'Andika', fontSize: size, color: color, fontWeight: weight, height: 1.3);

ThemeData appTheme() => ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(seedColor: C.court, primary: C.court),
      scaffoldBackgroundColor: C.court,
      fontFamily: 'Andika',
      textTheme: const TextTheme().apply(bodyColor: C.ink, displayColor: C.ink, fontFamily: 'Andika'),
    );

/// La « feuille » blanche posée sur le fond bleu, comme dans la version web.
class Sheet extends StatelessWidget {
  final Widget child;
  final double maxWidth;
  const Sheet({super.key, required this.child, this.maxWidth = 1000});
  @override
  Widget build(BuildContext context) {
    final narrow = MediaQuery.sizeOf(context).width < 640;
    return SafeArea(
      child: Center(
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: maxWidth),
          child: Container(
            margin: EdgeInsets.all(narrow ? 0 : 16),
            decoration: BoxDecoration(
              color: C.paper,
              borderRadius: BorderRadius.circular(narrow ? 0 : 22),
              boxShadow: const [BoxShadow(color: Color(0x33000000), offset: Offset(0, 6), blurRadius: 0)],
            ),
            clipBehavior: Clip.antiAlias,
            child: child,
          ),
        ),
      ),
    );
  }
}

/// Le gros bouton rouge (« Suivant », « C'est bon ! »…).
class BigButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final bool ghost;
  final Color color;
  const BigButton(this.label, {super.key, this.onPressed, this.ghost = false, this.color = C.red});
  @override
  Widget build(BuildContext context) {
    final enabled = onPressed != null;
    final bg = ghost ? Colors.white : color;
    return Opacity(
      opacity: enabled ? 1 : 0.5,
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(999),
        child: InkWell(
          borderRadius: BorderRadius.circular(999),
          onTap: onPressed,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 26, vertical: 14),
            decoration: BoxDecoration(
              color: bg,
              borderRadius: BorderRadius.circular(999),
              border: ghost ? Border.all(color: C.rule, width: 2) : null,
              boxShadow: ghost ? null : [BoxShadow(color: Color.lerp(color, Colors.black, 0.3)!, offset: const Offset(0, 5))],
            ),
            child: Text(label, style: display(20, color: ghost ? C.ink : Colors.white)),
          ),
        ),
      ),
    );
  }
}
