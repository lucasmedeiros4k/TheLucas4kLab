import type { ContentElement, Screen } from "../types/content";

type Props = {
  screen: Screen | null;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onRenameScreen: (title: string) => void;
  onAddElement: (type: ContentElement["type"]) => void;
};

export function Canvas({
  screen, selectedElementId, onSelectElement, onRenameScreen, onAddElement,
}: Props) {
  if (!screen) {
    return <div className="empty">Selecione ou crie uma tela.</div>;
  }

  return (
    <div className="canvas">
      <div className="canvas-header">
        <input
          value={screen.title}
          onChange={(e) => onRenameScreen(e.target.value)}
          style={{ fontSize: "1.3rem", fontWeight: 700, background: "transparent", border: "none", color: "inherit", width: "100%" }}
        />
      </div>
      <div className="toolbar">
        <button className="btn" onClick={() => onAddElement("button")}>Adicionar botão</button>
        <button className="btn" onClick={() => onAddElement("video")}>Adicionar vídeo</button>
        <button className="btn" onClick={() => onAddElement("checklist")}>Adicionar checklist</button>
        <button className="btn" onClick={() => onAddElement("text")}>Adicionar texto</button>
      </div>
      {screen.elements.length === 0 && (
        <div className="empty">Sandbox vazio — adicione elementos para montar a experiência.</div>
      )}
      {screen.elements.map((el) => (
        <div
          key={el.id}
          className={"element-card" + (el.id === selectedElementId ? " selected" : "")}
          onClick={() => onSelectElement(el.id)}
        >
          {el.type === "button" && (
            <>
              <h3>Botão</h3>
              <div>{el.label}</div>
              <div className="muted">{el.action.type}: {el.action.target}</div>
            </>
          )}
          {el.type === "video" && (
            <>
              <h3>Vídeo</h3>
              <div>{el.title || "Sem título"}</div>
              <div className="muted">{el.url || "URL vazia"}</div>
            </>
          )}
          {el.type === "checklist" && (
            <>
              <h3>Checklist</h3>
              <div>{el.title}</div>
              <div className="muted">{el.items.length} itens</div>
            </>
          )}
          {el.type === "text" && (
            <>
              <h3>Texto</h3>
              <div>{el.content}</div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
