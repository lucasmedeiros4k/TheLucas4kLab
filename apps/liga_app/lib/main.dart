import "dart:convert";

import "package:flutter/material.dart";
import "package:flutter/services.dart";

import "models/content.dart";
import "screens/content_screen.dart";
import "services/app_settings.dart";

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const LigaApp());
}

class LigaApp extends StatefulWidget {
  const LigaApp({super.key});

  @override
  State<LigaApp> createState() => _LigaAppState();
}

class _LigaAppState extends State<LigaApp> {
  late final AppSettings _settings = AppSettings();

  @override
  void initState() {
    super.initState();
    _settings.load();
  }

  @override
  void dispose() {
    _settings.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: "LAUEM",
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF0EA5E9),
          brightness: Brightness.light,
        ),
        useMaterial3: true,
      ),
      home: ContentLoader(settings: _settings),
    );
  }
}

class ContentLoader extends StatefulWidget {
  final AppSettings settings;
  const ContentLoader({super.key, required this.settings});

  @override
  State<ContentLoader> createState() => _ContentLoaderState();
}

class _ContentLoaderState extends State<ContentLoader> {
  late Future<AppContent> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<AppContent> _load() async {
    final raw = await rootBundle.loadString("assets/content/published.json");
    final json = jsonDecode(raw) as Map<String, dynamic>;
    return AppContent.fromJson(json);
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<AppContent>(
      future: _future,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }
        if (snapshot.hasError) {
          return Scaffold(
            body: Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Text(
                  "Não foi possível carregar o conteúdo publicado.\n${snapshot.error}",
                  textAlign: TextAlign.center,
                ),
              ),
            ),
          );
        }
        final content = snapshot.data!;
        if (content.screens.isEmpty) {
          return const Scaffold(
            body: Center(
              child: Text("Nenhuma tela publicada. Use o editor externo e publique."),
            ),
          );
        }
        final home = content.screenById(content.homeScreenId) ?? content.screens.first;
        return ContentScreen(content: content, screen: home, settings: widget.settings);
      },
    );
  }
}
