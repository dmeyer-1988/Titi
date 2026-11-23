import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../data/app_state.dart';
import '../data/models.dart';
import '../engine/calcul.dart';
import '../engine/maths2.dart';
import '../engine/question.dart';
import '../engine/registry.dart';
import '../engine/sons.dart';
import '../engine/words.dart';
import '../games/calc.dart';
import '../games/combien.dart';
import '../games/drapeau.dart';
import '../games/capacite.dart';
import '../games/chateaux.dart';
import '../games/entoure.dart';
import '../games/noeuds.dart';
import '../games/paquets.dart';
import '../games/suite.dart';
import '../games/table.dart';
import '../games/son.dart';
import '../ui/audio.dart';
import '../ui/balls.dart';
import '../ui/mascot.dart';
import '../ui/otter.dart';
import '../ui/theme.dart';

const _praise = ['Bravo', 'Super', 'Génial', 'Parfait', 'Excellent'];

class _Msg {
  final bool ok;
  final String title;
  final String? sub;
  const _Msg(this.ok, this.title, [this.sub]);
}

/// Une partie : les questions d'un exercice, une par une, puis les étoiles.
class RunnerScreen extends StatefulWidget {
  final Exercise exercise;
  const RunnerScreen({super.key, required this.exercise});
  @override
  State<RunnerScreen> createState() => _RunnerScreenState();
}

class _RunnerScreenState extends State<RunnerScreen> {
  late List<Question> round = makeRound(widget.exercise);
  int idx = 0;
  final results = <int, bool>{};
  String phase = 'play'; // play | solved | end
  _Msg? msg;
  int tries = 0, misses = 0, streak = 0;
  late bool rule = widget.exercise.type == 'son' && widget.exercise.config['showRule'] != false;

  Exercise get ex => widget.exercise;
  Question? get q => idx < round.length ? round[idx] : null;
  String? get name => AppScope.of(context).child?.name;

  ({String text, String speech}) get prompt {
    final q = this.q;
    switch (q) {
      case CollectionQuestion():
        return ex.type == 'entoure'
            ? (text: 'Entoure la collection de ${q.target} balles de tennis.', speech: 'Entoure la collection de ${words(q.target)} balles de tennis.')
            : (text: 'Combien de balles de tennis ?', speech: 'Combien de balles de tennis ?');
      case SuiteQuestion():
        if (q.oral) {
          return (
            text: 'Écoute bien la consigne 🔊 et écris les nombres.',
            speech: 'Compte de 1 en 1${q.down ? ' en reculant' : ''}, de ${words(q.seq.first)} jusqu\'à ${words(q.seq.last)}. Écris tous les nombres.',
          );
        }
        return (text: 'Complète la suite.', speech: 'Complète la suite. Trouve les nombres qui manquent.');
      case TableQuestion():
        return (text: 'Complète les cases vides du tableau.', speech: 'Complète les cases vides du tableau. Touche une case vide, puis écris le nombre.');
      case PaquetsQuestion():
        return (text: 'Fais des paquets de 10 pour obtenir ${q.target} balles.', speech: 'Fais des paquets de 10 pour obtenir ${words(q.target)} balles. Entoure 10 balles avec ton doigt.');
      case NoeudsQuestion():
        final nn = nodeName(q.answer), t = q.thing.name;
        String spell(String s) => s.split('').join(' ');
        if (q.skill == 'lire') return (text: 'Sur quel nœud est $t ${q.thing.emoji} ?', speech: 'Sur quel nœud est $t ?');
        if (q.skill == 'placer') return (text: 'Place $t ${q.thing.emoji} sur le nœud $nn.', speech: 'Place $t sur le nœud ${spell(nn)}. Touche le bon nœud.');
        final m = moveText(q.move!);
        return (
          text: '${_cap(t)} ${q.thing.emoji} part du nœud ${nodeName(q.at)} et avance de $m. Touche le nœud d\'arrivée.',
          speech: '${_cap(t)} part du nœud ${spell(nodeName(q.at))} et avance de $m. Touche le nœud d\'arrivée.',
        );
      case ChateauxQuestion():
        return (text: 'Construis le château : ${q.towers} tours qui respectent les 2 conditions.', speech: 'Construis un château de ${words(q.total)} cubes. ${ruleText(q)} Essaie, vérifie, puis ajuste.');
      case CapaciteQuestion():
        return q.mode == 'verser'
            ? (text: 'Qui contient le plus ? Verse le ${q.a.name} dans le ${q.b.name} pour comparer.', speech: 'Qui contient le plus ? Le récipient ${q.a.name} est plein. Verse-le dans le ${q.b.name} pour comparer.')
            : (text: 'Qui contient le plus ?', speech: "On a rempli le ${q.a.name} jusqu'en haut, puis on l'a versé dans le ${q.b.name}. Lequel contient le plus ?");
      case CalcQuestion():
        String w(String k) => q.blank == k ? 'combien' : words(k == 'a' ? q.a : k == 'b' ? q.b : q.c);
        return (
          text: q.blank == 'c' ? 'Calcule.' : 'Trouve le nombre qui manque.',
          speech: '${w('a')} ${q.op == '+' ? 'plus' : 'moins'} ${w('b')}, égale ${w('c')} ?',
        );
      case SonQuestion():
        return (text: 'Complète le mot avec « on » ou « om ».', speech: 'Complète le mot ${q.word} avec o, n, ou o, m.');
      case DrapeauQuestion():
        return q.sens == 'nom'
            ? (text: 'À quel pays est ce drapeau ?', speech: 'À quel pays est ce drapeau ?')
            : (text: 'Trouve le drapeau : ${q.answer.name}', speech: 'Trouve le drapeau. ${q.answer.name}.');
      case null:
        return (text: '', speech: '');
    }
  }

  void onAttempt(String given, String expected, bool correct) {
    final q = this.q!;
    final first = tries == 0;
    AppScope.of(context).record(AttemptDraft(
      exerciseId: ex.id,
      exerciseType: ex.type,
      prompt: q.toJson(),
      expected: expected,
      given: given,
      correct: correct,
      firstTry: first,
    ));
    setState(() {
      if (correct) {
        Sounds.good();
        msg = null;
        if (q is SonQuestion || q is TableQuestion) tries = 0; // plusieurs cases : chaque case repart « du premier coup »
      } else {
        tries++;
        misses++;
        Sounds.bad();
        final hint = switch (q) {
          DrapeauQuestion() => q.sens == 'nom' ? 'Regarde bien les couleurs et les formes du drapeau.' : "Ça, c'est le drapeau : $given. Cherche encore !",
          CalcQuestion() => q.tip != null
              ? 'Utilise l’astuce !'
              : q.blank == 'a'
                  ? "Fais le calcul à l'envers pour retrouver le premier nombre."
                  : q.op == '+'
                      ? 'Compte en avançant de 1 en 1 depuis le premier nombre.'
                      : 'Compte en reculant de 1 en 1 depuis le premier nombre.',
          SonQuestion() => isTrap(q.word) ? "C'est un mot piège : il ne suit pas la règle !" : 'Regarde la lettre juste après : est-ce un m, un b ou un p ?',
          CollectionQuestion() => ex.type == 'entoure' ? 'Compte les paquets de 10.' : "Compte d'abord les paquets de 10, puis les balles seules.",
          SuiteQuestion() => q.oral ? 'Réécoute la consigne avec le haut-parleur. On avance de 1 à chaque fois.' : 'Regarde de combien on avance à chaque fois.',
          TableQuestion() => 'Additionne le nombre de la ligne et celui de la colonne.',
          PaquetsQuestion() => (int.tryParse(given) ?? 0) < (int.tryParse(expected) ?? 0)
              ? 'Il te manque des balles : ajoute un paquet de 10 ou des balles seules.'
              : 'Tu en as trop : enlève des balles.',
          NoeudsQuestion() => q.skill == 'lire'
              ? "Descends jusqu'à la lettre de la colonne, puis va à gauche jusqu'au chiffre de la ligne."
              : q.skill == 'placer'
                  ? "Ça, c'est le nœud $given. Trouve d'abord la colonne (la lettre en bas), puis la ligne (le chiffre à gauche)."
                  : "Ça, c'est le nœud $given. Pose ton doigt sur ${nodeName(q.at)} et compte les nœuds un par un.",
          ChateauxQuestion() => 'Ajuste et vérifie encore.',
          CapaciteQuestion() => "Regarde bien : est-ce que l'eau a débordé ? Ou est-ce que le récipient n'est pas plein ?",
        };
        msg = _Msg(false, 'Essaie encore !', hint);
        Sounds.say(hint);
      }
    });
  }

  void onSolved() {
    final q = this.q!;
    final first = misses == 0;
    final run = first ? streak + 1 : 0;
    final n = name;
    final praise = run >= 3
        ? 'Tu es en feu${n != null ? ' $n' : ''} ! 🔥'
        : '${first ? _praise[math.Random().nextInt(_praise.length)] : 'Bien joué'}${n != null ? ' $n' : ''} !';
    String sub;
    switch (q) {
      case CollectionQuestion():
        final t = q.target, p = t ~/ 10, u = t % 10;
        sub = '$p paquet${p > 1 ? 's' : ''} de 10${u > 0 ? ' et $u balle${u > 1 ? 's' : ''}' : ''} = $t (${words(t)})';
        Sounds.say('${words(t)} balles ! ${first ? praise : ''}');
      case CalcQuestion():
        sub = '${q.a} ${opSign(q.op)} ${q.b} = ${q.c}';
        Sounds.say('${words(q.answer)} ! $praise');
      case SonQuestion():
        sub = isTrap(q.word) ? '« ${q.word} » est un mot piège : apprends-le par cœur.' : '« ${q.word} »';
        Sounds.say('${q.word}. $praise');
      case DrapeauQuestion():
        sub = '${q.answer.flag} ${q.answer.name}';
        Sounds.say('${q.answer.name}. $praise');
      case SuiteQuestion():
        sub = 'On ${q.down ? 'recule' : 'avance'} de ${q.step} à chaque fois.';
        Sounds.say(praise);
      case TableQuestion():
        sub = first ? 'Tableau complet, sans une seule erreur !' : 'Tableau complet ! $misses erreur${misses > 1 ? 's' : ''} corrigée${misses > 1 ? 's' : ''}.';
        Sounds.say(praise);
      case PaquetsQuestion():
        final t = q.target, p = t ~/ 10, u = t % 10;
        sub = '$p paquet${p > 1 ? 's' : ''} de 10${u > 0 ? ' et $u balle${u > 1 ? 's' : ''}' : ''} = $t (${words(t)})';
        Sounds.say('${words(t)} balles ! $praise');
      case NoeudsQuestion():
        final nn = nodeName(q.answer);
        sub = q.skill == 'bouger' ? '${_cap(q.thing.name)} arrive sur le nœud $nn.' : '${_cap(q.thing.name)} est sur le nœud $nn : colonne ${nn[0]}, ligne ${nn.substring(1)}.';
        Sounds.say('${nn.split('').join(' ')}. $praise');
      case ChateauxQuestion():
        sub = '${q.answer.join(' + ')} = ${q.total} cubes. Tu as bien ajusté tes essais !';
        Sounds.say(praise);
      case CapaciteQuestion():
        sub = explainCapacite(q);
        Sounds.say('$praise $sub');
    }
    setState(() {
      results[idx] = first;
      phase = 'solved';
      streak = run;
      msg = _Msg(true, praise, sub);
    });
  }

  @override
  void initState() {
    super.initState();
    _autoSpeak();
  }

  /// Consigne orale (compter de 1 en 1) : l'app la dit toute seule au début de chaque question.
  void _autoSpeak() {
    final q = this.q;
    if (q is SuiteQuestion && q.oral) {
      Future.delayed(const Duration(milliseconds: 450), () {
        if (mounted && phase == 'play') Sounds.say(prompt.speech);
      });
    }
  }

  void next() {
    WidgetsBinding.instance.addPostFrameCallback((_) => _autoSpeak());
    setState(() {
      tries = 0;
      misses = 0;
      msg = null;
      if (idx + 1 < round.length) {
        idx++;
        phase = 'play';
      } else {
        phase = 'end';
        Sounds.fanfare();
        Sounds.say(_endMessage(_stars, round.length, name));
      }
    });
  }

  int get _stars => results.values.where((v) => v).length;

  void restart() => setState(() {
        round = makeRound(ex);
        idx = 0;
        results.clear();
        phase = 'play';
        msg = null;
        streak = 0;
        tries = 0;
        misses = 0;
      });

  void nudge(String s) {
    setState(() => msg = _Msg(false, 'Presque !', s));
    Sounds.say(s);
  }

  Widget _game(Question q) {
    final k = ValueKey(idx);
    return switch (q) {
      CollectionQuestion() => ex.type == 'entoure'
          ? EntoureGame(key: k, q: q, onAttempt: onAttempt, onSolved: onSolved, onNudge: nudge)
          : CombienGame(key: k, q: q, onAttempt: onAttempt, onSolved: onSolved),
      SuiteQuestion() => SuiteGame(key: k, q: q, onAttempt: onAttempt, onSolved: onSolved),
      TableQuestion() => TableGame(key: k, q: q, onAttempt: onAttempt, onSolved: onSolved),
      PaquetsQuestion() => PaquetsGame(key: k, q: q, onAttempt: onAttempt, onSolved: onSolved, onNudge: nudge),
      NoeudsQuestion() => NoeudsGame(key: k, q: q, onAttempt: onAttempt, onSolved: onSolved),
      ChateauxQuestion() => ChateauxGame(key: k, q: q, onAttempt: onAttempt, onSolved: onSolved, onNudge: (s) => setState(() => msg = _Msg(false, 'Ajuste !', s))),
      CapaciteQuestion() => CapaciteGame(key: k, q: q, onAttempt: onAttempt, onSolved: onSolved),
      CalcQuestion() => CalcGame(key: k, q: q, onAttempt: onAttempt, onSolved: onSolved),
      SonQuestion() => SonGame(key: k, q: q, onAttempt: onAttempt, onSolved: onSolved),
      DrapeauQuestion() => DrapeauGame(key: k, q: q, onAttempt: onAttempt, onSolved: onSolved),
    };
  }

  @override
  Widget build(BuildContext context) {
    final q = this.q;
    return Scaffold(
      body: Sheet(
        child: Column(children: [
          // barre du haut : retour, titre
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 6),
            child: Row(children: [
              TextButton.icon(
                onPressed: () => Navigator.of(context).pop(),
                icon: const Icon(Icons.chevron_left_rounded),
                label: Text('Menu', style: body(16)),
                style: TextButton.styleFrom(backgroundColor: C.tint, foregroundColor: C.ink),
              ),
              const SizedBox(width: 12),
              Expanded(child: Text(ex.title, style: display(20, color: C.red), overflow: TextOverflow.ellipsis)),
            ]),
          ),
          // progression : un rond par question, une étoile quand c'est juste du premier coup
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(children: [
              Expanded(
                child: Wrap(spacing: 4, runSpacing: 4, children: [
                  for (var i = 0; i < round.length; i++)
                    results[i] == true
                        ? const StarIcon(size: 18)
                        : Container(
                            width: 16,
                            height: 16,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: results[i] == false ? C.rule : const Color(0xFFE9EEF2),
                              border: i == idx && phase != 'end' ? Border.all(color: C.court, width: 2.5) : null,
                            ),
                          ),
                ]),
              ),
              Text('${math.min(idx + 1, round.length)} / ${round.length}', style: body(14, color: C.inkSoft)),
              if (streak >= 3 && phase != 'end')
                Container(
                  margin: const EdgeInsets.only(left: 10),
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
                  decoration: BoxDecoration(color: const Color(0xFFFF7A2E), borderRadius: BorderRadius.circular(999)),
                  child: Text('🔥 $streak', style: display(16, color: Colors.white)),
                ),
            ]),
          ),
          Expanded(
            child: round.isEmpty
                ? Center(child: Text('Ce jeu n’a pas de questions.', style: body(18)))
                : rule
                    ? _SonRule(onClose: () => setState(() => rule = false))
                    : phase == 'end'
                        ? _end()
                        : SingleChildScrollView(
                            padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
                            child: Column(children: [
                              Row(children: [
                                IconButton.filledTonal(onPressed: () => Sounds.say(prompt.speech), icon: const Icon(Icons.volume_up_rounded)),
                                const SizedBox(width: 10),
                                Expanded(child: Text(prompt.text, style: body(22))),
                              ]),
                              const SizedBox(height: 18),
                              _game(q!),
                            ]),
                          ),
          ),
          if (phase != 'end' && !rule)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
              child: Row(children: [
                Expanded(
                  child: msg == null
                      ? const SizedBox(height: 60)
                      : Align(
                          alignment: Alignment.centerLeft,
                          child: Mascot(
                            size: 60,
                            mood: msg!.ok ? Mood.cheer : Mood.think,
                            speak: !msg!.ok ? msg!.sub : null,
                            text: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
                              Text(msg!.title, style: display(18, color: msg!.ok ? C.ok : C.no)),
                              if (msg!.sub != null) Text(msg!.sub!, style: body(14, color: C.inkSoft)),
                            ]),
                          ),
                        ),
                ),
                if (phase == 'solved') BigButton(idx + 1 < round.length ? 'Suivant' : 'Voir mes étoiles', onPressed: next),
              ]),
            ),
        ]),
      ),
    );
  }

  Widget _end() {
    final s = _stars;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(children: [
        Mascot(size: 140, mood: Mood.cheer, text: Text(_endMessage(s, round.length, name), style: display(26))),
        const SizedBox(height: 20),
        Wrap(spacing: 6, runSpacing: 6, alignment: WrapAlignment.center, children: [
          for (var i = 0; i < s; i++)
            TweenAnimationBuilder<double>(
              tween: Tween(begin: 0, end: 1),
              duration: Duration(milliseconds: 400 + i * 120),
              curve: Curves.elasticOut,
              builder: (_, t, c) => Transform.scale(scale: t, child: c),
              child: const StarIcon(size: 44),
            ),
        ]),
        const SizedBox(height: 8),
        Text('$s / ${round.length}', style: display(54)),
        const SizedBox(height: 16),
        Wrap(spacing: 12, children: [
          BigButton('Rejouer', onPressed: restart),
          BigButton('Menu', ghost: true, onPressed: () => Navigator.of(context).pop()),
        ]),
      ]),
    );
  }
}

String _cap(String t) => t.isEmpty ? t : t[0].toUpperCase() + t.substring(1);

String _endMessage(int s, int total, String? name) {
  final n = name != null ? ', $name' : '';
  final r = total == 0 ? 0 : s / total;
  return r >= 0.9 ? 'Champion$n !' : r >= 0.6 ? 'Très bien joué$n !' : 'Bon match$n, on rejoue ?';
}

/// La règle du son [on], montrée au début de la partie.
class _SonRule extends StatelessWidget {
  final VoidCallback onClose;
  const _SonRule({required this.onClose});
  @override
  Widget build(BuildContext context) {
    Widget block(Color bg, List<Widget> children) => Container(
          width: double.infinity,
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(16)),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: children),
        );
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('LA RÈGLE', style: body(14, color: C.inkSoft, weight: FontWeight.w700)),
        Text('Le son [on]', style: display(40, color: C.court)),
        const SizedBox(height: 12),
        block(C.tint, [
          Text("En général, il s'écrit « on »", style: body(20)),
          Text('un ballon · un mouton · bonjour', style: body(18, color: C.inkSoft)),
        ]),
        block(const Color(0xFFFCEBDD), [
          Text("Devant m, b, p il s'écrit « om »", style: body(20, weight: FontWeight.w700)),
          Text('une ombre · tomber · un pompon', style: body(18, color: C.inkSoft)),
        ]),
        block(const Color(0xFFFFF8E6), [
          Text('Mots pièges à apprendre par cœur', style: body(20)),
          Text('un bonbon (on devant b !) · un nom · un prénom (om à la fin)', style: body(18, color: C.inkSoft)),
        ]),
        const SizedBox(height: 8),
        Wrap(spacing: 12, runSpacing: 12, children: [
          BigButton('Écouter la règle', ghost: true, onPressed: () => Sounds.say("Le son on. En général, il s'écrit o, n. Devant m, b, p, il s'écrit o, m. Attention aux mots pièges : bonbon, nom et prénom.")),
          BigButton("J'ai compris, on joue !", onPressed: onClose),
        ]),
      ]),
    );
  }
}
