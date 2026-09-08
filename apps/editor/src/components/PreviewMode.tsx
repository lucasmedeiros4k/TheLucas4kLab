import { useMemo, useState, type CSSProperties } from "react";
import type { AppContent } from "../types/content";
import {
  hasLayout,
  isEmojiSrc,
  resolveMediaSrc,
} from "../types/content";
import { ElementVisual } from "./ElementVisual";

type Props = { content: AppContent };

export function PreviewMode({ content }: Props) {
  const [stack, setStack] = useState<string[]>([content.homeScreenId]);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const screenId = stack[stack.length - 1];
  const screen = useMemo(
    () => content.screens.find((s) => s.id === screenId),
    [content, screenId]
  );

  if (!screen) {
    return (
      <div className="canvas-wrap">
        <div className="empty">Nenhuma tela publicada / disponível.</div>
      </div>
    );
  }

  const bgUrl = screen.backgroundImage ? resolveMediaSrc(screen.backgroundImage) : "";
  const stageStyle: CSSProperties | undefined =
    bgUrl && !isEmojiSrc(bgUrl)
      ? {
          backgroundImage: `linear-gradient(rgba(15,23,42,0.45), rgba(15,23,42,0.65)), url(${JSON.stringify(bgUrl)})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }
      : undefined;

  const flowEls = screen.elements.filter((el) => !hasLayout(el));
  const absEls = screen.elements.filter((el) => hasLayout(el));

  return (
    <div className="phone-workspace preview-workspace">
      <div className="phone-meta">
        <h1 className="phone-preview-title">{screen.title}</h1>
        {stack.length > 1 && (
          <button className="btn" type="button" onClick={() => setStack((s) => s.slice(0, -1))}>
            Voltar
          </button>
        )}
      </div>
      {content.disclaimer && <div className="disclaimer preview-disclaimer">{content.disclaimer}</div>}

      <div className="phone-bezel">
        <div className="phone-notch" aria-hidden />
        <div className={"phone-stage" + (bgUrl ? " has-bg" : "")} style={stageStyle}>
          {screen.elements.length === 0 && (
            <div className="phone-empty-hint">Tela vazia</div>
          )}
          <div className="phone-flow">
            {flowEls.map((el) => (
              <div key={el.id} className="phone-el">
                <ElementVisual
                  el={el}
                  interactive
                  checks={checks}
                  onToggleCheck={(id, checked) =>
                    setChecks((c) => ({ ...c, [id]: checked }))
                  }
                  onButtonClick={() => {
                    if (el.type !== "button") return;
                    if (el.action.type === "navigate") {
                      if (!el.action.target) return;
                      setStack((s) => [...s, el.action.target]);
                    } else if (el.action.target) {
                      window.open(el.action.target, "_blank", "noopener,noreferrer");
                    }
                  }}
                />
              </div>
            ))}
          </div>
          {absEls.map((el) => (
            <div
              key={el.id}
              className="phone-el abs"
              style={{
                left: `${el.x}%`,
                top: `${el.y}%`,
                width: el.w != null ? `${el.w}%` : undefined,
              }}
            >
              <ElementVisual
                el={el}
                interactive
                checks={checks}
                onToggleCheck={(id, checked) =>
                  setChecks((c) => ({ ...c, [id]: checked }))
                }
                onButtonClick={() => {
                  if (el.type !== "button") return;
                  if (el.action.type === "navigate") {
                    if (!el.action.target) return;
                    setStack((s) => [...s, el.action.target]);
                  } else if (el.action.target) {
                    window.open(el.action.target, "_blank", "noopener,noreferrer");
                  }
                }}
              />
            </div>
          ))}
        </div>
        <div className="phone-home-bar" aria-hidden />
      </div>
    </div>
  );
}
