import { useRef, useState } from "react";
import type { AppContent, ContentElement, Screen } from "../types/content";
import {
  ICON_PRESETS,
  emojiSrc,
  uid,
} from "../types/content";
import { uploadMedia } from "../api/contentApi";

type Props = {
  content: AppContent;
  screen: Screen | null;
  element: ContentElement | null;
  onChange: (element: ContentElement) => void;
  onUpdateScreen: (patch: Partial<Screen>) => void;
  onRemove: () => void;
};

export function Inspector({ content, screen, element, onChange, onUpdateScreen, onRemove }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  if (!element) {
    return (
      <div>
        <h2>Propriedades</h2>
        {screen ? (
          <>
            <p className="muted">Tela selecionada — ou escolha um elemento no canvas.</p>
            <div className="field">
              <label>Plano de fundo (URL ou /media/...)</label>
              <input
                value={screen.backgroundImage || ""}
                onChange={(e) =>
                  onUpdateScreen({ backgroundImage: e.target.value || undefined })
                }
                placeholder="https://... ou /media/arquivo.png"
              />
            </div>
          </>
        ) : (
          <p className="muted">Selecione um elemento no canvas.</p>
        )}
      </div>
    );
  }

  const doUpload = async (file: File | null) => {
    if (!file || element.type !== "image") return;
    setUploading(true);
    try {
      const { url } = await uploadMedia(file);
      onChange({ ...element, src: url });
    } catch (e) {
      alert("Falha no upload: " + String(e));
    } finally {
      setUploading(false);
    }
  };

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
                    target: e.target.value === element.action.type ? element.action.target : "",
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
                <option value="">(selecione a tela destino)</option>
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

      {element.type === "image" && (
        <>
          <div className="field">
            <label>Função (role)</label>
            <select
              value={element.role || "photo"}
              onChange={(e) =>
                onChange({
                  ...element,
                  role: e.target.value as "logo" | "icon" | "photo",
                })
              }
            >
              <option value="photo">Foto / ilustração</option>
              <option value="logo">Logo</option>
              <option value="icon">Ícone</option>
            </select>
          </div>
          <div className="field">
            <label>Fonte (URL ou /media/...)</label>
            <input
              value={element.src}
              onChange={(e) => onChange({ ...element, src: e.target.value })}
              placeholder="https://... ou /media/arquivo.png"
            />
          </div>
          <div className="row" style={{ marginBottom: 12 }}>
            <button
              className="btn"
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? "Enviando…" : "Enviar arquivo"}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                e.target.value = "";
                void doUpload(f);
              }}
            />
          </div>
          <div className="field">
            <label>Atalhos de ícone (emoji)</label>
            <div className="icon-presets">
              {ICON_PRESETS.map((p) => (
                <button
                  key={p.emoji}
                  type="button"
                  className="icon-preset-btn"
                  title={p.label}
                  onClick={() =>
                    onChange({
                      ...element,
                      src: emojiSrc(p.emoji),
                      role: "icon",
                      alt: element.alt || p.label,
                    })
                  }
                >
                  {p.emoji}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <label>Texto alternativo (alt)</label>
            <input
              value={element.alt || ""}
              onChange={(e) => onChange({ ...element, alt: e.target.value })}
              placeholder="Descrição da imagem"
            />
          </div>
          <div className="field">
            <label>Ajuste (fit)</label>
            <select
              value={element.fit || "contain"}
              onChange={(e) =>
                onChange({
                  ...element,
                  fit: e.target.value as "cover" | "contain",
                })
              }
            >
              <option value="contain">Contain (caber)</option>
              <option value="cover">Cover (preencher)</option>
            </select>
          </div>
          <div className="row">
            <div className="field">
              <label>Largura (px, opcional)</label>
              <input
                type="number"
                min={0}
                value={element.width ?? ""}
                onChange={(e) =>
                  onChange({
                    ...element,
                    width: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                placeholder="auto"
              />
            </div>
            <div className="field">
              <label>Altura (px, opcional)</label>
              <input
                type="number"
                min={0}
                value={element.height ?? ""}
                onChange={(e) =>
                  onChange({
                    ...element,
                    height: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                placeholder="auto"
              />
            </div>
          </div>
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
