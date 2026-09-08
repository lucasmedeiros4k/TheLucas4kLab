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
          child: ListView(
            key: ValueKey(screen.id),
            padding: const EdgeInsets.all(16),
            children: [
              if (content.disclaimer.isNotEmpty)
                Container(
                  width: double.infinity,
                  margin: const EdgeInsets.only(bottom: 16),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.amber.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.amber.shade700.withValues(alpha: 0.4)),
                  ),
                  child: Text(content.disclaimer),
                ),
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
              ...screen.elements.map(
                (el) => ElementRenderer(
                  element: el,
                  onNavigate: (id) {
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
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
