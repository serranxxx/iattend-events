/*
  Portada de un side event / Pop: una lista de 1 a 6 fotos o videos,
  mezclados (la arma la barra Fondo del editor de vite). Con uno es el fondo
  fijo; con varios, un carrusel que cambia solo con un fundido: cada foto
  dura CAMBIO_CARRUSEL_MS y cada video se reproduce completo cuando le toca.
  Cómo se guarda:
  - `body.images`: la lista completa cuando son 2 o más (fotos y videos).
  - `body.video`: el video cuando es lo único de la portada.
  - `body.image`: la primera FOTO (link, pase, dibujos anclados a la foto,
    cuadro fijo de un video).
  Un `images` viejo que ya no empieza con `body.image` y no trae videos no
  cuenta. Un video se reconoce por su URL (carpeta `video/` o extensión).
  Gemela en iattend-vite: src/modules/SideEvents/fotosPortada.js.
*/

export const CAMBIO_CARRUSEL_MS = 4500;

type ConFotos = { image?: string | null; images?: unknown; video?: string | null; imageFrame?: unknown; imageFrames?: unknown } | null | undefined;

export const esVideo = (url: unknown): url is string => typeof url === "string" && /\/video\/|\.(mp4|mov|webm|m4v)(\?|#|$)/i.test(url);

// Todo lo de la portada, en orden (fotos y videos).
export const mediaDePortada = (body: ConFotos): string[] => {
  const lista = Array.isArray(body?.images) ? body.images.filter((s): s is string => typeof s === "string" && Boolean(s.trim())) : [];
  if (lista.length > 1 && (lista[0] === body?.image || lista.some(esVideo))) return lista;
  if (body?.video) return [body.video];
  return body?.image ? [body.image] : [];
};

// Solo las fotos.
export const fotosDePortada = (body: ConFotos): string[] => mediaDePortada(body).filter((s) => !esVideo(s));

export const esCarrusel = (body: ConFotos) => mediaDePortada(body).length > 1;

/*
  Ajuste de cada foto o video: `body.imageFrames` = { [url]: { z, x, y } }
  (zoom sobre el cover de 1 a AJUSTE_ZOOM_MAX y encuadre en % como
  object-position); también se lee el `imageFrame` de una sola foto
  ({ src, z, x, y }). Se pinta con object-position + scale con el origen en el
  mismo punto (estiloAjuste), que da justo el recuadro de `cubrir`, donde se
  anclan los dibujos.
*/
export const AJUSTE_ZOOM_MAX = 3;
export type AjusteFoto = { z: number; x: number; y: number };
type AjusteGuardado = { src?: string; z?: number; x?: number; y?: number };

const acotar = (v: unknown, a: number, b: number, d: number) => (Number.isFinite(Number(v)) ? Math.min(b, Math.max(a, Number(v))) : d);

export const ajusteDe = (body: ConFotos, src: string | null | undefined): AjusteFoto | null => {
  if (!src) return null;
  const viejo = (body?.imageFrame as AjusteGuardado | null | undefined)?.src === src ? (body?.imageFrame as AjusteGuardado) : null;
  const a = (body?.imageFrames as Record<string, AjusteGuardado> | null | undefined)?.[src] ?? viejo;
  if (!a) return null;
  const z = acotar(a.z, 1, AJUSTE_ZOOM_MAX, 1);
  const x = acotar(a.x, 0, 100, 50);
  const y = acotar(a.y, 0, 100, 50);
  return z === 1 && x === 50 && y === 50 ? null : { z, x, y };
};

export const estiloAjuste = (a: AjusteFoto | null): React.CSSProperties | undefined =>
  a ? { objectPosition: `${a.x}% ${a.y}%`, transform: `scale(${a.z})`, transformOrigin: `${a.x}% ${a.y}%` } : undefined;

// Recuadro de una foto de w × h que cubre una caja de ancho × alto con el ajuste.
export const cubrir = ({ w, h }: { w: number; h: number }, ancho: number, alto: number, a?: AjusteFoto | null) => {
  const e = Math.max(ancho / w, alto / h) * (a?.z ?? 1);
  const width = w * e;
  const height = h * e;
  return { left: (ancho - width) * ((a?.x ?? 50) / 100), top: (alto - height) * ((a?.y ?? 50) / 100), width, height };
};

/*
  Desenfoque de la portada hacia abajo: `body.coverBlur` = { amount (px,
  0 = sin desenfoque), start (% de la pantalla donde empieza) }; sin valor,
  el de siempre (6 px desde el 40 %). Llega a todo el desenfoque 40 puntos
  más abajo. Con video de fondo no hay desenfoque. Gemela en vite.
*/
export const DESENFOQUE_BASE = { amount: 6, start: 40 };
type ConDesenfoque = { coverBlur?: { amount?: number; start?: number } | null } | null | undefined;
export const desenfoqueDe = (body: ConDesenfoque) => ({
  amount: acotar(body?.coverBlur?.amount, 0, 20, DESENFOQUE_BASE.amount),
  start: acotar(body?.coverBlur?.start, 0, 90, DESENFOQUE_BASE.start),
});
export const variablesDesenfoque = (body: ConDesenfoque) => {
  const d = desenfoqueDe(body);
  return { "--blur-portada": `${d.amount}px`, "--blur-inicio": `${d.start}%`, "--blur-fin": `${Math.min(100, d.start + 40)}%` } as React.CSSProperties;
};
