// Géographie : les pays et leurs drapeaux (données générées par scripts/build-geo.mjs du site web).
import 'dart:convert';
import 'package:flutter/services.dart' show rootBundle;
import 'rng.dart';

class Country {
  final String code, name, cont, flag;
  final bool easy;
  const Country(this.code, this.name, this.cont, this.flag, this.easy);
  factory Country.fromJson(Map<String, dynamic> j) =>
      Country(j['code'] as String, j['name'] as String, j['cont'] as String, j['flag'] as String, j['easy'] == true);
}

class GeoData {
  static List<Country> countries = const [];
  static Future<void> load() async {
    if (countries.isNotEmpty) return;
    final raw = jsonDecode(await rootBundle.loadString('assets/data/countries.json')) as List;
    countries = raw.map((e) => Country.fromJson(e as Map<String, dynamic>)).toList();
  }
}

List<Country> flagPool(String niveau) {
  final all = GeoData.countries;
  if (niveau == 'facile') return all.where((c) => c.easy).toList();
  if (niveau == 'europe') return all.where((c) => c.cont == 'EU').toList();
  return all;
}
