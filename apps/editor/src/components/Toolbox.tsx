import { TOOL_TYPES } from "../types/content";
import type { ContentElement } from "../types/content";

type Props = {
  onAddClick: (type: ContentElement["type"]) => void;
};

const DND_TYPE = "application/x-lauem-tool";

export function Toolbox({ onAddClick }: Props) {
  return (
    <div className="toolbox">
      <h2>Ferramentas</h2>
      <p className="muted toolbox-hint">Arraste para o celular ou toque para adicionar</p>
      <div className="toolbox-grid">
        {TOOL_TYPES.map((tool) => (
          <button
            key={tool.type}
            type="button"
            className="toolbox-item"
            draggable
            title={`Arrastar ${tool.label}`}
            onDragStart={(e) => {
              e.dataTransfer.setData(DND_TYPE, tool.type);
              e.dataTransfer.setData("text/plain", "lauem-tool:"+tool.type);
              e.dataTransfer.effectAllowed = "copy";
            }}
            onClick={() => onAddClick(tool.type)}
          >
            <span className="toolbox-icon" aria-hidden>{tool.icon}</span>
            <span>Adicionar {tool.label.toLowerCase()}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export const LAUEM_TOOL_MIME = DND_TYPE;
