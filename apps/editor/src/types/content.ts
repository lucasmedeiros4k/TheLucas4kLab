export type NavigateAction = { type: "navigate"; target: string };
export type OpenUrlAction = { type: "openUrl"; target: string };
export type ButtonAction = NavigateAction | OpenUrlAction;

/** Layout opcional em % do canvas do celular (0–100). Sem x/y = empilhar (auto). */
export type ElementLayout = {
  x?: number;
  y?: number;
  w?: number;
  /** Altura em % do canvas. Ausente = altura do conteúdo. */
  h?: number;
  /** Trava posição/tamanho no canvas (arrasto/resize). */
  locked?: boolean;
};

/** Presets de som do botão (assets no Flutter). */
export type ClickSoundId = "none" | "click" | "pop" | "beep";

export const CLICK_SOUND_OPTIONS: { id: ClickSoundId; label: string }[] = [
  { id: "none", label: "Nenhum" },
  { id: "click", label: "Clique" },
  { id: "pop", label: "Pop" },
  { id: "beep", label: "Beep" },
];

/** Forma do botão → borderRadius em px (pill ≈ 999). */
export type ButtonShapeId = "retangulo" | "arredondado" | "pill";

export const BUTTON_SHAPE_OPTIONS: { id: ButtonShapeId; label: string; radius: number }[] = [
  { id: "retangulo", label: "Retângulo", radius: 4 },
  { id: "arredondado", label: "Arredondado", radius: 12 },
  { id: "pill", label: "Pill", radius: 999 },
];

export const BUTTON_STYLE_DEFAULTS = {
  bgColor: "#38bdf8",
  textColor: "#0f172a",
  fontFamily: "system" as const,
  fontSize: 16,
  fontWeight: 600,
  borderRadius: 12,
  opacity: 1,
  borderColor: undefined as string | undefined,
  borderWidth: 0,
  paddingY: 12,
};

export type ButtonElement = {
  id: string;
  type: "button";
  label: string;
  action: ButtonAction;
  /** Som ao tocar no app publicado (none/click/pop/beep). Preferências do usuário ficam no app. */
  clickSound?: ClickSoundId | string;
  /** Cor de fundo (hex). Default #38bdf8. */
  bgColor?: string;
  /** Cor do texto (hex). */
  textColor?: string;
  fontFamily?: FontFamilyId | string;
  fontSize?: number;
  fontWeight?: number;
  /** Raio em px (4 = retângulo, 12 = arredondado, 999 = pill). */
  borderRadius?: number;
  /** Opacidade 0–1. */
  opacity?: number;
  borderColor?: string;
  borderWidth?: number;
  /** Padding vertical em px. */
  paddingY?: number;
} & ElementLayout;

export function buttonShapeFromRadius(r?: number): ButtonShapeId {
  if (r == null) return "arredondado";
  if (r >= 100) return "pill";
  if (r <= 6) return "retangulo";
  return "arredondado";
}

export function radiusForShape(shape: ButtonShapeId): number {
  return BUTTON_SHAPE_OPTIONS.find((o) => o.id === shape)?.radius ?? 12;
}

/** Resolve estilos do botão com defaults (rascunhos antigos). */
export function resolveButtonStyle(el: ButtonElement) {
  const d = BUTTON_STYLE_DEFAULTS;
  return {
    bgColor: el.bgColor || d.bgColor,
    textColor: el.textColor || d.textColor,
    fontFamily: el.fontFamily || d.fontFamily,
    fontSize: el.fontSize ?? d.fontSize,
    fontWeight: el.fontWeight ?? d.fontWeight,
    borderRadius: el.borderRadius ?? d.borderRadius,
    opacity: normalizeOpacity(el.opacity ?? d.opacity),
    borderColor: el.borderColor,
    borderWidth: el.borderWidth ?? d.borderWidth,
    paddingY: el.paddingY ?? d.paddingY,
  };
}

/** Templates clínicos de 1 toque (Primário / Alerta / Secundário). */
export type ButtonTemplateId = "primario" | "alerta" | "secundario";

export type ButtonStylePatch = {
  bgColor: string;
  textColor: string;
  borderRadius: number;
  borderWidth: number;
  borderColor?: string;
  opacity: number;
  fontWeight: number;
  fontSize: number;
  paddingY: number;
};

export const BUTTON_TEMPLATES: {
  id: ButtonTemplateId;
  label: string;
  hint: string;
  patch: ButtonStylePatch;
}[] = [
  {
    id: "primario",
    label: "Primário",
    hint: "Ação principal — azul/verde clínico",
    patch: {
      bgColor: "#0d9488",
      textColor: "#ffffff",
      borderRadius: 12,
      borderWidth: 0,
      opacity: 1,
      fontWeight: 600,
      fontSize: 16,
      paddingY: 12,
    },
  },
  {
    id: "alerta",
    label: "Alerta",
    hint: "Urgência — vermelho/âmbar",
    patch: {
      bgColor: "#dc2626",
      textColor: "#ffffff",
      borderRadius: 12,
      borderWidth: 2,
      borderColor: "#f59e0b",
      opacity: 1,
      fontWeight: 700,
      fontSize: 16,
      paddingY: 12,
    },
  },
  {
    id: "secundario",
    label: "Secundário",
    hint: "Outline — secundário",
    patch: {
      bgColor: "#0f172a",
      textColor: "#7dd3fc",
      borderRadius: 12,
      borderWidth: 2,
      borderColor: "#38bdf8",
      opacity: 1,
      fontWeight: 600,
      fontSize: 16,
      paddingY: 12,
    },
  },
];

function hexToRgb(hex: string): [number, number, number] | null {
  let s = hex.trim();
  if (s.startsWith("#")) s = s.slice(1);
  if (s.length === 3) s = s.split("").map((c) => c + c).join("");
  if (s.length !== 6) return null;
  const n = Number.parseInt(s, 16);
  if (Number.isNaN(n)) return null;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0.5;
  const lin = (c: number) => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  };
  const [r, g, b] = rgb.map(lin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Razão de contraste WCAG (bg vs texto). */
export function buttonContrastRatio(bg: string, fg: string): number {
  const L1 = relativeLuminance(bg);
  const L2 = relativeLuminance(fg);
  const light = Math.max(L1, L2);
  const dark = Math.min(L1, L2);
  return (light + 0.05) / (dark + 0.05);
}

/** true se contraste < 4.5:1 (aviso amigável no inspetor). */
export function buttonContrastWarn(bg: string, fg: string): boolean {
  return buttonContrastRatio(bg, fg) < 4.5;
}

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

/** Fontes livres (system + Google Fonts). Sem fontes licenciadas Microsoft. */
export type FontFamilyId = "system" | "Roboto" | "Open Sans" | "Lato" | "Nunito" | "Montserrat";

export const FONT_FAMILY_OPTIONS: { id: FontFamilyId; label: string; css: string }[] = [
  { id: "system", label: "Sistema", css: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif" },
  { id: "Roboto", label: "Roboto", css: "Roboto, sans-serif" },
  { id: "Open Sans", label: "Open Sans", css: "'Open Sans', sans-serif" },
  { id: "Lato", label: "Lato", css: "Lato, sans-serif" },
  { id: "Nunito", label: "Nunito", css: "Nunito, sans-serif" },
  { id: "Montserrat", label: "Montserrat", css: "Montserrat, sans-serif" },
];

export type TextAlignId = "left" | "center" | "right";

export type TextElement = {
  id: string;
  type: "text";
  content: string;
  fontFamily?: FontFamilyId | string;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  textAlign?: TextAlignId;
  lineHeight?: number;
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
  /**
   * Opacidade da imagem de fundo (0–1). Ausente = 1.
   * No editor o slider mostra 0–100%.
   */
  backgroundOpacity?: number;
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

/** Altura padrão opcional (%). Imagem ganha h; outros ficam auto até o usuário definir. */
export function defaultHeightFor(type: ContentElement["type"]): number | undefined {
  if (type === "image") return 25;
  if (type === "button") return 8;
  return undefined;
}

/** Normaliza opacidade 0–1 (aceita legado 0–100). Default 1. */
export function normalizeOpacity(v: number | undefined | null): number {
  if (v == null || Number.isNaN(Number(v))) return 1;
  let n = Number(v);
  if (n > 1) n = n / 100;
  return Math.max(0, Math.min(1, n));
}

export function fontCss(family?: string): string {
  const found = FONT_FAMILY_OPTIONS.find((f) => f.id === family);
  return found?.css ?? FONT_FAMILY_OPTIONS[0].css;
}

export function createElementOfType(
  type: ContentElement["type"],
  layout?: ElementLayout
): ContentElement {
  const pos: ElementLayout = {
    x: layout?.x,
    y: layout?.y,
    w: layout?.w ?? defaultWidthFor(type),
    h: layout?.h ?? defaultHeightFor(type),
    locked: layout?.locked,
  };
  if (type === "button") {
    const d = BUTTON_STYLE_DEFAULTS;
    return {
      id: uid("btn"),
      type,
      label: "Botão",
      action: { type: "navigate", target: "" },
      clickSound: "none",
      bgColor: d.bgColor,
      textColor: d.textColor,
      fontFamily: d.fontFamily,
      fontSize: d.fontSize,
      fontWeight: d.fontWeight,
      borderRadius: d.borderRadius,
      opacity: d.opacity,
      borderWidth: d.borderWidth,
      paddingY: d.paddingY,
      ...pos,
    };
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
  return {
    id: uid("txt"),
    type: "text",
    content: "Texto",
    fontFamily: "system",
    fontSize: 16,
    fontWeight: 400,
    color: "#e2e8f0",
    textAlign: "left",
    lineHeight: 1.45,
    ...pos,
  };
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

/** Duplica elemento com novo id (itens de checklist também). */
export function duplicateElement(el: ContentElement): ContentElement {
  const base = { ...el, id: uid(el.type.slice(0, 3)) };
  if (base.type === "checklist") {
    return {
      ...base,
      items: base.items.map((it) => ({ ...it, id: uid("item") })),
    };
  }
  // offset leve pra não ficar em cima
  if (typeof base.x === "number") base.x = clampPct(base.x + 3, 0, 92);
  if (typeof base.y === "number") base.y = clampPct(base.y + 3, 0, 92);
  return base;
}
