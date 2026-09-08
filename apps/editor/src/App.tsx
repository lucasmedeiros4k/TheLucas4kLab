import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchDraft, publishDraft, saveDraft } from "./api/contentApi";
import type {
  AppContent,
  ContentElement,
  Screen,
} from "./types/content";
import { clampPct, createElementOfType, createEmptyContent, uid } from "./types/content";
import { ScreenList } from "./components/ScreenList";
import { Canvas } from "./components/Canvas";
import { Inspector } from "./components/Inspector";
import { PreviewMode } from "./components/PreviewMode";
import { Toolbox } from "./components/Toolbox";

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
    const n = (content?.screens.length ?? 0) + 1;
    const screen: Screen = { id, title: `Tela ${n}`, elements: [] };
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

  const insertElement = (el: ContentElement) => {
    if (!selectedScreen) return;
    updateContent((prev) => ({
      ...prev,
      screens: prev.screens.map((s) =>
        s.id === selectedScreen.id ? { ...s, elements: [...s.elements, el] } : s
      ),
    }));
    setSelectedElementId(el.id);
  };

  /** Clique na ferramenta: coloca no meio com layout */
  const addElement = (type: ContentElement["type"]) => {
    const count = selectedScreen?.elements.length ?? 0;
    const el = createElementOfType(type, {
      x: 10,
      y: clampPct(12 + count * 14, 5, 80),
    });
    insertElement(el);
  };

  /** Drop no celular: posição do ponteiro */
  const dropTool = (type: ContentElement["type"], x: number, y: number) => {
    const el = createElementOfType(type, { x, y });
    insertElement(el);
  };

  const moveElement = (id: string, x: number, y: number) => {
    if (!selectedScreen) return;
    updateContent((prev) => ({
      ...prev,
      screens: prev.screens.map((s) =>
        s.id === selectedScreen.id
          ? {
              ...s,
              elements: s.elements.map((e) =>
                e.id === id ? { ...e, x, y, w: e.w ?? 80 } : e
              ),
            }
          : s
      ),
    }));
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
    return (
      <div className="app-shell">
        <div className="topbar">
          <div className="brand">LAUEM <span>Editor</span></div>
          <div className="status">{status}</div>
        </div>
      </div>
    );
  }

  if (preview) {
    return (
      <div className="app-shell">
        <div className="topbar">
          <div className="brand">LAUEM <span>Preview</span></div>
          <div className="topbar-actions">
            <button className="btn" type="button" onClick={() => setPreview(false)}>
              Sair do preview
            </button>
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
          <button className="btn ghost" type="button" disabled={busy} onClick={() => setPreview(true)}>
            Preview
          </button>
          <button className="btn" type="button" disabled={busy} onClick={onSave}>
            Salvar rascunho
          </button>
          <button className="btn primary" type="button" disabled={busy} onClick={onPublish}>
            Publicar
          </button>
        </div>
      </div>
      <div className="layout">
        <aside className="panel panel-left">
          <ScreenList
            content={content}
            selectedScreenId={selectedScreenId}
            onSelect={(id) => {
              setSelectedScreenId(id);
              setSelectedElementId(null);
            }}
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
            onDropTool={dropTool}
            onMoveElement={moveElement}
          />
        </main>
        <aside className="panel panel-right">
          <Toolbox onAddClick={addElement} />
          <div className="inspector-block">
            <Inspector
              content={content}
              screen={selectedScreen}
              element={selectedElement}
              onChange={updateElement}
              onUpdateScreen={updateScreen}
              onRemove={() => selectedElement && removeElement(selectedElement.id)}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
