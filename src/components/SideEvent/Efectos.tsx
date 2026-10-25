"use client";

import { useMemo } from "react";
import styles from "./efectos.module.css";

/*
  Efectos animados de un Flash: partículas encima de la portada y los PNG,
  debajo del texto y los botones. Solo CSS (transform y opacity); con
  "reducir movimiento" no se mueve nada. Misma lógica y misma semilla que el
  editor (iattend-vite, modules/SideEvents/EfectosCapa.jsx + efectosData.js):
  si cambia allá, cambiar aquí.
*/

export type Efecto = {
  type: "sparkles" | "confetti" | "bubbles" | "snow" | "petals";
  intensity?: number;
  color?: "theme" | "white" | "gold" | "multi";
};

const TIPOS_EFECTO = ["sparkles", "confetti", "bubbles", "snow", "petals"];
const COLOR_INICIAL: Record<string, string> = { sparkles: "gold", confetti: "multi", bubbles: "white", snow: "white", petals: "theme" };
const MULTI = ["#FF6FA5", "#FFC94D", "#5BD1C7", "#8C7CFF", "#FF8A5C", "#FFFFFF"];
const DORADOS = ["#F7D774", "#E9B949", "#FFF1B8"];

const cantidadDeEfecto = (intensidad = 50) => Math.round(6 + Math.min(100, Math.max(1, intensidad)) * 0.54);

// mulberry32: las partículas no cambian entre renders ni entre editor y página.
const azar = (semilla: number) => () => {
  semilla = (semilla + 0x6d2b79f5) | 0;
  let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const colorDe = (modo: string, tema: string | undefined, r: () => number) => {
  if (modo === "white") return "#FFFFFF";
  if (modo === "gold") return DORADOS[Math.floor(r() * DORADOS.length)];
  if (modo === "multi") return MULTI[Math.floor(r() * MULTI.length)];
  return tema || "#FFFFFF";
};

const PARAMS: Record<string, { tam: [number, number]; dur: [number, number] }> = {
  sparkles: { tam: [10, 22], dur: [1.6, 3.6] },
  confetti: { tam: [6, 11], dur: [5, 9] },
  bubbles: { tam: [10, 26], dur: [7, 13] },
  snow: { tam: [3, 8], dur: [8, 15] },
  petals: { tam: [10, 18], dur: [8, 14] },
};

export default function Efectos({ effect, colorTema }: { effect?: Efecto | null; colorTema?: string }) {
  const tipo = effect?.type;
  const intensidad = effect?.intensity ?? 50;
  const modo = effect?.color ?? (tipo ? COLOR_INICIAL[tipo] : "theme") ?? "theme";

  const particulas = useMemo(() => {
    if (!tipo || !PARAMS[tipo]) return [];
    const r = azar(TIPOS_EFECTO.indexOf(tipo) * 7919 + 13);
    const { tam, dur } = PARAMS[tipo];
    return Array.from({ length: cantidadDeEfecto(intensidad) }, () => {
      const d = dur[0] + r() * (dur[1] - dur[0]);
      return {
        x: r() * 100,
        y: r() * 100,
        tam: tam[0] + r() * (tam[1] - tam[0]),
        dur: d,
        delay: -r() * d,
        vaiven: (r() - 0.5) * 60,
        giro: (r() - 0.5) * 720,
        color: colorDe(modo, colorTema, r),
      };
    });
  }, [tipo, intensidad, modo, colorTema]);

  if (!tipo || !particulas.length) return null;

  return (
    <div aria-hidden className={`${styles.capa} ${styles[tipo]}`}>
      {particulas.map((p, i) => (
        <span
          key={i}
          className={styles.particula}
          style={{
            left: `${p.x}%`,
            top: tipo === "sparkles" ? `${p.y}%` : undefined,
            width: p.tam,
            height: tipo === "confetti" ? p.tam * 0.45 : tipo === "petals" ? p.tam * 0.7 : p.tam,
            "--color": p.color,
            "--dur": `${p.dur}s`,
            "--delay": `${p.delay}s`,
            "--vaiven": `${p.vaiven}px`,
            "--giro": `${p.giro}deg`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
