import 'package:audioplayers/audioplayers.dart';
import 'package:flutter_tts/flutter_tts.dart';

/// Petits sons et lecture à voix haute (voix française, suisse si disponible).
class Sounds {
  static bool muted = false;
  static final _tts = FlutterTts();
  static bool _ttsReady = false;

  static Future<void> _play(String name, {double rate = 1}) async {
    if (muted) return;
    try {
      final p = AudioPlayer();
      await p.setPlaybackRate(rate);
      await p.play(AssetSource('sounds/$name.wav'), mode: PlayerMode.lowLatency);
      p.onPlayerComplete.listen((_) => p.dispose());
    } catch (_) {/* son indisponible */}
  }

  static void good() => _play('good');
  static void bad() => _play('bad');
  static void tick([int i = 0]) => _play('tick', rate: 1 + (i % 8) * 0.06);
  static void fanfare() => _play('fanfare');

  static Future<void> _initTts() async {
    if (_ttsReady) return;
    _ttsReady = true;
    try {
      final langs = (await _tts.getLanguages as List?)?.map((e) => '$e').toList() ?? const [];
      await _tts.setLanguage(langs.contains('fr-CH') ? 'fr-CH' : 'fr-FR');
      await _tts.setSpeechRate(0.45);
      await _tts.awaitSpeakCompletion(false);
    } catch (_) {/* pas de synthèse vocale */}
  }

  static Future<void> say(String text) async {
    if (muted || text.isEmpty) return;
    try {
      await _initTts();
      await _tts.stop();
      await _tts.speak(text);
    } catch (_) {/* ignore */}
  }
}
