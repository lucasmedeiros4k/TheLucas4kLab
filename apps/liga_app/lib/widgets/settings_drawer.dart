import "package:flutter/material.dart";
import "../services/app_settings.dart";

/// Engrenagem / drawer: Silenciar tudo · Som · Vibração.
class SettingsDrawer extends StatelessWidget {
  final AppSettings settings;

  const SettingsDrawer({super.key, required this.settings});

  @override
  Widget build(BuildContext context) {
    return Drawer(
      child: SafeArea(
        child: ListenableBuilder(
          listenable: settings,
          builder: (context, _) {
            return ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Text("Configurações", style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 8),
                Text(
                  "Som e vibração ficam neste aparelho (não vêm do editor).",
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                const Divider(height: 32),
                SwitchListTile(
                  title: const Text("Som"),
                  subtitle: const Text("Tocar sons dos botões"),
                  value: settings.soundEnabled,
                  onChanged: (v) => settings.setSoundEnabled(v),
                ),
                SwitchListTile(
                  title: const Text("Vibração"),
                  subtitle: const Text("Vibrar ao tocar botões"),
                  value: settings.vibrationEnabled,
                  onChanged: (v) => settings.setVibrationEnabled(v),
                ),
                const SizedBox(height: 12),
                const Text("Atalhos"),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    OutlinedButton(
                      onPressed: () => settings.applyMode(sound: false, vibration: false),
                      child: const Text("Silenciar tudo"),
                    ),
                    OutlinedButton(
                      onPressed: () => settings.applyMode(sound: true, vibration: false),
                      child: const Text("Só som"),
                    ),
                    OutlinedButton(
                      onPressed: () => settings.applyMode(sound: false, vibration: true),
                      child: const Text("Só vibração"),
                    ),
                    FilledButton(
                      onPressed: () => settings.applyMode(sound: true, vibration: true),
                      child: const Text("Som + vibração"),
                    ),
                  ],
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}
