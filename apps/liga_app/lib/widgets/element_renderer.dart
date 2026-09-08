import "package:flutter/material.dart";
import "package:url_launcher/url_launcher.dart";
import "../models/content.dart";

class ElementRenderer extends StatefulWidget {
  final ContentElement element;
  final void Function(String screenId) onNavigate;

  const ElementRenderer({
    super.key,
    required this.element,
    required this.onNavigate,
  });

  @override
  State<ElementRenderer> createState() => _ElementRendererState();
}

class _ElementRendererState extends State<ElementRenderer> {
  final Map<String, bool> _checks = {};

  @override
  Widget build(BuildContext context) {
    final el = widget.element;
    if (el is TextElement) {
      return Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: Text(el.content, style: Theme.of(context).textTheme.bodyLarge),
      );
    }
    if (el is ButtonElement) {
      return Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: SizedBox(
          width: double.infinity,
          child: FilledButton(
            onPressed: () async {
              if (el.action.type == "navigate" && el.action.target.isNotEmpty) {
                widget.onNavigate(el.action.target);
              } else if (el.action.type == "openUrl" && el.action.target.isNotEmpty) {
                final uri = Uri.tryParse(el.action.target);
                if (uri != null) {
                  await launchUrl(uri, mode: LaunchMode.externalApplication);
                }
              }
            },
            child: Text(el.label),
          ),
        ),
      );
    }
    if (el is ImageElement) {
      return Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: _buildImage(el),
      );
    }
    if (el is VideoElement) {
      return Card(
        margin: const EdgeInsets.only(bottom: 12),
        child: ListTile(
          leading: const Icon(Icons.play_circle_outline),
          title: Text(el.title?.isNotEmpty == true ? el.title! : "Vídeo"),
          subtitle: Text(el.url.isEmpty ? "Placeholder — URL vazia" : el.url),
          onTap: el.url.isEmpty
              ? null
              : () async {
                  final uri = Uri.tryParse(el.url);
                  if (uri != null) {
                    await launchUrl(uri, mode: LaunchMode.externalApplication);
                  }
                },
        ),
      );
    }
    if (el is ChecklistElement) {
      return Card(
        margin: const EdgeInsets.only(bottom: 12),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(el.title, style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              ...el.items.map((item) {
                final checked = _checks[item.id] ?? false;
                return CheckboxListTile(
                  contentPadding: EdgeInsets.zero,
                  value: checked,
                  title: Text(item.label),
                  onChanged: (v) => setState(() => _checks[item.id] = v ?? false),
                );
              }),
            ],
          ),
        ),
      );
    }
    return const SizedBox.shrink();
  }

  Widget _buildImage(ImageElement el) {
    if (el.src.isEmpty) {
      return const Text("Imagem sem fonte", style: TextStyle(color: Colors.grey));
    }
    if (el.isEmoji) {
      final size = el.role == "icon" ? 40.0 : (el.width ?? 56.0);
      return Center(
        child: Text(el.emojiChar, style: TextStyle(fontSize: size)),
      );
    }

    final fit = el.fit == "cover" ? BoxFit.cover : BoxFit.contain;
    final w = el.width;
    final h = el.height ?? (el.role == "icon" ? 48.0 : (el.role == "logo" ? 96.0 : null));

    Widget img;
    if (el.isNetwork) {
      img = Image.network(
        el.src,
        fit: fit,
        width: w,
        height: h,
        errorBuilder: (context, error, stackTrace) => _broken(el.alt),
      );
    } else {
      final asset = el.assetPath;
      if (asset == null) {
        return _broken(el.alt);
      }
      img = Image.asset(
        asset,
        fit: fit,
        width: w,
        height: h,
        errorBuilder: (context, error, stackTrace) => _broken(el.alt),
      );
    }

    if (el.role == "logo" || el.role == "icon") {
      return Center(child: img);
    }
    return SizedBox(width: double.infinity, child: img);
  }

  Widget _broken(String? alt) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey.shade400),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(alt?.isNotEmpty == true ? alt! : "Imagem indisponível"),
    );
  }
}
