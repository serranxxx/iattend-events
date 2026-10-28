"use client";

import React, { createContext, useContext } from "react";
import type { DynamicBackground } from "@/types/new_invitation";
import type { Texture } from "@/lib/textures/cache";

// Fondo propio de un bloque (dynamic_background): color, imagen y/o textura,
// independientes entre sí y de la textura general de la invitación.
//
// El color sigue en la caja del módulo (backgroundColor). La imagen y la
// textura van en capas detrás del contenido: la caja lleva
// `isolation: isolate` (moduleBoxStyle) y las capas z-index -1, así quedan
// encima del color pero debajo del texto, y heredan el radio de la caja.

// Texturas disponibles (las mismas de la textura general): las pone
// Invitation.tsx para que los módulos no tengan que recibirlas.
export const ModuleTexturesContext = createContext<Texture[]>([]);

// ¿El bloque tiene algún fondo? Con cualquiera de los tres aplica su largo,
// radio y sombra.
export const hasModuleBg = (bg?: Partial<DynamicBackground> | null) =>
  Boolean(bg?.active || bg?.image || (bg?.texture !== null && bg?.texture !== undefined));

// Extras de la caja del bloque:
// - Relleno arriba / abajo: va como variable CSS (la usa
//   `.main_container[style*="--module-py"]` en styles/modules.css) para no
//   pelear con el `padding` que algunos módulos ponen en línea.
// - Con textura propia, el bloque sube sobre la textura general (TextureOverlay,
//   z-index 0 al final de la invitación): así se ve la suya, no la general
//   encima.
export const moduleBoxExtras = (bg?: Partial<DynamicBackground> | null): React.CSSProperties => ({
  ...(typeof bg?.padding_y === "number" ? { ["--module-py" as string]: `${bg.padding_y}px` } : {}),
  ...(bg?.texture !== null && bg?.texture !== undefined ? { zIndex: 1 } : {}),
}) as React.CSSProperties;

export function ModuleBackdrop({ bg }: { bg?: Partial<DynamicBackground> | null }) {
  const textures = useContext(ModuleTexturesContext);
  if (!bg) return null;
  const tex = bg.texture !== null && bg.texture !== undefined ? textures.find((t) => t.id === bg.texture) : null;
  if (!bg.image && !tex) return null;
  const layer: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    borderRadius: "inherit",
    pointerEvents: "none",
    zIndex: -1,
  };
  return (
    <>
      {bg.image && (
        <span
          aria-hidden
          style={{
            ...layer,
            backgroundImage: `url("${bg.image}")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: bg.image_opacity ?? 1,
          }}
        />
      )}
      {tex && (
        <span
          aria-hidden
          style={{
            ...layer,
            backgroundImage: `url("${tex.image}")`,
            backgroundSize: "60% auto",
            backgroundRepeat: "repeat",
            mixBlendMode: (tex.blend as React.CSSProperties["mixBlendMode"]) ?? "multiply",
            // Intensidad del bloque (editor) sobre la opacidad propia de la textura.
            opacity: (tex.opacity ?? 1) * (bg.texture_opacity ?? 1),
            filter: tex.filter ?? undefined,
          }}
        />
      )}
    </>
  );
}
