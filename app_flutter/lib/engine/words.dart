// Nombres en toutes lettres, français de Suisse romande (septante, huitante, nonante).

const _units = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix',
  'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize'];
const _tens = {2: 'vingt', 3: 'trente', 4: 'quarante', 5: 'cinquante', 6: 'soixante', 7: 'septante', 8: 'huitante', 9: 'nonante'};

String _below100(int n) {
  if (n <= 16) return _units[n];
  if (n < 20) return 'dix-${_units[n - 10]}';
  final t = n ~/ 10, u = n % 10;
  if (u == 0) return _tens[t]!;
  if (u == 1) return '${_tens[t]}-et-un';
  return '${_tens[t]}-${_units[u]}';
}

String words(int n) {
  if (n < 0) return 'moins ${words(-n)}';
  if (n < 100) return _below100(n);
  if (n == 100) return 'cent';
  if (n < 200) return 'cent-${_below100(n - 100)}';
  if (n < 1000) {
    final h = n ~/ 100, r = n % 100;
    return '${_units[h]}-cent${r == 0 ? 's' : '-${_below100(r)}'}';
  }
  return '$n';
}
