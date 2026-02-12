import React, { useEffect, useRef, useState } from "react";
import styles from "./swipe.module.css";
import { FaUnlock } from "react-icons/fa";

type Props = {
  label?: string;
  onConfirm: () => void;
  disabled?: boolean;
  resetOnConfirm?: boolean;
  threshold?: number; // 0..1 (default 0.85)
};

export default function SwipeToConfirm({
  label = "Desliza para desbloquear",
  onConfirm,
  disabled = false,
  resetOnConfirm = false,
  threshold = 0.85,
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLButtonElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);

  const [maxX, setMaxX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  // refs para cálculo sin re-render
  const startX = useRef(0);
  const dragX = useRef(0);
  const rafId = useRef<number | null>(null);

  // medir
  useEffect(() => {
    const calc = () => {
      if (!trackRef.current || !knobRef.current) return;
      const trackW = trackRef.current.clientWidth;
      const knobW = knobRef.current.clientWidth;
      setMaxX(Math.max(0, trackW - knobW - 8));
      dragX.current = 0;
      // reset posicion visual
      if (knobRef.current) {
        knobRef.current.style.transform = `translate(0px, -50%)`;
      }
      if (progressRef.current) {
        progressRef.current.style.width = `${56}px`;
      }
      if (labelRef.current) {
        labelRef.current.style.opacity = `1`;
      }
    };
    calc();
    const obs = new ResizeObserver(calc);
    if (trackRef.current) obs.observe(trackRef.current);
    return () => obs.disconnect();
  }, []);

  const renderFrame = () => {
    if (!knobRef.current || !progressRef.current || !labelRef.current) return;
    knobRef.current.style.transform = `translate(${dragX.current}px, -50%)`;
    progressRef.current.style.width = `${dragX.current + 56}px`;
    // fade del texto (0..1)
    const p = Math.min(Math.max(dragX.current / maxX, 0), 1);
    labelRef.current.style.opacity = `${1 - p}`;
    rafId.current = null;
  };

  const scheduleFrame = () => {
    if (rafId.current == null) {
      rafId.current = requestAnimationFrame(renderFrame);
    }
  };

  const clamp = (x: number) => Math.max(0, Math.min(x, maxX));

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled || confirmed) return;
    knobRef.current?.setPointerCapture(e.pointerId);
    setDragging(true);
    startX.current = e.clientX - dragX.current;

    // listeners globales (mejor que React para iOS)
    window.addEventListener("pointermove", onWindowPointerMove, { passive: false });
    window.addEventListener("pointerup", onWindowPointerUp, { passive: false });
    window.addEventListener("pointercancel", onWindowPointerUp, { passive: false });
  };

  const onWindowPointerMove = (e: PointerEvent) => {
    if (!dragging) return;
    if (e.pointerType === "mouse" && (e as any).buttons === 0) return;
    e.preventDefault(); // evita scroll/gestos
    const x = e.clientX - startX.current;
    dragX.current = clamp(x);
    scheduleFrame();
  };

  const onWindowPointerUp = () => {
    if (!dragging) return;
    setDragging(false);
    window.removeEventListener("pointermove", onWindowPointerMove);
    window.removeEventListener("pointerup", onWindowPointerUp);
    window.removeEventListener("pointercancel", onWindowPointerUp);

    const done = dragX.current >= maxX * (threshold ?? 0.85);

    if (done) {
      setConfirmed(true);
      dragX.current = maxX;
      scheduleFrame();
      onConfirm?.();
      if (resetOnConfirm) {
        setTimeout(() => {
          setConfirmed(false);
          dragX.current = 0;
          scheduleFrame();
        }, 800);
      }
    } else {
      // snap back con animación corta
      if (knobRef.current && progressRef.current) {
        knobRef.current.classList.add(styles.snap);
        progressRef.current.classList.add(styles.snap);
        dragX.current = 0;
        scheduleFrame();
        setTimeout(() => {
          knobRef.current?.classList.remove(styles.snap);
          progressRef.current?.classList.remove(styles.snap);
        }, 160);
      } else {
        dragX.current = 0;
        scheduleFrame();
      }
    }
  };

  return (
    <div className={styles.stc_wrapper}>
      <div
        ref={trackRef}
        className={`${styles.stc_track} ${dragging ? styles.dragging : ""} ${
          disabled ? styles.stc_disabled : ""
        }`}
        aria-disabled={disabled}
      >
        <div ref={labelRef} className={`${styles.stc_label} ${confirmed ? styles.stc_label__hidden : ""}`}>
          {label}
        </div>

        <div ref={progressRef} className={styles.stc_progress} />

        <button
          ref={knobRef}
          type="button"
          className={`${styles.stc_knob} ${confirmed ? styles.stc_knob__ok : ""}`}
          onPointerDown={onPointerDown}
          aria-label={confirmed ? "Confirmado" : "Desliza para desbloquear"}
          disabled={disabled}
        >
          <FaUnlock size={18} style={{ color: "#00000030" }} />
        </button>
      </div>
    </div>
    
  );
}