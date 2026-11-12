"use client";

import React, { useEffect, useState } from "react";
import { ArrowUpRight, Copy, Download, Globe, Lock, Play } from "lucide-react";
import type { SideEvent } from "@/types/side_event";
import {
  type Acceso,
  detectarPlataforma,
  estadoPorHora,
  faltaLegible,
  formatoIdZoom,
  hostDeMaterial,
  idDeZoom,
  lineaZona,
  normalizarAcceso,
  pesoLegible,
  textosPlataforma,
  tipoDeArchivo,
} from "@/helpers/acceso";
import { LogoPlataforma } from "./LogoPlataforma";
import layout from "./layout.module.css";
import base from "../side-event.module.css";
import styles from "./acceso.module.css";

/*
  Widget Acceso de un Pop en línea (handoff "Pop · Evento en línea", 2a/2b):
  sustituye a TarjetaLugar bajo la etiqueta ACCESO. Arriba el enlace
  principal (Zoom / Meet / YouTube / genérico), sus datos copiables y, en
  YouTube, el estado por la hora; debajo, el material. Gemelo de
  iattend-vite/src/modules/SideEvents/Acceso/TarjetaAcceso.jsx.

  Lo privado (enlace, códigos y material) no viene en el body: se pide a
  GET /api/side-events/:clave/acceso con el código del invitado (solo
  confirmados si así lo pide el Pop). En "Ver en vivo" del editor llega en
  `accesoPreview` (la columna `acceso` del Pop).
*/

type Body = SideEvent["body"];

type Props = {
  body: Body;
  clave: string | number | undefined;
  codigo: string | null;          // código del invitado confirmado
  confirmado: boolean;            // yaConfirmo de la página
  preview?: boolean;
  accesoPreview?: unknown;
  onConfirmar?: () => void;       // la franja con candado lleva a confirmar
};

export default function TarjetaAcceso({ body, clave, codigo, confirmado, preview = false, accesoPreview, onConfirmar }: Props) {
  const soloConfirmados = body.online?.onlyConfirmed !== false;
  const bloqueada = soloConfirmados && !confirmado;
  const [acceso, setAcceso] = useState<Acceso | null>(preview ? normalizarAcceso(accesoPreview) : null);
  const [ahora, setAhora] = useState(() => new Date());
  const [copiado, setCopiado] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (preview) { setAcceso(normalizarAcceso(accesoPreview)); return; }
    if (bloqueada || !clave) { setAcceso(null); return; }
    let vivo = true;
    fetch(`${process.env.NEXT_PUBLIC_IATTEND_API_URL}/side-events/${clave}/acceso`, {
      headers: codigo ? { "x-codigo-invitado": codigo } : {},
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (vivo && d?.ok) setAcceso(normalizarAcceso(d.acceso)); })
      .catch(() => {});
    return () => { vivo = false; };
  }, [preview, accesoPreview, bloqueada, clave, codigo]);

  const d = detectarPlataforma(acceso?.url);
  const platform = (d.valido ? d.platform : body.online?.platform) ?? "link";
  const txt = textosPlataforma(platform, { host: d.host });
  const { estado, falta } = estadoPorHora(body, ahora);
  const zona = typeof window !== "undefined" ? lineaZona(body) : null;

  // Un enlace genérico sin ruta (título = host): "Enlace" en vez de repetirlo.
  const subtitulo = bloqueada ? "Enlace privado" : platform === "youtube" ? "YouTube"
    : platform === "link" && d.corto === d.host ? "Enlace" : (d.corto || "");
  const chipYoutube = estado === "antes" ? `en ${faltaLegible(falta ?? 0)}`
    : estado === "pronto" ? "Por comenzar"
      : estado === "envivo" ? "En vivo"
        : estado === "termino" ? "Terminó" : null;
  const conBotonGrande = platform === "youtube" && !bloqueada && acceso?.url && (estado === "pronto" || estado === "envivo" || estado === "termino");
  const cuandoReunion = platform !== "youtube"
    ? (estado === "antes" && (falta ?? 0) <= 24 * 60 ? `Empieza en ${faltaLegible(falta ?? 0)}` : estado === "envivo" ? "En curso" : null)
    : null;

  const meetingId = platform === "zoom" ? formatoIdZoom(acceso?.meetingId || idDeZoom(acceso?.url) || "") : "";
  const codigoReunion = platform === "zoom" ? (d.zoomConPwd ? "" : acceso?.passcode ?? "")
    : platform === "meet" ? (d.meetCode || acceso?.passcode || "") : "";
  const datos = [
    meetingId ? { etiqueta: "ID de reunión", valor: meetingId } : null,
    codigoReunion ? { etiqueta: platform === "meet" ? "Código de reunión" : "Código", valor: codigoReunion } : null,
  ].filter(Boolean) as { etiqueta: string; valor: string }[];

  const copiar = (valor: string) => {
    navigator.clipboard?.writeText(valor.replace(/\s/g, "")).catch(() => {});
    setCopiado(valor);
    window.setTimeout(() => setCopiado((c) => (c === valor ? null : c)), 1600);
  };

  const abrir = acceso?.url && d.https && !bloqueada ? acceso.url : null;

  return (
    <div className={`${base.tarjeta} ${styles.acceso}`}>
      <div className={styles.cabecera}>
        <span className={styles.mosaico}><LogoPlataforma platform={platform} /></span>
        <span className={styles.textos}>
          <span className={styles.titulo} data-una={!/\s/.test(txt.titulo) || undefined}>{txt.titulo}</span>
          <span className={styles.subtitulo}>{subtitulo}</span>
          {cuandoReunion && !bloqueada && <span className={styles.cuando}>{cuandoReunion}</span>}
        </span>
        {!bloqueada && (platform === "youtube"
          ? chipYoutube && (
            <span className={styles.estado} data-vivo={estado === "envivo" || undefined}>
              {estado === "envivo" && <i className={styles.punto} />}
              {chipYoutube}
            </span>
          )
          : abrir && (
            <a className={`${base.relieve} ${layout.lugar_abrir}`} href={abrir} target="_blank" rel="noopener noreferrer">
              {txt.boton} <ArrowUpRight size={14} strokeWidth={2.2} />
            </a>
          ))}
      </div>

      {bloqueada ? (
        <button type="button" className={styles.candado} onClick={onConfirmar}>
          <span className={styles.candado_icono}><Lock size={16} /></span>
          <span className={styles.textos}>
            <span className={styles.candado_titulo}>Enlace de acceso</span>
            <span className={styles.subtitulo}>Confirma tu asistencia para verlo</span>
          </span>
        </button>
      ) : (
        <>
          {conBotonGrande && (
            <a className={styles.ver} href={acceso!.url} target="_blank" rel="noopener noreferrer">
              <Play size={14} fill="currentColor" /> {estado === "termino" ? "Ver repetición" : "Ver transmisión"}
            </a>
          )}
          {datos.length > 0 && (
            <div className={styles.datos} data-uno={datos.length === 1 || undefined}>
              {datos.map((x) => (
                <button key={x.etiqueta} type="button" className={styles.dato} onClick={() => copiar(x.valor)}>
                  <span className={styles.textos}>
                    <span className={styles.dato_etiqueta}>{copiado === x.valor ? "Copiado" : x.etiqueta}</span>
                    <span className={styles.dato_valor}>{x.valor}</span>
                  </span>
                  <Copy size={15} />
                </button>
              ))}
            </div>
          )}
          {zona && <span className={styles.zona}>{zona}</span>}
          {(acceso?.material.length ?? 0) > 0 && (
            <div className={styles.material}>
              <span className={styles.material_etiqueta}>MATERIAL</span>
              {acceso!.material.map((m) => {
                const contenido = (
                  <>
                    {m.kind === "file"
                      ? <span className={styles.tipo}>{tipoDeArchivo(m.mime, m.title)}</span>
                      : <span className={styles.globo}><Globe size={16} /></span>}
                    <span className={styles.textos}>
                      <span className={styles.fila_titulo}>{m.title || (m.kind === "link" ? hostDeMaterial(m.url) : "Archivo")}</span>
                      <span className={styles.subtitulo}>{m.kind === "file" ? `${tipoDeArchivo(m.mime, m.title)} · ${pesoLegible(m.size)}` : hostDeMaterial(m.url)}</span>
                    </span>
                    {m.kind === "file" ? <Download size={16} /> : <ArrowUpRight size={16} />}
                  </>
                );
                const href = m.kind === "link" ? m.url : m.descarga;
                return href
                  ? <a key={m.id} className={styles.fila} href={href} target={m.kind === "link" ? "_blank" : undefined} rel="noopener noreferrer" download={m.kind === "file" ? true : undefined}>{contenido}</a>
                  : <div key={m.id} className={styles.fila}>{contenido}</div>;
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
