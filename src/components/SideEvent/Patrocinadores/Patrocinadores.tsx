"use client";

import React from "react";
import type { SideEventBody } from "@/types/side_event";
import { acomodar, ANCHO_FILA, CINTA, etiquetaCategoria, GAP, logosDe, MEDIDA_PORTADA, patrocinadoresDe, porCategoria, type LogoMedido, type Medida } from "@/helpers/patrocinadores";
import { estiloDe, luminancia, variablesDeEstilo } from "@/helpers/estilosBloque";
import { Cinta, Logo } from "./Cinta";
import styles from "./patrocinadores.module.css";

/*
  Patrocinadores de un Pop en la página del invitado (handoff "Patrocinadores
  en un Pop" v2 · categorías):
  · PortadaPatrocinadores (§3.2): etiqueta + cinta con todas las marcas, del
    mismo tamaño, en el orden de sus categorías (cada una con su color).
  · TarjetaPatrocinadores (§3.3): tarjeta de vidrio, un bloque por categoría.
  · BandaPatrocinadores (§3.4): la primera categoría fija arriba y las demás
    en una banda que corre sola, avanza con el scroll y se arrastra. Con una
    sola categoría, solo la banda.
  Tamaños y filas: helpers/patrocinadores.ts. Réplica en el editor:
  iattend-vite modules/SideEvents/Patrocinadores/Patrocinadores.jsx.
*/

const Filas = ({ logos, ancho, gap, oscuro }: { logos: LogoMedido[]; ancho: number; gap: number; oscuro?: boolean }) => (
  <>
    {acomodar(logos, { width: ancho, gap }).map((fila, i) => (
      <div key={i} className={styles.fila} style={{ gap }}>
        {fila.map((it) => <Logo key={it.id ?? it.url} it={it} oscuro={oscuro} />)}
      </div>
    ))}
  </>
);

const logosCinta = (grupos: ReturnType<typeof porCategoria>, medida?: Medida) =>
  grupos.flatMap(({ cat, items }) => logosDe(items, cat, medida));

export const PortadaPatrocinadores = ({ body }: { body: SideEventBody }) => {
  const s = patrocinadoresDe(body);
  return (
    <div className={styles.portada}>
      <span className={styles.portada_etiqueta}>{s.label}</span>
      <Cinta logos={logosCinta(porCategoria(s), MEDIDA_PORTADA)} gap={GAP.portada} sp={CINTA.portada.sp} speed={s.speed} />
    </div>
  );
};

// `vidrio`: la clase de las tarjetas de la página (side-event.module.css).
export const TarjetaPatrocinadores = ({ body, vidrio }: { body: SideEventBody; vidrio: string }) => {
  const s = patrocinadoresDe(body);
  const grupos = porCategoria(s);
  // Con un estilo de bloques claro, los logos adaptados van con su tinta.
  const tinta = (variablesDeEstilo(estiloDe(body), body.color) as Record<string, string | undefined>)["--bloque-tinta"];
  const oscuro = /^#[0-9a-f]{6}$/i.test(tinta ?? "") && luminancia(tinta) < 0.4;
  // Una sola categoría llamada como el grupo: la etiqueta PATROCINADORES ya lo dice.
  const titulo = (cat: (typeof grupos)[number]["cat"]) => {
    const t = etiquetaCategoria(cat);
    return grupos.length === 1 && t === "PATROCINADORES" ? "" : t;
  };
  return (
    <div className={`${vidrio} ${styles.tarjeta}`}>
      {grupos.map(({ cat, items }) => (
        <div key={cat.id} className={styles.nivel}>
          {titulo(cat) && <span className={styles.nivel_titulo}>{titulo(cat)}</span>}
          <div className={styles.filas}>
            <Filas logos={logosDe(items, cat)} ancho={ANCHO_FILA.tarjeta} gap={GAP.tarjeta} oscuro={oscuro} />
          </div>
        </div>
      ))}
    </div>
  );
};

export const BandaPatrocinadores = ({ body, scroller }: { body: SideEventBody; scroller?: () => HTMLElement | null | undefined }) => {
  const s = patrocinadoresDe(body);
  const grupos = porCategoria(s);
  const [primera, ...resto] = grupos;
  const varias = grupos.length > 1;
  const enCinta = varias ? resto : grupos;
  const marcas = enCinta.reduce((n, g) => n + g.items.length, 0);
  const etiquetaCinta = enCinta.map((g) => etiquetaCategoria(g.cat)).filter(Boolean).join(" · ");
  return (
    <div className={styles.banda}>
      {varias && (
        <>
          {etiquetaCategoria(primera.cat) && <span className={styles.nivel_titulo}>{etiquetaCategoria(primera.cat)}</span>}
          <div className={styles.banda_principal}>
            <Filas logos={logosDe(primera.items, primera.cat)} ancho={ANCHO_FILA.bandaFija} gap={GAP.bandaFija} />
          </div>
          {/* Sobre la cinta, los nombres de sus categorías (las que tengan). */}
          {etiquetaCinta && <span className={`${styles.nivel_titulo} ${styles.banda_segunda}`}>{etiquetaCinta}</span>}
        </>
      )}
      <div className={styles.banda_cinta}>
        <Cinta logos={logosCinta(enCinta)} gap={GAP.cinta} sp={CINTA.banda.sp} k={CINTA.banda.k} speed={s.speed} puntos arrastrable scroller={scroller} />
      </div>
      {varias && <span className={styles.banda_pie}>{marcas} {marcas === 1 ? "marca" : "marcas"} · arrastra la cinta</span>}
    </div>
  );
};
