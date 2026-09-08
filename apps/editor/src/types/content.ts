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

export type ContentElement =
  | ButtonElement
  | VideoElement
  | ChecklistElement
  | TextElement;

export type Screen = {
  id: string;
  title: string;
  elements: ContentElement[];
};

export type AppContent = {
  version: number;
  disclaimer: string;
  homeScreenId: string;
  screens: Screen[];
};

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
