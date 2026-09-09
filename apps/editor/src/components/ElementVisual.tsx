import type { CSSProperties } from "react";
import type { ContentElement } from "../types/content";
import {
  emojiFromSrc,
  fontCss,
  isEmojiSrc,
  resolveButtonStyle,
  resolveMediaSrc,
} from "../types/content";

type Props = {
  el: ContentElement;
  /** Preview: botões disparam ação; edit: só aparência */
  interactive?: boolean;
  onButtonClick?: () => void;
  checks?: Record<string, boolean>;
  onToggleCheck?: (itemId: string, checked: boolean) => void;
};

/** Aparência “de app” — botão, imagem, vídeo, checklist, texto. */
export function ElementVisual({
  el, interactive, onButtonClick, checks, onToggleCheck,
}: Props) {
  if (el.type === "button") {
    const s = resolveButtonStyle(el);
    const style: CSSProperties = {
      background: s.bgColor,
      color: s.textColor,
      fontFamily: fontCss(s.fontFamily),
      fontSize: `${s.fontSize}px`,
      fontWeight: s.fontWeight,
      borderRadius: s.borderRadius >= 100 ? 9999 : s.borderRadius,
      opacity: s.opacity,
      padding: `${s.paddingY}px 14px`,
      border:
        s.borderWidth && s.borderWidth > 0
          ? `${s.borderWidth}px solid ${s.borderColor || "#ffffff"}`
          : "none",
      boxShadow: "0 4px 12px rgba(15, 23, 42, 0.25)",
      height: el.h != null ? "100%" : undefined,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      textAlign: "center",
      boxSizing: "border-box",
      cursor: interactive ? "pointer" : "default",
    };
    return (
      <button
        type="button"
        className="phone-btn phone-btn-styled"
        style={style}
        onClick={(e) => {
          if (!interactive) return;
          e.stopPropagation();
          onButtonClick?.();
        }}
      >
        {el.label || "Botão"}
      </button>
    );
  }

  if (el.type === "text") {
    const style: CSSProperties = {
      fontFamily: fontCss(el.fontFamily),
      fontSize: el.fontSize != null ? `${el.fontSize}px` : undefined,
      fontWeight: el.fontWeight ?? undefined,
      color: el.color || undefined,
      textAlign: el.textAlign || "left",
      lineHeight: el.lineHeight ?? undefined,
    };
    return (
      <p className="phone-text" style={style}>
        {el.content || "Texto"}
      </p>
    );
  }

  if (el.type === "image") {
    if (!el.src) {
      return <div className="phone-placeholder">🖼️ Imagem</div>;
    }
    if (isEmojiSrc(el.src)) {
      return (
        <div className="phone-emoji" style={{ fontSize: el.role === "icon" ? 32 : 48 }}>
          {emojiFromSrc(el.src)}
        </div>
      );
    }
    return (
      <img
        className="phone-img"
        src={resolveMediaSrc(el.src)}
        alt={el.alt || ""}
        draggable={false}
        style={{
          objectFit: el.fit || "contain",
          width: "100%",
          height: el.h != null ? "100%" : (el.height ? el.height : "auto"),
          maxHeight: el.h != null ? "100%" : (el.role === "icon" ? 56 : 160),
          flex: el.h != null ? 1 : undefined,
        }}
      />
    );
  }

  if (el.type === "video") {
    return (
      <div className="phone-video">
        <div className="phone-video-play">▶</div>
        <div className="phone-video-title">{el.title || "Vídeo"}</div>
        <div className="phone-video-url">{el.url || "Sem URL"}</div>
      </div>
    );
  }

  if (el.type === "checklist") {
    return (
      <div className="phone-checklist">
        <div className="phone-checklist-title">{el.title || "Checklist"}</div>
        {el.items.map((item) => (
          <label key={item.id} className="phone-check-item" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              disabled={!interactive}
              checked={!!checks?.[item.id]}
              onChange={(e) => onToggleCheck?.(item.id, e.target.checked)}
            />
            <span>{item.label}</span>
          </label>
        ))}
      </div>
    );
  }

  return null;
}
