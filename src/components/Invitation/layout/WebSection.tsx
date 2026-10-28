"use client";

import { forwardRef } from "react";
import { DynamicBackground, DynamicSeparator, Generals } from "@/types/new_invitation";
import styles from "./web-section.module.css";

type WebSectionProps = {
  background?: DynamicBackground;
  secondary: string;
  // Ancho máximo del contenido; sin él ocupa toda la columna.
  maxWidth?: number;
  // Sin padding horizontal (la galería se sale hasta los bordes de la columna).
  bleed?: boolean;
  // Sin padding alguno (la frase con imagen ocupa la sección completa).
  flush?: boolean;
  // Se reciben por compatibilidad: el separador ya lo pinta Invitation.tsx.
  separator?: DynamicSeparator;
  inverted?: boolean;
  generals: Generals;
  children?: React.ReactNode;
};

/**
 * Sección de un módulo en el layout web (≥768). Con `dynamic_background`
 * activo se vuelve una banda a todo lo ancho de la columna en vez de la caja
 * al `width%` que se usa en móvil.
 */
export const WebSection = forwardRef<HTMLDivElement, WebSectionProps>(function WebSection(
  { background, secondary, maxWidth, bleed = false, flush = false, children },
  ref,
) {
  const isBand = Boolean(background?.active);
  const className = [
    styles.section,
    isBand ? styles.band : "",
    isBand && background?.shadow ? styles.band_shadow : "",
    bleed ? styles.bleed : "",
    flush ? styles.flush : "",
  ].join(" ");

  return (
    <section ref={ref} className={className} style={{ backgroundColor: isBand ? secondary : undefined }}>
      {children && (
        <div className={styles.inner} style={{ maxWidth }}>
          {children}
        </div>
      )}

      {/* El separador de cada bloque lo pinta Invitation.tsx entre bloques
          (separatorAfter), en los dos layouts: aquí ya no, o salía doble. */}
    </section>
  );
});
