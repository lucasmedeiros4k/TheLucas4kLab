import { useRef, useState } from "react";
import type { AppContent, ContentElement, Screen } from "../types/content";
import {
  BUTTON_SHAPE_OPTIONS,
  BUTTON_STYLE_DEFAULTS,
  BUTTON_TEMPLATES,
  CLICK_SOUND_OPTIONS,
  FONT_FAMILY_OPTIONS,
  ICON_PRESETS,
  buttonContrastRatio,
  buttonContrastWarn,
  buttonShapeFromRadius,
  clampPct,
  emojiSrc,
  hasLayout,
  normalizeOpacity,
  radiusForShape,
  resolveButtonStyle,
  uid,
} from "../types/content";
import type { ButtonShapeId } from "../types/content";
import { uploadMedia } from "../api/contentApi";

type Props = {
  content: AppContent;
  screen: Screen | null;
  element: ContentElement | null;
  onChange: (element: ContentElement) => void;
  onUpdateScreen: (patch: Partial<Screen>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onAlign: (where: "left" | "center" | "right" | "top" | "middle" | "bottom") => void;
  onNudge: (dx: number, dy: number) => void;
  nudgeStep: number;
  onNudgeStepChange: (step: number) => void;
  showGrid: boolean;
  onShowGridChange: (v: boolean) => void;
};

export function Inspector({
  content,
  screen,
  element,
  onChange,
  onUpdateScreen,
  onRemove,
  onDuplicate,
  onBringForward,
  onSendBackward,
  onAlign,
  onNudge,
  nudgeStep,
  onNudgeStepChange,
  showGrid,
  onShowGridChange,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const bgRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [bgBusy, setBgBusy] = useState(false);

  const uploadBg = async (file: File | null) => {
    if (!file || !screen) return;
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

  if (!element) {
    const opacityPct = Math.round(normalizeOpacity(screen?.backgroundOpacity) * 100);
    return (
      <div>
        <h2>Propriedades</h2>
        {screen ? (
          <>
            <p className="muted">Tela selecionada — toque num elemento no celular para editá-lo.</p>
            <div className="field">
              <label>Plano de fundo da tela</label>
              <input
                value={screen.backgroundImage || ""}
                onChange={(e) =>
                  onUpdateScreen({ backgroundImage: e.target.value || undefined })
                }
                placeholder="https://... ou /media/arquivo.png"
              />
            </div>
            <div className="row" style={{ marginBottom: 12 }}>
              <button
                className="btn"
                type="button"
                disabled={bgBusy}
                onClick={() => bgRef.current?.click()}
              >
                {bgBusy ? "Enviando…" : "Enviar imagem"}
              </button>
              {screen.backgroundImage && (
                <button
                  className="btn ghost"
                  type="button"
                  onClick={() => onUpdateScreen({ backgroundImage: undefined })}
                >
                  Limpar
                </button>
              )}
              <input
                ref={bgRef}
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                style={{ display: "none" }}
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  e.target.value = "";
                  void uploadBg(f);
                }}
              />
            </div>
            <div className="field">
              <label>Opacidade do fundo ({opacityPct}%)</label>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={opacityPct}
                disabled={!screen.backgroundImage}
                onChange={(e) => {
                  const pct = Number(e.target.value);
                  onUpdateScreen({ backgroundOpacity: Math.round((pct / 100) * 100) / 100 });
                }}
              />
              <p className="muted" style={{ margin: 0, fontSize: "0.75rem" }}>
                0 = invisível · 100 = total. Campo JSON: backgroundOpacity (0–1).
              </p>
            </div>
            <div className="field">
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={(e) => onShowGridChange(e.target.checked)}
                />
                Mostrar grade no celular
              </label>
            </div>
            <div className="field">
              <label>Passo do nudge</label>
              <select
                value={String(nudgeStep)}
                onChange={(e) => onNudgeStepChange(Number(e.target.value))}
              >
                <option value="0.5">0,5%</option>
                <option value="1">1%</option>
                <option value="5">5%</option>
              </select>
              <p className="muted" style={{ margin: 0, fontSize: "0.75rem" }}>
                Setas / cruz · Shift = 5× o passo
              </p>
            </div>
          </>
        ) : (
          <p className="muted">Selecione um elemento no celular.</p>
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

  const setLayout = (patch: {
    x?: number;
    y?: number;
    w?: number | undefined;
    h?: number | undefined;
    locked?: boolean;
  }) => {
    onChange({ ...element, ...patch });
  };

  const wVal = element.w ?? 80;
  const hVal = element.h ?? 20;

  return (
    <div>
      <h2>Propriedades</h2>
      <div className="muted" style={{ marginBottom: 12 }}>
        Tipo: {element.type}
        {hasLayout(element) ? " · posicionado" : " · empilhado"}
        {element.locked ? " · 🔒" : ""}
      </div>
      {element.type === "button" && (
        <p className="muted tip-banner">
          Botão = widget: use a cruz, largura/altura e alinhar (igual imagem/texto).
        </p>
      )}

      <h3 className="insp-section-title">Posição e tamanho</h3>
      {/* Controles rápidos */}
      <div className="edit-toolbar">
        <button className="btn ghost tiny" type="button" title="Trazer pra frente" onClick={onBringForward}>
          ▲ Frente
        </button>
        <button className="btn ghost tiny" type="button" title="Enviar pra trás" onClick={onSendBackward}>
          ▼ Trás
        </button>
        <button className="btn ghost tiny" type="button" title="Duplicar" onClick={onDuplicate}>
          ⧉ Dup
        </button>
        <button
          className={"btn ghost tiny" + (element.locked ? " active" : "")}
          type="button"
          title="Travar posição"
          onClick={() => setLayout({ locked: !element.locked })}
        >
          {element.locked ? "🔒" : "🔓"}
        </button>
      </div>

      <div className="field">
        <label>Alinhar no celular</label>
        <div className="align-grid">
          <button type="button" className="btn ghost tiny" onClick={() => onAlign("left")}>⬅ Esq</button>
          <button type="button" className="btn ghost tiny" onClick={() => onAlign("center")}>⇔ Centro</button>
          <button type="button" className="btn ghost tiny" onClick={() => onAlign("right")}>Dir ➡</button>
          <button type="button" className="btn ghost tiny" onClick={() => onAlign("top")}>⬆ Topo</button>
          <button type="button" className="btn ghost tiny" onClick={() => onAlign("middle")}>⇕ Meio</button>
          <button type="button" className="btn ghost tiny" onClick={() => onAlign("bottom")}>Baixo ⬇</button>
        </div>
      </div>

      {/* Cruz / D-pad no inspetor */}
      <div className="field">
        <label>Mover (cruz)</label>
        <div className="dpad dpad-inspector" role="group" aria-label="Mover">
          <button type="button" className="dpad-btn dpad-up" onClick={(e) => onNudge(0, e.shiftKey ? -nudgeStep * 5 : -nudgeStep)}>▲</button>
          <button type="button" className="dpad-btn dpad-left" onClick={(e) => onNudge(e.shiftKey ? -nudgeStep * 5 : -nudgeStep, 0)}>◀</button>
          <button type="button" className="dpad-btn dpad-center" disabled>✕</button>
          <button type="button" className="dpad-btn dpad-right" onClick={(e) => onNudge(e.shiftKey ? nudgeStep * 5 : nudgeStep, 0)}>▶</button>
          <button type="button" className="dpad-btn dpad-down" onClick={(e) => onNudge(0, e.shiftKey ? nudgeStep * 5 : nudgeStep)}>▼</button>
        </div>
      </div>

      <div className="field">
        <label>Passo do nudge</label>
        <select
          value={String(nudgeStep)}
          onChange={(e) => onNudgeStepChange(Number(e.target.value))}
        >
          <option value="0.5">0,5%</option>
          <option value="1">1%</option>
          <option value="5">5%</option>
        </select>
      </div>

      <div className="field">
        <label className="check-label">
          <input
            type="checkbox"
            checked={showGrid}
            onChange={(e) => onShowGridChange(e.target.checked)}
          />
          Mostrar grade
        </label>
      </div>

      <div className="layout-fields layout-fields-4">
        <div className="field">
          <label>X (%)</label>
          <input
            type="number"
            min={0}
            max={100}
            step={0.5}
            value={element.x ?? ""}
            placeholder="auto"
            disabled={!!element.locked}
            onChange={(e) =>
              setLayout({
                x: e.target.value === "" ? undefined : clampPct(Number(e.target.value)),
                y: element.y ?? 10,
              })
            }
          />
        </div>
        <div className="field">
          <label>Y (%)</label>
          <input
            type="number"
            min={0}
            max={100}
            step={0.5}
            value={element.y ?? ""}
            placeholder="auto"
            disabled={!!element.locked}
            onChange={(e) =>
              setLayout({
                y: e.target.value === "" ? undefined : clampPct(Number(e.target.value)),
                x: element.x ?? 10,
              })
            }
          />
        </div>
        <div className="field">
          <label>Largura w (%)</label>
          <input
            type="number"
            min={8}
            max={100}
            step={1}
            value={element.w ?? ""}
            placeholder="auto"
            disabled={!!element.locked}
            onChange={(e) =>
              setLayout({
                w: e.target.value === "" ? undefined : clampPct(Number(e.target.value), 8, 100),
              })
            }
          />
        </div>
        <div className="field">
          <label>Altura h (%)</label>
          <input
            type="number"
            min={5}
            max={100}
            step={1}
            value={element.h ?? ""}
            placeholder="auto"
            disabled={!!element.locked}
            onChange={(e) =>
              setLayout({
                h: e.target.value === "" ? undefined : clampPct(Number(e.target.value), 5, 100),
              })
            }
          />
        </div>
      </div>

      <div className="field">
        <label>Largura ({wVal}%)</label>
        <input
          type="range"
          min={8}
          max={100}
          step={1}
          value={wVal}
          disabled={!!element.locked}
          onChange={(e) => setLayout({ w: clampPct(Number(e.target.value), 8, 100) })}
        />
      </div>
      <div className="field">
        <label>
          Altura h ({element.h != null ? `${hVal}%` : "auto"})
          {element.type === "button" ? " · botão" : ""}
        </label>
        <input
          type="range"
          min={5}
          max={100}
          step={1}
          value={hVal}
          disabled={!!element.locked}
          onChange={(e) => setLayout({ h: clampPct(Number(e.target.value), 5, 100) })}
        />
        {element.type === "button" && element.h == null && (
          <p className="muted" style={{ margin: "4px 0 0", fontSize: "0.75rem" }}>
            Arraste o slider para definir altura fixa (% do celular). Novos botões já vêm com h.
          </p>
        )}
        {element.h != null && (
          <button
            className="btn ghost tiny"
            type="button"
            style={{ marginTop: 4 }}
            onClick={() => setLayout({ h: undefined })}
          >
            Altura automática
          </button>
        )}
      </div>

      {hasLayout(element) && (
        <button
          className="btn ghost"
          type="button"
          style={{ marginBottom: 12 }}
          onClick={() =>
            onChange({
              ...element,
              x: undefined,
              y: undefined,
              w: undefined,
              h: undefined,
            })
          }
        >
          Voltar ao empilhamento automático
        </button>
      )}

      <h3 className="insp-section-title">Conteúdo do elemento</h3>
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
          <div className="field">
            <label>Som do clique</label>
            <select
              value={element.clickSound || "none"}
              onChange={(e) => onChange({ ...element, clickSound: e.target.value })}
            >
              {CLICK_SOUND_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
            <p className="muted" style={{ margin: 0, fontSize: "0.75rem" }}>
              Som/vibração respeitam as preferências do app publicado (engrenagem: Silenciar / Som / Vibração).
            </p>
          </div>

          <h3 className="insp-section-title">Aparência do botão</h3>
          {(() => {
            const s = resolveButtonStyle(element);
            const shape = buttonShapeFromRadius(element.borderRadius ?? s.borderRadius);
            const opacityPct = Math.round(s.opacity * 100);
            const contrast = buttonContrastRatio(s.bgColor, s.textColor);
            const lowContrast = buttonContrastWarn(s.bgColor, s.textColor);
            return (
              <>
                <div className="field">
                  <label>Templates clínicos (1 toque)</label>
                  <div className="row" style={{ flexWrap: "wrap", gap: 6 }}>
                    {BUTTON_TEMPLATES.map((tpl) => (
                      <button
                        key={tpl.id}
                        type="button"
                        className="btn ghost tiny"
                        title={tpl.hint}
                        onClick={() => onChange({ ...element, ...tpl.patch })}
                        style={
                          tpl.id === "primario"
                            ? { borderColor: "#0d9488", color: "#5eead4" }
                            : tpl.id === "alerta"
                              ? { borderColor: "#dc2626", color: "#fca5a5" }
                              : { borderColor: "#38bdf8", color: "#7dd3fc" }
                        }
                      >
                        {tpl.label}
                      </button>
                    ))}
                  </div>
                  <p className="muted" style={{ margin: "4px 0 0", fontSize: "0.75rem" }}>
                    Primário (azul/verde) · Alerta (vermelho/âmbar) · Secundário (outline)
                  </p>
                </div>
                {lowContrast && (
                  <p className="muted tip-banner" style={{ borderColor: "rgba(245, 158, 11, 0.5)", background: "rgba(245, 158, 11, 0.12)" }}>
                    ⚠️ Contraste baixo ({contrast.toFixed(1)}:1). Tente texto mais claro/escuro (ideal ≥ 4,5:1).
                  </p>
                )}
                <div className="field">
                  <label>Cor de fundo</label>
                  <div className="row">
                    <input
                      type="color"
                      value={/^#[0-9a-fA-F]{6}$/.test(s.bgColor) ? s.bgColor : BUTTON_STYLE_DEFAULTS.bgColor}
                      onChange={(e) => onChange({ ...element, bgColor: e.target.value })}
                      style={{ width: 48, padding: 2, flex: "0 0 auto" }}
                    />
                    <input
                      value={element.bgColor || s.bgColor}
                      onChange={(e) => onChange({ ...element, bgColor: e.target.value })}
                      placeholder={BUTTON_STYLE_DEFAULTS.bgColor}
                    />
                  </div>
                </div>
                <div className="field">
                  <label>Cor do texto</label>
                  <div className="row">
                    <input
                      type="color"
                      value={/^#[0-9a-fA-F]{6}$/.test(s.textColor) ? s.textColor : BUTTON_STYLE_DEFAULTS.textColor}
                      onChange={(e) => onChange({ ...element, textColor: e.target.value })}
                      style={{ width: 48, padding: 2, flex: "0 0 auto" }}
                    />
                    <input
                      value={element.textColor || s.textColor}
                      onChange={(e) => onChange({ ...element, textColor: e.target.value })}
                      placeholder={BUTTON_STYLE_DEFAULTS.textColor}
                    />
                  </div>
                </div>
                <div className="field">
                  <label>Fonte</label>
                  <select
                    value={element.fontFamily || s.fontFamily}
                    onChange={(e) => onChange({ ...element, fontFamily: e.target.value })}
                  >
                    {FONT_FAMILY_OPTIONS.map((f) => (
                      <option key={f.id} value={f.id}>{f.label}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Tamanho ({s.fontSize}px)</label>
                  <input
                    type="range"
                    min={10}
                    max={36}
                    step={1}
                    value={s.fontSize}
                    onChange={(e) => onChange({ ...element, fontSize: Number(e.target.value) })}
                  />
                </div>
                <div className="field">
                  <label>Peso</label>
                  <select
                    value={String(s.fontWeight)}
                    onChange={(e) => onChange({ ...element, fontWeight: Number(e.target.value) })}
                  >
                    <option value="400">Normal (400)</option>
                    <option value="600">Semi-negrito (600)</option>
                    <option value="700">Negrito (700)</option>
                  </select>
                </div>
                <div className="field">
                  <label>Forma</label>
                  <select
                    value={shape}
                    onChange={(e) =>
                      onChange({
                        ...element,
                        borderRadius: radiusForShape(e.target.value as ButtonShapeId),
                      })
                    }
                  >
                    {BUTTON_SHAPE_OPTIONS.map((o) => (
                      <option key={o.id} value={o.id}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Opacidade ({opacityPct}%)</label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={opacityPct}
                    onChange={(e) => {
                      const pct = Number(e.target.value);
                      onChange({ ...element, opacity: Math.round((pct / 100) * 100) / 100 });
                    }}
                  />
                </div>
                <div className="field">
                  <label>Borda (opcional)</label>
                  <div className="row">
                    <input
                      type="color"
                      value={/^#[0-9a-fA-F]{6}$/.test(element.borderColor || "") ? element.borderColor! : "#ffffff"}
                      onChange={(e) =>
                        onChange({
                          ...element,
                          borderColor: e.target.value,
                          borderWidth: element.borderWidth && element.borderWidth > 0 ? element.borderWidth : 2,
                        })
                      }
                      style={{ width: 48, padding: 2, flex: "0 0 auto" }}
                      title="Cor da borda"
                    />
                    <input
                      type="number"
                      min={0}
                      max={8}
                      step={1}
                      value={element.borderWidth ?? 0}
                      onChange={(e) =>
                        onChange({ ...element, borderWidth: Math.max(0, Number(e.target.value) || 0) })
                      }
                      placeholder="largura px"
                      title="Largura da borda (px)"
                    />
                  </div>
                </div>
                <div className="field">
                  <label>Padding vertical ({s.paddingY}px)</label>
                  <input
                    type="range"
                    min={4}
                    max={28}
                    step={1}
                    value={s.paddingY}
                    onChange={(e) => onChange({ ...element, paddingY: Number(e.target.value) })}
                  />
                </div>
              </>
            );
          })()}
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
        <>
          <div className="field">
            <label>Conteúdo</label>
            <textarea value={element.content} onChange={(e) => onChange({ ...element, content: e.target.value })} />
          </div>
          <div className="field">
            <label>Fonte</label>
            <select
              value={element.fontFamily || "system"}
              onChange={(e) => onChange({ ...element, fontFamily: e.target.value })}
            >
              {FONT_FAMILY_OPTIONS.map((f) => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Tamanho ({element.fontSize ?? 16}px)</label>
            <input
              type="range"
              min={10}
              max={48}
              step={1}
              value={element.fontSize ?? 16}
              onChange={(e) => onChange({ ...element, fontSize: Number(e.target.value) })}
            />
          </div>
          <div className="field">
            <label>Peso</label>
            <select
              value={String(element.fontWeight ?? 400)}
              onChange={(e) => onChange({ ...element, fontWeight: Number(e.target.value) })}
            >
              <option value="400">Normal (400)</option>
              <option value="500">Médio (500)</option>
              <option value="600">Semi-negrito (600)</option>
              <option value="700">Negrito (700)</option>
            </select>
          </div>
          <div className="field">
            <label>Cor</label>
            <div className="row">
              <input
                type="color"
                value={/^#[0-9a-fA-F]{6}$/.test(element.color || "") ? element.color! : "#e2e8f0"}
                onChange={(e) => onChange({ ...element, color: e.target.value })}
                style={{ width: 48, padding: 2, flex: "0 0 auto" }}
              />
              <input
                value={element.color || "#e2e8f0"}
                onChange={(e) => onChange({ ...element, color: e.target.value })}
                placeholder="#e2e8f0"
              />
            </div>
          </div>
          <div className="field">
            <label>Alinhamento</label>
            <select
              value={element.textAlign || "left"}
              onChange={(e) =>
                onChange({
                  ...element,
                  textAlign: e.target.value as "left" | "center" | "right",
                })
              }
            >
              <option value="left">Esquerda</option>
              <option value="center">Centro</option>
              <option value="right">Direita</option>
            </select>
          </div>
          <div className="field">
            <label>Altura da linha ({(element.lineHeight ?? 1.45).toFixed(2)})</label>
            <input
              type="range"
              min={1}
              max={2.5}
              step={0.05}
              value={element.lineHeight ?? 1.45}
              onChange={(e) => onChange({ ...element, lineHeight: Number(e.target.value) })}
            />
          </div>
        </>
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
                  type="button"
                  onClick={() => onChange({ ...element, items: element.items.filter((it) => it.id !== item.id) })}
                >×</button>
              </div>
            ))}
            <button
              className="btn"
              type="button"
              onClick={() => onChange({ ...element, items: [...element.items, { id: uid("item"), label: "Novo item" }] })}
            >Adicionar item</button>
          </div>
        </>
      )}

      <div style={{ marginTop: 16 }}>
        <button className="btn ghost danger" type="button" onClick={onRemove}>Remover elemento</button>
      </div>
    </div>
  );
}
