import "package:audioplayers/audioplayers.dart";
import "package:flutter/foundation.dart";
import "package:flutter/services.dart";
import "package:shared_preferences/shared_preferences.dart";

/// Preferências locais do app publicado (não vêm do JSON do editor).
class AppSettings extends ChangeNotifier {
  static const _kSound = "soundEnabled";
  static const _kVibration = "vibrationEnabled";

  bool soundEnabled = true;
  bool vibrationEnabled = true;
  final AudioPlayer _player = AudioPlayer();

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    soundEnabled = prefs.getBool(_kSound) ?? true;
    vibrationEnabled = prefs.getBool(_kVibration) ?? true;
    notifyListeners();
  }

  Future<void> setSoundEnabled(bool v) async {
    soundEnabled = v;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_kSound, v);
    notifyListeners();
  }

  Future<void> setVibrationEnabled(bool v) async {
    vibrationEnabled = v;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_kVibration, v);
    notifyListeners();
  }

  /// Silenciar tudo / só som / só vibração / tudo.
  Future<void> applyMode({required bool sound, required bool vibration}) async {
    soundEnabled = sound;
    vibrationEnabled = vibration;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_kSound, sound);
    await prefs.setBool(_kVibration, vibration);
    notifyListeners();
  }

  Future<void> playClickSound(String? assetPath) async {
    if (!soundEnabled || assetPath == null) return;
    try {
      await _player.stop();
      await _player.play(AssetSource(assetPath.replaceFirst("assets/", "")));
    } catch (_) {
      // Som opcional — falha silenciosa (desktop sem audio, asset ausente, etc.)
    }
  }

  Future<void> vibrateIfEnabled() async {
    if (!vibrationEnabled) return;
    try {
      await HapticFeedback.mediumImpact();
    } catch (_) {}
  }

  Future<void> feedbackForButton(String? soundAsset) async {
    await Future.wait([
      playClickSound(soundAsset),
      vibrateIfEnabled(),
    ]);
  }

  @override
  void dispose() {
    _player.dispose();
    super.dispose();
  }
}
