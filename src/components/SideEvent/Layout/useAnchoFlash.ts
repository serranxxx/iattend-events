"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

/*
  Puntos de quiebre de un Flash en pantallas grandes (handoff "Evento Flash en
  iPad y Mac", 9b): < 600 la columna del celular, 600–1023 la tableta (una
  columna, hoja inferior centrada) y ≥ 1024 el escritorio (mosaico de dos
  columnas, panel lateral). Arranca en "tel" (igual que el render del
  servidor) y se corrige al montar.
*/

export type AnchoFlash = "tel" | "tableta" | "escritorio";

const TABLETA = "(min-width: 600px)";
const ESCRITORIO = "(min-width: 1024px)";

export function useAnchoFlash(): AnchoFlash {
  const [ancho, setAncho] = useState<AnchoFlash>("tel");
  useEffect(() => {
    const t = window.matchMedia(TABLETA);
    const e = window.matchMedia(ESCRITORIO);
    const leer = () => setAncho(e.matches ? "escritorio" : t.matches ? "tableta" : "tel");
    leer();
    t.addEventListener("change", leer);
    e.addEventListener("change", leer);
    return () => {
      t.removeEventListener("change", leer);
      e.removeEventListener("change", leer);
    };
  }, []);
  return ancho;
}

// Panel y hoja (role="dialog"): al abrir el foco entra y Tab no sale de ellos;
// al cerrar vuelve a lo que lo abrió.
const ENFOCABLES = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useFocoAtrapado(ref: RefObject<HTMLElement | null>, abierto: boolean) {
  const previo = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!abierto || !el) return;
    previo.current = document.activeElement as HTMLElement | null;
    // Sin robar el foco de un campo que el propio panel ya enfocó.
    if (!el.contains(document.activeElement)) el.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const lista = [...el.querySelectorAll<HTMLElement>(ENFOCABLES)].filter((n) => n.offsetParent !== null);
      if (!lista.length) { e.preventDefault(); return; }
      const primero = lista[0];
      const ultimo = lista[lista.length - 1];
      if (e.shiftKey && (document.activeElement === primero || document.activeElement === el)) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      const p = previo.current;
      if (p && document.contains(p)) p.focus({ preventScroll: true });
    };
  }, [abierto, ref]);
}
