export type NavigateAction = { type: "navigate"; target: string };
export type OpenUrlAction = { type: "openUrl"; target: string };
export type ButtonAction = NavigateAction | OpenUrlAction;

/** Layout opcional em % do canvas do celular (0–100). Sem x/y = empilhar (auto). */
export type ElementLayout = {
  x?: number;
  y?: number;
  w?: number;
};

export type ButtonElement = {
  id: string;
  type: "button";
  label: string;
  action: ButtonAction;
} & ElementLayout;

export type VideoElement = {
  id: string;
  type: "video";
  url: string;
  title?: string;
} & ElementLayout;

export type ChecklistItem = { id: string; label: string };

export type ChecklistElement = {
  id: string;
  type: "checklist";
  title: string;
  items: ChecklistItem[];
} & ElementLayout;

export type TextElement = {
  id: string;
  type: "text";
  content: string;
} & ElementLayout;

export type ImageFit = "cover" | "contain";
export type ImageRole = "logo" | "icon" | "photo";

export type ImageElement = {
  id: string;
  type: "image";
  src: string;
  alt?: string;
  fit?: ImageFit;
  width?: number;
  height?: number;
  role?: ImageRole;
} & ElementLayout;

export type ContentElement =
  | ButtonElement
  | VideoElement
  | ChecklistElement
  | TextElement
  | ImageElement;

export type Screen = {
  id: string;
  title: string;
  /** URL http(s) ou caminho /media/... */
  backgroundImage?: string;
  elements: ContentElement[];
};

export type AppContent = {
  version: number;
  disclaimer: string;
  homeScreenId: string;
  screens: Screen[];
};

/** Atalhos de ícone (emoji) — src no formato emoji:XXX */
export const ICON_PRESETS: { label: string; emoji: string }[] = [
  { label: "Ambulância", emoji: "🚑" },
  { label: "Hospital", emoji: "🏥" },
  { label: "Coração", emoji: "❤️" },
  { label: "Estetoscópio", emoji: "🩺" },
  { label: "Medicina", emoji: "⚕️" },
  { label: "Alerta", emoji: "⚠️" },
  { label: "Checklist", emoji: "📋" },
  { label: "OK", emoji: "✅" },
  { label: "Estrela", emoji: "⭐" },
  { label: "Telefone", emoji: "📱" },
];

export const TOOL_TYPES: { type: ContentElement["type"]; label: string; icon: string }[] = [
  { type: "button", label: "Botão", icon: "🔘" },
  { type: "image", label: "Imagem", icon: "🖼️" },
  { type: "video", label: "Vídeo", icon: "▶️" },
  { type: "checklist", label: "Checklist", icon: "☑️" },
  { type: "text", label: "Texto", icon: "🔤" },
];

export function emojiSrc(emoji: string): string {
  return "emoji:" + emoji;
}

export function isEmojiSrc(src: string): boolean {
  return src.startsWith("emoji:");
}

export function emojiFromSrc(src: string): string {
  return src.startsWith("emoji:") ? src.slice(6) : "";
}

/** Resolve caminho de mídia para uso na UI do editor (preview). */
export function resolveMediaSrc(src: string): string {
  if (!src) return "";
  if (isEmojiSrc(src)) return src;
  if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:")) {
    return src;
  }
  if (src.startsWith("/media/")) return src;
  if (src.startsWith("media/")) return "/" + src;
  return src;
}

export function hasLayout(el: ElementLayout): boolean {
  return typeof el.x === "number" && typeof el.y === "number";
}

export function defaultWidthFor(type: ContentElement["type"]): number {
  if (type === "image") return 50;
  if (type === "text") return 70;
  return 80;
}

export function createElementOfType(
  type: ContentElement["type"],
  layout?: ElementLayout
): ContentElement {
  const pos: ElementLayout = {
    x: layout?.x,
    y: layout?.y,
    w: layout?.w ?? defaultWidthFor(type),
  };
  if (type === "button") {
    return { id: uid("btn"), type, label: "Botão", action: { type: "navigate", target: "" }, ...pos };
  }
  if (type === "video") {
    return { id: uid("vid"), type, url: "", title: "Vídeo", ...pos };
  }
  if (type === "checklist") {
    return { id: uid("chk"), type, title: "Checklist", items: [{ id: uid("item"), label: "Item" }], ...pos };
  }
  if (type === "image") {
    return {
      id: uid("img"),
      type: "image",
      src: "",
      alt: "",
      fit: "contain",
      role: "photo",
      ...pos,
    };
  }
  return { id: uid("txt"), type: "text", content: "Texto", ...pos };
}

export function createEmptyContent(): AppContent {
  return {
    version: 1,
    disclaimer: "Conteúdo educacional da LAUEM. Não substitui protocolos clínicos oficiais.",
    homeScreenId: "home",
    screens: [{ id: "home", title: "Início", elements: [] }],
  };
}

export function uid(prefix = "id"): string {
  return prefix + "_" + Math.random().toString(36).slice(2, 9);
}

/** Clamp layout % */
export function clampPct(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(n * 10) / 10));
}
