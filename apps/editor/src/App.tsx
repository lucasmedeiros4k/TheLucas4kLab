import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchDraft, publishDraft, saveDraft } from "./api/contentApi";
import type {
  AppContent,
  ContentElement,
  Screen,
} from "./types/content";
import {
  clampPct,
  createElementOfType,
  createEmptyContent,
  duplicateElement,
  hasLayout,
  uid,
} from "./types/content";
import { ScreenList } from "./components/ScreenList";
import { Canvas } from "./components/Canvas";
import { Inspector } from "./components/Inspector";

/** Se não aparecer no topo, o Pull não aplicou. */
const EDITOR_BUILD = "dpad-resize-v2";
import { PreviewMode } from "./components/PreviewMode";
import { Toolbox } from "./components/Toolbox";

export default function App() {
  const [content, setContent] = useState<AppContent | null>(null);
  const [selectedScreenId, setSelectedScreenId] = useState<string>("home");
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const [status, setStatus] = useState("Carregando...");
  const [busy, setBusy] = useState(false);
  const [nudgeStep, setNudgeStep] = useState(1);
  const [showGrid, setShowGrid] = useState(false);

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

  const mapSelectedElements = useCallback(
    (mapper: (els: ContentElement[]) => ContentElement[]) => {
      if (!selectedScreen) return;
      updateContent((prev) => ({
        ...prev,
        screens: prev.screens.map((s) =>
          s.id === selectedScreen.id ? { ...s, elements: mapper(s.elements) } : s
        ),
      }));
    },
    [selectedScreen, updateContent]
  );

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

  const addElement = (type: ContentElement["type"]) => {
    const count = selectedScreen?.elements.length ?? 0;
    const el = createElementOfType(type, {
      x: 10,
      y: clampPct(12 + count * 14, 5, 80),
    });
    insertElement(el);
  };

  const dropTool = (type: ContentElement["type"], x: number, y: number) => {
    const el = createElementOfType(type, { x, y });
    insertElement(el);
  };

  const moveElement = (id: string, x: number, y: number) => {
    mapSelectedElements((els) =>
      els.map((e) => {
        if (e.id !== id || e.locked) return e;
        return { ...e, x, y, w: e.w ?? 80 };
      })
    );
  };

  const resizeElement = (
    id: string,
    w: number,
    h: number | undefined,
    x?: number,
    y?: number
  ) => {
    mapSelectedElements((els) =>
      els.map((e) => {
        if (e.id !== id || e.locked) return e;
        return {
          ...e,
          w: clampPct(w, 8, 100),
          h: h != null ? clampPct(h, 5, 100) : e.h,
          x: x != null ? clampPct(x, 0, 95) : e.x,
          y: y != null ? clampPct(y, 0, 95) : e.y,
        };
      })
    );
  };

  const updateElement = (element: ContentElement) => {
    mapSelectedElements((els) => els.map((e) => (e.id === element.id ? element : e)));
  };

  const removeElement = (elementId: string) => {
    mapSelectedElements((els) => els.filter((e) => e.id !== elementId));
    setSelectedElementId(null);
  };

  const nudgeSelected = useCallback(
    (dx: number, dy: number) => {
      if (!selectedElementId) return;
      mapSelectedElements((els) =>
        els.map((e) => {
          if (e.id !== selectedElementId || e.locked) return e;
          const x0 = e.x ?? 10;
          const y0 = e.y ?? 10;
          return {
            ...e,
            x: clampPct(x0 + dx, 0, 92),
            y: clampPct(y0 + dy, 0, 92),
            w: e.w ?? 80,
          };
        })
      );
    },
    [selectedElementId, mapSelectedElements]
  );

  const duplicateSelected = () => {
    if (!selectedElement) return;
    const copy = duplicateElement(selectedElement);
    insertElement(copy);
  };

  const bringForward = () => {
    if (!selectedElementId) return;
    mapSelectedElements((els) => {
      const i = els.findIndex((e) => e.id === selectedElementId);
      if (i < 0 || i >= els.length - 1) return els;
      const next = [...els];
      [next[i], next[i + 1]] = [next[i + 1], next[i]];
      return next;
    });
  };

  const sendBackward = () => {
    if (!selectedElementId) return;
    mapSelectedElements((els) => {
      const i = els.findIndex((e) => e.id === selectedElementId);
      if (i <= 0) return els;
      const next = [...els];
      [next[i - 1], next[i]] = [next[i], next[i - 1]];
      return next;
    });
  };

  const alignSelected = (
    where: "left" | "center" | "right" | "top" | "middle" | "bottom"
  ) => {
    if (!selectedElement || selectedElement.locked) return;
    const w = selectedElement.w ?? 80;
    const h = selectedElement.h ?? 20;
    let x = selectedElement.x ?? 10;
    let y = selectedElement.y ?? 10;
    if (where === "left") x = 2;
    if (where === "center") x = clampPct((100 - w) / 2, 0, 92);
    if (where === "right") x = clampPct(100 - w - 2, 0, 92);
    if (where === "top") y = 2;
    if (where === "middle") y = clampPct((100 - h) / 2, 0, 92);
    if (where === "bottom") y = clampPct(100 - h - 2, 0, 92);
    // Garante layout abs se ainda empilhado
    if (!hasLayout(selectedElement)) {
      updateElement({ ...selectedElement, x, y, w });
    } else {
      updateElement({ ...selectedElement, x, y });
    }
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
          <div className="status">{status} · build <strong>{EDITOR_BUILD}</strong></div>
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
        <div className="status">{status} · build <strong>{EDITOR_BUILD}</strong></div>
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
            onResizeElement={resizeElement}
            onNudge={nudgeSelected}
            nudgeStep={nudgeStep}
            showGrid={showGrid}
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
              onDuplicate={duplicateSelected}
              onBringForward={bringForward}
              onSendBackward={sendBackward}
              onAlign={alignSelected}
              onNudge={nudgeSelected}
              nudgeStep={nudgeStep}
              onNudgeStepChange={setNudgeStep}
              showGrid={showGrid}
              onShowGridChange={setShowGrid}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
