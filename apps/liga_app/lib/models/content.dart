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
  final String? backgroundImage;
  final List<ContentElement> elements;

  const AppScreen({
    required this.id,
    required this.title,
    this.backgroundImage,
    required this.elements,
  });

  factory AppScreen.fromJson(Map<String, dynamic> json) {
    final elements = (json["elements"] as List? ?? [])
        .map((e) => ContentElement.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
    final bg = json["backgroundImage"] as String?;
    return AppScreen(
      id: json["id"] as String? ?? "",
      title: json["title"] as String? ?? "",
      backgroundImage: (bg != null && bg.isNotEmpty) ? bg : null,
      elements: elements,
    );
  }
}

sealed class ContentElement {
  final String id;
  /// Layout opcional em % do canvas (0–100). Sem x/y = Column (auto).
  final double? x;
  final double? y;
  final double? w;

  const ContentElement({required this.id, this.x, this.y, this.w});

  bool get hasLayout => x != null && y != null;

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
      case "image":
        return ImageElement.fromJson(json);
      default:
        return TextElement(id: json["id"] as String? ?? "unknown", content: "Elemento desconhecido: $type");
    }
  }

  static double? _pct(dynamic v) {
    if (v == null) return null;
    if (v is num) return v.toDouble();
    return null;
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
  const ButtonElement({
    required super.id,
    required this.label,
    required this.action,
    super.x,
    super.y,
    super.w,
  });
  factory ButtonElement.fromJson(Map<String, dynamic> json) => ButtonElement(
        id: json["id"] as String? ?? "",
        label: json["label"] as String? ?? "Botão",
        action: ButtonAction.fromJson(Map<String, dynamic>.from(json["action"] as Map? ?? {})),
        x: ContentElement._pct(json["x"]),
        y: ContentElement._pct(json["y"]),
        w: ContentElement._pct(json["w"]),
      );
}

class VideoElement extends ContentElement {
  final String url;
  final String? title;
  const VideoElement({
    required super.id,
    required this.url,
    this.title,
    super.x,
    super.y,
    super.w,
  });
  factory VideoElement.fromJson(Map<String, dynamic> json) => VideoElement(
        id: json["id"] as String? ?? "",
        url: json["url"] as String? ?? "",
        title: json["title"] as String?,
        x: ContentElement._pct(json["x"]),
        y: ContentElement._pct(json["y"]),
        w: ContentElement._pct(json["w"]),
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
  const ChecklistElement({
    required super.id,
    required this.title,
    required this.items,
    super.x,
    super.y,
    super.w,
  });
  factory ChecklistElement.fromJson(Map<String, dynamic> json) => ChecklistElement(
        id: json["id"] as String? ?? "",
        title: json["title"] as String? ?? "Checklist",
        items: (json["items"] as List? ?? [])
            .map((e) => ChecklistItem.fromJson(Map<String, dynamic>.from(e as Map)))
            .toList(),
        x: ContentElement._pct(json["x"]),
        y: ContentElement._pct(json["y"]),
        w: ContentElement._pct(json["w"]),
      );
}

class TextElement extends ContentElement {
  final String content;
  const TextElement({
    required super.id,
    required this.content,
    super.x,
    super.y,
    super.w,
  });
  factory TextElement.fromJson(Map<String, dynamic> json) => TextElement(
        id: json["id"] as String? ?? "",
        content: json["content"] as String? ?? "",
        x: ContentElement._pct(json["x"]),
        y: ContentElement._pct(json["y"]),
        w: ContentElement._pct(json["w"]),
      );
}

class ImageElement extends ContentElement {
  final String src;
  final String? alt;
  final String fit; // cover | contain
  final double? width;
  final double? height;
  final String? role; // logo | icon | photo

  const ImageElement({
    required super.id,
    required this.src,
    this.alt,
    this.fit = "contain",
    this.width,
    this.height,
    this.role,
    super.x,
    super.y,
    super.w,
  });

  factory ImageElement.fromJson(Map<String, dynamic> json) => ImageElement(
        id: json["id"] as String? ?? "",
        src: json["src"] as String? ?? "",
        alt: json["alt"] as String?,
        fit: json["fit"] as String? ?? "contain",
        width: (json["width"] as num?)?.toDouble(),
        height: (json["height"] as num?)?.toDouble(),
        role: json["role"] as String?,
        x: ContentElement._pct(json["x"]),
        y: ContentElement._pct(json["y"]),
        w: ContentElement._pct(json["w"]),
      );

  bool get isEmoji => src.startsWith("emoji:");
  String get emojiChar => isEmoji ? src.substring(6) : "";

  /// Caminho de asset Flutter para /media/arquivo → assets/media/arquivo
  String? get assetPath {
    if (src.startsWith("/media/")) {
      return "assets/media/${src.substring("/media/".length)}";
    }
    if (src.startsWith("media/")) {
      return "assets/$src";
    }
    return null;
  }

  bool get isNetwork =>
      src.startsWith("http://") || src.startsWith("https://");
}

/// Utilitário para plano de fundo da tela (mesmas regras de ImageElement.src).
class MediaPath {
  static bool isEmoji(String src) => src.startsWith("emoji:");
  static String emojiChar(String src) =>
      isEmoji(src) ? src.substring(6) : "";

  static String? assetPath(String src) {
    if (src.startsWith("/media/")) {
      return "assets/media/${src.substring("/media/".length)}";
    }
    if (src.startsWith("media/")) {
      return "assets/$src";
    }
    return null;
  }

  static bool isNetwork(String src) =>
      src.startsWith("http://") || src.startsWith("https://");
}
