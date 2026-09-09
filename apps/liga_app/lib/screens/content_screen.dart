import "package:flutter/material.dart";
import "../models/content.dart";
import "../services/app_settings.dart";
import "../widgets/element_renderer.dart";
import "../widgets/settings_drawer.dart";

class ContentScreen extends StatelessWidget {
  final AppContent content;
  final AppScreen screen;
  final AppSettings settings;

  const ContentScreen({
    super.key,
    required this.content,
    required this.screen,
    required this.settings,
  });

  @override
  Widget build(BuildContext context) {
    final bg = screen.backgroundImage;
    Widget? bgWidget;
    if (bg != null && bg.isNotEmpty && !MediaPath.isEmoji(bg)) {
      ImageProvider? provider;
      if (MediaPath.isNetwork(bg)) {
        provider = NetworkImage(bg);
      } else {
        final asset = MediaPath.assetPath(bg);
        if (asset != null) provider = AssetImage(asset);
      }
      if (provider != null) {
        bgWidget = Opacity(
          opacity: screen.backgroundOpacity,
          child: DecoratedBox(
            decoration: BoxDecoration(
              image: DecorationImage(
                image: provider,
                fit: BoxFit.cover,
                colorFilter: ColorFilter.mode(
                  Colors.black.withValues(alpha: 0.25),
                  BlendMode.darken,
                ),
              ),
            ),
            child: const SizedBox.expand(),
          ),
        );
      }
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(screen.title),
        actions: [
          Builder(
            builder: (ctx) => IconButton(
              tooltip: "Configurações",
              icon: const Icon(Icons.settings),
              onPressed: () => Scaffold.of(ctx).openEndDrawer(),
            ),
          ),
        ],
      ),
      endDrawer: SettingsDrawer(settings: settings),
      body: Stack(
        fit: StackFit.expand,
        children: [
          if (bgWidget != null) Positioned.fill(child: bgWidget),
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 280),
            switchInCurve: Curves.easeOutCubic,
            switchOutCurve: Curves.easeInCubic,
            transitionBuilder: (child, animation) {
              return FadeTransition(
                opacity: animation,
                child: SlideTransition(
                  position: Tween<Offset>(
                    begin: const Offset(0.04, 0),
                    end: Offset.zero,
                  ).animate(animation),
                  child: child,
                ),
              );
            },
            child: _ScreenBody(
              key: ValueKey(screen.id),
              content: content,
              screen: screen,
              settings: settings,
            ),
          ),
        ],
      ),
    );
  }
}

class _ScreenBody extends StatelessWidget {
  final AppContent content;
  final AppScreen screen;
  final AppSettings settings;

  const _ScreenBody({
    super.key,
    required this.content,
    required this.screen,
    required this.settings,
  });

  void _navigate(BuildContext context, String id) {
    final next = content.screenById(id);
    if (next == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Tela não encontrada: $id")),
      );
      return;
    }
    Navigator.of(context).push(
      PageRouteBuilder(
        pageBuilder: (context, animation, secondaryAnimation) =>
            ContentScreen(content: content, screen: next, settings: settings),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          final curved = CurvedAnimation(parent: animation, curve: Curves.easeOutCubic);
          return FadeTransition(
            opacity: curved,
            child: SlideTransition(
              position: Tween<Offset>(
                begin: const Offset(0.06, 0),
                end: Offset.zero,
              ).animate(curved),
              child: child,
            ),
          );
        },
        transitionDuration: const Duration(milliseconds: 280),
      ),
    );
  }

  Widget _disclaimer() {
    if (content.disclaimer.isEmpty) return const SizedBox.shrink();
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.amber.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.amber.shade700.withValues(alpha: 0.4)),
      ),
      child: Text(content.disclaimer),
    );
  }

  @override
  Widget build(BuildContext context) {
    final flow = screen.elements.where((e) => !e.hasLayout).toList();
    final positioned = screen.elements.where((e) => e.hasLayout).toList();

    if (positioned.isEmpty) {
      return ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _disclaimer(),
          if (screen.elements.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 48),
              child: Center(
                child: Text(
                  "Tela vazia. Publique conteúdo pelo editor externo.",
                  textAlign: TextAlign.center,
                ),
              ),
            ),
          ...flow.map(
            (el) => ElementRenderer(
              element: el,
              expand: true,
              settings: settings,
              onNavigate: (id) => _navigate(context, id),
            ),
          ),
        ],
      );
    }

    // Com layout: Stack + Positioned (%); elementos sem x/y ficam em Column no topo.
    return LayoutBuilder(
      builder: (context, constraints) {
        final w = constraints.maxWidth;
        final h = constraints.maxHeight.isFinite && constraints.maxHeight > 0
            ? constraints.maxHeight
            : MediaQuery.sizeOf(context).height;

        return Stack(
          children: [
            Positioned.fill(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    _disclaimer(),
                    if (screen.elements.isEmpty)
                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 48),
                        child: Center(
                          child: Text(
                            "Tela vazia. Publique conteúdo pelo editor externo.",
                            textAlign: TextAlign.center,
                          ),
                        ),
                      ),
                    ...flow.map(
                      (el) => ElementRenderer(
                        element: el,
                        expand: true,
                        settings: settings,
                        onNavigate: (id) => _navigate(context, id),
                      ),
                    ),
                    // Espaço para absolutos não cobrirem o scroll mínimo
                    SizedBox(height: h * 0.4),
                  ],
                ),
              ),
            ),
            ...positioned.map((el) {
              final left = (el.x! / 100) * w;
              final top = (el.y! / 100) * h;
              final width = el.w != null ? (el.w! / 100) * w : null;
              final height = el.h != null ? (el.h! / 100) * h : null;
              return Positioned(
                left: left,
                top: top,
                width: width,
                height: height,
                child: ElementRenderer(
                  element: el,
                  expand: width != null,
                  settings: settings,
                  onNavigate: (id) => _navigate(context, id),
                ),
              );
            }),
          ],
        );
      },
    );
  }
}
