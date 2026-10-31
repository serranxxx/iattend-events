/*
  Fotos de la portada de un Flash: una sola (`body.image`) o un carrusel
  (`body.images`, que cambian solas con un fundido cada CAMBIO_CARRUSEL_MS).
  `body.image` es siempre la primera (link, pase, dibujos anclados a la
  foto). Con video no hay carrusel. Un `images` que ya no empieza con
  `body.image` no cuenta.
  Gemela en iattend-vite: src/modules/SideEvents/fotosPortada.js.
*/

export const CAMBIO_CARRUSEL_MS = 4500;

type ConFotos = { image?: string | null; images?: unknown; video?: string | null } | null | undefined;

export const fotosDePortada = (body: ConFotos): string[] => {
  const lista = Array.isArray(body?.images) ? body.images.filter((s): s is string => typeof s === "string" && Boolean(s.trim())) : [];
  if (lista.length > 1 && lista[0] === body?.image) return lista;
  return body?.image ? [body.image] : [];
};

export const esCarrusel = (body: ConFotos) => !body?.video && fotosDePortada(body).length > 1;
