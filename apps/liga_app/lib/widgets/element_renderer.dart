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
}
