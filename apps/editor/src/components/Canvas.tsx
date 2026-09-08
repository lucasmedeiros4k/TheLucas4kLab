import { useRef, useState, type CSSProperties } from "react";
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

const MOVE_MIME = "application/x-lauem-move";

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

  const pctFromEvent = (e: React.DragEvent | React.MouseEvent) => {
    const el = stageRef.current;
    if (!el) return { x: 10, y: 10 };
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    return { x: clampPct(x, 0, 92), y: clampPct(y, 0, 92) };
  };

  const onDragOver = (e: React.DragEvent) => {
    if (
      [...e.dataTransfer.types].includes(LAUEM_TOOL_MIME) ||
      [...e.dataTransfer.types].includes(MOVE_MIME) ||
      [...e.dataTransfer.types].includes("text/plain")
    ) {
      e.preventDefault();
      e.dataTransfer.dropEffect = [...e.dataTransfer.types].includes(MOVE_MIME) ? "move" : "copy";
      setDragOver(true);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const { x, y } = pctFromEvent(e);
    const plain = e.dataTransfer.getData("text/plain") || "";
    const moveId = e.dataTransfer.getData(MOVE_MIME) || (plain.startsWith("lauem-move:") ? plain.slice("lauem-move:".length) : "");
    if (moveId) {
      onMoveElement(moveId, x, y);
      onSelectElement(moveId);
      return;
    }
    const tool =
      e.dataTransfer.getData(LAUEM_TOOL_MIME) || (plain.startsWith("lauem-tool:") ? plain.slice("lauem-tool:".length) : plain);
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

  /** Elementos sem x/y empilham; com layout usam absolute % */
  const flowEls = screen.elements.filter((el) => !hasLayout(el));
  const absEls = screen.elements.filter((el) => hasLayout(el));

  return (
    <div className="phone-workspace">
      <div className="phone-meta">
        <input
          className="phone-title-input"
          value={screen.title}
          onChange={(e) => onRenameScreen(e.target.value)}
          aria-label="Nome da tela"
        />
        <span className="muted phone-meta-hint">Arraste ferramentas para o celular</span>
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

          <div className="phone-flow">
            {flowEls.map((el) => (
              <div
                key={el.id}
                className={
                  "phone-el" + (el.id === selectedElementId ? " selected" : "")
                }
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectElement(el.id);
                }}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData(MOVE_MIME, el.id);
                  e.dataTransfer.setData("text/plain", "lauem-move:"+el.id);
                  e.dataTransfer.effectAllowed = "move";
                }}
              >
                <ElementVisual el={el} />
              </div>
            ))}
          </div>

          {absEls.map((el) => (
            <div
              key={el.id}
              className={
                "phone-el abs" + (el.id === selectedElementId ? " selected" : "")
              }
              style={{
                left: `${el.x}%`,
                top: `${el.y}%`,
                width: el.w != null ? `${el.w}%` : undefined,
              }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectElement(el.id);
              }}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData(MOVE_MIME, el.id);
                  e.dataTransfer.setData("text/plain", "lauem-move:"+el.id);
                e.dataTransfer.effectAllowed = "move";
              }}
            >
              <ElementVisual el={el} />
            </div>
          ))}
        </div>
        <div className="phone-home-bar" aria-hidden />
      </div>
    </div>
  );
}
