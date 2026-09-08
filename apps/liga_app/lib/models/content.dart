class AppContent {
  final int version;
  final String disclaimer;
  final String homeScreenId;
  final List<AppScreen> screens;

  const AppContent({
    required this.version,
    required this.disclaimer,
    required this.homeScreenId,
    required this.screens,
  });

  factory AppContent.fromJson(Map<String, dynamic> json) {
    final screens = (json["screens"] as List? ?? [])
        .map((e) => AppScreen.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
    return AppContent(
      version: (json["version"] as num?)?.toInt() ?? 1,
      disclaimer: json["disclaimer"] as String? ?? "",
      homeScreenId: json["homeScreenId"] as String? ?? (screens.isNotEmpty ? screens.first.id : ""),
      screens: screens,
    );
  }

  AppScreen? screenById(String id) {
    for (final s in screens) {
      if (s.id == id) return s;
    }
    return null;
  }
}

class AppScreen {
  final String id;
  final String title;
  final List<ContentElement> elements;

  const AppScreen({required this.id, required this.title, required this.elements});

  factory AppScreen.fromJson(Map<String, dynamic> json) {
    final elements = (json["elements"] as List? ?? [])
        .map((e) => ContentElement.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
    return AppScreen(
      id: json["id"] as String? ?? "",
      title: json["title"] as String? ?? "",
      elements: elements,
    );
  }
}

sealed class ContentElement {
  final String id;
  const ContentElement({required this.id});

  factory ContentElement.fromJson(Map<String, dynamic> json) {
    final type = json["type"] as String? ?? "";
    switch (type) {
      case "button":
        return ButtonElement.fromJson(json);
      case "video":
        return VideoElement.fromJson(json);
      case "checklist":
        return ChecklistElement.fromJson(json);
      case "text":
        return TextElement.fromJson(json);
      default:
        return TextElement(id: json["id"] as String? ?? "unknown", content: "Elemento desconhecido: $type");
    }
  }
}

class ButtonAction {
  final String type;
  final String target;
  const ButtonAction({required this.type, required this.target});
  factory ButtonAction.fromJson(Map<String, dynamic> json) => ButtonAction(
        type: json["type"] as String? ?? "navigate",
        target: json["target"] as String? ?? "",
      );
}

class ButtonElement extends ContentElement {
  final String label;
  final ButtonAction action;
  const ButtonElement({required super.id, required this.label, required this.action});
  factory ButtonElement.fromJson(Map<String, dynamic> json) => ButtonElement(
        id: json["id"] as String? ?? "",
        label: json["label"] as String? ?? "Botão",
        action: ButtonAction.fromJson(Map<String, dynamic>.from(json["action"] as Map? ?? {})),
      );
}

class VideoElement extends ContentElement {
  final String url;
  final String? title;
  const VideoElement({required super.id, required this.url, this.title});
  factory VideoElement.fromJson(Map<String, dynamic> json) => VideoElement(
        id: json["id"] as String? ?? "",
        url: json["url"] as String? ?? "",
        title: json["title"] as String?,
      );
}

class ChecklistItem {
  final String id;
  final String label;
  const ChecklistItem({required this.id, required this.label});
  factory ChecklistItem.fromJson(Map<String, dynamic> json) => ChecklistItem(
        id: json["id"] as String? ?? "",
        label: json["label"] as String? ?? "",
      );
}

class ChecklistElement extends ContentElement {
  final String title;
  final List<ChecklistItem> items;
  const ChecklistElement({required super.id, required this.title, required this.items});
  factory ChecklistElement.fromJson(Map<String, dynamic> json) => ChecklistElement(
        id: json["id"] as String? ?? "",
        title: json["title"] as String? ?? "Checklist",
        items: (json["items"] as List? ?? [])
            .map((e) => ChecklistItem.fromJson(Map<String, dynamic>.from(e as Map)))
            .toList(),
      );
}

class TextElement extends ContentElement {
  final String content;
  const TextElement({required super.id, required this.content});
  factory TextElement.fromJson(Map<String, dynamic> json) => TextElement(
        id: json["id"] as String? ?? "",
        content: json["content"] as String? ?? "",
      );
}
