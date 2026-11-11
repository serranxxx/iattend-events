"use client";

import React, { useEffect, useRef } from "react";
import { filtroAdaptado, repeticionesCinta, type LogoMedido } from "@/helpers/patrocinadores";
import styles from "./patrocinadores.module.css";

/*
  Cinta de logos que corre sola (handoff "Patrocinadores" §3.1). Se usa en
  la portada y en la banda. Movimiento en requestAnimationFrame (no CSS
  animation) para sumar scroll y arrastre:
  t += dt · sp · speed → raw = t + scrollTop · k + arrastre → translateX(−raw mod mitad).
  Logos repetidos (mínimo 4 veces) para que nunca se vea el final. Con
  reducir movimiento se queda quieta; el arrastre sí funciona.
  Gemela: iattend-vite modules/SideEvents/Patrocinadores/Cinta.jsx.
*/

// Un logo ya medido (logosDe): adaptado al diseño va en blanco, o con la
// tinta del estilo en la tarjeta (`oscuro`); a color, tal cual.
export const Logo = ({ it, oscuro = false }: { it: LogoMedido; oscuro?: boolean }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img
    className={styles.logo}
    src={it.url}
    alt={it.name || ""}
    width={it.ancho}
    height={it.alto}
    draggable={false}
    loading="lazy"
    style={{ width: it.ancho, height: it.alto, ...(it.adaptar ? { filter: filtroAdaptado(oscuro) } : {}) }}
  />
);

type Props = {
  // Ya medidos, cada uno con el tamaño y el color de su categoría (logosDe).
  logos: LogoMedido[];
  gap: number;
  sp: number;
  k?: number;
  speed?: number;
  puntos?: boolean;
  arrastrable?: boolean;
  // El elemento que hace scroll (para k > 0).
  scroller?: () => HTMLElement | null | undefined;
};

export const Cinta = ({ logos, gap, sp, k = 0, speed = 1, puntos = false, arrastrable = false, scroller }: Props) => {
  const pistaRef = useRef<HTMLDivElement>(null);
  const estado = useRef({ t: 0, off: 0, drag: false, x: 0 });
  const medidos = logos;
  const veces = repeticionesCinta(medidos, gap, puntos);
  const pista = Array.from({ length: veces }, () => medidos).flat();
  // Lo que cambia (velocidad, scroll) se lee de una ref: el ciclo no se reinicia.
  const conf = useRef({ sp, speed, k, scroller });
  useEffect(() => { conf.current = { sp, speed, k, scroller }; });

  useEffect(() => {
    const reducir = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let antes = 0;
    const paso = (ahora: number) => {
      const dt = antes ? Math.min(ahora - antes, 64) : 16;
      antes = ahora;
      const el = pistaRef.current;
      const e = estado.current;
      const mitad = el ? el.scrollWidth / 2 : 0;
      const c = conf.current;
      if (el && mitad) {
        if (!e.drag && !reducir) e.t += dt * c.sp * c.speed;
        const st = c.k ? c.scroller?.()?.scrollTop ?? 0 : 0;
        const raw = e.t + st * c.k + e.off;
        const d = ((raw % mitad) + mitad) % mitad;
        el.style.transform = `translateX(${-d}px)`;
      }
      raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, []);

  const arrastre: React.HTMLAttributes<HTMLDivElement> = arrastrable ? {
    onPointerDown: (ev) => {
      const e = estado.current;
      e.drag = true;
      e.x = ev.clientX;
      ev.currentTarget.setPointerCapture?.(ev.pointerId);
    },
    onPointerMove: (ev) => {
      const e = estado.current;
      if (!e.drag) return;
      e.off -= ev.clientX - e.x;
      e.x = ev.clientX;
    },
    onPointerUp: () => { estado.current.drag = false; },
    onPointerCancel: () => { estado.current.drag = false; },
  } : {};

  return (
    <div className={styles.cinta} data-arrastrable={arrastrable || undefined} {...arrastre}>
      <div ref={pistaRef} className={styles.pista}>
        {pista.map((it, i) => (
          <span key={`${it.id ?? it.url}-${i}`} className={styles.paso_cinta} style={{ gap, paddingRight: gap }}>
            <Logo it={it} />
            {puntos && <span className={styles.punto} aria-hidden />}
          </span>
        ))}
      </div>
    </div>
  );
};
