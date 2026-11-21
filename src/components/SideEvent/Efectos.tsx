"use client";

import { useMemo } from "react";
import styles from "./efectos.module.css";

/*
  Efectos animados de un Pop: partículas encima de la portada y los PNG,
  debajo del texto y los botones. Solo CSS (transform y opacity); con
  "reducir movimiento" no se mueve nada. Misma lógica y misma semilla que el
  editor (iattend-vite, modules/SideEvents/EfectosCapa.jsx + efectosData.js):
  si cambia allá, cambiar aquí.
*/

export type Efecto = {
  type: "sparkles" | "confetti" | "bubbles" | "snow" | "petals" | "imagenes";
  intensity?: number;
  // Uno fijo o uno propio en #RRGGBB.
  color?: "theme" | "white" | "gold" | "multi" | string;
  // Mis PNG ('imagenes'): las imágenes, cómo se mueven y su tamaño (20–200 %).
  images?: string[];
  motion?: "caer" | "subir" | "latir";
  size?: number;
};

const TIPOS_EFECTO = ["sparkles", "confetti", "bubbles", "snow", "petals", "imagenes"];
const esColorPropio = (c: unknown): c is string => typeof c === "string" && /^#[0-9a-f]{6}$/i.test(c);
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
  if (esColorPropio(modo)) return modo;
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

// Mis PNG: duración según cómo se mueven; tamaño 16–32 px con `size` 50.
const DUR_IMAGEN: Record<string, [number, number]> = { caer: [8, 14], subir: [7, 13], latir: [2.2, 4.2] };
const tamImagen = (size = 50): [number, number] => {
  const k = Math.min(200, Math.max(1, size)) / 50;
  return [16 * k, 32 * k];
};

export default function Efectos({ effect, colorTema }: { effect?: Efecto | null; colorTema?: string }) {
  const tipo = effect?.type;
  const intensidad = effect?.intensity ?? 50;
  const modo = effect?.color ?? (tipo ? COLOR_INICIAL[tipo] : "theme") ?? "theme";
  const imagenes = tipo === "imagenes" && Array.isArray(effect?.images) ? effect.images.filter(Boolean) : [];
  const mov = effect?.motion ?? "caer";
  const firmaImagenes = imagenes.join("|");
  const size = effect?.size;

  const particulas = useMemo(() => {
    if (!tipo || (tipo === "imagenes" ? !imagenes.length : !PARAMS[tipo])) return [];
    const r = azar(TIPOS_EFECTO.indexOf(tipo) * 7919 + 13);
    const { tam, dur } = tipo === "imagenes" ? { tam: tamImagen(size), dur: DUR_IMAGEN[mov] ?? DUR_IMAGEN.caer } : PARAMS[tipo];
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
        ...(tipo === "imagenes"
          ? { imagen: imagenes[Math.floor(r() * imagenes.length)] as string | undefined, color: undefined as string | undefined }
          : { imagen: undefined as string | undefined, color: colorDe(modo, colorTema, r) }),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo, intensidad, modo, colorTema, firmaImagenes, mov, size]);

  if (!tipo || !particulas.length) return null;

  return (
    <div aria-hidden className={`${styles.capa} ${styles[tipo]}`} data-mov={tipo === "imagenes" ? mov : undefined}>
      {particulas.map((p, i) => (
        <span
          key={i}
          className={styles.particula}
          style={{
            left: `${p.x}%`,
            top: tipo === "sparkles" || (tipo === "imagenes" && mov === "latir") ? `${p.y}%` : undefined,
            width: p.tam,
            height: tipo === "confetti" ? p.tam * 0.45 : tipo === "petals" ? p.tam * 0.7 : p.tam,
            ...(p.imagen ? { backgroundImage: `url("${p.imagen}")` } : { "--color": p.color }),
            "--dur": `${p.dur}s`,
            "--delay": `${p.delay}s`,
            "--vaiven": `${p.vaiven}px`,
            "--giro": `${p.giro}deg`,
          } as unknown as React.CSSProperties}
        />
      ))}
    </div>
  );
}
