"use client";

import { useEffect, useState } from "react";

/*
  Vectores (elementos `{ kind: "icon", src, vector: true }`): el SVG se pinta
  en línea, no como máscara, para poder cambiarle color Y grosor del trazo.
  Contraparte en el editor: iattend-vite/src/modules/Editor/vector.js
  (mismas reglas; si cambias una, cambia la otra).

    color        → trazo y relleno (todo lo que no sea "none" pasa a currentColor)
    strokeRel    → grosor como fracción del ancho del vector (escala con él)
    strokePx     → grosor en px de pantalla cuando `strokeFixed`
    strokeFixed  → grosor fijo al escalar (non-scaling stroke)
  Sin strokeRel / strokePx se respeta el grosor original del archivo.
*/

export type VectorInfo = { markup: string; vbW: number; vbH: number; baseStroke: number };
export type VectorFields = { strokeRel?: number | null; strokePx?: number | null; strokeFixed?: boolean | null };

const SHAPES = "path, circle, ellipse, line, polyline, polygon, rect, text";
const PELIGROSOS = 'script, foreignObject, metadata, title, desc, iframe, a, image, use[href^="http"], style';

const conPx = (v: string) => (/^[\d.]+$/.test(v.trim()) ? `${v}px` : v);

const reglasDeClase = (svg: Element) => {
  const reglas: [string, string][] = [];
  svg.querySelectorAll("style").forEach((st) => {
    const css = (st.textContent ?? "").replace(/\/\*[\s\S]*?\*\//g, "");
    for (const m of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
      m[1].split(",").map((x) => x.trim()).filter((x) => /^\.[\w-]+$/.test(x))
        .forEach((sel) => reglas.push([sel.slice(1), m[2].trim()]));
    }
  });
  return reglas;
};

const estiloDe = (el: Element): Record<string, string> =>
  Object.fromEntries((el.getAttribute("style") ?? "")
    .split(";").map((d) => d.split(":").map((x) => x.trim())).filter(([k, v]) => k && v));

const guardaEstilo = (el: Element, obj: Record<string, string>) => {
  const txt = Object.entries(obj).map(([k, v]) => `${k}:${v}`).join(";");
  if (txt) el.setAttribute("style", txt);
  else el.removeAttribute("style");
};

const efectivo = (el: Element, prop: string, raiz: Element): string | null => {
  for (let n: Element | null = el; n; n = n === raiz ? null : n.parentElement) {
    const v = estiloDe(n)[prop] ?? n.getAttribute(prop);
    if (v != null && v !== "inherit") return v;
  }
  return null;
};

const pinta = (v: string | null | undefined): v is string =>
  v != null && v !== "none" && v !== "transparent" && !v.startsWith("url(");

export const procesarVector = (texto: string): VectorInfo | null => {
  if (typeof DOMParser === "undefined") return null;
  const doc = new DOMParser().parseFromString(texto, "image/svg+xml");
  const svg = doc.documentElement;
  if (!svg || svg.nodeName.toLowerCase() !== "svg" || doc.querySelector("parsererror")) return null;

  reglasDeClase(svg).forEach(([clase, decl]) => svg.querySelectorAll(`.${CSS.escape(clase)}`).forEach((el) => {
    el.setAttribute("style", `${decl};${el.getAttribute("style") ?? ""}`);
  }));
  svg.querySelectorAll(PELIGROSOS).forEach((n) => n.remove());
  const todos = [svg, ...Array.from(svg.querySelectorAll("*"))];
  todos.forEach((el) => {
    Array.from(el.attributes).forEach((a) => {
      const n = a.name.toLowerCase();
      if (n.startsWith("on") || n === "class" || ((n === "href" || n === "xlink:href") && !a.value.trim().startsWith("#"))) el.removeAttribute(a.name);
    });
  });

  const vb = (svg.getAttribute("viewBox") ?? "").split(/[\s,]+/).map(Number);
  const vbW = vb.length === 4 && vb[2] > 0 ? vb[2] : parseFloat(svg.getAttribute("width") ?? "") || 100;
  const vbH = vb.length === 4 && vb[3] > 0 ? vb[3] : parseFloat(svg.getAttribute("height") ?? "") || 100;
  if (vb.length !== 4) svg.setAttribute("viewBox", `0 0 ${vbW} ${vbH}`);

  let baseStroke = 0;
  todos.forEach((el) => {
    const st = estiloDe(el);
    (["fill", "stroke"] as const).forEach((prop) => {
      if (st[prop] != null) { if (pinta(st[prop])) st[prop] = "currentColor"; }
      else if (pinta(el.getAttribute(prop))) el.setAttribute(prop, "currentColor");
    });
    if (el === svg && st.fill == null && el.getAttribute("fill") == null) el.setAttribute("fill", "currentColor");
    if (el.matches(SHAPES)) {
      const orig = efectivo(el, "stroke-width", svg) ?? "1";
      if (!baseStroke && pinta(efectivo(el, "stroke", svg))) baseStroke = parseFloat(orig) || 1;
      st["stroke-width"] = `var(--v-sw, ${conPx(orig)})`;
      st["vector-effect"] = "var(--v-ve, none)";
    }
    guardaEstilo(el, st);
  });

  ["width", "height", "xmlns:c2pa"].forEach((a) => svg.removeAttribute(a));
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "100%");
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.setAttribute("overflow", "visible");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");

  return { markup: new XMLSerializer().serializeToString(svg), vbW, vbH, baseStroke };
};

const pendientes = new Map<string, Promise<VectorInfo | null>>();
const listos = new Map<string, VectorInfo | null>();

export const cargarVector = (src: string) => {
  if (!pendientes.has(src)) {
    pendientes.set(src, fetch(src)
      .then((r) => (r.ok ? r.text() : null))
      .then((txt) => (txt ? procesarVector(txt) : null))
      .catch(() => null)
      .then((info) => { listos.set(src, info); return info; }));
  }
  return pendientes.get(src)!;
};

export const useVector = (src?: string | null) => {
  const [info, setInfo] = useState<VectorInfo | null>(() => (src ? listos.get(src) ?? null : null));
  useEffect(() => {
    if (!src) return;
    let vivo = true;
    if (listos.has(src)) setInfo(listos.get(src) ?? null);
    else cargarVector(src).then((i) => { if (vivo) setInfo(i); });
    return () => { vivo = false; };
  }, [src]);
  return info;
};

// SVG de la categoría Vectores del catálogo (editor-assets/vectores/…). Como
// ícono de un momento ("svg:<url>") se pintan en línea con trazo fijo; los
// demás SVG del catálogo siguen como máscara.
export const esUrlDeVector = (url?: string | null) => /\/editor-assets\/vectores\//.test(url ?? "");

// Trazo de un ícono de `size` px: el de los íconos de Lucide (1.6 a 24 px).
export const trazoDeIcono = (size: number) => Math.round(size * (1.6 / 24) * 100) / 100;

export const estiloVector = (s: VectorFields, info: VectorInfo | null): Record<string, string> => {
  if (s.strokeFixed && (s.strokePx ?? 0) > 0) return { "--v-sw": `${s.strokePx}px`, "--v-ve": "non-scaling-stroke" };
  if ((s.strokeRel ?? 0) > 0 && info) return { "--v-sw": `${(s.strokeRel as number) * info.vbW}px` };
  return {};
};
