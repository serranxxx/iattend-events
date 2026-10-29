"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowUp, ChevronDown, Pin, SmilePlus } from "lucide-react";
import { darker } from "@/helpers/functions";
import { AvatarAsistente } from "../Asistentes/Asistentes";
import { oscuroDe, type Asistente, type ModoAvatar } from "../Asistentes/datosAsistentes";
import type { AutorChat, MensajeChat, ReaccionesChat } from "./useChatFlash";
import styles from "./chat-flash.module.css";

/*
  Hoja del chat de asistentes de un Flash (handoff "Pop Event — Chat de
  asistentes", opción 1a). Sube sobre el evento; se cierra con la flecha,
  tocando el fondo, arrastrando el asa hacia abajo o con Escape. Mensajes de
  otros con su avatar (y mini-avatares de su pase), los míos en blanco a la
  derecha, reacciones con ráfaga y "escribiendo…".
*/

const PICK = ["❤️", "😂", "🔥", "👏", "🎉"];
const unir = (n: string[]) => (n.length > 1 ? `${n.slice(0, -1).join(", ")} y ${n[n.length - 1]}` : n[0] ?? "");

function rafaga(desde: HTMLElement, capa: HTMLElement | null, emoji: string) {
  if (!capa || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const a = capa.getBoundingClientRect();
  const r = desde.getBoundingClientRect();
  for (let i = 0; i < 7; i++) {
    const s = document.createElement("span");
    s.textContent = emoji;
    s.className = styles.burst;
    s.style.left = `${r.left + r.width / 2 - a.left}px`;
    s.style.top = `${r.top - a.top}px`;
    s.style.fontSize = `${18 + Math.random() * 10}px`;
    capa.appendChild(s);
    const dx = (Math.random() - 0.5) * 90;
    const dy = -60 - Math.random() * 80;
    s.animate(
      [{ transform: "translate(-50%,0) scale(.4)", opacity: 1 }, { transform: `translate(calc(-50% + ${dx}px), ${dy}px) scale(1.15)`, opacity: 0 }],
      { duration: 800 + Math.random() * 400, easing: "cubic-bezier(.2,.9,.25,1)" },
    ).onfinish = () => s.remove();
  }
}

type Props = {
  open: boolean;
  onClose: () => void;
  modo: ModoAvatar;
  preview?: boolean;
  confirmados: number;
  asistentes: Asistente[];
  chat: {
    mensajes: MensajeChat[];
    autores: Record<string, AutorChat>;
    reacciones: ReaccionesChat;
    fijado: { text: string } | null;
    yo: string | null;
    hayMas: boolean;
    cargando: boolean;
    enLinea: number;
    escribiendo: string[];
    enviar: (_texto: string, _reintentoDe?: string) => void;
    reaccionar: (_msgId: string, _emoji: string) => void;
    cargarMas: () => void;
    avisarEscribiendo: () => void;
  };
};

export default function ChatFlash({ open, onClose, modo, preview, confirmados, asistentes, chat }: Props) {
  const listRef = useRef<HTMLDivElement>(null);
  const capaRef = useRef<HTMLDivElement>(null);
  const hojaRef = useRef<HTMLDivElement>(null);
  const [borrador, setBorrador] = useState("");
  const [picker, setPicker] = useState<string | null>(null);
  const [entraron, setEntraron] = useState<Set<string>>(new Set());
  const [bump, setBump] = useState<string | null>(null);
  const [nuevosAbajo, setNuevosAbajo] = useState(0);
  const [arrastre, setArrastre] = useState(0);
  const cercaDelFondo = useRef(true);
  const arrastreRef = useRef<{ y: number; t: number } | null>(null);
  const cuantos = useRef(chat.mensajes.length);

  // Entrada de cada mensaje: monta abajo y transparente; al siguiente cuadro sube.
  useEffect(() => {
    const ids = chat.mensajes.map((m) => m.id).filter((id) => !entraron.has(id));
    if (!ids.length) return;
    const r = requestAnimationFrame(() => requestAnimationFrame(() => setEntraron((s) => new Set([...s, ...ids]))));
    return () => cancelAnimationFrame(r);
  }, [chat.mensajes]);

  // Llegan mensajes: abajo si ya estaba cerca del fondo; si no, la píldora.
  useLayoutEffect(() => {
    const el = listRef.current;
    const antes = cuantos.current;
    cuantos.current = chat.mensajes.length;
    if (!el || !open) return;
    if (cercaDelFondo.current) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    else if (chat.mensajes.length > antes) setNuevosAbajo((n) => n + chat.mensajes.length - antes);
  }, [chat.mensajes.length, chat.escribiendo.length, open]);

  // Al abrir: al fondo, Escape cierra.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    requestAnimationFrame(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight }));
    cercaDelFondo.current = true;
    setNuevosAbajo(0);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Tocar fuera cierra el picker.
  useEffect(() => {
    if (!picker) return;
    const fuera = (e: PointerEvent) => { if (!(e.target as HTMLElement).closest?.("[data-picker]")) setPicker(null); };
    document.addEventListener("pointerdown", fuera, true);
    return () => document.removeEventListener("pointerdown", fuera, true);
  }, [picker]);

  const puedeEscribir = Boolean(chat.yo) && !preview;

  const enviar = () => {
    const t = borrador.trim();
    if (!t || !puedeEscribir) return;
    chat.enviar(t.slice(0, 500));
    setBorrador("");
    cercaDelFondo.current = true;
  };

  const reaccionar = (msgId: string, emoji: string, el?: HTMLElement) => {
    if (!puedeEscribir) return;
    const eraMia = chat.reacciones[msgId]?.[emoji]?.mine;
    chat.reaccionar(msgId, emoji);
    setPicker(null);
    setBump(`${msgId}:${emoji}`);
    window.setTimeout(() => setBump(null), 380);
    if (el && !eraMia) rafaga(el, capaRef.current, emoji);
  };

  // Arrastrar el asa hacia abajo: > 120 px o rápido (> 0.5 px/ms) cierra.
  const onAsaDown = (e: React.PointerEvent) => {
    arrastreRef.current = { y: e.clientY, t: performance.now() };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onAsaMove = (e: React.PointerEvent) => {
    if (!arrastreRef.current) return;
    setArrastre(Math.max(0, e.clientY - arrastreRef.current.y));
  };
  const onAsaUp = (e: React.PointerEvent) => {
    const ini = arrastreRef.current;
    arrastreRef.current = null;
    if (!ini) return;
    const dy = e.clientY - ini.y;
    const v = dy / Math.max(1, performance.now() - ini.t);
    setArrastre(0);
    if (dy > 120 || v > 0.5) onClose();
  };

  const recientes = [...new Set([...chat.mensajes].reverse().map((m) => m.autor).filter((id) => id !== chat.yo))]
    .slice(0, 3).map((id) => chat.autores[id]).filter(Boolean);
  const etiquetaEscribiendo = chat.escribiendo.length > 1
    ? `${chat.escribiendo[0]} y ${chat.escribiendo.length - 1} más están escribiendo…`
    : `${chat.escribiendo[0]} está escribiendo…`;

  return (
    <>
      <div className={styles.scrim} style={{ opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none" }} onClick={onClose} />
      <div
        ref={hojaRef}
        className={styles.sheet}
        style={{
          transform: open ? `translateY(${arrastre}px)` : "translateY(104%)",
          transition: arrastre ? "none" : undefined,
          pointerEvents: open ? "auto" : "none",
        }}
        role="dialog"
        aria-label="Chat de asistentes"
        aria-hidden={!open}
      >
        <div className={styles.sheet_inner} style={{ opacity: open ? 1 : 0 }}>
          <div className={styles.handle_wrap} onPointerDown={onAsaDown} onPointerMove={onAsaMove} onPointerUp={onAsaUp} onPointerCancel={onAsaUp}>
            <div className={styles.handle} />
          </div>

          <div className={styles.header}>
            <button type="button" className={styles.icon_btn} onClick={onClose} aria-label="Cerrar"><ChevronDown size={18} strokeWidth={2.2} /></button>
            <div className={styles.header_col}>
              <span className={styles.title}>Chat de asistentes</span>
              <span className={styles.subtitle}>
                <span className={styles.live_dot} />
                <span className={styles.ellipsis}>
                  {preview ? "Vista previa" : `${Math.max(1, chat.enLinea)} en línea`} · {confirmados} confirmado{confirmados === 1 ? "" : "s"}
                </span>
              </span>
            </div>
            <div className={styles.recent}>
              {recientes.map((u) => <span key={u.id} className={styles.av_ring}><AvatarAsistente a={u} size={28} modo={modo} /></span>)}
            </div>
          </div>

          {chat.fijado && (
            <div className={styles.pinned}>
              <span className={styles.pin_icon}><Pin size={14} strokeWidth={2.2} /></span>
              <div className={styles.pinned_col}>
                <span className={styles.pinned_by}>Fijado por el anfitrión</span>
                <span className={styles.pinned_text}>{chat.fijado.text}</span>
              </div>
            </div>
          )}

          <div
            ref={listRef}
            className={styles.list}
            onScroll={(e) => {
              const el = e.currentTarget;
              cercaDelFondo.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
              if (cercaDelFondo.current) setNuevosAbajo(0);
            }}
          >
            <div className={styles.spacer} />
            {chat.hayMas && <button type="button" className={styles.mas_viejos} onClick={chat.cargarMas}>Ver mensajes anteriores</button>}
            {chat.cargando && !chat.mensajes.length && <div className={styles.cargando}>Cargando…</div>}
            {!chat.cargando && !chat.mensajes.length && <div className={styles.vacio}>Todavía no hay mensajes. ¡Saluda al grupo! 👋</div>}
            {chat.mensajes.map((m) => {
              const u = chat.autores[m.autor];
              const mio = m.autor === chat.yo;
              if (!u && !mio) return null;
              const reacts = Object.entries(chat.reacciones[m.id] ?? {}).filter(([, r]) => r.count > 0);
              const entro = entraron.has(m.id);
              const fila = (
                <div className={styles.reacts} style={{ justifyContent: mio ? "flex-end" : "flex-start" }} data-picker>
                  {reacts.map(([e, r]) => (
                    <button
                      key={e}
                      type="button"
                      className={`${styles.chip} ${r.mine ? styles.chip_mine : ""}`}
                      style={{ transform: `scale(${bump === `${m.id}:${e}` ? 1.18 : 1})` }}
                      onClick={(ev) => reaccionar(m.id, e, ev.currentTarget)}
                    >
                      {e} {r.count}
                    </button>
                  ))}
                  {puedeEscribir && !m.estado && (
                    <button type="button" className={`${styles.chip} ${styles.chip_plus}`} onClick={() => setPicker(picker === m.id ? null : m.id)} aria-label="Reaccionar">
                      <SmilePlus size={14} />
                    </button>
                  )}
                  {picker === m.id && (
                    <div className={styles.picker} style={mio ? { right: 0 } : { left: 0 }}>
                      {PICK.map((e) => <button key={e} type="button" onClick={(ev) => reaccionar(m.id, e, ev.currentTarget)}>{e}</button>)}
                    </div>
                  )}
                </div>
              );
              const estilo = { opacity: entro ? (m.estado === "fallido" ? 0.5 : m.estado === "enviando" ? 0.8 : 1) : 0, transform: `translateY(${entro ? 0 : 14}px)` };
              if (mio) {
                return (
                  <div key={m.id} className={styles.msg} style={estilo}>
                    <div className={styles.mine_col}>
                      <div className={`${styles.bubble} ${styles.bubble_mine}`}>{m.text}</div>
                      {(reacts.length > 0 || !m.estado) && fila}
                      {m.estado === "fallido" && (
                        <button type="button" className={styles.retry} onClick={() => chat.enviar(m.text, m.id)}>No se envió · Reintentar</button>
                      )}
                    </div>
                  </div>
                );
              }
              // Su pase: sus acompañantes (si es titular) o su titular (si es acompañante).
              const acomp = asistentes.filter((a) => a.titular === u.id);
              const titular = u.titular ? asistentes.find((a) => a.id === u.titular) ?? null : null;
              const minis = (acomp.length ? acomp : titular ? [titular] : []).slice(0, 2);
              const con = acomp.length ? `con ${unir(acomp.map((a) => a.nombre))}` : titular ? `con ${titular.nombre}` : "";
              return (
                <div key={m.id} className={styles.msg} style={estilo}>
                  <div className={styles.other_row}>
                    <span className={styles.group_av}>
                      <AvatarAsistente a={u} size={32} modo={modo} />
                      {minis.length > 0 && (
                        <span className={styles.minis}>
                          {minis.map((c) => <span key={c.id} className={styles.av_ring}><AvatarAsistente a={c} size={18} modo={modo} /></span>)}
                        </span>
                      )}
                    </span>
                    <div className={styles.other_col}>
                      <div className={styles.name_line}>
                        <b>{u.nombre}</b>
                        {con && <span className={styles.with}>{con}</span>}
                      </div>
                      <div className={styles.bubble} style={{ background: darker(oscuroDe(u, modo), 0.72) ?? "#2B221C" }}>{m.text}</div>
                      {fila}
                    </div>
                  </div>
                </div>
              );
            })}
            {chat.escribiendo.length > 0 && (
              <div className={styles.typing}>
                <span className={styles.typing_av} />
                <div className={styles.typing_bubble}><i /><i /><i /></div>
                <span className={styles.typing_label}>{etiquetaEscribiendo}</span>
              </div>
            )}
          </div>

          {nuevosAbajo > 0 && (
            <button
              type="button"
              className={styles.nuevos}
              onClick={() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }); setNuevosAbajo(0); }}
            >
              ↓ {nuevosAbajo} nuevo{nuevosAbajo === 1 ? "" : "s"}
            </button>
          )}

          <div className={styles.composer}>
            {preview ? (
              <div className={styles.preview_nota}>Vista previa: así verán el chat tus invitados confirmados.</div>
            ) : (
              <div className={styles.composer_row}>
                <input
                  className={styles.input}
                  value={borrador}
                  maxLength={500}
                  placeholder="Escribe algo al grupo…"
                  enterKeyHint="send"
                  onChange={(e) => { setBorrador(e.target.value); chat.avisarEscribiendo(); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); enviar(); } }}
                />
                <button type="button" className={styles.send} onClick={enviar} disabled={!borrador.trim()} aria-label="Enviar">
                  <ArrowUp size={20} strokeWidth={2.4} />
                </button>
              </div>
            )}
          </div>
        </div>
        <div ref={capaRef} className={styles.burst_layer} />
      </div>
    </>
  );
}
