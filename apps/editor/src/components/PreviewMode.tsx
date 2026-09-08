import { useMemo, useState } from "react";
import type { AppContent } from "../types/content";
import {
  emojiFromSrc,
  isEmojiSrc,
  resolveMediaSrc,
} from "../types/content";

type Props = { content: AppContent };

export function PreviewMode({ content }: Props) {
  const [stack, setStack] = useState<string[]>([content.homeScreenId]);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const screenId = stack[stack.length - 1];
  const screen = useMemo(() => content.screens.find((s) => s.id === screenId), [content, screenId]);

  if (!screen) {
    return <div className="canvas-wrap"><div className="empty">Nenhuma tela publicada / disponível.</div></div>;
  }

  const bgUrl = screen.backgroundImage ? resolveMediaSrc(screen.backgroundImage) : "";
  const canvasStyle = bgUrl && !isEmojiSrc(bgUrl)
    ? {
        backgroundImage: `linear-gradient(rgba(15,23,42,0.55), rgba(15,23,42,0.75)), url(${JSON.stringify(bgUrl)})`,
        backgroundSize: "cover" as const,
        backgroundPosition: "center" as const,
      }
    : undefined;

  return (
    <div className="canvas-wrap">
      <div className={"canvas" + (bgUrl ? " has-bg" : "")} style={canvasStyle}>
        <div className="canvas-header">
          <h1>{screen.title}</h1>
          {stack.length > 1 && (
            <button className="btn" onClick={() => setStack((s) => s.slice(0, -1))}>Voltar</button>
          )}
        </div>
        {content.disclaimer && <div className="disclaimer">{content.disclaimer}</div>}
        {screen.elements.length === 0 && (
          <div className="empty">Tela vazia — monte o conteúdo no editor.</div>
        )}
        {screen.elements.map((el) => {
          if (el.type === "text") {
            return <p key={el.id}>{el.content}</p>;
          }
          if (el.type === "button") {
            return (
              <button
                key={el.id}
                className="preview-btn"
                onClick={() => {
                  if (el.action.type === "navigate") {
                    if (!el.action.target) return;
                    setStack((s) => [...s, el.action.target]);
                  } else if (el.action.target) {
                    window.open(el.action.target, "_blank", "noopener,noreferrer");
                  }
                }}
              >
                {el.label}
              </button>
            );
          }
          if (el.type === "image") {
            if (!el.src) {
              return (
                <div key={el.id} className="element-card">
                  <div className="muted">Imagem sem fonte</div>
                </div>
              );
            }
            if (isEmojiSrc(el.src)) {
              return (
                <div key={el.id} className="img-emoji" style={{ fontSize: el.role === "icon" ? 40 : 64, textAlign: "center", margin: "12px 0" }}>
                  {emojiFromSrc(el.src)}
                </div>
              );
            }
            return (
              <img
                key={el.id}
                className="img-preview"
                src={resolveMediaSrc(el.src)}
                alt={el.alt || ""}
                style={{
                  display: "block",
                  margin: "12px auto",
                  objectFit: el.fit || "contain",
                  width: el.width ? el.width : el.role === "logo" ? 160 : "100%",
                  maxHeight: el.height || (el.role === "icon" ? 64 : 240),
                }}
              />
            );
          }
          if (el.type === "video") {
            return (
              <div key={el.id} className="element-card">
                <h3>{el.title || "Vídeo"}</h3>
                {el.url ? (
                  <a href={el.url} target="_blank" rel="noreferrer">{el.url}</a>
                ) : (
                  <div className="muted">Placeholder de vídeo (URL vazia)</div>
                )}
              </div>
            );
          }
          if (el.type === "checklist") {
            return (
              <div key={el.id} className="element-card">
                <h3>{el.title}</h3>
                {el.items.map((item) => (
                  <label key={item.id} className="checklist-item">
                    <input
                      type="checkbox"
                      checked={!!checks[item.id]}
                      onChange={(e) => setChecks((c) => ({ ...c, [item.id]: e.target.checked }))}
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}
