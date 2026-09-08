import { useMemo, useState } from "react";
import type { AppContent } from "../types/content";

type Props = { content: AppContent };

export function PreviewMode({ content }: Props) {
  const [stack, setStack] = useState<string[]>([content.homeScreenId]);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const screenId = stack[stack.length - 1];
  const screen = useMemo(() => content.screens.find((s) => s.id === screenId), [content, screenId]);

  if (!screen) {
    return <div className="canvas-wrap"><div className="empty">Nenhuma tela publicada / disponível.</div></div>;
  }

  return (
    <div className="canvas-wrap">
      <div className="canvas">
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
