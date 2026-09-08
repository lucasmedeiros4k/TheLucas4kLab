import type { AppContent } from "../types/content";
import { hasLayout, isEmojiSrc, resolveMediaSrc } from "../types/content";

type Props = {
  content: AppContent;
  selectedScreenId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onSetHome: (id: string) => void;
  onDisclaimerChange: (value: string) => void;
};

export function ScreenList({
  content, selectedScreenId, onSelect, onAdd, onRemove, onSetHome, onDisclaimerChange,
}: Props) {
  return (
    <div className="screen-rail">
      <h2>Telas</h2>
      <p className="muted screen-rail-hint">Como atividades do Android — cada tela é uma página</p>
      <div className="screen-list">
        {content.screens.map((screen, idx) => {
          const bg = screen.backgroundImage ? resolveMediaSrc(screen.backgroundImage) : "";
          const thumbStyle =
            bg && !isEmojiSrc(bg)
              ? {
                  backgroundImage: `linear-gradient(rgba(15,23,42,0.4), rgba(15,23,42,0.7)), url(${JSON.stringify(bg)})`,
                  backgroundSize: "cover" as const,
                  backgroundPosition: "center" as const,
                }
              : undefined;
          const isHome = screen.id === content.homeScreenId;
          return (
            <button
              key={screen.id}
              type="button"
              className={"screen-thumb" + (screen.id === selectedScreenId ? " active" : "")}
              onClick={() => onSelect(screen.id)}
            >
              <div className="screen-thumb-frame" style={thumbStyle}>
                <div className="screen-thumb-dots">
                  {screen.elements.slice(0, 4).map((el) => (
                    <span
                      key={el.id}
                      className={"dot type-" + el.type + (hasLayout(el) ? " laid" : "")}
                      title={el.type}
                    />
                  ))}
                  {screen.elements.length === 0 && (
                    <span className="thumb-empty">vazia</span>
                  )}
                </div>
              </div>
              <div className="screen-thumb-meta">
                <strong>{screen.title || `Tela ${idx + 1}`}</strong>
                <span className="muted">
                  {isHome ? "🏠 Início · " : ""}
                  {screen.elements.length} elem.
                </span>
              </div>
            </button>
          );
        })}
      </div>
      <div className="stack" style={{ marginTop: 12 }}>
        <button className="btn" type="button" onClick={onAdd}>Adicionar tela</button>
        <button
          className="btn ghost"
          type="button"
          onClick={() => onSetHome(selectedScreenId)}
          disabled={selectedScreenId === content.homeScreenId}
        >
          Definir como início
        </button>
        <button
          className="btn ghost danger"
          type="button"
          onClick={() => onRemove(selectedScreenId)}
          disabled={content.screens.length <= 1}
        >
          Remover tela
        </button>
      </div>
      <div className="field" style={{ marginTop: 20 }}>
        <label>Aviso / disclaimer</label>
        <textarea
          value={content.disclaimer}
          onChange={(e) => onDisclaimerChange(e.target.value)}
        />
      </div>
    </div>
  );
}
