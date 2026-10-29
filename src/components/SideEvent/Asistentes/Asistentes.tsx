"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { darker } from "@/helpers/functions";
import { brilloDe, contenidoDe, fondoDe, unidadesDe, type Asistente, type ListaAsistentes, type ModoAvatar } from "./datosAsistentes";
import styles from "./asistentes.module.css";

/*
  Tarjeta "Asistentes" de un Flash (handoff "Pop Event — Asistentes agrupados
  en cápsulas", opción 3a). Cerrada: pila de avatares y la línea de nombres
  agrupada ("Sofía +2, Mateo +1, Andrés…"). Abierta: cada avatar viaja (un
  solo nodo, solo transform) a su lugar en un flujo de unidades: un pase
  (titular + acompañantes) dentro de una cápsula de vidrio, o alguien solo.
  Las llegadas brillan, el contador rebota y aparece "X acaba de confirmar"
  ("X confirmó con Y" si es acompañante). El vidrio, el título y el chip son
  los de las demás tarjetas (Itinerario).
*/

const STACK = 7;
const AV = 44;
const ROWH = 78;
const GAP = 8;
const STEP = 26; // traslape de 18 px dentro de la cápsula

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

function Avatar({ a, size = AV, brillo, modo = "emoji" }: { a: Asistente; size?: number; brillo?: boolean; modo?: ModoAvatar }) {
  const chico = size < 30;
  const letras = modo === "initials";
  return (
    <div
      className={`${styles.avatar} ${letras ? styles.avatar_letras : ""}`}
      style={{
        width: size,
        height: size,
        background: fondoDe(a, modo),
        fontSize: Math.round(size * (letras ? 0.36 : chico ? 0.6 : 0.55)),
        boxShadow: brillo ? `0 0 0 3px ${brilloDe(a, modo)}88, 0 0 18px ${brilloDe(a, modo)}` : undefined,
      }}
    >
      {contenidoDe(a, modo)}
    </div>
  );
}

export function AvatarAsistente(props: { a: Asistente; size?: number; modo?: ModoAvatar }) {
  return <Avatar {...props} />;
}

// `pie`: lo que va al fondo de la tarjeta, de orilla a orilla (la fila del chat).
export default function Asistentes({ lista, colorTema, modo = "emoji", pie }: { lista: ListaAsistentes; colorTema?: string; modo?: ModoAvatar; pie?: React.ReactNode }) {
  const list = lista.asistentes;
  const n = Math.max(lista.total, list.length);
  const areaRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const prevIds = useRef<Set<string> | null>(null);
  const [open, setOpen] = useState(false);
  // Mientras se cierra, el área recorta (cerrada no: cortaría el brillo de una llegada).
  const [cerrando, setCerrando] = useState(false);
  useEffect(() => {
    if (!cerrando) return;
    const t = setTimeout(() => setCerrando(false), 600);
    return () => clearTimeout(t);
  }, [cerrando]);
  const [W, setW] = useState(310);
  const [newId, setNewId] = useState<string | null>(null);
  const [toast, setToast] = useState<Asistente | null>(null);
  const [toastOn, setToastOn] = useState(false);
  const [bump, setBump] = useState(false);
  // Pase abierto (tocar una cápsula con la tarjeta abierta): su lista.
  const [grupoAbierto, setGrupoAbierto] = useState<string | null>(null);
  const detalleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  // Llegadas: ids que no estaban en la carga anterior (la primera no cuenta).
  useEffect(() => {
    const ids = new Set(list.map((p) => p.id));
    const antes = prevIds.current;
    prevIds.current = ids;
    if (!antes) return;
    const nuevo = list.find((p) => !antes.has(p.id));
    if (!nuevo) return;
    setNewId(nuevo.id);
    setToast(nuevo);
    setToastOn(true);
    setBump(true);
    const a = setTimeout(() => setBump(false), 380);
    const b = setTimeout(() => { setToastOn(false); setNewId(null); }, 3200);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [list]);

  // Al cerrar la tarjeta se suelta el pase; tocar fuera del detalle también.
  useEffect(() => { if (!open) setGrupoAbierto(null); }, [open]);
  useEffect(() => {
    if (!grupoAbierto) return;
    const fuera = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      if (detalleRef.current?.contains(t) || t.closest?.("[data-capsula]")) return;
      setGrupoAbierto(null);
    };
    document.addEventListener("pointerdown", fuera, true);
    return () => document.removeEventListener("pointerdown", fuera, true);
  }, [grupoAbierto]);

  const unidades = useMemo(() => unidadesDe(list), [list]);
  // Orden plano (pila cerrada y escalones): unidad por unidad, titular primero.
  const plano = useMemo(() => unidades.flatMap((u) => u.miembros), [unidades]);

  // Flujo abierto: unidades por filas (centradas), cápsulas y lugar de cada avatar.
  const { lugar, capsulas, filas } = useMemo(() => {
    const medidas = unidades.map((u) => ({ u, w: 8 + AV + (u.miembros.length - 1) * STEP }));
    const filasArr: (typeof medidas)[] = [];
    let actual: typeof medidas = [];
    let ancho = 0;
    for (const m of medidas) {
      if (actual.length && ancho + GAP + m.w > W) { filasArr.push(actual); actual = []; ancho = 0; }
      ancho += (actual.length ? GAP : 0) + m.w;
      actual.push(m);
    }
    if (actual.length) filasArr.push(actual);
    const lugar = new Map<string, { x: number; y: number; z: number }>();
    const capsulas: { id: string; x: number; y: number; w: number; etiqueta: string; grupo: boolean }[] = [];
    filasArr.forEach((fila, r) => {
      const anchoFila = fila.reduce((acc, m) => acc + m.w, 0) + GAP * (fila.length - 1);
      let x = (W - anchoFila) / 2;
      const y = r * ROWH;
      for (const m of fila) {
        capsulas.push({ id: m.u.id, x, y, w: m.w, etiqueta: m.u.etiqueta, grupo: m.u.miembros.length > 1 });
        m.u.miembros.forEach((a, j) => lugar.set(a.id, { x: x + 4 + j * STEP, y: y + 4, z: 60 - j }));
        x += m.w + GAP;
      }
    });
    return { lugar, capsulas, filas: Math.max(1, filasArr.length) };
  }, [unidades, W]);

  // Cascada con tope: tarda lo mismo con 7 que con 70. Al cerrar, la altura
  // baja cuando los avatares ya van de regreso.
  // Abrir: los de la pila vuelan a su lugar y los demás aparecen en el suyo,
  // en cascada con tope (tarda lo mismo con 7 que con 70).
  // Cerrar: solo los de la pila regresan volando; los demás se desvanecen
  // donde están, las cápsulas se apagan y la tarjeta se encoge de inmediato
  // recortando lo que queda (antes los 66 cruzaban la tarjeta y se sentía mal).
  const pasoAbrir = Math.min(16, 360 / Math.max(1, plano.length));

  // Al cerrar desde abajo (el "Cerrar" del pie), la página sube con la
  // tarjeta para no quedarse viendo otra cosa.
  const alternar = () => {
    if (open) {
      const top = panelRef.current?.getBoundingClientRect().top ?? 0;
      if (top < 0) panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      setCerrando(true);
    }
    setOpen((o) => !o);
  };
  const areaH = open ? filas * ROWH - 6 : AV;
  const more = Math.max(0, n - STACK);
  const lineaNombres = unidades.map((u) => u.etiqueta).filter(Boolean).join(", ");
  const titularDe = (a: Asistente) => (a.titular ? list.find((q) => q.id === a.titular) : null);

  return (
    <div
      ref={panelRef}
      className={styles.panel}
      style={{ "--blur-color--darker": `${darker(colorTema ?? "#000000", 0.2) ?? "#000000"}80` } as React.CSSProperties}
    >
      {/* Encabezado como el del itinerario: título y chip de resumen. Todo él
          abre / cierra. */}
      <button type="button" className={styles.cabecera} style={n > 0 ? undefined : { cursor: "default" }} onClick={() => n > 0 && alternar()} aria-expanded={open}>
        <span className={styles.titulo}>Asistentes</span>
        {n > 0 && (
          <span className={styles.resumen} style={{ transform: `scale(${bump ? 1.08 : 1})` }}>
            <span className={styles.live_dot} />
            {plural(n, "asistente", "asistentes")}
          </span>
        )}
      </button>

      {n === 0 && <span className={styles.vacio}>¡Sé el primero en confirmar!</span>}

      {n > 0 && (
        <div
          ref={areaRef}
          className={`${styles.area} ${cerrando ? styles.area_cerrada : ""}`}
          style={{ height: areaH }}
        >
          {/* Cápsulas (detrás): un pase con vidrio; alguien solo, sin fondo. */}
          {capsulas.map((c) => (
            <div
              key={c.id}
              className={`${styles.capsula} ${c.grupo ? styles.capsula_grupo : ""}`}
              style={{
                width: c.w,
                transform: `translate(${c.x}px, ${c.y}px)`,
                opacity: open ? 1 : 0,
                // Al cerrar se apagan rápido (150 ms); al abrir entran tras los avatares.
                transitionDuration: `650ms, 650ms, ${open ? 350 : 150}ms`,
                transitionDelay: `0ms, 0ms, ${open ? 220 : 0}ms`,
              }}
            >
              <span className={styles.capsula_etiqueta} style={{ width: c.w + 40, fontWeight: c.grupo ? 600 : 500 }}>{c.etiqueta}</span>
            </div>
          ))}

          {plano.map((p, i) => {
            const o = lugar.get(p.id) ?? { x: 0, y: 0, z: 1 };
            const enPila = i < STACK;
            // Cerrada: los de la pila en la pila; los demás, invisibles en su
            // lugar de la cuadrícula (así abrir y cerrar no los hace cruzar).
            const l = open
              ? { x: o.x, y: o.y, s: 1, op: 1, z: o.z }
              : enPila
                ? { x: i * 34, y: 0, s: p.id === newId ? 1.08 : 1, op: 1, z: 100 - i }
                : { x: o.x, y: o.y, s: 0.85, op: 0, z: o.z };
            const delay = open ? Math.round(i * pasoAbrir) : enPila ? (STACK - i) * 20 : 0;
            return (
              <div
                key={p.id}
                className={styles.item}
                style={{
                  transform: `translate(${l.x}px, ${l.y}px) scale(${l.s})`,
                  opacity: l.op,
                  zIndex: l.z,
                  // Los que se desvanecen al cerrar lo hacen rápido.
                  transitionDuration: !open && !enPila ? "650ms, 200ms" : "650ms, 400ms",
                  transitionDelay: `${delay}ms`,
                }}
              >
                <Avatar a={p} brillo={p.id === newId} modo={modo} />
              </div>
            );
          })}

          <div
            className={styles.more}
            style={{ transform: `translateX(${STACK * 34}px) scale(${open ? 0.6 : 1})`, opacity: open || !more ? 0 : 1 }}
          >
            +{more}
          </div>

          {/* Abierta: cada pase se toca (encima de sus avatares y su etiqueta). */}
          {open && capsulas.filter((c) => c.grupo).map((c) => (
            <button
              key={`toque-${c.id}`}
              type="button"
              data-capsula
              className={styles.capsula_toque}
              style={{ width: c.w, transform: `translate(${c.x}px, ${c.y}px)` }}
              aria-label={`Ver el grupo de ${c.etiqueta}`}
              aria-expanded={grupoAbierto === c.id}
              onClick={() => setGrupoAbierto((g) => (g === c.id ? null : c.id))}
            />
          ))}

          {/* Lista del pase tocado: debajo de su cápsula (arriba si no cabe). */}
          {open && grupoAbierto && (() => {
            const c = capsulas.find((x) => x.id === grupoAbierto);
            const u = unidades.find((x) => x.id === grupoAbierto);
            if (!c || !u) return null;
            const ancho = Math.min(240, W);
            const alto = 16 + u.miembros.length * 40;
            const x = Math.max(0, Math.min(W - ancho, c.x + c.w / 2 - ancho / 2));
            const abajo = c.y + 74;
            const y = abajo + alto <= areaH + 40 || c.y - alto - 6 < 0 ? abajo : c.y - alto - 6;
            return (
              <div ref={detalleRef} className={styles.detalle} style={{ width: ancho, transform: `translate(${x}px, ${y}px)` }} role="dialog" aria-label="Grupo">
                {/* Solo la lista del grupo (sin decir quién es el titular). */}
                <button type="button" className={styles.detalle_cerrar} aria-label="Cerrar" onClick={() => setGrupoAbierto(null)}>
                  <X size={14} strokeWidth={2.4} />
                </button>
                {u.miembros.map((m) => (
                  <div key={m.id} className={styles.detalle_fila}>
                    <Avatar a={m} size={30} modo={modo} />
                    <span className={styles.detalle_nombre}>{m.nombre || "Acompañante"}</span>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* Pie: los nombres agrupados (cerrado) y "Ver todos" / "Cerrar". */}
      {n > 0 && (
        <button type="button" className={styles.pie} onClick={alternar}>
          <span className={styles.names} style={{ opacity: open ? 0 : 1 }}>
            {lista.ejemplo && <span className={styles.ejemplo}>Ejemplo</span>}
            {lineaNombres}
          </span>
          <span className={styles.toggle}>
            {open ? "Cerrar" : "Ver todos"}
            <ChevronDown size={16} strokeWidth={2.4} className={styles.chevron} style={{ transform: `rotate(${open ? 180 : 0}deg)` }} />
          </span>
        </button>
      )}

      <div className={styles.collapse} style={{ gridTemplateRows: toastOn ? "1fr" : "0fr" }}>
        <div>
          <div className={styles.toast} style={{ opacity: toastOn ? 1 : 0, transform: `translateY(${toastOn ? 0 : 8}px)` }}>
            {toast && <Avatar a={toast} size={22} modo={modo} />}
            <span>
              <b>{toast?.nombre || "Alguien"}</b>
              {toast && titularDe(toast) ? ` confirmó con ${titularDe(toast)!.nombre}` : " acaba de confirmar"}
            </span>
          </div>
        </div>
      </div>
      {pie}
    </div>
  );
}
