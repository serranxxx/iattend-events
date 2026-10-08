"use client";

import { forwardRef } from "react";
import Image from "next/image";
import { DynamicBackground, DynamicSeparator, Generals } from "@/types/new_invitation";
import { Separador } from "../Separator/Separator";
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
  { background, secondary, maxWidth, bleed = false, flush = false, separator, inverted, generals, children },
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

      {separator?.active && (
        separator.type === "single" ? (
          <Separador inverted={inverted} generals={generals} value={separator.single?.value ?? 1} />
        ) : (
          <div
            className={`dyn_separator_cont ${styles.separator_image}`}
            style={{ width: `${separator.image?.width}%`, minHeight: `${separator.image?.height}px` }}
          >
            {separator.image?.value && (
              <Image fill src={separator.image.value} alt="" style={{ objectFit: "cover" }} />
            )}
          </div>
        )
      )}
    </section>
  );
});
