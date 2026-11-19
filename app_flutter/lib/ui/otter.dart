import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

/// Humeurs de Bigou la loutre.
enum Mood { hello, happy, wow, cheer, think }

const _fur = '#5A3826', _dark = '#47291B', _face = '#9A6A47', _nose = '#1F1612';
const _cheek = '#E88A6A', _hat = '#8FC3EA', _hatDark = '#6FA9D6', _stripe = '#CDB59C', _shirt = '#FBF8F3', _star = '#E58C93';

String _arm(String d) {
  final nums = d.trim().split(RegExp(r'\s+'));
  final ex = nums[nums.length - 2], ey = nums[nums.length - 1];
  return '<path d="$d" stroke="$_fur" stroke-width="18" stroke-linecap="round" fill="none"/><circle cx="$ex" cy="$ey" r="10" fill="$_dark"/>';
}

/// Le dessin de la loutre (même SVG que la version web).
String otterSvg(Mood mood) {
  final closed = mood == Mood.cheer;
  final big = mood == Mood.wow;
  final s = StringBuffer('<svg viewBox="0 0 220 240" xmlns="http://www.w3.org/2000/svg">');
  s.write('<defs><clipPath id="ob"><ellipse cx="110" cy="174" rx="44" ry="52"/></clipPath>'
      '<clipPath id="oh"><path d="M48 92 Q50 30 110 28 Q170 30 172 92 Z"/></clipPath></defs>');
  s.write('<path d="M130 198 Q194 208 208 154 Q202 150 194 156 Q184 186 134 178 Z" fill="$_dark"/>');
  s.write('<g clip-path="url(#ob)"><rect x="60" y="118" width="100" height="112" fill="$_shirt"/>');
  for (var i = 0; i < 8; i++) {
    s.write('<rect x="60" y="${124 + i * 14}" width="100" height="7" fill="$_stripe"/>');
  }
  s.write('</g>');
  s.write('<path d="M110 160 l5 10 11 1.5 -8 7.5 2 11 -10 -5.5 -10 5.5 2 -11 -8 -7.5 11 -1.5 Z" fill="$_star"/>');
  s.write('<ellipse cx="88" cy="226" rx="18" ry="9" fill="$_dark"/><ellipse cx="132" cy="226" rx="18" ry="9" fill="$_dark"/>');
  if (mood != Mood.cheer && mood != Mood.think) s.write(_arm('M70 150 Q56 170 64 192'));
  if (mood != Mood.cheer && mood != Mood.hello) s.write(_arm('M150 150 Q164 170 156 192'));
  s.write('<ellipse cx="110" cy="96" rx="60" ry="54" fill="$_fur"/>');
  s.write('<path d="M110 84 Q148 84 152 112 Q150 140 110 142 Q70 140 68 112 Q72 84 110 84 Z" fill="$_face"/>');
  s.write('<g clip-path="url(#oh)"><rect x="40" y="20" width="140" height="80" fill="$_hat"/>');
  for (var i = 0; i < 12; i++) {
    s.write('<rect x="${52 + i * 10}" y="20" width="3" height="80" fill="$_hatDark" opacity=".55"/>');
  }
  s.write('</g><path d="M46 92 Q110 74 174 92 L174 80 Q110 62 46 80 Z" fill="$_hatDark"/>');
  if (closed) {
    s.write('<g stroke="$_nose" stroke-width="4.5" fill="none" stroke-linecap="round"><path d="M76 104 Q86 94 96 104"/><path d="M124 104 Q134 94 144 104"/></g>');
  } else {
    final rx = big ? 14 : 12, ry = big ? 15 : 13, r = big ? 8 : 7;
    s.write('<ellipse cx="86" cy="103" rx="$rx" ry="$ry" fill="#fff" stroke="$_dark" stroke-width="2"/>'
        '<ellipse cx="134" cy="103" rx="$rx" ry="$ry" fill="#fff" stroke="$_dark" stroke-width="2"/>'
        '<circle cx="88" cy="104" r="$r" fill="$_nose"/><circle cx="132" cy="104" r="$r" fill="$_nose"/>'
        '<circle cx="90.5" cy="101" r="2.4" fill="#fff"/><circle cx="134.5" cy="101" r="2.4" fill="#fff"/>');
    if (mood == Mood.think) {
      s.write('<path d="M72 88 Q86 82 98 88 M122 86 Q134 84 146 90" stroke="$_dark" stroke-width="3.5" fill="none" stroke-linecap="round"/>');
    }
  }
  s.write('<ellipse cx="72" cy="126" rx="8" ry="5.5" fill="$_cheek" opacity=".85"/><ellipse cx="148" cy="126" rx="8" ry="5.5" fill="$_cheek" opacity=".85"/>');
  s.write('<path d="M98 114 Q110 106 122 114 Q118 125 110 126 Q102 125 98 114 Z" fill="$_nose"/>');
  s.write('<g stroke="#F6EEE6" stroke-width="1.6" stroke-linecap="round" opacity=".9"><path d="M80 122 L56 116 M80 128 L56 130"/><path d="M140 122 L164 116 M140 128 L164 130"/></g>');
  if (mood == Mood.wow) {
    s.write('<ellipse cx="110" cy="134" rx="6" ry="7" fill="$_nose"/>');
  } else if (mood == Mood.think) {
    s.write('<path d="M103 134 Q110 131 117 135" stroke="$_nose" stroke-width="3" fill="none" stroke-linecap="round"/>');
  } else {
    s.write('<path d="M110 125 Q104 135 97 130 M110 125 Q116 135 123 130" stroke="$_nose" stroke-width="3" fill="${mood == Mood.cheer ? _cheek : 'none'}" stroke-linecap="round"/>');
  }
  if (mood == Mood.cheer) s.write(_arm('M72 150 Q46 128 36 100') + _arm('M148 150 Q174 128 184 100'));
  if (mood == Mood.hello) s.write(_arm('M150 150 Q180 132 190 102'));
  if (mood == Mood.think) s.write(_arm('M74 156 Q84 150 96 142') + _arm('M150 150 Q164 170 156 192'));
  s.write('</svg>');
  return s.toString();
}

class Otter extends StatelessWidget {
  final Mood mood;
  final double size;
  const Otter({super.key, this.mood = Mood.happy, this.size = 120});
  @override
  Widget build(BuildContext context) => SvgPicture.string(otterSvg(mood), width: size, height: size * 240 / 220);
}
