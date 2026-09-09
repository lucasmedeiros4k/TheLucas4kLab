import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { ContentElement, Screen } from "../types/content";
import {
  clampPct,
  hasLayout,
  isEmojiSrc,
  normalizeOpacity,
  resolveMediaSrc,
} from "../types/content";
import { ElementVisual } from "./ElementVisual";
import { LAUEM_TOOL_MIME } from "./Toolbox";

type Props = {
  screen: Screen | null;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onRenameScreen: (title: string) => void;
  onDropTool: (type: ContentElement["type"], x: number, y: number) => void;
  onMoveElement: (id: string, x: number, y: number) => void;
  onResizeElement: (id: string, w: number, h: number | undefined, x?: number, y?: number) => void;
  onNudge: (dx: number, dy: number) => void;
  nudgeStep: number;
  showGrid: boolean;
};

type MoveDrag = {
  kind: "move";
  id: string;
  grabX: number;
  grabY: number;
};

type ResizeDrag = {
  kind: "resize";
  id: string;
  /** corner se | se ne | nw | e | s | w | n */
  edge: string;
  startX: number;
  startY: number;
  startW: number;
  startH: number;
  origX: number;
  origY: number;
  stageW: number;
  stageH: number;
};

type ActiveDrag = MoveDrag | ResizeDrag;

const MIN_W = 8;
const MIN_H = 5;
const MAX_WH = 100;

export function Canvas({
  screen,
  selectedElementId,
  onSelectElement,
  onRenameScreen,
  onDropTool,
  onMoveElement,
  onResizeElement,
  onNudge,
  nudgeStep,
  showGrid,
}: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const dragRef = useRef<ActiveDrag | null>(null);
  const [, setDragging] = useState(false);

  // Setas do teclado: move o selecionado
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!selectedElementId || !screen) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }
      const el = screen.elements.find((x) => x.id === selectedElementId);
      if (!el || el.locked) return;
      if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) return;
      e.preventDefault();
      const step = e.shiftKey ? nudgeStep * 5 : nudgeStep;
      if (e.key === "ArrowUp") onNudge(0, -step);
      if (e.key === "ArrowDown") onNudge(0, step);
      if (e.key === "ArrowLeft") onNudge(-step, 0);
      if (e.key === "ArrowRight") onNudge(step, 0);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedElementId, screen, nudgeStep, onNudge]);

  if (!screen) {
    return <div className="empty">Selecione ou crie uma tela à esquerda.</div>;
  }

  const bgUrl = screen.backgroundImage ? resolveMediaSrc(screen.backgroundImage) : "";
  const bgOpacity = normalizeOpacity(screen.backgroundOpacity);
  const bgLayerStyle: CSSProperties | undefined =
    bgUrl && !isEmojiSrc(bgUrl)
      ? {
          backgroundImage: `url(${JSON.stringify(bgUrl)})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: bgOpacity,
        }
      : undefined;

  const pctFromClient = (clientX: number, clientY: number, grabX = 0, grabY = 0) => {
    const el = stageRef.current;
    if (!el) return { x: 10, y: 10 };
    const rect = el.getBoundingClientRect();
    const x = ((clientX - rect.left - grabX) / rect.width) * 100;
    const y = ((clientY - rect.top - grabY) / rect.height) * 100;
    return { x: clampPct(x, 0, 92), y: clampPct(y, 0, 92) };
  };

  const onDragOver = (e: React.DragEvent) => {
    if (
      [...e.dataTransfer.types].includes(LAUEM_TOOL_MIME) ||
      [...e.dataTransfer.types].includes("text/plain")
    ) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      setDragOver(true);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const { x, y } = pctFromClient(e.clientX, e.clientY);
    const plain = e.dataTransfer.getData("text/plain") || "";
    const tool =
      e.dataTransfer.getData(LAUEM_TOOL_MIME) ||
      (plain.startsWith("lauem-tool:") ? plain.slice("lauem-tool:".length) : plain);
    if (
      tool === "button" ||
      tool === "image" ||
      tool === "video" ||
      tool === "checklist" ||
      tool === "text"
    ) {
      onDropTool(tool, x, y);
    }
  };

  const beginMove = (e: ReactPointerEvent<HTMLDivElement>, elId: string) => {
    if (e.button !== 0) return;
    const targetEl = screen.elements.find((x) => x.id === elId);
    if (targetEl?.locked) {
      e.stopPropagation();
      onSelectElement(elId);
      return;
    }
    e.stopPropagation();
    e.preventDefault();
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    dragRef.current = {
      kind: "move",
      id: elId,
      grabX: e.clientX - rect.left,
      grabY: e.clientY - rect.top,
    };
    setDragging(true);
    onSelectElement(elId);
    target.setPointerCapture(e.pointerId);
  };

  const beginResize = (
    e: ReactPointerEvent<HTMLDivElement>,
    elId: string,
    edge: string
  ) => {
    if (e.button !== 0) return;
    const targetEl = screen.elements.find((x) => x.id === elId);
    if (!targetEl || targetEl.locked || !hasLayout(targetEl)) return;
    e.stopPropagation();
    e.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const srect = stage.getBoundingClientRect();
    dragRef.current = {
      kind: "resize",
      id: elId,
      edge,
      startX: e.clientX,
      startY: e.clientY,
      startW: targetEl.w ?? 80,
      startH: targetEl.h ?? 20,
      origX: targetEl.x ?? 0,
      origY: targetEl.y ?? 0,
      stageW: srect.width,
      stageH: srect.height,
    };
    setDragging(true);
    onSelectElement(elId);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;

    if (drag.kind === "move") {
      if (drag.id !== e.currentTarget.dataset.elId) return;
      const { x, y } = pctFromClient(e.clientX, e.clientY, drag.grabX, drag.grabY);
      onMoveElement(drag.id, x, y);
      return;
    }

    // resize — handled on stage-level move via window? Use element capture on handle
    const dxPct = ((e.clientX - drag.startX) / drag.stageW) * 100;
    const dyPct = ((e.clientY - drag.startY) / drag.stageH) * 100;
    let { startW: w, startH: h, origX: x, origY: y } = drag;
    const edge = drag.edge;

    if (edge.includes("e")) w = clampPct(drag.startW + dxPct, MIN_W, MAX_WH);
    if (edge.includes("s")) h = clampPct(drag.startH + dyPct, MIN_H, MAX_WH);
    if (edge.includes("w")) {
      const nw = clampPct(drag.startW - dxPct, MIN_W, MAX_WH);
      x = clampPct(drag.origX + (drag.startW - nw), 0, 95);
      w = nw;
    }
    if (edge.includes("n")) {
      const nh = clampPct(drag.startH - dyPct, MIN_H, MAX_WH);
      y = clampPct(drag.origY + (drag.startH - nh), 0, 95);
      h = nh;
    }
    onResizeElement(drag.id, w, h, x, y);
  };

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    dragRef.current = null;
    setDragging(false);
  };

  // Resize handles need move even when pointer leaves the handle — listen on window while resizing
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.kind !== "resize") return;
      const dxPct = ((e.clientX - drag.startX) / drag.stageW) * 100;
      const dyPct = ((e.clientY - drag.startY) / drag.stageH) * 100;
      let { startW: w, startH: h, origX: x, origY: y } = drag;
      const edge = drag.edge;
      if (edge.includes("e")) w = clampPct(drag.startW + dxPct, MIN_W, MAX_WH);
      if (edge.includes("s")) h = clampPct(drag.startH + dyPct, MIN_H, MAX_WH);
      if (edge.includes("w")) {
        const nw = clampPct(drag.startW - dxPct, MIN_W, MAX_WH);
        x = clampPct(drag.origX + (drag.startW - nw), 0, 95);
        w = nw;
      }
      if (edge.includes("n")) {
        const nh = clampPct(drag.startH - dyPct, MIN_H, MAX_WH);
        y = clampPct(drag.origY + (drag.startH - nh), 0, 95);
        h = nh;
      }
      onResizeElement(drag.id, w, h, x, y);
    };
    const onUp = () => {
      if (dragRef.current?.kind === "resize") {
        dragRef.current = null;
        setDragging(false);
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [onResizeElement]);

  const flowEls = screen.elements.filter((el) => !hasLayout(el));
  const absEls = screen.elements.filter((el) => hasLayout(el));

  const renderHandles = (el: ContentElement) => {
    if (el.id !== selectedElementId || el.locked) return null;
    const edges = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];
    return edges.map((edge) => (
      <div
        key={edge}
        className={`resize-handle rh-${edge}`}
        data-edge={edge}
        onPointerDown={(ev) => beginResize(ev, el.id, edge)}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      />
    ));
  };

  const renderEl = (el: ContentElement, abs: boolean, zIndex: number) => (
    <div
      key={el.id}
      data-el-id={el.id}
      className={
        "phone-el" +
        (abs ? " abs" : "") +
        (el.id === selectedElementId ? " selected" : "") +
        (el.locked ? " locked" : "")
      }
      style={
        abs
          ? {
              left: `${el.x}%`,
              top: `${el.y}%`,
              width: el.w != null ? `${el.w}%` : undefined,
              height: el.h != null ? `${el.h}%` : undefined,
              touchAction: "none",
              zIndex: 2 + zIndex,
              overflow: el.h != null ? "hidden" : undefined,
            }
          : { touchAction: "none" }
      }
      onClick={(ev) => {
        ev.stopPropagation();
        onSelectElement(el.id);
      }}
      onPointerDown={(ev) => beginMove(ev, el.id)}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <ElementVisual el={el} />
      {abs && renderHandles(el)}
      {el.locked && el.id === selectedElementId && (
        <span className="lock-badge" title="Travado">🔒</span>
      )}
    </div>
  );

  const stepSmall = nudgeStep;
  const stepLarge = nudgeStep * 5;

  return (
    <div className="phone-workspace">
      <div className="phone-meta">
        <input
          className="phone-title-input"
          value={screen.title}
          onChange={(e) => onRenameScreen(e.target.value)}
          aria-label="Nome da tela"
        />
        <span className="muted phone-meta-hint">
          Arraste · setas · Shift = passo maior
        </span>
      </div>

      <div className="phone-with-dpad">
        <div className="phone-bezel">
          <div className="phone-notch" aria-hidden />
          <div
            ref={stageRef}
            className={
              "phone-stage" +
              (bgUrl ? " has-bg" : "") +
              (dragOver ? " drag-over" : "") +
              (screen.elements.length === 0 ? " is-empty" : "") +
              (showGrid ? " show-grid" : "")
            }
            onClick={() => onSelectElement(null)}
            onDragOver={onDragOver}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
          >
            {bgLayerStyle && <div className="phone-bg-layer" style={bgLayerStyle} aria-hidden />}
            {bgUrl && !isEmojiSrc(bgUrl) && <div className="phone-bg-scrim" aria-hidden />}
            {showGrid && <div className="phone-grid" aria-hidden />}

            {screen.elements.length === 0 && (
              <div className="phone-empty-hint">
                Celular vazio
                <br />
                <span>Arraste um botão, imagem ou texto para cá</span>
              </div>
            )}

            <div className="phone-flow">{flowEls.map((el, i) => renderEl(el, false, i))}</div>
            {absEls.map((el, i) => renderEl(el, true, flowEls.length + i))}
          </div>
          <div className="phone-home-bar" aria-hidden />
        </div>

        <div className="dpad" role="group" aria-label="Mover elemento">
          <button
            type="button"
            className="dpad-btn dpad-up"
            title={`Cima (${stepSmall}%, Shift ${stepLarge}%)`}
            disabled={!selectedElementId}
            onClick={(e) => onNudge(0, e.shiftKey ? -stepLarge : -stepSmall)}
          >
            ▲
          </button>
          <button
            type="button"
            className="dpad-btn dpad-left"
            title="Esquerda"
            disabled={!selectedElementId}
            onClick={(e) => onNudge(e.shiftKey ? -stepLarge : -stepSmall, 0)}
          >
            ◀
          </button>
          <button
            type="button"
            className="dpad-btn dpad-center"
            title="Centro (só visual)"
            disabled={!selectedElementId}
            onClick={() => {
              /* noop — centro é referência visual da cruz */
            }}
          >
            ✕
          </button>
          <button
            type="button"
            className="dpad-btn dpad-right"
            title="Direita"
            disabled={!selectedElementId}
            onClick={(e) => onNudge(e.shiftKey ? stepLarge : stepSmall, 0)}
          >
            ▶
          </button>
          <button
            type="button"
            className="dpad-btn dpad-down"
            title="Baixo"
            disabled={!selectedElementId}
            onClick={(e) => onNudge(0, e.shiftKey ? stepLarge : stepSmall)}
          >
            ▼
          </button>
        </div>
      </div>
    </div>
  );
}
