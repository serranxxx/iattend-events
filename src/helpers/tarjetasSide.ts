import type React from "react";
import type { SideEventBody } from "@/types/side_event";

/*
  Tarjetas de un side event / Flash debajo de la portada (Asistentes,
  Itinerario, Cómo llegar, Notas, Clima): orden y cuáles se ocultan, como las
  acomoda el panel Capas del editor. Contraparte:
  iattend-vite/src/modules/SideEvents/tarjetasSide.js (mismas reglas).

  body.cards       → [{ key, hidden }] en orden. Sin él, el orden de siempre;
                     una llave que falte va al final.
  body.coverHidden → { title, date, place }: textos de la portada ocultos.
  Asistentes y Clima guardan su "oculto" en showAttendees / hideWeather.
*/

export type TarjetaSide = "registration" | "attendees" | "itinerary" | "map" | "notes" | "weather";

// Registro va primero: después de confirmar es lo que sigue.
export const ORDEN_TARJETAS: TarjetaSide[] = ["registration", "itinerary", "map", "notes", "attendees", "weather"];

const SOLO_FLASH = new Set<TarjetaSide>(["registration", "attendees", "itinerary"]);
const aplica = (key: TarjetaSide, esFlash: boolean) => esFlash || !SOLO_FLASH.has(key);

const ocultaDe = (body: SideEventBody | undefined, key: TarjetaSide) => {
  if (key === "registration") return !body?.form?.enabled;
  if (key === "attendees") return !body?.showAttendees;
  if (key === "weather") return Boolean(body?.hideWeather);
  return Boolean((body?.cards ?? []).find((c) => c.key === key)?.hidden);
};

export const tarjetasDe = (body: SideEventBody | undefined, esFlash: boolean) => {
  const guardadas = (Array.isArray(body?.cards) ? body.cards : [])
    .map((c) => c.key as TarjetaSide)
    .filter((k) => ORDEN_TARJETAS.includes(k));
  const orden = [...new Set([...guardadas, ...ORDEN_TARJETAS])];
  return orden.filter((k) => aplica(k, esFlash)).map((key) => ({ key, hidden: ocultaDe(body, key) }));
};

export const portadaOculta = (body: SideEventBody | undefined, key: "title" | "date" | "place") =>
  Boolean(body?.coverHidden?.[key]);

// Estilo del texto de Notas (body.notes_style, barra de texto del editor).
// Sin él, el de siempre: Poppins 14, blanco con mezcla soft-light, centrado.
export const estiloNotas = (body: SideEventBody | undefined): React.CSSProperties => {
  const n = body?.notes_style ?? {};
  return {
    fontFamily: n.font ?? "Poppins",
    fontSize: `${n.size ?? 14}px`,
    fontWeight: n.weight ?? 400,
    lineHeight: n.line_height ?? 1.5,
    opacity: n.opacity ?? 1,
    textAlign: (n.align ?? "center") as React.CSSProperties["textAlign"],
    mixBlendMode: n.color ? "normal" : "soft-light",
    color: n.color || "#FFFFFF",
    ...(n.italic ? { fontStyle: "italic" } : {}),
    ...((n.underline || n.strike) ? { textDecoration: [n.underline && "underline", n.strike && "line-through"].filter(Boolean).join(" ") } : {}),
    ...(n.transform && n.transform !== "none" ? { textTransform: n.transform } : {}),
    ...(typeof n.letterSpacing === "number" ? { letterSpacing: `${n.letterSpacing / 100}em` } : {}),
  };
};
