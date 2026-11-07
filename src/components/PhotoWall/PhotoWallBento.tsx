"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Minimize2 } from "lucide-react";
import styles from "./photo-wall-bento.module.css";

export interface BentoPhoto {
  id: string;
  guest_name: string;
  public_url: string;
}

export const esVideo = (url: string) => /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url);

// Portada en video: un cuadro fijo, no el video corriendo. iOS no pinta el
// primer cuadro de un <video> en pausa hasta que hay interacción, así que se
// deja arrancar en silencio y se pausa en cuanto hay imagen.
export function CuadroDeVideo({ src }: { src: string }) {
  return (
    <video
      src={`${src}#t=0.5`}
      muted
      playsInline
      autoPlay
      preload="auto"
      onLoadedData={(e) => e.currentTarget.pause()}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
    />
  );
}

interface PhotoWallBentoProps {
  photos: BentoPhoto[]; // la más nueva primero (como las guarda PhotoWall)
  titleText?: string;
  titleFace?: string;
  participantCount: number;
  portada?: string; // fondo cuando todavía no hay fotos (imagen o video)
  onClose: () => void;
}

// Acomodos del mosaico por cantidad de casillas. Cada letra es una casilla
// (grid-template-areas); nunca hay más casillas que fotos, así que no se
// repite una foto en pantalla. La "a" es la grande, donde cae cada foto nueva.
type Acomodo = { cols: number; rows: number; areas: string[] };

const HORIZONTAL: Record<number, Acomodo> = {
  1: { cols: 1, rows: 1, areas: ["a"] },
  2: { cols: 2, rows: 1, areas: ["a b"] },
  3: { cols: 3, rows: 2, areas: ["a a b", "a a c"] },
  5: { cols: 4, rows: 2, areas: ["a a b c", "a a d e"] },
  8: { cols: 5, rows: 3, areas: ["a a b c c", "a a d c c", "e f f g h"] },
  11: { cols: 6, rows: 4, areas: ["a a b c c d", "a a e c c f", "g h h i j j", "g h h k j j"] },
};

const VERTICAL: Record<number, Acomodo> = {
  1: { cols: 1, rows: 1, areas: ["a"] },
  2: { cols: 1, rows: 2, areas: ["a", "b"] },
  3: { cols: 2, rows: 3, areas: ["a a", "a a", "b c"] },
  5: { cols: 2, rows: 4, areas: ["a a", "a a", "b c", "d e"] },
  8: { cols: 3, rows: 5, areas: ["a a b", "a a c", "d e e", "f e e", "g g h"] },
  11: { cols: 3, rows: 6, areas: ["a a b", "a a c", "d e e", "f e e", "g h h", "i j k"] },
};

const NIVELES = [11, 8, 5, 3, 2, 1];
const LETRAS = "abcdefghijk";
const ROTACION_MS = 3200;
const NUEVA_MS = 6000;

const casillasPara = (n: number) => NIVELES.find((k) => k <= n) ?? 0;

// Hash simple para dar a cada foto su propio movimiento (origen del zoom).
const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

const precargar = (url: string) =>
  new Promise<void>((resolve) => {
    const img = new window.Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = url;
  });

type Casilla = { id: string; prev: string | null };

export function PhotoWallBento({ photos, titleText, titleFace, participantCount, portada, onClose }: PhotoWallBentoProps) {
  const [montado, setMontado] = useState(false);
  const [vertical, setVertical] = useState(false);
  const [casillas, setCasillas] = useState<Casilla[]>([]);
  const [nuevas, setNuevas] = useState<Set<string>>(new Set());
  const [controles, setControles] = useState(true);

  const conocidasRef = useRef<Set<string> | null>(null);
  const casillasRef = useRef<Casilla[]>([]);
  const photosRef = useRef(photos);
  const vistaRef = useRef<Map<string, number>>(new Map()); // id → última vez en pantalla
  const ultimaCasillaRef = useRef(-1);
  const entroFullscreenRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  casillasRef.current = casillas;
  photosRef.current = photos;

  const porId = useMemo(() => new Map(photos.map((p) => [p.id, p])), [photos]);
  const k = casillasPara(photos.length);
  const acomodo = (vertical ? VERTICAL : HORIZONTAL)[k];

  useEffect(() => setMontado(true), []);

  // Orientación de la pantalla (proyector horizontal vs. celular vertical).
  useEffect(() => {
    const medir = () => setVertical(window.innerHeight > window.innerWidth);
    medir();
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, []);

  // Pantalla completa del navegador: la pide PhotoWall en el clic (gesto del
  // usuario). Si el usuario sale con Esc, se cierra también el mosaico.
  useEffect(() => {
    const onChange = () => {
      if (document.fullscreenElement) entroFullscreenRef.current = true;
      else if (entroFullscreenRef.current) onClose();
    };
    if (document.fullscreenElement) entroFullscreenRef.current = true;
    document.addEventListener("fullscreenchange", onChange);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    };
  }, [onClose]);

  // Controles y cursor se esconden solos cuando no se mueve el mouse.
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const mostrar = () => {
      setControles(true);
      clearTimeout(t);
      t = setTimeout(() => setControles(false), 3000);
    };
    mostrar();
    window.addEventListener("pointermove", mostrar);
    window.addEventListener("pointerdown", mostrar);
    return () => {
      clearTimeout(t);
      window.removeEventListener("pointermove", mostrar);
      window.removeEventListener("pointerdown", mostrar);
    };
  }, []);

  // Llenado inicial, cambios de nivel y fotos nuevas en tiempo real.
  useEffect(() => {
    const ahora = Date.now();
    const primeraVez = conocidasRef.current === null;
    const conocidas = conocidasRef.current ?? new Set<string>();
    const recienLlegadas = primeraVez ? [] : photos.filter((p) => !conocidas.has(p.id)).map((p) => p.id);
    photos.forEach((p) => conocidas.add(p.id));
    conocidasRef.current = conocidas;

    const existentes = new Set(photos.map((p) => p.id));
    let next = casillasRef.current.filter((c) => existentes.has(c.id)).slice(0, k);
    const enPantalla = new Set(next.map((c) => c.id));

    // Las nuevas entran primero: la más nueva a la casilla grande ("a").
    const nuevasPorColocar = recienLlegadas.filter((id) => !enPantalla.has(id));
    const reemplazos = [...nuevasPorColocar];
    // Se rellenan casillas vacías (nivel que creció) con nuevas y luego las más recientes.
    while (next.length < k) {
      const id = reemplazos.shift() ?? photos.find((p) => !enPantalla.has(p.id))?.id;
      if (!id) break;
      next.push({ id, prev: null });
      enPantalla.add(id);
    }
    // Las que sobran desplazan casillas: la grande primero, luego al azar.
    if (reemplazos.length > 0 && next.length > 0) {
      next = [...next];
      const libres = next.map((_, i) => i).filter((i) => i !== 0).sort(() => Math.random() - 0.5);
      const orden = [0, ...libres];
      reemplazos.slice(0, next.length).forEach((id, j) => {
        const i = orden[j];
        next[i] = { id, prev: next[i].id };
      });
    }
    // Lo nuevo siempre en la grande: si quedó en otra casilla, se intercambia.
    const masNueva = recienLlegadas[0];
    if (masNueva) {
      const idx = next.findIndex((c) => c.id === masNueva);
      if (idx > 0) {
        next = [...next];
        const a = next[0];
        next[0] = { id: masNueva, prev: a.id };
        next[idx] = { id: a.id, prev: masNueva };
      }
    }

    next.forEach((c) => vistaRef.current.set(c.id, ahora));
    setCasillas(next);

    if (recienLlegadas.length > 0) {
      setNuevas((prev) => new Set([...prev, ...recienLlegadas]));
      timersRef.current.push(
        setTimeout(() => {
          setNuevas((prev) => {
            const s = new Set(prev);
            recienLlegadas.forEach((id) => s.delete(id));
            return s;
          });
        }, NUEVA_MS)
      );
    }
  }, [photos, k]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach(clearTimeout);
  }, []);

  // Rotación: cada tanto una casilla cambia de foto (la que lleva más tiempo
  // sin verse). Si todas caben en pantalla, dos casillas se intercambian.
  useEffect(() => {
    let cancelado = false;
    const tick = async () => {
      const actuales = casillasRef.current;
      const todas = photosRef.current;
      if (actuales.length < 2) return;

      const candidatas = actuales.map((_, i) => i).filter((i) => i !== ultimaCasillaRef.current);
      const i = candidatas[Math.floor(Math.random() * candidatas.length)];
      ultimaCasillaRef.current = i;

      const enPantalla = new Set(actuales.map((c) => c.id));
      const fuera = todas.filter((p) => !enPantalla.has(p.id));

      if (fuera.length === 0) {
        const otras = actuales.map((_, j) => j).filter((j) => j !== i);
        const j = otras[Math.floor(Math.random() * otras.length)];
        setCasillas((prev) => {
          if (!prev[i] || !prev[j]) return prev;
          const next = [...prev];
          next[i] = { id: prev[j].id, prev: prev[i].id };
          next[j] = { id: prev[i].id, prev: prev[j].id };
          return next;
        });
        return;
      }

      const elegida = fuera.reduce((a, b) =>
        (vistaRef.current.get(a.id) ?? 0) <= (vistaRef.current.get(b.id) ?? 0) ? a : b
      );
      await precargar(elegida.public_url);
      if (cancelado) return;
      vistaRef.current.set(elegida.id, Date.now());
      setCasillas((prev) => {
        if (!prev[i] || prev.some((c) => c.id === elegida.id)) return prev;
        const next = [...prev];
        next[i] = { id: elegida.id, prev: prev[i].id };
        return next;
      });
    };
    const intervalo = setInterval(tick, ROTACION_MS);
    return () => {
      cancelado = true;
      clearInterval(intervalo);
    };
  }, []);

  if (!montado) return null;

  const pintarFoto = (id: string, capa: "actual" | "anterior") => {
    const foto = porId.get(id);
    if (!foto) return null;
    const h = hash(id);
    const estilo = {
      "--kb-x": `${20 + (h % 61)}%`,
      "--kb-y": `${20 + ((h >> 3) % 61)}%`,
      "--kb-dur": `${14 + (h % 8)}s`,
    } as React.CSSProperties;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        key={`${capa}-${id}`}
        src={foto.public_url}
        alt={foto.guest_name}
        className={`${styles.img} ${capa === "actual" ? styles.imgActual : styles.imgAnterior}`}
        style={estilo}
        draggable={false}
      />
    );
  };

  return createPortal(
    <div className={`${styles.root} ${controles ? "" : styles.sinControles}`}>
      {acomodo && casillas.length > 0 ? (
        <div
          className={styles.grid}
          style={{
            gridTemplateColumns: `repeat(${acomodo.cols}, 1fr)`,
            gridTemplateRows: `repeat(${acomodo.rows}, 1fr)`,
            gridTemplateAreas: acomodo.areas.map((r) => `"${r}"`).join(" "),
          }}
        >
          {casillas.map((c, i) => {
            const foto = porId.get(c.id);
            const esNueva = nuevas.has(c.id);
            return (
              <div
                key={LETRAS[i]}
                className={`${styles.tile} ${esNueva ? styles.tileNueva : ""}`}
                style={{ gridArea: LETRAS[i] }}
              >
                {c.prev && c.prev !== c.id && pintarFoto(c.prev, "anterior")}
                {pintarFoto(c.id, "actual")}
                {foto && (
                  <div key={`cap-${c.id}`} className={styles.caption}>
                    {esNueva && <span className={styles.badgeNueva}>Nueva</span>}
                    <span className={styles.captionName}>{foto.guest_name}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className={styles.vacio}>
          {portada && (
            <div className={styles.vacioFondo} aria-hidden>
              {esVideo(portada)
                ? <CuadroDeVideo src={portada} />
                // eslint-disable-next-line @next/next/no-img-element
                : <img src={portada} alt="" />}
            </div>
          )}
          <span className={styles.vacioTexto}>Las fotos aparecerán aquí en cuanto los invitados empiecen a compartir</span>
        </div>
      )}

      <div className={styles.header}>
        <div className={styles.headerInfo}>
          {titleText && (
            <span className={styles.title} style={{ fontFamily: titleFace ?? undefined }}>
              {titleText}
            </span>
          )}
          <span className={styles.meta}>
            <span className={styles.liveDot} />
            En vivo · {photos.length.toLocaleString("es-MX")} fotos · {participantCount.toLocaleString("es-MX")} participantes
          </span>
        </div>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Salir de pantalla completa">
          <Minimize2 size={18} />
        </button>
      </div>
    </div>,
    document.body
  );
}
