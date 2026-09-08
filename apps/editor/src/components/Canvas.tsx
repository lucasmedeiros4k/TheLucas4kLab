import type { ContentElement, Screen } from "../types/content";
import {
  emojiFromSrc,
  isEmojiSrc,
  resolveMediaSrc,
} from "../types/content";
import { uploadMedia } from "../api/contentApi";
import { useRef, useState } from "react";

type Props = {
  screen: Screen | null;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onRenameScreen: (title: string) => void;
  onUpdateScreen: (patch: Partial<Screen>) => void;
  onAddElement: (type: ContentElement["type"]) => void;
};

export function Canvas({
  screen, selectedElementId, onSelectElement, onRenameScreen, onUpdateScreen, onAddElement,
}: Props) {
  const bgInputRef = useRef<HTMLInputElement>(null);
  const [bgBusy, setBgBusy] = useState(false);

  if (!screen) {
    return <div className="empty">Selecione ou crie uma tela.</div>;
  }

  const bgUrl = screen.backgroundImage ? resolveMediaSrc(screen.backgroundImage) : "";
  const canvasStyle = bgUrl && !isEmojiSrc(bgUrl)
    ? {
        backgroundImage: `linear-gradient(rgba(15,23,42,0.55), rgba(15,23,42,0.75)), url(${JSON.stringify(bgUrl)})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : undefined;

  const onBgFile = async (file: File | null) => {
    if (!file) return;
    setBgBusy(true);
    try {
      const { url } = await uploadMedia(file);
      onUpdateScreen({ backgroundImage: url });
    } catch (e) {
      alert("Falha no upload do plano de fundo: " + String(e));
    } finally {
      setBgBusy(false);
    }
  };

  return (
    <div className={"canvas" + (bgUrl ? " has-bg" : "")} style={canvasStyle}>
      <div className="canvas-header">
        <input
          value={screen.title}
          onChange={(e) => onRenameScreen(e.target.value)}
          style={{ fontSize: "1.3rem", fontWeight: 700, background: "transparent", border: "none", color: "inherit", width: "100%" }}
        />
      </div>

      <div className="field screen-bg-field">
        <label>Plano de fundo da tela</label>
        <div className="row">
          <input
            value={screen.backgroundImage || ""}
            onChange={(e) => onUpdateScreen({ backgroundImage: e.target.value || undefined })}
            placeholder="URL https://... ou /media/arquivo.png"
          />
          <button
            className="btn"
            type="button"
            disabled={bgBusy}
            onClick={() => bgInputRef.current?.click()}
            style={{ flex: "0 0 auto" }}
          >
            {bgBusy ? "Enviando…" : "Enviar imagem"}
          </button>
          {screen.backgroundImage && (
            <button
              className="btn ghost"
              type="button"
              onClick={() => onUpdateScreen({ backgroundImage: undefined })}
              style={{ flex: "0 0 auto" }}
            >
              Limpar
            </button>
          )}
        </div>
        <input
          ref={bgInputRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            e.target.value = "";
            void onBgFile(f);
          }}
        />
      </div>

      <div className="toolbar">
        <button className="btn" onClick={() => onAddElement("button")}>Adicionar botão</button>
        <button className="btn" onClick={() => onAddElement("image")}>Adicionar imagem</button>
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
              <div className="muted">
                {el.action.target
                  ? `${el.action.type}: ${el.action.target}`
                  : `${el.action.type}: (sem destino)`}
              </div>
            </>
          )}
          {el.type === "image" && (
            <>
              <h3>
                {el.role === "logo" ? "Logo" : el.role === "icon" ? "Ícone" : "Imagem"}
              </h3>
              <ImagePreview el={el} />
              <div className="muted">{el.alt || el.src || "Sem fonte"}</div>
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

function ImagePreview({ el }: { el: Extract<ContentElement, { type: "image" }> }) {
  if (!el.src) {
    return <div className="img-placeholder">Sem imagem — cole URL ou envie arquivo no inspetor</div>;
  }
  if (isEmojiSrc(el.src)) {
    return (
      <div className="img-emoji" style={{ fontSize: el.role === "icon" ? 40 : 56 }}>
        {emojiFromSrc(el.src)}
      </div>
    );
  }
  const src = resolveMediaSrc(el.src);
  return (
    <img
      className="img-preview"
      src={src}
      alt={el.alt || ""}
      style={{
        objectFit: el.fit || "contain",
        width: el.width ? el.width : "100%",
        height: el.height ? el.height : "auto",
        maxHeight: 180,
      }}
    />
  );
}
