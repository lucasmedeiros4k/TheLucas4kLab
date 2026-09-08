import "package:flutter/material.dart";
import "../models/content.dart";
import "../widgets/element_renderer.dart";

class ContentScreen extends StatelessWidget {
  final AppContent content;
  final AppScreen screen;

  const ContentScreen({super.key, required this.content, required this.screen});

  @override
  Widget build(BuildContext context) {
    final bg = screen.backgroundImage;
    DecorationImage? bgImage;
    if (bg != null && bg.isNotEmpty && !MediaPath.isEmoji(bg)) {
      if (MediaPath.isNetwork(bg)) {
        bgImage = DecorationImage(
          image: NetworkImage(bg),
          fit: BoxFit.cover,
          colorFilter: ColorFilter.mode(
            Colors.black.withValues(alpha: 0.35),
            BlendMode.darken,
          ),
        );
      } else {
        final asset = MediaPath.assetPath(bg);
        if (asset != null) {
          bgImage = DecorationImage(
            image: AssetImage(asset),
            fit: BoxFit.cover,
            colorFilter: ColorFilter.mode(
              Colors.black.withValues(alpha: 0.35),
              BlendMode.darken,
            ),
          );
        }
      }
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(screen.title),
      ),
      body: Container(
        decoration: BoxDecoration(
          image: bgImage,
        ),
        child: AnimatedSwitcher(
          duration: const Duration(milliseconds: 250),
          child: _ScreenBody(
            key: ValueKey(screen.id),
            content: content,
            screen: screen,
          ),
        ),
      ),
    );
  }
}

class _ScreenBody extends StatelessWidget {
  final AppContent content;
  final AppScreen screen;

  const _ScreenBody({super.key, required this.content, required this.screen});

  void _navigate(BuildContext context, String id) {
    final next = content.screenById(id);
    if (next == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Tela não encontrada: $id")),
      );
      return;
    }
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => ContentScreen(content: content, screen: next),
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
              return Positioned(
                left: left,
                top: top,
                width: width,
                child: ElementRenderer(
                  element: el,
                  expand: width != null,
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
