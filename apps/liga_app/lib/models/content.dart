import "package:flutter/material.dart";
import "package:google_fonts/google_fonts.dart";

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
  /// Opacidade da imagem de fundo (0–1). Ausente / inválido = 1.
  final double backgroundOpacity;
  final List<ContentElement> elements;

  const AppScreen({
    required this.id,
    required this.title,
    this.backgroundImage,
    this.backgroundOpacity = 1,
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
      backgroundOpacity: normalizeOpacity(json["backgroundOpacity"]),
      elements: elements,
    );
  }
}

/// Aceita 0–1 ou 0–100 (legado). Default 1.
double normalizeOpacity(dynamic v) {
  if (v == null) return 1;
  if (v is! num) return 1;
  var n = v.toDouble();
  if (n > 1) n = n / 100;
  if (n.isNaN) return 1;
  return n.clamp(0.0, 1.0);
}

sealed class ContentElement {
  final String id;
  /// Layout opcional em % do canvas (0–100). Sem x/y = Column (auto).
  final double? x;
  final double? y;
  final double? w;
  /// Altura em % do canvas. Ausente = altura intrínseca.
  final double? h;
  /// Trava no editor; app ignora (só leitura).
  final bool locked;

  const ContentElement({
    required this.id,
    this.x,
    this.y,
    this.w,
    this.h,
    this.locked = false,
  });

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
  /// none | click | pop | beep | caminho de asset
  final String clickSound;
  final String bgColor;
  final String textColor;
  final String fontFamily;
  final double fontSize;
  final FontWeight fontWeight;
  final double borderRadius;
  final double opacity;
  final String? borderColor;
  final double borderWidth;
  final double paddingY;

  const ButtonElement({
    required super.id,
    required this.label,
    required this.action,
    this.clickSound = "none",
    this.bgColor = "#38bdf8",
    this.textColor = "#0f172a",
    this.fontFamily = "system",
    this.fontSize = 16,
    this.fontWeight = FontWeight.w600,
    this.borderRadius = 12,
    this.opacity = 1,
    this.borderColor,
    this.borderWidth = 0,
    this.paddingY = 12,
    super.x,
    super.y,
    super.w,
    super.h,
    super.locked,
  });

  factory ButtonElement.fromJson(Map<String, dynamic> json) => ButtonElement(
        id: json["id"] as String? ?? "",
        label: json["label"] as String? ?? "Botão",
        action: ButtonAction.fromJson(Map<String, dynamic>.from(json["action"] as Map? ?? {})),
        clickSound: (json["clickSound"] as String?)?.trim().isNotEmpty == true
            ? (json["clickSound"] as String).trim()
            : "none",
        bgColor: (json["bgColor"] as String?)?.trim().isNotEmpty == true
            ? (json["bgColor"] as String).trim()
            : "#38bdf8",
        textColor: (json["textColor"] as String?)?.trim().isNotEmpty == true
            ? (json["textColor"] as String).trim()
            : "#0f172a",
        fontFamily: json["fontFamily"] as String? ?? "system",
        fontSize: (json["fontSize"] as num?)?.toDouble() ?? 16,
        fontWeight: _parseWeight(json["fontWeight"], fallback: FontWeight.w600),
        borderRadius: (json["borderRadius"] as num?)?.toDouble() ?? 12,
        opacity: normalizeOpacity(json["opacity"] ?? 1),
        borderColor: (json["borderColor"] as String?)?.trim().isNotEmpty == true
            ? (json["borderColor"] as String).trim()
            : null,
        borderWidth: (json["borderWidth"] as num?)?.toDouble() ?? 0,
        paddingY: (json["paddingY"] as num?)?.toDouble() ?? 12,
        x: ContentElement._pct(json["x"]),
        y: ContentElement._pct(json["y"]),
        w: ContentElement._pct(json["w"]),
        h: ContentElement._pct(json["h"]),
        locked: json["locked"] == true,
      );

  Color get resolvedBg => TextElement._parseColor(bgColor) ?? const Color(0xFF38BDF8);
  Color get resolvedText => TextElement._parseColor(textColor) ?? const Color(0xFF0F172A);
  Color? get resolvedBorder =>
      borderColor != null ? TextElement._parseColor(borderColor) : null;

  TextStyle resolveLabelStyle() {
    final base = TextStyle(
      fontSize: fontSize,
      fontWeight: fontWeight,
      color: resolvedText,
    );
    switch (fontFamily) {
      case "Roboto":
        return GoogleFonts.roboto(textStyle: base);
      case "Open Sans":
        return GoogleFonts.openSans(textStyle: base);
      case "Lato":
        return GoogleFonts.lato(textStyle: base);
      case "Nunito":
        return GoogleFonts.nunito(textStyle: base);
      case "Montserrat":
        return GoogleFonts.montserrat(textStyle: base);
      case "system":
      default:
        return base;
    }
  }

  static FontWeight _parseWeight(dynamic v, {FontWeight fallback = FontWeight.w400}) {
    if (v == null) return fallback;
    final n = v is num ? v.toInt() : int.tryParse(v.toString()) ?? fallback.value;
    return FontWeight.values.firstWhere(
      (w) => w.value == n,
      orElse: () => fallback,
    );
  }
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
    super.h,
    super.locked,
  });
  factory VideoElement.fromJson(Map<String, dynamic> json) => VideoElement(
        id: json["id"] as String? ?? "",
        url: json["url"] as String? ?? "",
        title: json["title"] as String?,
        x: ContentElement._pct(json["x"]),
        y: ContentElement._pct(json["y"]),
        w: ContentElement._pct(json["w"]),
        h: ContentElement._pct(json["h"]),
        locked: json["locked"] == true,
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
    super.h,
    super.locked,
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
        h: ContentElement._pct(json["h"]),
        locked: json["locked"] == true,
      );
}

class TextElement extends ContentElement {
  final String content;
  final String fontFamily;
  final double fontSize;
  final FontWeight fontWeight;
  final Color color;
  final TextAlign textAlign;
  final double lineHeight;

  const TextElement({
    required super.id,
    required this.content,
    this.fontFamily = "system",
    this.fontSize = 16,
    this.fontWeight = FontWeight.w400,
    this.color = const Color(0xFFE2E8F0),
    this.textAlign = TextAlign.left,
    this.lineHeight = 1.45,
    super.x,
    super.y,
    super.w,
    super.h,
    super.locked,
  });

  factory TextElement.fromJson(Map<String, dynamic> json) {
    return TextElement(
      id: json["id"] as String? ?? "",
      content: json["content"] as String? ?? "",
      fontFamily: json["fontFamily"] as String? ?? "system",
      fontSize: (json["fontSize"] as num?)?.toDouble() ?? 16,
      fontWeight: _parseWeight(json["fontWeight"]),
      color: _parseColor(json["color"]) ?? const Color(0xFFE2E8F0),
      textAlign: _parseAlign(json["textAlign"]),
      lineHeight: (json["lineHeight"] as num?)?.toDouble() ?? 1.45,
      x: ContentElement._pct(json["x"]),
      y: ContentElement._pct(json["y"]),
      w: ContentElement._pct(json["w"]),
      h: ContentElement._pct(json["h"]),
      locked: json["locked"] == true,
    );
  }

  TextStyle resolveStyle() {
    final base = TextStyle(
      fontSize: fontSize,
      fontWeight: fontWeight,
      color: color,
      height: lineHeight,
    );
    switch (fontFamily) {
      case "Roboto":
        return GoogleFonts.roboto(textStyle: base);
      case "Open Sans":
        return GoogleFonts.openSans(textStyle: base);
      case "Lato":
        return GoogleFonts.lato(textStyle: base);
      case "Nunito":
        return GoogleFonts.nunito(textStyle: base);
      case "Montserrat":
        return GoogleFonts.montserrat(textStyle: base);
      case "system":
      default:
        return base;
    }
  }

  static FontWeight _parseWeight(dynamic v) {
    if (v == null) return FontWeight.w400;
    final n = v is num ? v.toInt() : int.tryParse(v.toString()) ?? 400;
    return FontWeight.values.firstWhere(
      (w) => w.value == n,
      orElse: () => FontWeight.w400,
    );
  }

  static Color? _parseColor(dynamic v) {
    if (v is! String || v.isEmpty) return null;
    var s = v.trim();
    if (s.startsWith("#")) s = s.substring(1);
    if (s.length == 6) s = "FF$s";
    if (s.length != 8) return null;
    final n = int.tryParse(s, radix: 16);
    if (n == null) return null;
    return Color(n);
  }

  static TextAlign _parseAlign(dynamic v) {
    switch (v) {
      case "center":
        return TextAlign.center;
      case "right":
        return TextAlign.right;
      default:
        return TextAlign.left;
    }
  }
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
    super.h,
    super.locked,
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
        h: ContentElement._pct(json["h"]),
        locked: json["locked"] == true,
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

/// Resolve preset de som → asset path (ou null se none).
String? clickSoundAsset(String? clickSound) {
  if (clickSound == null || clickSound.isEmpty || clickSound == "none") return null;
  const presets = {
    "click": "assets/sounds/click.wav",
    "pop": "assets/sounds/pop.wav",
    "beep": "assets/sounds/beep.wav",
  };
  if (presets.containsKey(clickSound)) return presets[clickSound];
  if (clickSound.startsWith("assets/")) return clickSound;
  return null;
}
