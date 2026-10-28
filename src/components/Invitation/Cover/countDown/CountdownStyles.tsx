"use client";

import React from "react";

// Catálogo de estilos de la cuenta regresiva (handoff "Countdown Catálogo"):
// misma lógica y datos que Countdown, solo cambia la presentación. El estilo
// vive en cover.date.style; "1a" (o vacío) es el de siempre y lo pinta
// Countdown tal cual. Aquí van 1b … 1l.
//
// Todos van sin fondo propio, sobre la portada (el fondo de cada tarjeta del
// handoff era solo el lienzo de la muestra): el texto toma el color de la
// fecha (`text`). Lo que sí es parte del diseño se queda: las fichas del
// flip, el boleto, la línea del arco y la tarjeta de papel, con los roles de
// la paleta (primary = Fondo, secondary = Contraste, accent = Textos,
// actions = Acento). Fuentes: `sans` = la de la fecha / cuerpo, `serif` =
// la de títulos.

export const COUNTDOWN_STYLE_IDS = ["1a", "1b", "1c", "1d", "1e", "1f", "1g", "1h", "1i", "1j", "1k", "1l"] as const;
export type CountdownStyleId = (typeof COUNTDOWN_STYLE_IDS)[number];

type Units = "days" | "hours" | "minutes" | "seconds";
type TimeLeft = Record<Units, number>;
type Colors = { primary: string; secondary: string; accent: string; actions: string };

export type StyledCountdownProps = {
  styleId: CountdownStyleId;
  t: TimeLeft;
  target: Date;
  locale?: string | null;
  labels: Record<Units, string>;
  colors: Colors;
  text: string; // color del texto sobre foto (cover.date.color o el de títulos)
  sans: string;
  serif: string;
  names?: string | null;
};

const p2 = (n: number) => String(n).padStart(2, "0");

// Textos fijos de los estilos (es / en).
const COPY = {
  es: { left: "Faltan", seeYou: "Nos vemos en", save: "Guarda la fecha", forYes: "días para el sí", counting: "Contando los días", admits: "Admite · 1 invitado", days: "días", hours: "horas", short: ["días", "hrs", "min", "seg"], week: ["L", "M", "M", "J", "V", "S", "D"] },
  en: { left: "Only", seeYou: "See you in", save: "Save the date", forYes: "days until “I do”", counting: "Counting the days", admits: "Admits · 1 guest", days: "days", hours: "hours", short: ["days", "hrs", "min", "sec"], week: ["M", "T", "W", "T", "F", "S", "S"] },
};

// Mezcla un color con blanco (0–1) para fondos suaves.
const tint = (hex: string, amount: number) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex ?? "");
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  return `rgb(${mix((n >> 16) & 255)}, ${mix((n >> 8) & 255)}, ${mix(n & 255)})`;
};
const alpha = (hex: string, a: number) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex ?? "");
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

export function StyledCountdown({ styleId, t, target, locale, labels, colors, text, sans, serif, names }: StyledCountdownProps) {
  const en = (locale ?? "es").startsWith("en");
  const c = en ? COPY.en : COPY.es;
  const loc = locale || "es-MX";
  const units = (["days", "hours", "minutes", "seconds"] as Units[]).map((u, i) => ({ u, v: i === 0 ? String(t.days) : p2(t[u]), l: labels[u] }));
  // 1e, 1j, 1l: días en grande; con menos de un día, horas.
  const big = t.days > 0 ? { v: String(t.days), l: c.days } : { v: String(t.hours), l: c.hours };
  const day = target.getUTCDate();
  const monthLong = target.toLocaleDateString(loc, { month: "long", timeZone: "UTC" });
  const monthShort = target.toLocaleDateString(loc, { month: "short", timeZone: "UTC" }).replace(".", "").toUpperCase();
  const year = target.getUTCFullYear();
  const longDate = target.toLocaleDateString(loc, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const weekday = target.toLocaleDateString(loc, { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  // Todo el ancho disponible (el margen lo pone la portada).
  const wrap: React.CSSProperties = { width: "100%", boxSizing: "border-box" };

  switch (styleId) {
    // ── Serif minimal (sobre foto) ──
    case "1b":
      return (
        <div style={{ ...wrap, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, color: text, padding: "6px 0" }}>
          <span style={{ fontFamily: serif, fontStyle: "italic", fontSize: 20 }}>{c.left}</span>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 6, fontFamily: serif }}>
            {units.map((x, i) => (
              <div key={x.u} style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 46 }}>
                  <span style={{ fontSize: 38, fontWeight: 500, lineHeight: 1 }}>{x.v}</span>
                  <span style={{ fontFamily: sans, fontSize: 10, letterSpacing: 2.5, textTransform: "uppercase", marginTop: 6, opacity: 0.85 }}>{x.l}</span>
                </div>
                {i < 3 && <span style={{ fontSize: 34, lineHeight: 1.1, opacity: 0.5 }}>·</span>}
              </div>
            ))}
          </div>
          <span style={{ fontFamily: sans, fontSize: 11, letterSpacing: 3, opacity: 0.85 }}>{p2(day)} · {p2(target.getUTCMonth() + 1)} · {year}</span>
        </div>
      );

    // ── Tarjetas flip (papel) ──
    case "1c":
      return (
        <div style={{ ...wrap, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <span style={{ fontFamily: sans, fontSize: 12, letterSpacing: 3, textTransform: "uppercase", color: text }}>{c.seeYou}</span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8, width: "100%" }}>
            {units.map((x) => (
              <div key={x.u} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div style={{ width: "100%", height: 76, borderRadius: 12, background: colors.accent, position: "relative", display: "grid", placeItems: "center", boxShadow: `0 6px 14px ${alpha(colors.accent, 0.25)}` }}>
                  <span style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 1, background: "rgba(255,255,255,.14)" }} />
                  <span style={{ fontFamily: sans, fontSize: 30, fontWeight: 600, color: colors.primary }}>{x.v}</span>
                </div>
                <span style={{ fontFamily: sans, fontSize: 12, letterSpacing: 1, color: text }}>{x.l}</span>
              </div>
            ))}
          </div>
        </div>
      );

    // ── Anillos de progreso (sobre foto) ──
    case "1d": {
      const pct = [Math.min(100, (t.days / 365) * 100), (t.hours / 24) * 100, (t.minutes / 60) * 100, (t.seconds / 60) * 100];
      return (
        <div style={{ ...wrap, display: "flex", flexDirection: "column", alignItems: "center", gap: 14, color: text, padding: "4px 10px" }}>
          <span style={{ fontFamily: serif, fontSize: 22, fontWeight: 500 }}>{longDate}</span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10, width: "100%" }}>
            {units.map((x, i) => (
              <div key={x.u} style={{ aspectRatio: "1", borderRadius: "50%", padding: 3, display: "grid", placeItems: "center", background: `conic-gradient(${text} 0 ${pct[i].toFixed(1)}%, ${alpha(text.startsWith("#") ? text : "#FFFFFF", 0.2)} 0)` }}>
                <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: alpha(colors.accent, 0.8), display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontFamily: sans, fontSize: 20, fontWeight: 600, lineHeight: 1 }}>{x.v}</span>
                  <span style={{ fontFamily: sans, fontSize: 9.5, letterSpacing: 1, opacity: 0.8, marginTop: 3 }}>{x.l}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // ── Editorial · solo días (tarjeta clara) ──
    case "1e":
      return (
        <div style={{ ...wrap, display: "flex", flexDirection: "column", gap: 4, color: text }}>
          <span style={{ fontFamily: sans, fontSize: 11, letterSpacing: 3, textTransform: "uppercase", opacity: 0.6 }}>{c.left}</span>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontFamily: serif, fontSize: 96, fontWeight: 500, lineHeight: 0.9, letterSpacing: -3 }}>{big.v}</span>
            <span style={{ fontFamily: serif, fontStyle: "italic", fontSize: 28 }}>{big.l}</span>
          </div>
          <span style={{ height: 1, background: text, margin: "12px 0 8px" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: sans, fontSize: 13, opacity: 0.8 }}>
            <span>{p2(t.hours)} h · {p2(t.minutes)} min · {p2(t.seconds)} s</span>
            <span>{p2(day)}.{p2(target.getUTCMonth() + 1)}.{String(year).slice(2)}</span>
          </div>
        </div>
      );

    // ── Tarjeta de papel (sobre foto) ──
    case "1f": {
      const ink = colors.accent;
      const line = alpha(ink, 0.25);
      return (
        <div style={{ ...wrap, padding: 8, borderRadius: 4, background: tint(colors.primary, 0.4), boxShadow: "0 14px 30px rgba(0,0,0,.35)" }}>
          <div style={{ border: `1px solid ${line}`, padding: "14px 10px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, color: ink }}>
            <span style={{ fontFamily: serif, fontStyle: "italic", fontSize: 22 }}>{c.save}</span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", width: "100%" }}>
              {units.map((x, i) => (
                <div key={x.u} style={{ display: "flex", flexDirection: "column", alignItems: "center", borderLeft: i ? `1px solid ${line}` : "none" }}>
                  <span style={{ fontFamily: serif, fontSize: 32, fontWeight: 600, lineHeight: 1 }}>{x.v}</span>
                  <span style={{ fontFamily: sans, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", marginTop: 4 }}>{x.l}</span>
                </div>
              ))}
            </div>
            <span style={{ fontFamily: sans, fontSize: 11, letterSpacing: 3, color: colors.actions, textTransform: "uppercase" }}>{day} · {monthLong} · {year}</span>
          </div>
        </div>
      );
    }

    // ── Lista vertical (sólido) ──
    case "1g":
      return (
        <div style={{ ...wrap, display: "flex", flexDirection: "column", color: text }}>
          {units.map((x) => (
            <div key={x.u} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", borderBottom: `1px solid ${alpha(text, 0.25)}`, padding: "6px 0" }}>
              <span style={{ fontFamily: serif, fontSize: 36, fontWeight: 500, lineHeight: 1 }}>{x.v}</span>
              <span style={{ fontFamily: sans, fontSize: 12, letterSpacing: 3, textTransform: "uppercase", opacity: 0.75 }}>{x.l}</span>
            </div>
          ))}
        </div>
      );

    // ── Cápsulas de cristal (sobre foto) ──
    case "1h":
      return (
        <div style={{ ...wrap, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "0 6px" }}>
          <span style={{ fontFamily: sans, fontSize: 14, fontWeight: 500, color: text, letterSpacing: 1 }}>{cap(weekday)}</span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8, width: "100%" }}>
            {units.map((x) => (
              <div key={x.u} style={{ height: 92, borderRadius: 99, background: "rgba(255,255,255,.22)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,.35)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: text }}>
                <span style={{ fontFamily: sans, fontSize: 24, fontWeight: 600, lineHeight: 1 }}>{x.v}</span>
                <span style={{ fontFamily: sans, fontSize: 10.5, marginTop: 4, opacity: 0.9 }}>{x.l}</span>
              </div>
            ))}
          </div>
        </div>
      );

    // ── Calendario (papel) ──
    case "1i": {
      const y = target.getUTCFullYear();
      const m = target.getUTCMonth();
      const daysIn = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
      const offset = (new Date(Date.UTC(y, m, 1)).getUTCDay() + 6) % 7; // lunes = 0
      return (
        // El único con fondo: muy tenue, para que la cuadrícula se lea sobre la foto.
        <div style={{ ...wrap, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "16px 18px", borderRadius: 20, background: alpha(colors.primary, 0.14), backdropFilter: "blur(3px)", WebkitBackdropFilter: "blur(3px)", color: text }}>
          <span style={{ fontFamily: serif, fontSize: 24, fontWeight: 500 }}>{cap(monthLong)} {y}</span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 2, width: "100%", textAlign: "center", fontFamily: sans }}>
            {c.week.map((h, i) => <span key={`h${i}`} style={{ fontSize: 10, letterSpacing: 1, opacity: 0.55, paddingBottom: 4 }}>{h}</span>)}
            {Array.from({ length: offset }).map((_, i) => <span key={`e${i}`} />)}
            {Array.from({ length: daysIn }, (_, i) => i + 1).map((n) => {
              const on = n === day;
              return (
                <div key={n} style={{ height: 24, display: "grid", placeItems: "center" }}>
                  <span style={{ width: 24, height: 24, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 11.5, background: on ? colors.secondary : "transparent", color: on ? colors.primary : text, fontWeight: on ? 600 : 400 }}>{n}</span>
                </div>
              );
            })}
          </div>
          <span style={{ fontFamily: sans, fontSize: 13, letterSpacing: 1, whiteSpace: "nowrap" }}>
            {c.left} <b style={{ fontWeight: 600 }}>{t.days}</b> {c.days} · {p2(t.hours)}:{p2(t.minutes)}:{p2(t.seconds)}
          </span>
        </div>
      );
    }

    // ── Número gigante (sobre foto) ──
    case "1j":
      return (
        <div style={{ ...wrap, display: "flex", flexDirection: "column", alignItems: "center", color: text }}>
          <span style={{ fontFamily: sans, fontSize: 130, fontWeight: 700, lineHeight: 1, color: "transparent", WebkitTextStroke: `1.5px ${text}`, letterSpacing: -4 }}>{big.v}</span>
          <span style={{ fontFamily: serif, fontStyle: "italic", fontSize: 26, marginTop: 6 }}>{t.days > 0 ? c.forYes : big.l}</span>
          <span style={{ fontFamily: sans, fontSize: 12, letterSpacing: 2, opacity: 0.85, marginTop: 8, whiteSpace: "nowrap" }}>{p2(t.hours)} : {p2(t.minutes)} : {p2(t.seconds)}</span>
        </div>
      );

    // ── Boleto ──
    case "1k":
      return (
        <div style={wrap}>
          <div style={{ display: "flex", background: "#FFFFFF", borderRadius: 14, overflow: "hidden", boxShadow: `0 10px 24px ${alpha(colors.accent, 0.18)}` }}>
            <div style={{ flex: 1, padding: "16px 14px", display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
              <span style={{ fontFamily: sans, fontSize: 10, letterSpacing: 2.5, textTransform: "uppercase", color: "#787878" }}>{c.admits}</span>
              <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr 1fr", gap: 6 }}>
                {units.map((x, i) => (
                  <div key={x.u} style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontFamily: sans, fontSize: 20, fontWeight: 600, color: colors.accent, lineHeight: 1 }}>{x.v}</span>
                    <span style={{ fontFamily: sans, fontSize: 10, color: "#787878", marginTop: 3 }}>{c.short[i]}</span>
                  </div>
                ))}
              </div>
              {names && <span style={{ fontFamily: serif, fontSize: 18, fontStyle: "italic", color: colors.accent, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{names}</span>}
            </div>
            <div style={{ width: 0, borderLeft: `2px dashed ${alpha(colors.accent, 0.2)}`, margin: "10px 0" }} />
            <div style={{ width: 74, background: colors.accent, color: colors.primary, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, fontFamily: sans }}>
              <span style={{ fontSize: 11, letterSpacing: 2 }}>{monthShort}</span>
              <span style={{ fontSize: 30, fontWeight: 600, lineHeight: 1 }}>{day}</span>
              <span style={{ fontSize: 11, letterSpacing: 2 }}>{year}</span>
            </div>
          </div>
        </div>
      );

    // ── Arco ──
    case "1l":
      return (
        <div style={{ ...wrap, display: "flex", justifyContent: "center", padding: "0 36px" }}>
          <div style={{ width: "100%", borderRadius: "160px 160px 0 0", border: `1.5px solid ${text}`, borderBottom: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "26px 0 18px", color: text }}>
            <span style={{ fontFamily: serif, fontStyle: "italic", fontSize: 21 }}>{c.counting}</span>
            <span style={{ fontFamily: serif, fontSize: 60, fontWeight: 500, lineHeight: 0.9 }}>{big.v}</span>
            <span style={{ fontFamily: sans, fontSize: 11, letterSpacing: 3, textTransform: "uppercase" }}>{big.l}</span>
            <div style={{ display: "flex", gap: 16, fontFamily: sans, fontSize: 12, letterSpacing: 1, marginTop: 4 }}>
              <span>{p2(t.hours)} h</span><span>{p2(t.minutes)} m</span><span>{p2(t.seconds)} s</span>
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
}
