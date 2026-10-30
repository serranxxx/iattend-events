"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import styles from "./layout.module.css";
import { useAnchoFlash, useFocoAtrapado } from "./useAnchoFlash";

/*
  Hoja inferior de un Flash (handoff "Flash Layout" 3a): el pase y el
  formulario se abren aquí, fuera del scroll. Velo que se funde, hoja que
  sube con rebote y contenido que entra después; al cerrar se invierte.
  Tocar el velo o el asa cierra.
  iPad y Mac (handoff "Evento Flash en iPad y Mac"): en tableta es una hoja
  centrada de 640 px (el asa se arrastra para cerrar) y en escritorio un panel
  lateral a la derecha; los dos con encabezado (título, subtítulo y ✕), foco
  atrapado y Esc.
*/

type Props = {
  open: boolean;
  onClose: () => void;
  // Color del tema (el vidrio de la hoja se tiñe con él).
  color?: string;
  // Variables del estilo de bloques (helpers/estilosBloque.ts).
  vars?: React.CSSProperties;
  label: string;
  // Encabezado en iPad y Mac.
  titulo?: string;
  subtitulo?: string;
  children: React.ReactNode;
};

const SALIDA_MS = 250;

export default function HojaFlash({ open, onClose, color, vars, label, titulo, subtitulo, children }: Props) {
  // Se queda montada mientras termina la animación de salida.
  const [montada, setMontada] = useState(open);
  const [saliendo, setSaliendo] = useState(false);
  const [contenido, setContenido] = useState<React.ReactNode>(children);
  const ancho = useAnchoFlash();
  const grande = ancho !== "tel";
  const idTitulo = useId();
  const hojaRef = useRef<HTMLDivElement>(null);
  const [arrastre, setArrastre] = useState(0);
  const arrastreRef = useRef<{ y: number; t: number } | null>(null);

  useEffect(() => {
    if (open) {
      setMontada(true);
      setSaliendo(false);
      return;
    }
    if (!montada) return;
    setSaliendo(true);
    const t = window.setTimeout(() => { setMontada(false); setSaliendo(false); }, SALIDA_MS);
    return () => window.clearTimeout(t);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Al cerrar se sigue viendo lo último (no se vacía a media animación).
  useEffect(() => { if (open) setContenido(children); }, [open, children]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useFocoAtrapado(hojaRef, open && montada && grande);

  // Tableta: arrastrar el asa hacia abajo (> 120 px o rápido) cierra.
  const onAsaDown = (e: React.PointerEvent) => {
    if (ancho !== "tableta") return;
    arrastreRef.current = { y: e.clientY, t: performance.now() };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onAsaMove = (e: React.PointerEvent) => {
    if (!arrastreRef.current) return;
    setArrastre(Math.max(0, e.clientY - arrastreRef.current.y));
  };
  const onAsaUp = (e: React.PointerEvent) => {
    const ini = arrastreRef.current;
    arrastreRef.current = null;
    if (!ini) return;
    const dy = e.clientY - ini.y;
    const v = dy / Math.max(1, performance.now() - ini.t);
    setArrastre(0);
    if (dy > 120 || v > 0.5) onClose();
  };

  if (!montada || typeof document === "undefined") return null;

  return createPortal(
    <div
      className={`${styles.hoja_capa} ${saliendo ? styles.hoja_saliendo : ""}`}
      style={{ "--blur-color": color ?? "#6E7FD8", ...vars } as React.CSSProperties}
    >
      <div className={styles.hoja_velo} onClick={onClose} aria-hidden />
      <div
        ref={hojaRef}
        className={styles.hoja}
        role="dialog"
        aria-modal="true"
        aria-label={grande && titulo ? undefined : label}
        aria-labelledby={grande && titulo ? idTitulo : undefined}
        tabIndex={-1}
        style={arrastre ? { translate: `0 ${arrastre}px`, transition: "none" } : undefined}
      >
        {ancho !== "escritorio" && (
          <button
            type="button"
            className={styles.hoja_asa}
            onClick={onClose}
            onPointerDown={onAsaDown}
            onPointerMove={onAsaMove}
            onPointerUp={onAsaUp}
            onPointerCancel={onAsaUp}
            aria-label="Cerrar"
          >
            <span />
          </button>
        )}
        {grande && (
          <div className={styles.hoja_cabecera}>
            <div className={styles.hoja_cabecera_textos}>
              {titulo && <span id={idTitulo} className={styles.hoja_titulo}>{titulo}</span>}
              {subtitulo && <span className={styles.hoja_subtitulo}>{subtitulo}</span>}
            </div>
            <button type="button" className={styles.hoja_cerrar} onClick={onClose} aria-label="Cerrar">
              <X size={18} strokeWidth={2.2} />
            </button>
          </div>
        )}
        <div className={styles.hoja_contenido}>{contenido}</div>
      </div>
    </div>,
    document.body,
  );
}
