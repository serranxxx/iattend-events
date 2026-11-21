/*
  Botones con link sobre una invitación en PDF (`decorations.pdf`, elementos
  `kind: "boton"`, herramienta Botones del editor de iattend-vite). Cada uno
  con su texto, link, colores (fondo, texto, borde) y estilo. Gemela:
  iattend-vite/src/modules/Invitation/Pdf/botonesPdf.js.
*/
import type { LayerItem } from "@/types/new_invitation";

// "transparente": zona invisible con link, sin texto (para tocar algo que ya
// viene dibujado en el PDF). Su alto es libre (`ar` = alto / ancho, como las
// formas) y en el editor se ve punteada; el invitado no la ve.
export const ESTILOS_BOTON = ["pildora", "redondeado", "recto", "relieve", "vidrio", "transparente"] as const;
export type EstiloBoton = (typeof ESTILOS_BOTON)[number];

export const estiloBoton = (it: Pick<LayerItem, "variant">): EstiloBoton =>
  (ESTILOS_BOTON as readonly string[]).includes(it.variant ?? "") ? (it.variant as EstiloBoton) : "pildora";

// Link que se puede abrir: sin esquema se le pone https://. Teléfono, correo y
// WhatsApp van tal cual. Vacío o raro = sin link.
export const linkDeBoton = (url?: string | null): string | null => {
  const u = (url ?? "").trim();
  if (!u) return null;
  if (/^(https?:|mailto:|tel:|sms:)/i.test(u)) return u;
  if (/^[\w.-]+@[\w.-]+\.\w+$/.test(u)) return `mailto:${u}`;
  if (/^\+?[\d\s()-]{7,}$/.test(u)) return `tel:${u.replace(/[^\d+]/g, "")}`;
  if (/^[\w-]+(\.[\w-]+)+(\/.*)?$/i.test(u)) return `https://${u}`;
  return null;
};

// Tamaño de letra = ancho del botón × factor (en cqw del PDF), como los textos.
export const LETRA_BOTON = 0.085;

export const esTransparente = (it: Pick<LayerItem, "kind" | "variant">): boolean =>
  it.kind === "boton" && it.variant === "transparente";

// Alto / ancho de una zona transparente nueva o sin `ar`.
export const AR_TRANSPARENTE = 0.35;
