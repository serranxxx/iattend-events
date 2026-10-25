"use client";

import { SideEvent } from "@/types/side_event";
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import styles from "./side-event.module.css";
import Image from "next/image";
import { Button, Input, message } from "antd";
import { LuCircleCheck, LuCircleX } from "react-icons/lu";
import { simpleaddress } from "../Invitation/Itinerary/OpenCard/OpenCard";
import { FooterCompact } from "../FooterCompact/FooterCompact";
import { FaLock } from "react-icons/fa";
import { createClient } from "@/lib/supabase/client";
import {  SideGuestSubabasePayload } from "@/types/guests";
import { darker, getEventDateOnly, itinerarioPorDia, lineasDeFechas, sombraDeTexto, colorDeVelo } from "@/helpers/functions";
import { ItinerarioWidget } from "./ItinerarioWidget";
import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "motion/react";
import SongPlayer from "@/components/Invitation/SongPlayer/SongPlayer";
import Efectos from "./Efectos";
import ClimaVidrio from "./ClimaVidrio";

// Lienzo de los PNG de un Flash: la pieza del editor (iattend-vite, SideCanvas,
// 390×700) escalada para cubrir la pantalla y centrada, como object-fit:
// cover. Así los PNG conservan su tamaño respecto a la pantalla aunque el
// teléfono sea más alargado (se recorta un poco a los lados). Misma regla que
// lienzoCover en iattend-vite/src/modules/SideEvents/stickersFlashData.js.
const PIEZA_ANCHO = 390;
const PIEZA_ALTO = 700;
// `sizes` de un PNG que ocupa w% del lienzo. El lienzo mide lo de la columna
// (hasta 450 px) y en pantallas alargadas un poco más (cover): se pide con
// 25% de holgura para que no salga borroso.
const tamanoDeSticker = (w: number) => {
  const vw = Math.min(100, Math.ceil(w * 1.25));
  return `(max-width: 450px) ${vw}vw, ${Math.ceil(450 * (w / 100) * 1.25)}px`;
};

// Horas (0–23) del día del evento en que pasa algo, para resaltarlas en el
// clima: la de inicio (hora de pared "YYYY-MM-DD HH:mm") y las de las
// actividades del itinerario de ese día.
const horasDelEvento = (body: SideEvent["body"] | undefined, dia: string | null) => {
  if (!body) return [];
  const horas: number[] = [];
  const inicio = /^\d{4}-\d{2}-\d{2} (\d{2}):/.exec(String(body.hour ?? ""));
  if (inicio) horas.push(Number(inicio[1]));
  const grupos = itinerarioPorDia(body);
  const grupo = grupos.find((g) => g.dia === dia) ?? (grupos.length === 1 ? grupos[0] : null);
  for (const m of grupo?.momentos ?? []) {
    const h = /^(\d{1,2}):/.exec(String(m.time ?? ""));
    if (h) horas.push(Number(h[1]));
  }
  return [...new Set(horas)].sort((a, b) => a - b);
};

// "Luis Alberto" → "LA" (avatar de la tarjeta del invitado).
const iniciales = (nombre?: string | null) =>
  (nombre ?? "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "?";

const lienzoCover = (ancho: number, alto: number) => {
  const escala = Math.max(ancho / PIEZA_ANCHO, alto / PIEZA_ALTO);
  const width = PIEZA_ANCHO * escala;
  const height = PIEZA_ALTO * escala;
  return { left: (ancho - width) / 2, top: (alto - height) / 2, width, height };
};

type invProps = {
  info: SideEvent | null;
  password?: string;
  preview?: boolean
};

export default function SideEvents({ info, password, preview }: invProps) {
  const [validated, setValidated] = useState<boolean>(false);
  const [guestCode, setGuestCode] = useState<string>("");
  const supabase = createClient();
  const [messageApi, contextHolder] = message.useMessage();
  const [guestInfo, setGuestInfo] = useState<SideGuestSubabasePayload | null>(null);
  const [companions, setCompanions] = useState<SideGuestSubabasePayload[]>([]);
  const [confirmStep, setConfirmStep] = useState<boolean>(false);
  // Evento público (`type: 'open'`, candado abierto en el editor): cualquiera
  // con el link entra sin código y, para confirmar, da su nombre y el de sus
  // acompañantes (POST /api/side-events/:id/confirmacion-publica). Su código
  // queda en localStorage para que al volver vea y cambie su respuesta.
  const esPublico = info?.type === "open";
  const [registro, setRegistro] = useState<"confirmado" | "rechazado" | null>(null);
  const [regNombre, setRegNombre] = useState("");
  const [regAcompanantes, setRegAcompanantes] = useState<string[]>([]);
  const [regEnviando, setRegEnviando] = useState(false);
  const claveRegistro = info?.id ? `iattend_side_event_${info.id}` : null;
  // Fondo de la página y barra de Safari: el color de la invitación al 80%.
  // El fundido de abajo de la portada termina en este mismo color, para que
  // no quede línea. Mismo valor en el editor.
  const colorFondoPagina = darker(info?.body.color ?? "#000000", 0.8) ?? info?.body.color;
  // Capa de los PNG de un Flash (para medir su lienzo).
  const capaStickersRef = useRef<HTMLDivElement>(null);
  // La página hace scroll dentro de este contenedor (de la pantalla visible
  // exacta), no en la ventana: así en iOS 26 Safari nada sube detrás de la
  // barra de estado; se corta justo donde empieza.
  const paginaRef = useRef<HTMLDivElement>(null);
  const botonesRef = useRef<HTMLDivElement>(null);
  // Lienzo de los PNG (px dentro de la capa): la pieza del editor escalada
  // para cubrir la pantalla, ver lienzoCover.
  const [lienzoStickers, setLienzoStickers] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const [draftCompanions, setDraftCompanions] = useState<SideGuestSubabasePayload[]>([]);
  const [draftMainName, setDraftMainName] = useState<string>("");
  const [draftMainRejected, setDraftMainRejected] = useState<boolean>(false);

  interface CSSVars extends React.CSSProperties {
    ["--hover-color"]?: string;
  }

  const btnStyle: CSSVars = {
    ["--hover-color"]: `${info?.body.color}`,
    height: "56px",
    width: "280px",
    fontSize: "18px",
    fontWeight: 600,
    letterSpacing: "2px",
    boxShadow: "0px 0px 12px rgba(0,0,0,0.2)",
    fontFamily: 'Poppins',
  };

  // Campos del registro público: mismos que el paso de acompañantes.
  const registroInputStyle: React.CSSProperties = {
    backgroundColor: "#FFFFFF20",
    borderWidth: "1px",
    color: "#FFF",
    // 16 px: con menos, iOS hace zoom al enfocar el campo.
    fontSize: "16px",
    borderRadius: "12px",
    minHeight: "48px",
    fontFamily: "Poppins",
    width: "100%",
  };

  const rejectButtonStyle: React.CSSProperties = {
    color: "#FFFFFF",
    backgroundColor: "#FFFFFF25",
    border: "1px solid #FFFFFF55",
    borderRadius: "10px",
    fontSize: "12px",
    height: "44px",
    paddingInline: "12px",
    whiteSpace: "nowrap",
    fontFamily: 'Poppins',
  };

  const undoButtonStyle: React.CSSProperties = {
    color: "#FFFFFF",
    backgroundColor: "transparent",
    border: "1px solid #FFFFFF40",
    borderRadius: "10px",
    fontSize: "12px",
    height: "44px",
    paddingInline: "12px",
    whiteSpace: "nowrap",
    fontFamily: 'Poppins',
  };

  const renderTextWithStrong = (text: string) => {
    const parts = text.split(/(\*[^*]+\*)/g);

    return parts.map((part, index) => {
      if (part.startsWith("*") && part.endsWith("*")) {
        return <strong key={index}>{part.slice(1, -1)}</strong>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  const onValidateUser = async (code: string) => {

    try {
      const { data, error } = await supabase
        .from("side_events_guests")
        .select("*")
        .eq("password", code)
        .eq("side_events_id", info?.id)
        .maybeSingle();

      if (error) {
        console.log(error, 'not found')
        return
      }

      if (!data) {
        messageApi.error(`Código incorrecto`);
        return
      }

      if (data?.has_companion) {
        const { data: companionsData, error: companionsError } = await supabase
          .from("side_events_guests")
          .select("*")
          .eq("companion_id", data.id);

        if (companionsError) {
          console.log(companionsError, 'not found')
        }

        setCompanions(companionsData ?? [])
      } else {
        setCompanions([])
      }

      setValidated(true);
      setGuestInfo(data)


    } catch (error) {
      console.log(error)
    }
  };

  // `recordado`: el código salió del localStorage de un evento público. Si ya
  // no existe (el organizador borró al invitado) se olvida sin avisar y queda
  // la invitación para registrarse otra vez.
  const onMagicLogin = async (code: string, recordado = false) => {

    // console.log('getting guest ----')
    try {
      const { data, error } = await supabase
        .from("side_events_guests")
        .select("*")
        .eq("password", code)
        .eq("side_events_id", info?.id)
        .maybeSingle();

      if (error) {
        console.log(error, 'not found')
        return
      }

      if (!data) {
        if (recordado) {
          if (claveRegistro) window.localStorage.removeItem(claveRegistro);
          return;
        }
        messageApi.error(`Código incorrecto`);
        return
      }

      if (data?.has_companion) {
        const { data: companionsData, error: companionsError } = await supabase
          .from("side_events_guests")
          .select("*")
          .eq("companion_id", data.id);

        if (companionsError) {
          console.log(companionsError, 'not found')
        }

        setCompanions(companionsData ?? [])
      } else {
        setCompanions([])
      }

      setValidated(true);
      setGuestInfo(data)
    }
    catch (error) {
      console.log(error)
    }
  }

  const updateGuestStatus = async (state: string) => {
    try {
      const { data, error } = await supabase
        .from("side_events_guests")
        .update({ state })
        .eq("password", guestInfo?.password)
        .eq("side_events_id", info?.id)
        .select()
        .maybeSingle();

      if (error) {
        console.log(error, "error updating status");
        messageApi.error("No se pudo actualizar el estado");
        return;
      }

      if (!data) {
        messageApi.error("Invitado no encontrado");
        return;
      }

      console.log(data)

      // Si quieres hacer algo después de actualizar
      setGuestInfo(data)
      // messageApi.success("Estado actualizado");

    } catch (error) {
      console.log(error);
    }
  };

  const onClick = useCallback(() => {
    confetti({
      particleCount: 200,
      spread: 80,
      angle: 90,                 // 90 = hacia abajo, 270 = hacia arriba
      origin: { x: 0.5, y: 0.9 }
    });
  }, []);

  // Mide la capa de PNG (del alto de la pantalla) para su lienzo. La portada
  // ocupa toda la pantalla, sin zona segura: los botones flotan encima.
  useLayoutEffect(() => {
    const medir = () => {
      const capa = capaStickersRef.current;
      if (!capa) return;
      // Tamaño de layout (offset*), no getBoundingClientRect: ese incluye el
      // zoom del scroll y, medido a media página, descentraba los PNG.
      setLienzoStickers(lienzoCover(capa.offsetWidth, capa.offsetHeight));
    };
    medir();
    // Los botones entran con una animación de 0.25 s que los mueve 12 px.
    const t = window.setTimeout(medir, 300);
    window.addEventListener("resize", medir);
    const ro = new ResizeObserver(medir);
    if (botonesRef.current?.parentElement) ro.observe(botonesRef.current.parentElement);
    if (capaStickersRef.current) ro.observe(capaStickersRef.current);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", medir);
      ro.disconnect();
    };
  }, [validated, confirmStep, info]);

  const handleConfirmAttendance = () => {
    if (!guestInfo) {
      if (esPublico) setRegistro("confirmado");
      return;
    }

    if (guestInfo.state === 'confirmado') {
      updateGuestStatus('creado');
      return;
    }

    if (guestInfo.has_companion && companions.length > 0) {
      setDraftMainName(guestInfo.name ?? "");
      setDraftMainRejected(false);
      setDraftCompanions(companions);
      setConfirmStep(true);
      return;
    }

    updateGuestStatus('confirmado');
    onClick(); // si esto cierra modal, avanza paso, etc.
  };

  const enviarRegistro = async () => {
    if (!registro || !info?.id || regEnviando) return;
    if (!regNombre.trim()) {
      messageApi.error("Escribe tu nombre");
      return;
    }
    setRegEnviando(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_IATTEND_API_URL}/side-events/${info.id}/confirmacion-publica`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: regNombre.trim(),
          // Sin nombre, "Acompañante de …", como en el paso de acompañantes.
          acompanantes: registro === "confirmado"
            ? regAcompanantes.map((n) => n.trim() || `Acompañante de ${regNombre.trim()}`)
            : [],
          estado: registro,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        messageApi.error(data.msg || "No se pudo enviar tu respuesta");
        return;
      }
      setGuestInfo(data.invitado);
      setCompanions(data.acompanantes ?? []);
      if (claveRegistro) window.localStorage.setItem(claveRegistro, data.invitado.password);
      if (registro === "confirmado") onClick();
      setRegistro(null);
    } catch (error) {
      console.log(error);
      messageApi.error("No se pudo enviar tu respuesta");
    } finally {
      setRegEnviando(false);
    }
  };

  // Teléfono compartido: otra persona se registra con su nombre. El registro
  // anterior se queda en la lista del organizador; solo se olvida aquí.
  const olvidarRegistro = () => {
    if (claveRegistro) window.localStorage.removeItem(claveRegistro);
    setGuestInfo(null);
    setCompanions([]);
    setRegNombre("");
    setRegAcompanantes([]);
  };

  const cancelConfirmStep = () => {
    setDraftMainName(guestInfo?.name ?? "");
    setDraftMainRejected(false);
    setDraftCompanions(companions);
    setConfirmStep(false);
  };

  const confirmWithCompanions = async () => {
    if (!guestInfo) return;

    try {
      const results = await Promise.all(
        draftCompanions.map((c) => {
          const hasName = Boolean(c.name && c.name.trim() !== "");
          const finalName = hasName ? c.name : `Acompañante de ${draftMainName || guestInfo.name}`;
          const finalState = c.state === "rechazado" ? "rechazado" : "confirmado";
          return supabase
            .from("side_events_guests")
            .update({ name: finalName, state: finalState })
            .eq("id", c.id)
            .select()
            .maybeSingle();
        })
      );

      const failed = results.find((r) => r.error);
      if (failed?.error) {
        console.log(failed.error, "error updating companions");
        messageApi.error("No se pudo actualizar a tus acompañantes");
        return;
      }

      const updatedCompanions = results
        .map((r) => r.data)
        .filter((d): d is SideGuestSubabasePayload => Boolean(d));

      const { data, error } = await supabase
        .from("side_events_guests")
        .update({ state: draftMainRejected ? "rechazado" : "confirmado", name: draftMainName })
        .eq("password", guestInfo.password)
        .eq("side_events_id", info?.id)
        .select()
        .maybeSingle();

      if (error || !data) {
        console.log(error, "error updating status");
        messageApi.error("No se pudo actualizar el estado");
        return;
      }

      setCompanions(updatedCompanions);
      setGuestInfo(data);
      setConfirmStep(false);
      onClick();
    } catch (error) {
      console.log(error);
    }
  };


  // La barra de Safari (arriba, y lo que se asoma al rebotar el scroll) toma
  // el color de la invitación: fondo del documento y meta theme-color.
  useEffect(() => {
    const color = colorFondoPagina;
    if (!color) return;
    const html = document.documentElement;
    const fondoAnterior = html.style.backgroundColor;
    html.style.backgroundColor = color;
    document.body.style.backgroundColor = color;
    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const metaAnterior = meta?.content ?? null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.appendChild(meta);
    }
    meta.content = color;
    return () => {
      html.style.backgroundColor = fondoAnterior;
      document.body.style.backgroundColor = "";
      if (meta) {
        if (metaAnterior === null) meta.remove();
        else meta.content = metaAnterior;
      }
    };
  }, [colorFondoPagina]);

  // Al subir los botones la portada se acerca: zoom de 1 a 1.5 en el 60% de
  // la pantalla de scroll, desde el centro. Cada cuadro solo toca el transform
  // de la foto, los PNG y los efectos ([data-zoom]): nada de variables de
  // toda la página, que recalculaban todos los estilos y lo trababan.
  useEffect(() => {
    let cuadro = 0;
    let ultima = -1;
    const pagina = paginaRef.current;
    if (!pagina) return;
    const aplicar = () => {
      const avance = Math.min(1, Math.max(0, pagina.scrollTop / (pagina.clientHeight * 0.6)));
      const escala = Math.round((1 + 0.5 * avance) * 1000) / 1000;
      if (escala === ultima) return;
      ultima = escala;
      document.querySelectorAll<HTMLElement>("[data-zoom]").forEach((el) => {
        el.style.transform = `scale(${escala})`;
      });
    };
    const onScroll = () => {
      cancelAnimationFrame(cuadro);
      cuadro = requestAnimationFrame(aplicar);
    };
    aplicar();
    pagina.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(cuadro);
      pagina.removeEventListener("scroll", onScroll);
    };
  }, [validated, info?.body.effect?.type]);

  useEffect(() => {

    if (preview) {
      setValidated(true);
    } else {
      if (info?.type === "open") {

        setValidated(true);
        // Ya se había registrado desde este teléfono: se le muestra su respuesta.
        const guardado = claveRegistro ? window.localStorage.getItem(claveRegistro) : null;
        if (guardado) onMagicLogin(guardado, true);
        // setAnimation(true)
      } else {
        setValidated(false);
        if (password) {
          onMagicLogin(password)
        }
      }
    }


  }, []);


  return (
    <>
      {contextHolder}
      {/* Canción de un Flash: el mismo reproductor compacto del Save the Date
          (disco arriba a la izquierda; gira mientras suena). */}
      {info?.body.song && (
        <SongPlayer song={info.body.song} accent="#FFFFFF" secondary="#FFFFFF" dev={false} compact />
      )}
      {/* Con video de fondo se apagan los desenfoques en vivo (con_video): se
          recalculaban en cada cuadro del video y lo trababan. */}
      <div
        ref={paginaRef}
        className={`${styles.side_event_main_cont} ${info?.body.video ? styles.con_video : ""}`}
        // Lo que se asome detrás de la portada (p. ej. bajo la barra de Safari)
        // es el color del tema oscurecido, no el gris de arranque.
        style={info?.body.color ? { backgroundColor: darker(info.body.color, 0.8) ?? undefined, backgroundImage: "none" } : undefined}
      >
        <div className={styles.hero}>
          {/* Flash con video de fondo: en bucle y sin sonido; la imagen es su cuadro fijo. */}
          {info?.body.video ? (
            <video
              className={styles.hero_bg}
              data-zoom
              src={info.body.video}
              poster={info.body.image || undefined}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
            />
          ) : (
            info?.body.image && <Image className={styles.hero_bg} data-zoom fill src={info?.body.image} alt="" style={{ objectFit: "cover" }} />
          )}
          <div className={styles.blur_cover}></div>
          <div className={styles.shadow}></div>
        </div>

        {/* Portada fija: no se mueve con el scroll (como la foto, que es
            sticky). Lleva los PNG, los efectos, el velo y el título, la fecha y
            el lugar; los botones y las tarjetas (.info_cont, z 2) suben encima
            al hacer scroll. */}
        <div className={styles.portada_fija}>
        {/* Columna de la pieza (450 px como máximo): en pantallas anchas los
            PNG y los efectos se quedan en ella y su zoom se recorta a sus
            orillas; el velo, el tinte y el fundido sí cubren todo el ancho. */}
        <div className={styles.columna_fija}>
        {/* PNG de un Flash sobre la portada: capa del alto de la pantalla,
            sin recorte (la portada ocupa toda la pantalla y los botones flotan
            encima). Van detrás del título, la fecha y el lugar. */}
        {/* Los ocultos (`hidden`) los dejó el organizador guardados sin mostrar. */}
        {(info?.body.stickers ?? []).some((st) => !st.hidden) && (
          <div
            ref={capaStickersRef}
            aria-hidden
            className={styles.stickers_capa}
            data-zoom
          >
            {/* Hasta medir la pantalla no se pinta, para que no brinquen. */}
            <div className={styles.stickers_lienzo} style={lienzoStickers ?? { visibility: "hidden" }}>
              {/* Por el optimizador de Next, como la portada: cada teléfono
                  recibe WebP/AVIF del ancho que ocupa el PNG (un PNG pegado
                  pesaba ~1 MB; así ~100 KB). Van en la primera pantalla, con
                  prioridad. width/height solo dan la proporción inicial: el
                  alto real sale de la imagen (height: auto). */}
              {(info?.body.stickers ?? []).filter((st) => !st.hidden).map((st) => (
                <Image
                  key={st.id}
                  src={st.url}
                  alt=""
                  width={1200}
                  height={1200}
                  quality={80}
                  priority
                  sizes={tamanoDeSticker(st.w)}
                  draggable={false}
                  className={styles.sticker}
                  style={{
                    left: `${st.x}%`,
                    top: `${st.y}%`,
                    width: `${st.w}%`,
                    height: "auto",
                    transform: `translate(-50%, -50%) rotate(${st.rot ?? 0}deg)`,
                    opacity: st.opacity ?? 1,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Efectos animados (panel Efectos del editor): encima de la portada
            y los PNG, debajo del texto y los botones (.info_cont, z 2). */}
        {info?.body.effect?.type && (
          <div aria-hidden className={styles.stickers_capa} data-zoom>
            <Efectos effect={info.body.effect} colorTema={info.body.color} />
          </div>
        )}

        </div>

        {/* Velo opcional del panel Fondo: tiñe la portada y los PNG, detrás
            del texto. */}
        {colorDeVelo(info?.body.color, info?.body.veil) && (
          <div aria-hidden className={styles.velo_fijo} style={{ background: colorDeVelo(info?.body.color, info?.body.veil) }} />
        )}

        <div
          aria-hidden
          className={styles.tinte_fijo}
          style={{ "--blur-color": info?.body.color ?? "#000000" } as React.CSSProperties}
        />

        {/* Fundido inferior: en iOS 26 Safari no pinta nada bajo su barra
            flotante (ahí solo se ve el fondo de la página), así que la portada
            se funde con ese mismo color en vez de cortarse en seco. */}
        <div
          aria-hidden
          className={styles.fundido_inferior}
          style={{ "--fondo-pagina": colorFondoPagina ?? "#000000" } as React.CSSProperties}
        />

        </div>

        {
          validated &&

          <div
            className={styles.info_cont}
            style={
              {
                "--blur-color": `${info?.body.color ?? "#000000"}`,
                // Con video no hay desenfoque detrás de las tarjetas: más opacas
                // (85% en vez de 50%) para que se sigan leyendo.
                "--blur-color--dark": `${darker(info?.body.color ?? "#000", 0.8) ?? "#000000"}${info?.body.video ? "D9" : "80"}`,
              } as React.CSSProperties
            }
          >
            {/* Primera pantalla: título, fecha, lugar y botones de confirmar,
                con los botones al fondo de la pantalla (16 px abajo). Al hacer
                scroll todo esto y lo demás (itinerario, cómo llegar, notas…)
                sube encima de la portada fija. El editor (iattend-vite,
                SideCanvas) acomoda la pieza igual. */}
            <div className={styles.primera_pantalla}>
              <span
                style={{
                  fontFamily: info?.body.title.font,
                  fontWeight: info?.body.title.weight,
                  fontSize: `${info?.body.title.size}px`,
                  lineHeight: info?.body.title.line_height,
                  opacity: info?.body.title.opacity,
                  textAlign: "center",
                  color: "#FFF",
                  textShadow: sombraDeTexto(info?.body.title.shadow) ?? "0px 0px 18px rgba(0, 0, 0, 0.35)",
                }}
              >
                {info?.name}
              </span>

              <div
                className={styles.col}
                style={{
                  fontFamily: 'Poppins',
                  zIndex: 99,
                  // Sombra elegida en el editor; sin ella, la del CSS (.col / .con_video).
                  ...(sombraDeTexto(info?.body.details_shadow) ? { "--sombra-detalles": sombraDeTexto(info?.body.details_shadow) } : {}),
                } as React.CSSProperties}
              >
                {/* Un Flash puede tener varias fechas: una por renglón. */}
                {lineasDeFechas(info?.body, { state: info?.body.address?.state, timezone: info?.body.timezone }).map((linea) => (
                  <span key={linea}>{linea}</span>
                ))}
                {info?.body.place_name ? (
                  <span>{info.body.place_name}</span>
                ) : (
                  <>
                    <span>
                      {info?.body.address.street} {info?.body.address.number},
                    </span>
                    <span>
                      {info?.body.address.state} {info?.body.address.country}
                    </span>
                  </>
                )}
              </div>
              <AnimatePresence mode="wait">
              {confirmStep ? (
                <motion.div
                  key="confirm-step"
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.98 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className={styles.mapa_container}
                  style={{ padding: "18px", gap: "12px" }}
                >
                  <span
                    style={{
                      color: "#FFFFFF",
                      textAlign: "center",
                      fontFamily: "Poppins",
                      fontSize: "12px",
                      opacity: 0.7,
                    }}
                  >
                    Confirma tu asistencia
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%" }}>
                    <Input
                      value={draftMainName}
                      disabled={draftMainRejected}
                      onChange={(e) => setDraftMainName(e.target.value)}
                      placeholder="Tu nombre"
                      className={styles.locked_input}
                      style={{
                        backgroundColor: "#FFFFFF20",
                        borderWidth: "1px",
                        color: "#FFF",
                        fontSize: "16px",
                        fontWeight: 700,
                        textAlign: "center",
                        borderRadius: "12px",
                        minHeight: "44px",
                        fontFamily: 'Poppins',
                        flex: 1,
                        opacity: draftMainRejected ? 0.5 : 1,
                      }}
                    />
                    {draftMainRejected ? (
                      <Button onClick={() => setDraftMainRejected(false)} style={undoButtonStyle}>
                        Deshacer
                      </Button>
                    ) : (
                      <Button icon={<LuCircleX size={16} />} onClick={() => setDraftMainRejected(true)} style={rejectButtonStyle}>
                        No asistirá
                      </Button>
                    )}
                  </div>
                  {draftCompanions.map((c, index) => {
                    const isRejected = c.state === "rechazado";

                    return (
                      <div key={c.id ?? index} style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%" }}>
                        <Input
                          value={c.name ?? ""}
                          disabled={isRejected}
                          onChange={(e) =>
                            setDraftCompanions((prev) => prev.map((dc, i) => (i === index ? { ...dc, name: e.target.value } : dc)))
                          }
                          placeholder={`Acompañante de ${draftMainName || guestInfo?.name}`}
                          className={styles.locked_input}
                          style={{
                            backgroundColor: "#FFFFFF20",
                            borderWidth: "1px",
                            color: "#FFF",
                            // 16 px: con menos, iOS hace zoom al enfocar el campo.
                            fontSize: "16px",
                            borderRadius: "12px",
                            minHeight: "44px",
                            fontFamily: 'Poppins',
                            flex: 1,
                            opacity: isRejected ? 0.5 : 1,
                          }}
                        />
                        {isRejected ? (
                          <Button
                            onClick={() =>
                              setDraftCompanions((prev) => prev.map((dc, i) => (i === index ? { ...dc, state: "esperando" } : dc)))
                            }
                            style={undoButtonStyle}
                          >
                            Deshacer
                          </Button>
                        ) : (
                          <Button
                            icon={<LuCircleX size={16} />}
                            onClick={() =>
                              setDraftCompanions((prev) => prev.map((dc, i) => (i === index ? { ...dc, state: "rechazado" } : dc)))
                            }
                            style={rejectButtonStyle}
                          >
                            No asistirá
                          </Button>
                        )}
                      </div>
                    );
                  })}
                  {draftCompanions.some((c) => !c.name || c.name.trim() === "") && (
                    <span
                      style={{
                        color: "#FFFFFF",
                        textAlign: "center",
                        fontFamily: "Poppins",
                        fontSize: "12px",
                        fontStyle: "italic",
                        opacity: 0.7,
                      }}
                    >
                      A los acompañantes sin nombre se les asignará &quot;Acompañante de {draftMainName || guestInfo?.name}&quot;
                    </span>
                  )}
                  <Button className={styles.locked_btn} style={{ ...btnStyle, width: "100%" }} onClick={confirmWithCompanions}>
                    Confirmar
                  </Button>
                  <Button type="text" onClick={cancelConfirmStep} style={{ color: "#FFFFFF", opacity: 0.7 }}>
                    Cancelar
                  </Button>
                </motion.div>
              ) : registro ? (
                <motion.div
                  key="registro-step"
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.98 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className={styles.registro}
                >
                  <span className={styles.registro_titulo}>
                    {registro === "confirmado" ? "¿Quiénes vienen?" : "¿Quién no podrá venir?"}
                  </span>
                  <Input
                    value={regNombre}
                    onChange={(e) => setRegNombre(e.target.value)}
                    placeholder="Tu nombre"
                    maxLength={80}
                    autoFocus
                    className={styles.locked_input}
                    style={registroInputStyle}
                  />
                  {registro === "confirmado" && (
                    <>
                      {regAcompanantes.map((nombre, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%" }}>
                          <Input
                            value={nombre}
                            onChange={(e) => setRegAcompanantes((prev) => prev.map((n, j) => (j === i ? e.target.value : n)))}
                            placeholder={`Acompañante ${i + 1}`}
                            maxLength={80}
                            className={styles.locked_input}
                            style={{ ...registroInputStyle, flex: 1 }}
                          />
                          <Button
                            type="text"
                            aria-label="Quitar acompañante"
                            icon={<LuCircleX size={18} />}
                            onClick={() => setRegAcompanantes((prev) => prev.filter((_, j) => j !== i))}
                            style={{ color: "#FFFFFF", opacity: 0.8 }}
                          />
                        </div>
                      ))}
                      {regAcompanantes.length < 10 && (
                        <Button
                          type="text"
                          onClick={() => setRegAcompanantes((prev) => [...prev, ""])}
                          style={{ color: "#FFFFFF", fontFamily: "Poppins" }}
                        >
                          + Agregar acompañante
                        </Button>
                      )}
                    </>
                  )}
                  <Button
                    className={styles.locked_btn}
                    style={{ ...btnStyle, width: "100%" }}
                    loading={regEnviando}
                    onClick={enviarRegistro}
                  >
                    {registro === "confirmado" ? "Confirmar asistencia" : "Enviar respuesta"}
                  </Button>
                  <Button type="text" onClick={() => setRegistro(null)} style={{ color: "#FFFFFF", opacity: 0.7 }}>
                    Cancelar
                  </Button>
                </motion.div>
              ) : guestInfo?.state === 'confirmado' ? null : (
                // Ya confirmó: sin botón de "Asistencia confirmada"; su tarjeta
                // de invitado (abajo) ya lo dice.
                <motion.div
                  key="buttons-step"
                  initial={{ opacity: 0, y: -12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.98 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className={styles.buttons_cont}
                  ref={botonesRef}
                >
                  {
                    guestInfo?.state !== 'rechazado' &&
                    <Button onClick={handleConfirmAttendance} style={{ height: '64px', borderRadius: '99px 0px 0px 99px' }} icon={<LuCircleCheck size={18} style={{ opacity: "0.5" }} />} type="text" className={styles.side_buttons}>
                      Asistiré
                    </Button>
                  }
                  {
                    <Button onClick={() => (!guestInfo && esPublico ? setRegistro("rechazado") : updateGuestStatus(guestInfo?.state === 'rechazado' ? 'creado' : 'rechazado'))} style={{ height: '64px', borderRadius: guestInfo?.state === 'rechazado' ? '99px' : '0px 99px 99px 0px' }} icon={guestInfo?.state !== 'rechazado' && <LuCircleX size={18} style={{ opacity: "0.5" }} />} type="text" className={styles.side_buttons}>
                      {guestInfo?.state === 'rechazado' ? 'Asistencia declinada' : 'No asistiré'}
                    </Button>
                  }

                </motion.div>
              )}
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {!confirmStep && guestInfo?.name && (
                <motion.div
                  key="guest-name-card"
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.98 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className={`${styles.tarjeta} ${styles.invitado}`}
                >
                  {/* Avatar flotante con las iniciales del invitado. */}
                  <span className={styles.invitado_avatar} aria-hidden>
                    <span>{iniciales(guestInfo.name)}</span>
                  </span>
                  <span className={styles.invitado_etiqueta}>
                    {esPublico ? "Registrado como" : "Invitación dirigida a"}
                  </span>
                  <span className={styles.invitado_nombre}>{guestInfo.name}</span>
                  {guestInfo.has_companion && companions.some((c) => c.state !== "rechazado") && (
                    <div className={styles.invitado_acompanantes}>
                      {companions.filter((c) => c.state !== "rechazado").map((c, i) => (
                        <span key={c.id ?? i} className={`${styles.chip_vidrio} ${styles.invitado_chip}`}>
                          <span className={styles.invitado_chip_mas} aria-hidden>+</span>
                          <span>{c.name?.trim() || "Acompañante"}</span>
                        </span>
                      ))}
                    </div>
                  )}
                  {esPublico && (
                    <button type="button" onClick={olvidarRegistro} className={styles.invitado_no_eres}>
                      ¿No eres {guestInfo.name}?
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Itinerario de un Flash (widget), arriba de Cómo llegar. */}
            {info?.body && itinerarioPorDia(info.body).length > 0 && <ItinerarioWidget body={info.body} />}

            {info?.body.address.street &&
              info?.body.address.number &&
              info?.body.address.neighborhood &&
              info?.body.address.zipcode &&
              info?.body.address.city &&
              info?.body.address.state &&
              info?.body.address.country && (
                <div className={`${styles.tarjeta} ${styles.llegar}`}>
                  <div className={styles.llegar_cabecera}>
                    <div className={styles.llegar_textos}>
                      <span className={styles.llegar_titulo}>Cómo llegar</span>
                      <span className={styles.llegar_direccion}>
                        {[`${info.body.address.street} ${info.body.address.number}`.trim(), info.body.address.city].filter(Boolean).join(", ")}
                      </span>
                    </div>
                    <a
                      className={`${styles.relieve} ${styles.llegar_abrir}`}
                      href={info.body.address.url || `https://maps.google.com/?q=${encodeURIComponent([info.body.place_name, info.body.address.street, info.body.address.number, info.body.address.city, info.body.address.state].filter(Boolean).join(" "))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Abrir
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
                        <path d="M7 17L17 7M9 7h8v8" />
                      </svg>
                    </a>
                  </div>
                  <div className={styles.llegar_mapa}>
                    <iframe
                      title="Mapa"
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                      src={simpleaddress(
                        info?.body.address.street,
                        info?.body.address.number,
                        info?.body.address.neighborhood,
                        info?.body.address.zipcode,
                        info?.body.address.city,
                        info?.body.address.state,
                        info?.body.address.country
                      )}
                    />
                    <div className={styles.llegar_etiqueta}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z" />
                        <circle cx="12" cy="9" r="2.5" />
                      </svg>
                      <span>{info.body.place_name || info.body.address.neighborhood}</span>
                    </div>
                  </div>
                </div>
              )}



            {/* Notas: debajo de Cómo llegar. */}
            {info?.body.extras && (
              <div className={styles.mapa_container} style={{ padding: "12px 18px" }}>
                <span
                  style={{
                    color: "#FFFFFF",
                    whiteSpace: "pre-line",
                    textAlign: "center",
                    fontFamily: "Poppins",
                    fontSize: "14px",
                    mixBlendMode: "soft-light",
                  }}
                >
                  {renderTextWithStrong(info.body.extras ?? "")}
                </span>
              </div>
            )}

            {
              info?.body.address.city && !info?.body.hideWeather &&
              <ClimaVidrio
                ciudad={info.body.address.city}
                horasEvento={horasDelEvento(info.body, getEventDateOnly(info?.body.hour, { state: info?.body?.address?.state, timezone: info?.body?.timezone }))}
                fechaEvento={getEventDateOnly(info?.body.hour, { state: info?.body?.address?.state, timezone: info?.body?.timezone })}
                // Flash (sin invitación): el clima siempre, aunque falten días.
                siempre={!info?.invitation_id}
              />
            }

            <FooterCompact />
          </div>
        }
        <div
          className={styles.inv_locked_blured}
          style={{ pointerEvents: validated ? "none" : undefined, opacity: validated ? "0" : "1", backgroundColor: `${info?.body.color}20` }}
        >
          <div className={styles.locked_icon}>
            <FaLock size={32} style={{ color: "#FFF" }} />
          </div>
          <span style={{ fontFamily: 'Poppins' }} className={styles.locked_title}>
            Invitación Privada
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <span style={{ fontFamily: 'Poppins' }} className={styles.locked_text}>
              Nos alegra mucho que seas parte de este evento tan especial.
            </span>
            <span style={{ fontFamily: 'Poppins' }} className={styles.locked_text}>
              Esta invitación es exclusiva para ti. Ingresa tu código de invitado para continuar y disfrutar de esta experiencia única.
            </span>
          </div>
          <Input
            value={guestCode}
            // length={6}
            size="large"
            onChange={(e) => setGuestCode(e.target.value)}
            placeholder="Código de invitado"
            className={styles.locked_input}
            style={{
              backgroundColor: "#FFFFFF20",
              boxShadow: "0px 0px 12px rgba(0,0,0,0.2)",
              borderWidth: "2px",
              color: "#FFF",
              fontSize: "18px",
              textAlign: "center",
              maxWidth: "280px",
              borderRadius: "99px",
              minHeight: "56px",
              fontFamily: 'Poppins',
            }}
          />

          <Button className={styles.locked_btn} style={btnStyle} onClick={() => onValidateUser(guestCode)}>
            ACCEDER
          </Button>
        </div>

      </div>
    </>
  );
}
