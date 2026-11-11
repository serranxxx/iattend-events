import type { SideEventBody } from "@/types/side_event";

/*
  Patrocinadores de un Pop (handoff "Patrocinadores en un Pop", v2 · categorías):
  body.sponsors = { enabled, layout: 'portada' | 'tarjeta' | 'banda', speed,
    label, defaultCat, cats: [{ id, name, size: 'l' | 'm' | 's', color }],
    items: [{ id, url, name, cat, w, h }] }.
  Siempre hay al menos una categoría. `color: false` = adaptar al diseño
  (blancos sobre la foto, la tinta del estilo en la tarjeta). Lo guardado con
  la v1 (niveles `tier` y `mono`) se lee convertido a categorías.
  Reglas gemelas: iattend-vite/src/modules/SideEvents/patrocinadores.js (si
  cambia una, cambia la otra). Los tamaños son px de la pieza de 390 de ancho.
*/

export type Acomodo = "portada" | "tarjeta" | "banda";
export type TamanoCat = "l" | "m" | "s";
export type CategoriaPatrocinio = { id: string; name: string; size: TamanoCat; color: boolean };
export type Patrocinador = { id: string; url: string; name?: string | null; cat: string; w?: number | null; h?: number | null };
export type LogoMedido = Patrocinador & { ancho: number; alto: number; adaptar: boolean };
export type Medida = { area: number; maxH: number; maxW: number };

export const ACOMODOS: Acomodo[] = ["portada", "tarjeta", "banda"];
export const TAMANOS_CAT: TamanoCat[] = ["l", "m", "s"];
export const VELOCIDADES = [0.5, 1, 1.8];
export const ETIQUETA_DEFAULT = "CON EL APOYO DE";
export const NOMBRE_INICIAL = "Patrocinadores";

export const TAMANOS: Record<TamanoCat, Medida> = {
  l: { area: 5600, maxH: 56, maxW: 150 },
  m: { area: 2100, maxH: 34, maxW: 110 },
  s: { area: 1000, maxH: 24, maxW: 80 },
};
export const MEDIDA_PORTADA: Medida = { area: 800, maxH: 20, maxW: 72 };
export const GAP = { tarjeta: 18, bandaFija: 30, cinta: 30, portada: 22 };
export const ANCHO_FILA = { tarjeta: 298, bandaFija: 330 };

export const CINTA = {
  portada: { sp: 0.025, k: 0 },
  banda: { sp: 0.03, k: 0.45 },
};

const V1 = [
  { tier: "p", id: "v1-p", name: "Presentado por", size: "l" as TamanoCat },
  { tier: "s", id: "v1-s", name: "Patrocinadores", size: "m" as TamanoCat },
  { tier: "a", id: "v1-a", name: "Aliados", size: "s" as TamanoCat },
];
const CAT_INICIAL = "patrocinadores";

type Crudo = NonNullable<SideEventBody["sponsors"]> & { mono?: boolean | null };
type ItemCrudo = { id: string; url: string; name?: string | null; cat?: string | null; tier?: string | null; w?: number | null; h?: number | null };

export const normalizarPatrocinadores = (raw?: Crudo | null) => {
  const s = (raw ?? {}) as Crudo;
  const items = ((Array.isArray(s.items) ? s.items : []) as ItemCrudo[]).filter((it) => it?.url);
  let cats: CategoriaPatrocinio[] = Array.isArray(s.cats)
    ? s.cats.filter((c) => c?.id).map((c) => ({ id: c.id, name: c.name ?? "", size: TAMANOS_CAT.includes(c.size as TamanoCat) ? (c.size as TamanoCat) : "m", color: Boolean(c.color) }))
    : [];
  let defaultCat = s.defaultCat ?? "";
  if (!cats.length) {
    const color = s.mono === false;
    const v1 = V1.filter((v) => items.some((it) => (it.tier ?? "s") === v.tier));
    if (items.some((it) => it.tier) && v1.length) {
      cats = v1.map(({ id, name, size }) => ({ id, name, size, color }));
      defaultCat = v1.some((v) => v.tier === "s") ? "v1-s" : cats[cats.length - 1].id;
    } else {
      cats = [{ id: CAT_INICIAL, name: NOMBRE_INICIAL, size: "m", color }];
      defaultCat = CAT_INICIAL;
    }
  }
  const ids = new Set(cats.map((c) => c.id));
  if (!ids.has(defaultCat)) defaultCat = cats[cats.length - 1].id;
  const catDe = (it: ItemCrudo) => (it.cat && ids.has(it.cat) ? it.cat : it.tier && ids.has(`v1-${it.tier}`) ? `v1-${it.tier}` : defaultCat);
  return {
    enabled: s.enabled !== false,
    // Estado inicial: la tarjeta.
    layout: (ACOMODOS.includes(s.layout as Acomodo) ? s.layout : "tarjeta") as Acomodo,
    speed: VELOCIDADES.includes(s.speed as number) ? (s.speed as number) : 1,
    label: s.label || ETIQUETA_DEFAULT,
    defaultCat,
    cats,
    items: items.map(({ tier, ...it }) => ({ ...it, cat: catDe({ ...it, tier }) })) as Patrocinador[],
  };
};

export type Patrocinadores = ReturnType<typeof normalizarPatrocinadores>;

export const patrocinadoresDe = (body?: SideEventBody | null) => normalizarPatrocinadores(body?.sponsors as Crudo | null | undefined);

export const hayPatrocinadores = (body?: SideEventBody | null) => {
  const s = patrocinadoresDe(body);
  return s.enabled && s.items.length > 0;
};

// Categorías en orden con sus marcas (solo las que tienen).
export const porCategoria = (s: Patrocinadores) =>
  s.cats.map((cat) => ({ cat, items: s.items.filter((it) => it.cat === cat.id) })).filter((g) => g.items.length);

export const medir = (it: Patrocinador, { area, maxH, maxW }: Medida) => {
  const r = (it?.w ?? 0) > 0 && (it?.h ?? 0) > 0 ? (it.w as number) / (it.h as number) : 2;
  let w = Math.sqrt(area * r);
  let h = w / r;
  if (h > maxH) { h = maxH; w = h * r; }
  if (w > maxW) { w = maxW; h = w / r; }
  return { ...it, ancho: Math.round(w), alto: Math.round(h) };
};

// Filas de ancho parejo, sin logo huérfano en la última. Logos ya medidos.
export const acomodar = <T extends { ancho: number }>(medidos: T[], { width, gap }: { width: number; gap: number }) => {
  if (!medidos.length) return [] as T[][];
  const total = medidos.reduce((s, x) => s + x.ancho, 0) + gap * (medidos.length - 1);
  const n = Math.max(1, Math.ceil(total / width));
  const objetivo = total / n;
  const filas: T[][] = [];
  let fila: T[] = [];
  let ancho = 0;
  medidos.forEach((it) => {
    const suma = (fila.length ? gap : 0) + it.ancho;
    if (fila.length && (ancho + suma > width || (ancho + suma / 2 > objetivo && filas.length < n - 1))) {
      filas.push(fila);
      fila = [];
      ancho = 0;
    }
    ancho += (fila.length ? gap : 0) + it.ancho;
    fila.push(it);
  });
  if (fila.length) filas.push(fila);
  return filas;
};

// Logos de una categoría medidos con su tamaño (o `medida`) y su color.
export const logosDe = (items: Patrocinador[], cat: CategoriaPatrocinio, medida: Medida = TAMANOS[cat.size]): LogoMedido[] =>
  items.map((it) => ({ ...medir(it, medida), adaptar: !cat.color }));

export const repeticionesCinta = (medidos: { ancho: number }[], gap: number, puntos: boolean, ancho = 800) => {
  const copia = medidos.reduce((s, x) => s + x.ancho + gap + (puntos ? 4 + gap : 0), 0);
  if (!copia) return 4;
  return 2 * Math.max(2, Math.ceil(ancho / copia));
};

export const filtroAdaptado = (oscuro = false) => (oscuro ? "brightness(0)" : "brightness(0) invert(1)");

export const etiquetaCategoria = (cat?: CategoriaPatrocinio | null) => String(cat?.name ?? "").trim().toUpperCase();
