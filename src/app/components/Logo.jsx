import React from "react";

/**
 * Reusable Logo component
 * - Uses fixed dimensions: 143x58
 * - Uses inline styles only
 * - Assumes `/public/Logo.jpg` exists with correct casing
 */
export default function Logo({
  title = "App Logo",
  onClick,
  style = {},
}) {
  return (
    <img
      src="/Logo.png"
      alt={title}
      aria-label={title}
      loading="lazy"
      decoding="async"
      onClick={onClick}
      style={{
        width: "143px",
        height: "128px",
        display: "block",
        objectFit: "contain",
        ...style,
      }}
    />
  );
}

export function LogoWithText({
  title = "Talent On Cloud",
  text = "Talent On Cloud",
  gap = 8,
  containerStyle = {},
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        ...containerStyle,
      }}
    >
      <Logo title={title} />
      <span style={{ marginLeft: gap }}>{text}</span>
    </div>
  );
}
