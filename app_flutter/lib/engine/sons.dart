// Le son [on] : on / om. Règle : devant m, b, p on écrit « om ».
import 'question.dart';
import 'rng.dart';

const _vowels = 'aeiouyéèêëàâîïôûüœ';

sealed class SonPart {
  const SonPart();
}

class SonText extends SonPart {
  final String text;
  const SonText(this.text);
}

class SonBlank extends SonPart {
  final String blank; // 'on' ou 'om'
  final String? next;
  const SonBlank(this.blank, this.next);
}

/// Découpe un mot en morceaux, avec un trou pour chaque son [on] écrit « on » ou « om ».
List<SonPart> parseSon(String word) {
  final w = word.toLowerCase().trim();
  final parts = <SonPart>[];
  var buf = '';
  for (var i = 0; i < w.length; i++) {
    final c = w[i];
    final n = i + 1 < w.length ? w[i + 1] : null;
    final after = i + 2 < w.length ? w[i + 2] : null;
    final nasal = c == 'o' && (n == 'n' || n == 'm') &&
        (after == null || (!_vowels.contains(after) && after != 'n' && after != 'm' && after != 'h'));
    if (nasal) {
      if (buf.isNotEmpty) parts.add(SonText(buf));
      buf = '';
      parts.add(SonBlank(n == 'n' ? 'on' : 'om', after));
      i++;
    } else {
      buf += c;
    }
  }
  if (buf.isNotEmpty) parts.add(SonText(buf));
  return parts;
}

bool hasSon(String w) => parseSon(w).any((p) => p is SonBlank);

String ruleSays(String? next) => next != null && 'mbp'.contains(next) ? 'om' : 'on';

bool isTrap(String word) => parseSon(word).any((p) => p is SonBlank && p.blank != ruleSays(p.next));

String reason(SonBlank p, String word) {
  if (p.blank != ruleSays(p.next)) {
    return p.blank == 'on'
        ? "Mot piège : « $word » s'écrit avec on, même devant ${p.next}."
        : "Mot piège : « $word » se termine par om.";
  }
  if (p.blank == 'om') return 'om, car il y a un ${p.next} juste après.';
  return p.next != null ? 'on, car après il y a un ${p.next} (pas de m, b, p).' : 'on, à la fin du mot.';
}

const sonBank = [
  'ballon', 'mouton', 'bonjour', 'maison', 'pont', 'rond', 'poisson', 'garçon', 'cochon', 'melon', 'crayon', 'oncle',
  'onze', 'montagne', 'savon', 'bouton', 'dragon', 'citron', 'long', 'blond', 'lion', 'avion', 'monde', 'conte',
  'ombre', 'tomber', 'pompon', 'nombre', 'pompier', 'trompette', 'bombe', 'colombe', 'concombre', 'sombre', 'tombe',
  'pompe', 'combien', 'ombrelle', 'compote',
  'bonbon', 'nom', 'prénom', 'surnom',
];

const sonFocusDefault = ['ombre', 'tomber', 'prénom', 'nom', 'ballon', 'pompon', 'bonbon'];

List<Question> sonRound(Map<String, dynamic> c) {
  final n = clampInt(cfgInt(c, 'questions', 12), 3, 30);
  final focus = cfgStrings(c, 'focus').map((w) => w.trim().toLowerCase()).where(hasSon).toSet().toList();
  final words = shuffled(focus).take(n).toList();
  if (cfgBool(c, 'extra', true)) {
    final pool = shuffled(sonBank.where((w) => !words.contains(w)));
    while (words.length < n && pool.isNotEmpty) {
      words.add(pool.removeLast());
    }
  }
  var i = 0;
  while (words.length < n && focus.isNotEmpty) {
    words.add(focus[i++ % focus.length]);
  }
  return shuffled(words).map<Question>((w) => SonQuestion(w)).toList();
}
