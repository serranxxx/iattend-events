"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

type Opts = {
  min?: number;     // px
  max?: number;     // px
  stepTolerance?: number; // precisión de la búsqueda
  observeResize?: boolean;
};

export function useFitText({ min = 8, max = 200, stepTolerance = 0.5, observeResize = true }: Opts = {}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLElement | null>(null);
  const [fontSize, setFontSize] = useState<number>(min);

  const measureFits = () => {
    const box = containerRef.current;
    const el = textRef.current;
    if (!box || !el) return false;
    return el.scrollWidth <= box.clientWidth && el.scrollHeight <= box.clientHeight;
  };

  const fit = () => {
    const el = textRef.current;
    if (!el) return;

    let lo = min;
    let hi = max;

    // reset grande para empezar a medir
    el.style.fontSize = `${hi}px`;

    // búsqueda binaria por tamaño
    while (hi - lo > stepTolerance) {
      const mid = (lo + hi) / 2;
      el.style.fontSize = `${mid}px`;
      if (measureFits()) {
        lo = mid; // cabe, intentemos más grande
      } else {
        hi = mid; // no cabe, bajemos
      }
    }
    const finalSize = Math.floor(lo);
    el.style.fontSize = `${finalSize}px`;
    setFontSize(finalSize);
  };

  // usar layout effect para evitar “salto” visual
  const useIsoLayout = typeof window !== "undefined" ? useLayoutEffect : useEffect;

  useIsoLayout(() => {
    fit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!observeResize) return;
    const box = containerRef.current;
    if (!box) return;

    const ro = new ResizeObserver(() => fit());
    ro.observe(box);

    // observar cambios de contenido (si el texto cambia)
    const el = textRef.current;
    const mo = el
      ? new MutationObserver(() => fit())
      : null;
    if (el && mo) mo.observe(el, { characterData: true, subtree: true, childList: true });

    window.addEventListener("resize", fit);
    return () => {
      ro.disconnect();
      mo?.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, [observeResize]);

  return { containerRef, textRef, fontSize, refContainer: containerRef, refText: textRef, ref: textRef };
}