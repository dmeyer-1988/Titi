import 'dart:async';
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:uuid/uuid.dart';
import 'models.dart';

SupabaseClient get _db => Supabase.instance.client;
const _uuid = Uuid();
final _uuidRe = RegExp(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', caseSensitive: false);

String _cacheKey(String uid) => 'balles-cache-$uid';
const _queueKey = 'balles-queue';
const _quarantineKey = 'balles-quarantine';
const childKey = 'balles-child';

// ---------- cache local (l'app reste utilisable hors ligne) ----------

Future<Family?> readCache(String uid) async {
  final p = await SharedPreferences.getInstance();
  final raw = p.getString(_cacheKey(uid));
  if (raw == null) return null;
  try {
    return Family.fromJson(jsonDecode(raw) as Map<String, dynamic>);
  } catch (_) {
    return null;
  }
}

Future<Family> fetchFamily(String uid) async {
  final res = await Future.wait([
    _db.from('children').select('id,name,mascot_name,level').order('created_at'),
    _db.from('exercises').select('id,type,title,config,active,position,updated_at').order('position').order('created_at'),
    _db.from('profiles').select('parent_pin,pack_price').eq('user_id', uid).maybeSingle(),
  ]);
  final children = (res[0] as List).map((e) => Child.fromJson(Map<String, dynamic>.from(e as Map))).toList();
  final exercises = (res[1] as List).map((e) => Exercise.fromJson(Map<String, dynamic>.from(e as Map))).toList();
  final prof = res[2] as Map<String, dynamic>?;
  final fam = Family(
    children: children,
    exercises: exercises,
    pin: prof?['parent_pin'] as String? ?? '1234',
    packPrice: (prof?['pack_price'] as num?)?.toInt() ?? 10,
  );
  final p = await SharedPreferences.getInstance();
  await p.setString(_cacheKey(uid), jsonEncode(fam.toJson()));
  return fam;
}

/// Première utilisation : profil et enfant (les exercices de départ sont créés par la version web
/// ou ajoutés depuis l'espace parent).
Future<void> setupFamily(String uid, String childName, String pin, int level) async {
  await _db.from('profiles').upsert({'user_id': uid, 'parent_pin': pin});
  await _db.from('children').insert({'name': childName.trim(), 'level': level});
}

// ---------- réponses de l'enfant (file d'attente hors ligne) ----------

Future<List<Map<String, dynamic>>> _readQueue() async {
  final p = await SharedPreferences.getInstance();
  try {
    return (jsonDecode(p.getString(_queueKey) ?? '[]') as List).map((e) => Map<String, dynamic>.from(e as Map)).toList();
  } catch (_) {
    return [];
  }
}

Future<void> _writeQueue(List<Map<String, dynamic>> q) async {
  final p = await SharedPreferences.getInstance();
  final kept = q.length > 2000 ? q.sublist(q.length - 2000) : q;
  await p.setString(_queueKey, jsonEncode(kept));
}

Future<void> recordAttempt(String childId, AttemptDraft a) async {
  // exercise_id référence la table exercises : un id factice ferait rejeter tout le lot.
  final exId = a.exerciseId != null && _uuidRe.hasMatch(a.exerciseId!) ? a.exerciseId : null;
  final q = await _readQueue();
  q.add({
    'id': _uuid.v4(),
    'child_id': childId,
    'exercise_id': exId,
    'exercise_type': a.exerciseType,
    'skill_id': null,
    'prompt': a.prompt,
    'expected': a.expected,
    'given': a.given,
    'correct': a.correct,
    'first_try': a.firstTry,
    'created_at': DateTime.now().toUtc().toIso8601String(),
  });
  await _writeQueue(q);
  unawaited(flushQueue());
}

bool _flushing = false;

Future<void> flushQueue() async {
  if (_flushing) return;
  final q = await _readQueue();
  if (q.isEmpty) return;
  _flushing = true;
  final batch = q.take(200).toList();
  final ids = batch.map((b) => b['id']).toSet();
  try {
    await _db.from('attempts').upsert(batch, onConflict: 'id', ignoreDuplicates: true);
    final rest = (await _readQueue()).where((x) => !ids.contains(x['id'])).toList();
    await _writeQueue(rest);
  } on PostgrestException {
    // Le serveur a rejeté le lot : on le met de côté pour ne pas bloquer la file.
    final p = await SharedPreferences.getInstance();
    final kept = (jsonDecode(p.getString(_quarantineKey) ?? '[]') as List)..addAll(batch);
    await p.setString(_quarantineKey, jsonEncode(kept));
    await _writeQueue((await _readQueue()).where((x) => !ids.contains(x['id'])).toList());
  } catch (_) {
    // Pas de réseau : le lot reste en tête de file.
    _flushing = false;
    return;
  }
  _flushing = false;
  if ((await _readQueue()).isNotEmpty) unawaited(Future.delayed(const Duration(milliseconds: 500), flushQueue));
}

/// Étoiles : une par bonne réponse du premier coup (par exercice et au total).
class StarCount {
  final Map<String, int> byExercise;
  final int total;
  const StarCount(this.byExercise, this.total);
}

Future<StarCount> fetchStars(String childId) async {
  final rows = await _db
      .from('attempts')
      .select('exercise_id,first_try,correct')
      .eq('child_id', childId)
      .eq('first_try', true)
      .eq('correct', true)
      .limit(10000);
  final by = <String, int>{};
  var total = 0;
  for (final r in rows) {
    total++;
    final id = r['exercise_id'] as String?;
    if (id != null) by[id] = (by[id] ?? 0) + 1;
  }
  // les réponses encore en attente d'envoi comptent aussi
  for (final a in await _readQueue()) {
    if (a['child_id'] == childId && a['first_try'] == true && a['correct'] == true) {
      total++;
      final id = a['exercise_id'] as String?;
      if (id != null) by[id] = (by[id] ?? 0) + 1;
    }
  }
  return StarCount(by, total);
}

Future<int> fetchSpentStars(String childId) async {
  try {
    final rows = await _db.from('sticker_packs').select('price').eq('child_id', childId);
    return rows.fold<int>(0, (s, r) => s + ((r['price'] as num?)?.toInt() ?? 0));
  } catch (_) {
    return 0;
  }
}
