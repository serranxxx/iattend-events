"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./slide-overlay.module.css";

type SlideOverlayProps = {
  open: boolean;
  children: React.ReactNode;
  zIndex?: number;
};

const EXIT_DURATION_MS = 320;

// Contenedor genérico para overlays de pantalla completa (Confirm, Lia,
// PhotoWall...) con transición horizontal de entrada/salida tipo stories de
// Instagram, en vez de los Modal/Drawer de antd que no comparten el mismo
// estilo de animación entre sí.
//
// React desmonta hijos condicionales de inmediato, sin dejar correr una
// animación de salida — por eso este componente sigue "rendered" un poco
// más de tiempo que "open": cuando open pasa a false, primero dispara la
// transición de vuelta hacia la derecha, y solo hasta que termina (```
// EXIT_DURATION_MS```, igual al tiempo del CSS) lo quita del DOM de verdad.
export default function SlideOverlay({ open, children, zIndex = 9999 }: SlideOverlayProps) {
  const [mounted, setMounted] = useState(false);
  const [rendered, setRendered] = useState(open);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      setRendered(true);
      const frame = requestAnimationFrame(() => setEntered(true));
      return () => cancelAnimationFrame(frame);
    }

    setEntered(false);
    const timeout = setTimeout(() => setRendered(false), EXIT_DURATION_MS);
    return () => clearTimeout(timeout);
  }, [open]);

  if (!mounted || !rendered) return null;

  return createPortal(
    <div className={`${styles.overlay} ${entered ? styles.overlayEntered : ""}`} style={{ zIndex }}>
      {children}
    </div>,
    document.body
  );
}
