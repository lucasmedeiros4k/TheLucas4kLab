import type { AppContent } from "../types/content";

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
    <div>
      <h2>Telas</h2>
      <div className="screen-list">
        {content.screens.map((screen) => (
          <button
            key={screen.id}
            className={"screen-item" + (screen.id === selectedScreenId ? " active" : "")}
            onClick={() => onSelect(screen.id)}
          >
            <div><strong>{screen.title}</strong></div>
            <div className="muted" style={{ fontSize: "0.8rem" }}>
              {screen.id === content.homeScreenId ? "Início · " : ""}{screen.elements.length} elementos
            </div>
          </button>
        ))}
      </div>
      <div className="stack" style={{ marginTop: 12 }}>
        <button className="btn" onClick={onAdd}>Adicionar tela</button>
        <button
          className="btn ghost"
          onClick={() => onSetHome(selectedScreenId)}
          disabled={selectedScreenId === content.homeScreenId}
        >
          Definir como início
        </button>
        <button
          className="btn ghost danger"
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
