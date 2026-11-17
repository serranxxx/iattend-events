/*
  Invitación en PDF (`invitations.data.formato === 'pdf'`).
  Gemela: iattend-vite/src/modules/Invitation/Pdf/pdfInvitacion.js.

  El PDF llega ya convertido a imágenes (lo hace el editor de vite al subirlo):
  `data.pdf.pages` = [{ url, w, h, pagina }] — una página larga va en tramos
  con el mismo `pagina`. Colores, texturas y pase son los de siempre
  (`generals.colors`, `generals.texture`, `wallet`): el panel Diseño del editor.
*/

import type { NewInvitation } from "@/types/new_invitation";

export type PaginaPdf = { url: string; w: number; h: number; pagina?: number };
export type DatosPdf = {
  pages?: PaginaPdf[];
  paginas?: number;
  source?: string | null;
  fileName?: string;
};

type ConPdf = { formato?: string; pdf?: DatosPdf };

export const esPdf = (data: unknown): boolean => (data as ConPdf | null)?.formato === "pdf";

export const datosPdf = (data: unknown): DatosPdf => (data as ConPdf | null)?.pdf ?? {};

export const coloresDe = (inv: NewInvitation) => {
  const c = inv?.generals?.colors;
  return {
    primary: c?.primary ?? "#FFFFFF",
    secondary: c?.secondary ?? "#FFFFFF",
    accent: c?.accent ?? "#29262D",
    actions: c?.actions ?? "#29262D",
  };
};

// Portada para lo que la usa fuera de la invitación (Photo Wall, pase de
// Wallet, imagen del link): en una invitación en PDF, la primera página.
// Mismo formato que `cover.image.prod` (una URL o una lista).
export const fuenteDePortada = (inv: unknown): unknown => {
  if (esPdf(inv)) {
    const primera = datosPdf(inv).pages?.[0]?.url;
    if (primera) return primera;
  }
  return (inv as NewInvitation | null)?.cover?.image?.prod;
};
