import { useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
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
};

type MoveDrag = {
  id: string;
  /** Offset do ponteiro dentro do elemento, em px */
  grabX: number;
  grabY: number;
};

export function Canvas({
  screen,
  selectedElementId,
  onSelectElement,
  onRenameScreen,
  onDropTool,
  onMoveElement,
}: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const moveRef = useRef<MoveDrag | null>(null);
  const [, setMovingId] = useState<string | null>(null);

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
    // Drop da toolbox: ancora no cursor (sem grab de elemento existente)
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
    // Só botão principal; não conflita com drop HTML5 da toolbox
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    moveRef.current = {
      id: elId,
      grabX: e.clientX - rect.left,
      grabY: e.clientY - rect.top,
    };
    setMovingId(elId);
    onSelectElement(elId);
    target.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = moveRef.current;
    if (!drag || drag.id !== e.currentTarget.dataset.elId) return;
    const { x, y } = pctFromClient(e.clientX, e.clientY, drag.grabX, drag.grabY);
    onMoveElement(drag.id, x, y);
  };

  const endMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!moveRef.current) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    moveRef.current = null;
    setMovingId(null);
  };

  const flowEls = screen.elements.filter((el) => !hasLayout(el));
  const absEls = screen.elements.filter((el) => hasLayout(el));

  const renderEl = (el: ContentElement, abs: boolean) => (
    <div
      key={el.id}
      data-el-id={el.id}
      className={"phone-el" + (abs ? " abs" : "") + (el.id === selectedElementId ? " selected" : "")}
      style={
        abs
          ? {
              left: `${el.x}%`,
              top: `${el.y}%`,
              width: el.w != null ? `${el.w}%` : undefined,
              touchAction: "none",
            }
          : { touchAction: "none" }
      }
      onClick={(ev) => {
        ev.stopPropagation();
        onSelectElement(el.id);
      }}
      onPointerDown={(ev) => beginMove(ev, el.id)}
      onPointerMove={onPointerMove}
      onPointerUp={endMove}
      onPointerCancel={endMove}
    >
      <ElementVisual el={el} />
    </div>
  );

  return (
    <div className="phone-workspace">
      <div className="phone-meta">
        <input
          className="phone-title-input"
          value={screen.title}
          onChange={(e) => onRenameScreen(e.target.value)}
          aria-label="Nome da tela"
        />
        <span className="muted phone-meta-hint">Arraste ferramentas para o celular · arraste elementos pra reposicionar</span>
      </div>

      <div className="phone-bezel">
        <div className="phone-notch" aria-hidden />
        <div
          ref={stageRef}
          className={
            "phone-stage" +
            (bgUrl ? " has-bg" : "") +
            (dragOver ? " drag-over" : "") +
            (screen.elements.length === 0 ? " is-empty" : "")
          }
          onClick={() => onSelectElement(null)}
          onDragOver={onDragOver}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          {bgLayerStyle && <div className="phone-bg-layer" style={bgLayerStyle} aria-hidden />}
          {bgUrl && !isEmojiSrc(bgUrl) && <div className="phone-bg-scrim" aria-hidden />}

          {screen.elements.length === 0 && (
            <div className="phone-empty-hint">
              Celular vazio
              <br />
              <span>Arraste um botão, imagem ou texto para cá</span>
            </div>
          )}

          <div className="phone-flow">{flowEls.map((el) => renderEl(el, false))}</div>
          {absEls.map((el) => renderEl(el, true))}
        </div>
        <div className="phone-home-bar" aria-hidden />
      </div>
    </div>
  );
}
