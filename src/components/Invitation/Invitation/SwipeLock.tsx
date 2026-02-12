"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./swipe-lock.module.css";
import { FaLock, FaUnlock } from "react-icons/fa";

type Props = {
  label?: string;
  onUnlock?: () => void;   // callback cuando se “desbloquea”
  onRelock?: () => void;   // callback al volver a bloquear
};

export default function SwipeLock({
  label = "Swipe",
  onUnlock,
  onRelock,
}: Props) {
  const bgRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLButtonElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  const [unlocked, setUnlocked] = useState(false);
  const [dragging, setDragging] = useState(false);

  // refs para cálculo imperativo (sin re-render por frame)
  const startX = useRef(0);
  const slideMax = useRef(0);
  const dragX = useRef(-10);
  const raf = useRef<number | null>(null);

  const schedule = () => {
    if (raf.current == null) {
      raf.current = requestAnimationFrame(() => {
        raf.current = null;
        if (!sliderRef.current) return;
        // mover el “ball”
        sliderRef.current.style.left = `${dragX.current}px`;
        // fade del texto
        if (labelRef.current && slideMax.current > 0) {
          const rel = Math.min(
            1,
            Math.max(0, (dragX.current + 10) / slideMax.current)
          );
          labelRef.current.style.opacity = String(1 - rel);
        }
      });
    }
  };

  // medir recorrido máximo
  useEffect(() => {
    const calc = () => {
      if (!bgRef.current || !sliderRef.current) return;
      const max =
        bgRef.current.clientWidth - sliderRef.current.clientWidth + 10;
      slideMax.current = max;
      // reset posición
      dragX.current = -10;
      sliderRef.current.style.left = `-10px`;
      if (labelRef.current) labelRef.current.style.opacity = "1";
    };
    calc();
    const ro = new ResizeObserver(calc);
    if (bgRef.current) ro.observe(bgRef.current);
    return () => ro.disconnect();
  }, []);

  // pointer handlers
  const onPointerDown = (e: React.PointerEvent) => {
    if (unlocked) return;
    sliderRef.current?.setPointerCapture(e.pointerId);
    setDragging(true);
    startX.current = e.clientX - dragX.current;
    // listeners globales (mejor en iOS)
    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp, { passive: false });
    window.addEventListener("pointercancel", onUp, { passive: false });
  };

  const onMove = (e: PointerEvent) => {
    if (!dragging || unlocked) return;
    e.preventDefault();
    const x = e.clientX - startX.current;
    const clamped = Math.max(-10, Math.min(x, slideMax.current));
    dragX.current = clamped;
    schedule();
  };

  const onUp = () => {
    if (!dragging || unlocked) return;
    setDragging(false);
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onUp);

    const reached = dragX.current >= slideMax.current;
    if (!reached) {
      // volver a -10 con animación (como el .animate del jQuery)
      sliderRef.current?.classList.add(styles.snap);
      dragX.current = -10;
      schedule();
      setTimeout(() => sliderRef.current?.classList.remove(styles.snap), 300);
      return;
    }

    // modo "unlocked": el slider se expande (clase .unlocked)
    setUnlocked(true);
    onUnlock?.();
  };

  const relock = () => {
    if (!unlocked) return;
    setUnlocked(false);
    onRelock?.();
    // volver a posición inicial
    dragX.current = -10;
    sliderRef.current?.classList.remove(styles.unlocked);
    schedule();
  };

  // cuando cambia unlocked, aplicamos/removemos la clase que expande
  useEffect(() => {
    const s = sliderRef.current;
    if (!s) return;
    if (unlocked) s.classList.add(styles.unlocked);
    else s.classList.remove(styles.unlocked);
  }, [unlocked]);

  return (
    <div className={styles.button_background} ref={bgRef}>
      <span ref={labelRef} className={styles.slide_text}>
        {label}
      </span>

      <button
        ref={sliderRef}
        id="slider"
        className={styles.slider}
        onPointerDown={onPointerDown}
        onClick={relock /* click para volver a bloquear, como el snippet */}
        aria-label={unlocked ? "lock_outline" : "lock_open"}
      >
        {
            !unlocked ? <FaUnlock size={18} style={{color:'#00000040'}} /> : <FaLock size={18} style={{color:'#00000040'}}/>
        }
       
      </button>
    </div>
  );
}