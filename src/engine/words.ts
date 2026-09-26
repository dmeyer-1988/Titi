// Nombres en toutes lettres, français de Suisse romande (septante, huitante, nonante).

const UNITS = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix',
  'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize']
const TENS: Record<number, string> = {
  2: 'vingt', 3: 'trente', 4: 'quarante', 5: 'cinquante', 6: 'soixante', 7: 'septante', 8: 'huitante', 9: 'nonante',
}

function below100(n: number): string {
  if (n <= 16) return UNITS[n]
  if (n < 20) return 'dix-' + UNITS[n - 10]
  const t = Math.floor(n / 10), u = n % 10
  if (u === 0) return TENS[t]
  if (u === 1) return TENS[t] + '-et-un'
  return TENS[t] + '-' + UNITS[u]
}

export function words(n: number): string {
  if (n < 0) return 'moins ' + words(-n)
  if (n < 100) return below100(n)
  if (n === 100) return 'cent'
  if (n < 200) return 'cent-' + below100(n - 100)
  if (n < 1000) {
    const h = Math.floor(n / 100), r = n % 100
    return UNITS[h] + '-cent' + (r === 0 ? 's' : '-' + below100(r))
  }
  return String(n)
}
