import type { AppContent, ContentElement } from "../types/content";
import { uid } from "../types/content";

type Props = {
  content: AppContent;
  element: ContentElement | null;
  onChange: (element: ContentElement) => void;
  onRemove: () => void;
};

export function Inspector({ content, element, onChange, onRemove }: Props) {
  if (!element) {
    return (
      <div>
        <h2>Propriedades</h2>
        <p className="muted">Selecione um elemento no canvas.</p>
      </div>
    );
  }

  return (
    <div>
      <h2>Propriedades</h2>
      <div className="muted" style={{ marginBottom: 12 }}>Tipo: {element.type}</div>

      {element.type === "button" && (
        <>
          <div className="field">
            <label>Rótulo</label>
            <input value={element.label} onChange={(e) => onChange({ ...element, label: e.target.value })} />
          </div>
          <div className="field">
            <label>Ação</label>
            <select
              value={element.action.type}
              onChange={(e) =>
                onChange({
                  ...element,
                  action: {
                    type: e.target.value as "navigate" | "openUrl",
                    target: element.action.target,
                  },
                })
              }
            >
              <option value="navigate">Navegar para tela</option>
              <option value="openUrl">Abrir URL</option>
            </select>
          </div>
          {element.action.type === "navigate" ? (
            <div className="field">
              <label>Tela destino</label>
              <select
                value={element.action.target}
                onChange={(e) => onChange({ ...element, action: { type: "navigate", target: e.target.value } })}
              >
                {content.screens.map((s) => (
                  <option key={s.id} value={s.id}>{s.title} ({s.id})</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="field">
              <label>URL</label>
              <input
                value={element.action.target}
                onChange={(e) => onChange({ ...element, action: { type: "openUrl", target: e.target.value } })}
                placeholder="https://..."
              />
            </div>
          )}
        </>
      )}

      {element.type === "video" && (
        <>
          <div className="field">
            <label>Título</label>
            <input value={element.title || ""} onChange={(e) => onChange({ ...element, title: e.target.value })} />
          </div>
          <div className="field">
            <label>URL do vídeo</label>
            <input value={element.url} onChange={(e) => onChange({ ...element, url: e.target.value })} placeholder="https://..." />
          </div>
        </>
      )}

      {element.type === "text" && (
        <div className="field">
          <label>Conteúdo</label>
          <textarea value={element.content} onChange={(e) => onChange({ ...element, content: e.target.value })} />
        </div>
      )}

      {element.type === "checklist" && (
        <>
          <div className="field">
            <label>Título</label>
            <input value={element.title} onChange={(e) => onChange({ ...element, title: e.target.value })} />
          </div>
          <div className="stack">
            {element.items.map((item, idx) => (
              <div className="row" key={item.id}>
                <input
                  value={item.label}
                  onChange={(e) => {
                    const items = element.items.map((it, i) => i === idx ? { ...it, label: e.target.value } : it);
                    onChange({ ...element, items });
                  }}
                />
                <button
                  className="btn ghost"
                  onClick={() => onChange({ ...element, items: element.items.filter((it) => it.id !== item.id) })}
                >×</button>
              </div>
            ))}
            <button
              className="btn"
              onClick={() => onChange({ ...element, items: [...element.items, { id: uid("item"), label: "Novo item" }] })}
            >Adicionar item</button>
          </div>
        </>
      )}

      <div style={{ marginTop: 16 }}>
        <button className="btn ghost danger" onClick={onRemove}>Remover elemento</button>
      </div>
    </div>
  );
}
