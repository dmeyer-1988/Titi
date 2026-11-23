import 'package:flutter/material.dart';
import '../engine/question.dart';
import '../ui/theme.dart';
import 'common.dart';
import 'keypad.dart';

// Couleurs pastel des tableaux de la fiche.
const _tints = [
  (Color(0xFFD9D2EA), Color(0xFFC7BDE0)),
  (Color(0xFFF6C98F), Color(0xFFF0B56E)),
  (Color(0xFFC6D3E6), Color(0xFFAFC2DD)),
  (Color(0xFFF5CFCB), Color(0xFFEEB8B2)),
  (Color(0xFFD6DEE0), Color(0xFFC2CDD0)),
  (Color(0xFFD3DDA0), Color(0xFFBFCD7F)),
];

/// Tableau d'addition à compléter, avec un clavier.
class TableGame extends StatefulWidget {
  final TableQuestion q;
  final OnAttempt onAttempt;
  final VoidCallback onSolved;
  const TableGame({super.key, required this.q, required this.onAttempt, required this.onSolved});
  @override
  State<TableGame> createState() => _TableGameState();
}

class _TableGameState extends State<TableGame> {
  final filled = <String, int>{};
  late String? current = widget.q.blanks.isEmpty ? null : widget.q.blanks.first;
  String entry = '';
  bool shake = false;

  bool get done => widget.q.blanks.every(filled.containsKey);
  bool isBlank(String k) => widget.q.blanks.contains(k);
  bool known(int r, int c) => !isBlank(cellKey(r, c)) || filled.containsKey(cellKey(r, c));
  (int, int) get rc {
    final p = current!.split(',').map(int.parse).toList();
    return (p[0], p[1]);
  }

  void press(String d) {
    if (done || current == null) return;
    setState(() {
      if (d == 'del') {
        if (entry.isNotEmpty) entry = entry.substring(0, entry.length - 1);
      } else if (d == 'ok') {
        if (entry.isEmpty) return;
        final (r, c) = rc;
        final expected = widget.q.value(r, c), v = int.tryParse(entry);
        final ok = v == expected;
        widget.onAttempt(entry, '$expected', ok);
        if (ok) {
          filled[current!] = v!;
          entry = '';
          current = widget.q.blanks.where((k) => !filled.containsKey(k)).firstOrNull;
          if (done) later(this, 700, widget.onSolved);
        } else {
          shake = true;
          later(this, 450, () => setState(() { shake = false; entry = ''; }));
        }
      } else if (entry.length < 3) {
        entry = entry == '0' ? d : entry + d;
      }
    });
  }

  /// Petite aide sous le tableau, comme le schéma en marge de la fiche.
  String? hint() {
    if (current == null || done) return null;
    final q = widget.q;
    final (cr, cc) = rc;
    if (cr >= 0 && cc >= 0) {
      if (known(cr, -1) && known(-1, cc)) return '${q.rows[cr]} + ${q.cols[cc]} = ?';
      return "Trouve d'abord le nombre ${known(cr, -1) ? 'en haut de la colonne' : 'au début de la ligne'}.";
    }
    if (cr == -1) {
      for (var r = 0; r < q.rows.length; r++) {
        if (known(r, -1) && known(r, cc)) return '${q.rows[r]} + ? = ${q.value(r, cc)}';
      }
    } else {
      for (var c = 0; c < q.cols.length; c++) {
        if (known(-1, c) && known(cr, c)) return '? + ${q.cols[c]} = ${q.value(cr, c)}';
      }
    }
    return 'Cherche une case déjà remplie sur cette ${cr == -1 ? 'colonne' : 'ligne'}.';
  }

  @override
  Widget build(BuildContext context) {
    final q = widget.q;
    final n = q.rows.length;
    final tint = _tints[(q.rows[0] * 7 + q.cols[0] * 3 + n) % _tints.length];
    final cur = current == null ? null : rc;
    final narrow = MediaQuery.sizeOf(context).width < 700;
    final cs = narrow ? 56.0 : 70.0;
    Widget cell(int r, int c) {
      final k = cellKey(r, c);
      final head = r == -1 || c == -1, blank = isBlank(k), ok = filled.containsKey(k), isCur = k == current;
      final lit = !isCur && cur != null && !done && ((r == -1 && c == cur.$2 && cur.$1 >= 0) || (c == -1 && r == cur.$1 && cur.$2 >= 0));
      final text = !blank ? '${q.value(r, c)}' : ok ? '${filled[k]}' : isCur ? entry : '';
      return GestureDetector(
        onTap: blank && !ok && !done ? () => setState(() { current = k; entry = ''; }) : null,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 160),
          width: cs,
          height: cs,
          margin: const EdgeInsets.all(2),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: ok ? C.okSoft : blank ? Colors.white : head ? tint.$2 : tint.$1,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: isCur ? (shake ? C.no : C.court) : lit ? C.red : ok ? C.ok : Colors.transparent, width: 3),
          ),
          child: Text(text, style: display(cs * 0.44, color: ok ? C.ok : blank ? C.court : C.ink)),
        ),
      );
    }

    final table = Column(mainAxisSize: MainAxisSize.min, children: [
      Row(mainAxisSize: MainAxisSize.min, children: [
        Container(width: cs, height: cs, margin: const EdgeInsets.all(2), alignment: Alignment.center,
            decoration: BoxDecoration(color: tint.$2, borderRadius: BorderRadius.circular(10)), child: Text('+', style: display(cs * 0.5, color: C.red))),
        for (var c = 0; c < n; c++) cell(-1, c),
      ]),
      for (var r = 0; r < n; r++) Row(mainAxisSize: MainAxisSize.min, children: [cell(r, -1), for (var c = 0; c < n; c++) cell(r, c)]),
    ]);
    final h = hint();
    final side = Column(mainAxisSize: MainAxisSize.min, children: [
      SizedBox(height: 34, child: h == null ? null : Text(h, style: display(22, color: C.court))),
      const SizedBox(height: 8),
      Keypad(onKey: press, enabled: !done, okEnabled: entry.isNotEmpty, keyW: narrow ? 72 : 80, keyH: narrow ? 58 : 64),
    ]);
    return Wrap(alignment: WrapAlignment.center, crossAxisAlignment: WrapCrossAlignment.center, spacing: 30, runSpacing: 20, children: [
      FittedBox(fit: BoxFit.scaleDown, child: table),
      side,
    ]);
  }
}
