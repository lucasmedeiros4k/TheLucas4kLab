import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchDraft, publishDraft, saveDraft } from "./api/contentApi";
import type {
  AppContent,
  ContentElement,
  Screen,
} from "./types/content";
import { createEmptyContent, uid } from "./types/content";
import { ScreenList } from "./components/ScreenList";
import { Canvas } from "./components/Canvas";
import { Inspector } from "./components/Inspector";
import { PreviewMode } from "./components/PreviewMode";

export default function App() {
  const [content, setContent] = useState<AppContent | null>(null);
  const [selectedScreenId, setSelectedScreenId] = useState<string>("home");
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const [status, setStatus] = useState("Carregando...");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchDraft()
      .then((data) => {
        setContent(data);
        setSelectedScreenId(data.homeScreenId || data.screens[0]?.id || "home");
        setStatus("Rascunho carregado");
      })
      .catch(() => {
        const empty = createEmptyContent();
        setContent(empty);
        setStatus("Novo rascunho local");
      });
  }, []);

  const selectedScreen = useMemo(() => {
    return content?.screens.find((s) => s.id === selectedScreenId) ?? null;
  }, [content, selectedScreenId]);

  const selectedElement = useMemo(() => {
    return selectedScreen?.elements.find((e) => e.id === selectedElementId) ?? null;
  }, [selectedScreen, selectedElementId]);

  const updateContent = useCallback((updater: (prev: AppContent) => AppContent) => {
    setContent((prev) => (prev ? updater(prev) : prev));
  }, []);

  const addScreen = () => {
    const id = uid("tela");
    const screen: Screen = { id, title: "Nova tela", elements: [] };
    updateContent((prev) => ({ ...prev, screens: [...prev.screens, screen] }));
    setSelectedScreenId(id);
    setSelectedElementId(null);
  };

  const renameScreen = (id: string, title: string) => {
    updateContent((prev) => ({
      ...prev,
      screens: prev.screens.map((s) => (s.id === id ? { ...s, title } : s)),
    }));
  };

  const updateScreen = (patch: Partial<Screen>) => {
    if (!selectedScreen) return;
    updateContent((prev) => ({
      ...prev,
      screens: prev.screens.map((s) =>
        s.id === selectedScreen.id ? { ...s, ...patch } : s
      ),
    }));
  };

  const removeScreen = (id: string) => {
    updateContent((prev) => {
      if (prev.screens.length <= 1) return prev;
      const screens = prev.screens.filter((s) => s.id !== id);
      const homeScreenId = prev.homeScreenId === id ? screens[0].id : prev.homeScreenId;
      return { ...prev, screens, homeScreenId };
    });
    if (selectedScreenId === id && content) {
      const next = content.screens.find((s) => s.id !== id);
      if (next) setSelectedScreenId(next.id);
    }
    setSelectedElementId(null);
  };

  const addElement = (type: ContentElement["type"]) => {
    if (!selectedScreen) return;
    let el: ContentElement;
    if (type === "button") {
      // Sem destino padrão — o usuário escolhe no inspetor
      el = { id: uid("btn"), type, label: "Botão", action: { type: "navigate", target: "" } };
    } else if (type === "video") {
      el = { id: uid("vid"), type, url: "", title: "Vídeo" };
    } else if (type === "checklist") {
      el = { id: uid("chk"), type, title: "Checklist", items: [{ id: uid("item"), label: "Item" }] };
    } else if (type === "image") {
      el = {
        id: uid("img"),
        type: "image",
        src: "",
        alt: "",
        fit: "contain",
        role: "photo",
      };
    } else {
      el = { id: uid("txt"), type, content: "Texto" };
    }
    updateContent((prev) => ({
      ...prev,
      screens: prev.screens.map((s) =>
        s.id === selectedScreen.id ? { ...s, elements: [...s.elements, el] } : s
      ),
    }));
    setSelectedElementId(el.id);
  };

  const updateElement = (element: ContentElement) => {
    if (!selectedScreen) return;
    updateContent((prev) => ({
      ...prev,
      screens: prev.screens.map((s) =>
        s.id === selectedScreen.id
          ? { ...s, elements: s.elements.map((e) => (e.id === element.id ? element : e)) }
          : s
      ),
    }));
  };

  const removeElement = (elementId: string) => {
    if (!selectedScreen) return;
    updateContent((prev) => ({
      ...prev,
      screens: prev.screens.map((s) =>
        s.id === selectedScreen.id
          ? { ...s, elements: s.elements.filter((e) => e.id !== elementId) }
          : s
      ),
    }));
    setSelectedElementId(null);
  };

  const onSave = async () => {
    if (!content) return;
    setBusy(true);
    try {
      await saveDraft(content);
      setStatus("Rascunho salvo em content/draft.json");
    } catch (e) {
      setStatus("Erro ao salvar: " + String(e));
    } finally {
      setBusy(false);
    }
  };

  const onPublish = async () => {
    if (!content) return;
    setBusy(true);
    try {
      await saveDraft(content);
      const result = await publishDraft();
      setStatus(result.message || "Publicado com sucesso");
    } catch (e) {
      setStatus("Erro ao publicar: " + String(e));
    } finally {
      setBusy(false);
    }
  };

  if (!content) {
    return <div className="app-shell"><div className="topbar"><div className="brand">LAUEM <span>Editor</span></div><div className="status">{status}</div></div></div>;
  }

  if (preview) {
    return (
      <div className="app-shell">
        <div className="topbar">
          <div className="brand">LAUEM <span>Preview</span></div>
          <div className="topbar-actions">
            <button className="btn" onClick={() => setPreview(false)}>Sair do preview</button>
          </div>
        </div>
        <PreviewMode content={content} />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="topbar">
        <div className="brand">LAUEM <span>Editor</span></div>
        <div className="status">{status}</div>
        <div className="topbar-actions">
          <button className="btn ghost" disabled={busy} onClick={() => setPreview(true)}>Preview</button>
          <button className="btn" disabled={busy} onClick={onSave}>Salvar rascunho</button>
          <button className="btn primary" disabled={busy} onClick={onPublish}>Publicar</button>
        </div>
      </div>
      <div className="layout">
        <aside className="panel">
          <ScreenList
            content={content}
            selectedScreenId={selectedScreenId}
            onSelect={(id) => { setSelectedScreenId(id); setSelectedElementId(null); }}
            onAdd={addScreen}
            onRemove={removeScreen}
            onSetHome={(id) => updateContent((prev) => ({ ...prev, homeScreenId: id }))}
            onDisclaimerChange={(disclaimer) => updateContent((prev) => ({ ...prev, disclaimer }))}
          />
        </aside>
        <main className="canvas-wrap">
          <Canvas
            screen={selectedScreen}
            selectedElementId={selectedElementId}
            onSelectElement={setSelectedElementId}
            onRenameScreen={(title) => selectedScreen && renameScreen(selectedScreen.id, title)}
            onUpdateScreen={updateScreen}
            onAddElement={addElement}
          />
        </main>
        <aside className="panel">
          <Inspector
            content={content}
            screen={selectedScreen}
            element={selectedElement}
            onChange={updateElement}
            onUpdateScreen={updateScreen}
            onRemove={() => selectedElement && removeElement(selectedElement.id)}
          />
        </aside>
      </div>
    </div>
  );
}
