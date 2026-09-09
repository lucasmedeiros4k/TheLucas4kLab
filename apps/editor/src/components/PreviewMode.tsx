import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { AppContent, ContentElement } from "../types/content";
import {
  hasLayout,
  isEmojiSrc,
  normalizeOpacity,
  resolveMediaSrc,
} from "../types/content";
import { ElementVisual } from "./ElementVisual";

type Props = { content: AppContent };

/**
 * Preview usa a MESMA estrutura do Canvas (phone-stage → flow + abs),
 * para posição/tamanho/estilo baterem com o editor.
 * A animação só aplica opacity — sem transform no container de layout
 * (transform cria containing block e distorce % de height/width).
 */
export function PreviewMode({ content }: Props) {
  const [stack, setStack] = useState<string[]>([content.homeScreenId]);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [fade, setFade] = useState(true);
  const screenId = stack[stack.length - 1];
  const screen = useMemo(
    () => content.screens.find((s) => s.id === screenId),
    [content, screenId]
  );

  useEffect(() => {
    setFade(false);
    const t = window.setTimeout(() => setFade(true), 30);
    return () => window.clearTimeout(t);
  }, [screenId]);

  if (!screen) {
    return (
      <div className="canvas-wrap">
        <div className="empty">Nenhuma tela publicada / disponível.</div>
      </div>
    );
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

  const flowEls = screen.elements.filter((el) => !hasLayout(el));
  const absEls = screen.elements.filter((el) => hasLayout(el));

  const goTo = (target: string) => setStack((s) => [...s, target]);
  const goBack = () => setStack((s) => s.slice(0, -1));

  const buttonHandler = (el: ContentElement) => {
    if (el.type !== "button") return;
    if (el.action.type === "navigate") {
      if (!el.action.target) return;
      goTo(el.action.target);
    } else if (el.action.target) {
      window.open(el.action.target, "_blank", "noopener,noreferrer");
    }
  };

  const absStyle = (el: ContentElement, zIndex: number): CSSProperties => ({
    left: `${el.x}%`,
    top: `${el.y}%`,
    width: el.w != null ? `${el.w}%` : undefined,
    height: el.h != null ? `${el.h}%` : undefined,
    zIndex: 2 + zIndex,
    overflow: el.h != null ? "hidden" : undefined,
  });

  return (
    <div className="phone-workspace preview-workspace">
      <div className="phone-meta">
        <h1 className="phone-preview-title">{screen.title}</h1>
        {stack.length > 1 && (
          <button className="btn" type="button" onClick={goBack}>
            Voltar
          </button>
        )}
      </div>
      {content.disclaimer && (
        <div className="disclaimer preview-disclaimer">{content.disclaimer}</div>
      )}

      <div className="phone-bezel">
        <div className="phone-notch" aria-hidden />
        <div
          className={
            "phone-stage" +
            (bgUrl ? " has-bg" : "") +
            (fade ? " preview-fade-in" : " preview-fade-out")
          }
        >
          {bgLayerStyle && <div className="phone-bg-layer" style={bgLayerStyle} aria-hidden />}
          {bgUrl && !isEmojiSrc(bgUrl) && <div className="phone-bg-scrim" aria-hidden />}

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
                  onButtonClick={() => buttonHandler(el)}
                />
              </div>
            ))}
          </div>

          {absEls.map((el, i) => (
            <div
              key={el.id}
              className="phone-el abs"
              style={absStyle(el, flowEls.length + i)}
            >
              <ElementVisual
                el={el}
                interactive
                checks={checks}
                onToggleCheck={(id, checked) =>
                  setChecks((c) => ({ ...c, [id]: checked }))
                }
                onButtonClick={() => buttonHandler(el)}
              />
            </div>
          ))}
        </div>
        <div className="phone-home-bar" aria-hidden />
      </div>
    </div>
  );
}
