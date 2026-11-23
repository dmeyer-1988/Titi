import 'package:flutter/material.dart';
import '../engine/maths2.dart';
import '../engine/question.dart';
import '../ui/audio.dart';
import '../ui/theme.dart';
import 'common.dart';

const _towerColors = [Color(0xFF2D6A9F), Color(0xFFD6453A), Color(0xFF2F8F55)];

/// Les tours de cubes : on essaie, on vérifie, on ajuste. Chaque essai est noté dans un tableau.
class ChateauxGame extends StatefulWidget {
  final ChateauxQuestion q;
  final OnAttempt onAttempt;
  final VoidCallback onSolved;
  final void Function(String msg) onNudge;
  const ChateauxGame({super.key, required this.q, required this.onAttempt, required this.onSolved, required this.onNudge});
  @override
  State<ChateauxGame> createState() => _ChateauxGameState();
}

class _ChateauxGameState extends State<ChateauxGame> {
  late final h = List<int>.filled(widget.q.towers, 1);
  final tries = <({List<int> h, int sum, bool totalOk, bool ruleOk})>[];
  bool done = false;

  void bump(int i, int d) {
    if (done) return;
    setState(() => h[i] = (h[i] + d).clamp(0, 15));
    Sounds.tick(d > 0 ? 5 : 2);
  }

  void verify() {
    final q = widget.q;
    final r = checkChateau(q, h);
    setState(() => tries.add((h: [...h], sum: r.sum, totalOk: r.totalOk, ruleOk: r.ruleOk)));
    if (r.totalOk && r.ruleOk) {
      // On récompense la démarche : la réussite compte, quel que soit le nombre d'essais.
      widget.onAttempt(h.join('-'), q.answer.join('-'), true);
      setState(() => done = true);
      later(this, 900, widget.onSolved);
      return;
    }
    Sounds.bad();
    final parts = <String>[];
    if (!r.totalOk) {
      final diff = q.total - r.sum;
      parts.add('Tu as ${r.sum} cube${r.sum > 1 ? 's' : ''} : ${diff > 0 ? 'il en manque $diff' : 'il y en a ${-diff} de trop'}.');
    } else {
      parts.add("${r.sum} cubes en tout, c'est juste !");
    }
    if (!r.ruleOk) {
      if (q.rule == 'double') {
        parts.add("Mais ${h[1]} n'est pas le double de ${h[0]}.");
      } else if (q.towers == 2) {
        final e = h[1] - h[0];
        parts.add(e < 0 ? 'Mais la tour de droite est plus petite.' : 'Mais la tour de droite a $e cube${e > 1 ? 's' : ''} de plus : il en faut ${q.d}.');
      } else {
        parts.add("Mais regarde l'écart entre les tours : il faut ${q.d} cube${q.d > 1 ? 's' : ''} de plus à chaque fois.");
      }
    } else {
      parts.add('La 2e condition est juste !');
    }
    widget.onNudge('${parts.join(' ')} Ajuste et vérifie encore.');
  }

  @override
  Widget build(BuildContext context) {
    final q = widget.q;
    final narrow = MediaQuery.sizeOf(context).width < 640;
    final cw = narrow ? 40.0 : 50.0, ch = narrow ? 15.0 : 18.0;
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: C.rule, width: 2)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('① En tout : ${q.total} cubes.', style: body(20, weight: FontWeight.w700)),
          Text('② ${ruleText(q)}', style: body(20)),
        ]),
      ),
      const SizedBox(height: 14),
      Container(
        padding: const EdgeInsets.fromLTRB(8, 16, 8, 14),
        decoration: BoxDecoration(color: C.tint, borderRadius: BorderRadius.circular(18)),
        child: Row(mainAxisAlignment: MainAxisAlignment.spaceEvenly, crossAxisAlignment: CrossAxisAlignment.end, children: [
          for (var i = 0; i < h.length; i++)
            Column(mainAxisSize: MainAxisSize.min, children: [
              Row(mainAxisSize: MainAxisSize.min, children: [
                for (var k = 0; k < 3; k++)
                  Container(width: cw * 0.2, height: ch * 0.6, margin: EdgeInsets.symmetric(horizontal: cw * 0.06), color: _towerColors[i]),
              ]),
              for (var k = 0; k < h[i]; k++)
                Container(
                  width: cw,
                  height: ch,
                  margin: const EdgeInsets.only(top: 2),
                  decoration: BoxDecoration(
                    color: _towerColors[i],
                    borderRadius: BorderRadius.circular(3),
                    border: done ? Border.all(color: C.gold, width: 2) : null,
                  ),
                ),
              const SizedBox(height: 8),
              Text('${h[i]}', style: display(30)),
              const SizedBox(height: 6),
              Row(mainAxisSize: MainAxisSize.min, children: [
                _btn('−', () => bump(i, -1), done || h[i] == 0),
                const SizedBox(width: 8),
                _btn('+', () => bump(i, 1), done || h[i] == 15),
              ]),
            ]),
        ]),
      ),
      const SizedBox(height: 14),
      Center(child: BigButton('Vérifier mon essai', onPressed: done || h.every((v) => v == 0) ? null : verify)),
      if (tries.isNotEmpty) ...[
        const SizedBox(height: 14),
        Center(
          child: DataTable(
            headingRowHeight: 36,
            dataRowMinHeight: 32,
            dataRowMaxHeight: 36,
            columnSpacing: 18,
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: C.rule)),
            columns: [
              const DataColumn(label: Text('Essai')),
              for (var i = 0; i < h.length; i++) DataColumn(label: Text('Tour ${i + 1}')),
              const DataColumn(label: Text('En tout')),
              const DataColumn(label: Text('①')),
              const DataColumn(label: Text('②')),
            ],
            rows: [
              for (var k = 0; k < tries.length; k++)
                DataRow(
                  color: WidgetStatePropertyAll(tries[k].totalOk && tries[k].ruleOk ? C.okSoft : null),
                  cells: [
                    DataCell(Text('${k + 1}')),
                    for (final v in tries[k].h) DataCell(Text('$v')),
                    DataCell(Text('${tries[k].sum}')),
                    DataCell(Text(tries[k].totalOk ? '✓' : '✗', style: body(18, color: tries[k].totalOk ? C.ok : C.no, weight: FontWeight.w700))),
                    DataCell(Text(tries[k].ruleOk ? '✓' : '✗', style: body(18, color: tries[k].ruleOk ? C.ok : C.no, weight: FontWeight.w700))),
                  ],
                ),
            ],
          ),
        ),
      ],
    ]);
  }

  Widget _btn(String label, VoidCallback onTap, bool disabled) => SizedBox(
        width: 54,
        height: 54,
        child: Opacity(
          opacity: disabled ? 0.4 : 1,
          child: Material(
            color: label == '+' ? Colors.white : C.tint,
            borderRadius: BorderRadius.circular(14),
            child: InkWell(
              borderRadius: BorderRadius.circular(14),
              onTap: disabled ? null : onTap,
              child: Container(
                alignment: Alignment.center,
                decoration: BoxDecoration(borderRadius: BorderRadius.circular(14), border: Border.all(color: C.rule, width: 2)),
                child: Text(label, style: display(30)),
              ),
            ),
          ),
        ),
      );
}
