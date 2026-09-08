export type NavigateAction = { type: "navigate"; target: string };
export type OpenUrlAction = { type: "openUrl"; target: string };
export type ButtonAction = NavigateAction | OpenUrlAction;

export type ButtonElement = {
  id: string;
  type: "button";
  label: string;
  action: ButtonAction;
};

export type VideoElement = {
  id: string;
  type: "video";
  url: string;
  title?: string;
};

export type ChecklistItem = { id: string; label: string };

export type ChecklistElement = {
  id: string;
  type: "checklist";
  title: string;
  items: ChecklistItem[];
};

export type TextElement = {
  id: string;
  type: "text";
  content: string;
};

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
};

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
