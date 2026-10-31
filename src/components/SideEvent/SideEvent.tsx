"use client";

import { SideEvent } from "@/types/side_event";
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import styles from "./side-event.module.css";
import Image from "next/image";
import { Button, Input, message } from "antd";
import { LuCircleCheck, LuCircleX } from "react-icons/lu";
import { FooterCompact } from "../FooterCompact/FooterCompact";
import { FaLock } from "react-icons/fa";
import { createClient } from "@/lib/supabase/client";
import {  SideGuestSubabasePayload } from "@/types/guests";
import { darker, getEventDateOnly, itinerarioPorDia, lineasDeFechas, sombraDeTexto, colorDeVelo } from "@/helpers/functions";
import { ItinerarioWidget } from "./ItinerarioWidget";
import { AnimatePresence, motion } from "motion/react";
import SongPlayer from "@/components/Invitation/SongPlayer/SongPlayer";
import Efectos from "./Efectos";
import FlashElemento from "./FlashElemento";
import { fontExtras } from "@/components/Invitation/fontExtras";
import ClimaVidrio from "./ClimaVidrio";
import Asistentes from "./Asistentes/Asistentes";
import SelectorAvatar, { type AvatarElegido } from "./Asistentes/SelectorAvatar";
import { avatarAlAzar, cargarAsistentes, contenidoDe, emojiDe, fondoDe, inicialesDe, LISTA_EJEMPLO, modoAvatar, perfilDe, type ListaAsistentes } from "./Asistentes/datosAsistentes";
import { estiloDe, tintaDeNotas, variablesDeEstilo } from "@/helpers/estilosBloque";
import { agruparTarjetas, estiloNotas, ETIQUETA_DE_GRUPO, portadaOculta, tarjetasDe, type GrupoTarjetas } from "@/helpers/tarjetasSide";
import ChatFlash from "./Chat/ChatFlash";
import RegistroCard from "./Registro/RegistroCard";
import { formPublicado, formVisible } from "./Registro/datosRegistro";
import { useEstadoRegistro } from "./Registro/useEstadoRegistro";
import FilaChat from "./Chat/FilaChat";
import { useChatFlash } from "./Chat/useChatFlash";
import ConfetiExplosion from "./Layout/ConfetiExplosion";
import HojaFlash from "./Layout/HojaFlash";
import NotificacionFormulario from "./Layout/NotificacionFormulario";
import TicketFlash from "./Layout/TicketFlash";
import { qrPaseSide } from "@/helpers/paseSide";
import TarjetaLugar, { direccionCompleta } from "./Layout/TarjetaLugar";
import layout from "./Layout/layout.module.css";
import { useAnchoFlash } from "./Layout/useAnchoFlash";
import { ClipboardList, MessageCircle } from "lucide-react";
import { CAMBIO_CARRUSEL_MS, fotosDePortada } from "@/helpers/fotosPortada";

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
// En iPad y Mac los elementos van en la pieza (357 × 631 escalada al alto de
// la pantalla, ~57 vh de ancho).
const tamanoDeSticker = (w: number) => {
  const vw = Math.min(100, Math.ceil(w * 1.25));
  return `(max-width: 450px) ${vw}vw, (min-width: 600px) ${Math.ceil(w * 0.57 * 1.25)}vh, ${Math.ceil(450 * (w / 100) * 1.25)}px`;
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

// Fecha y hora del boleto desde la hora de pared "YYYY-MM-DD HH:mm:00" (sin
// huso): "NOV 14" y "8:00 pm", como el pase de Apple Wallet.
const MESES_CORTOS = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
const fechaCorta = (pared?: string | null) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(pared ?? ""));
  return m ? `${MESES_CORTOS[Number(m[2]) - 1]} ${Number(m[3])}` : "";
};
const hora12 = (pared?: string | null) => {
  const m = /[ T](\d{2}):(\d{2})/.exec(String(pared ?? ""));
  if (!m) return "";
  const h = Number(m[1]);
  return `${h % 12 || 12}:${m[2]} ${h < 12 ? "am" : "pm"}`;
};

// Bloques que se abren y cierran dentro de la tarjeta del invitado: animan su
// alto y su opacidad. Mientras se mueven recortan (overflow hidden); ya
// abiertos no, para no cortar sombras ni la fila de emojis.
const DESPLIEGUE = {
  initial: { height: 0, opacity: 0, overflow: "hidden" },
  animate: { height: "auto", opacity: 1, transitionEnd: { overflow: "visible" } },
  exit: { height: 0, opacity: 0, overflow: "hidden" },
  transition: { height: { duration: 0.34, ease: [0.2, 0.9, 0.25, 1] }, opacity: { duration: 0.22 } },
} as const;

// Invitado de ejemplo de la vista previa "Confirmado" (sin id ni código: no
// toca datos reales; el chat y el formulario usan su modo vista previa).
const INVITADO_EJEMPLO = {
  id: undefined, name: "Invitado de ejemplo", state: "confirmado", password: "",
  companion_id: null, has_companion: false, emoji: null, profile: null,
  created_at: "", side_events_id: "", last_action: "", last_action_by: false, last_update_date: "",
  meal: null, notes: null, phone_number: null, side: null, table: null, tag: null, ticket: false, tier: null, type: null,
} as SideGuestSubabasePayload;

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
  preview?: boolean;
  // Link de un acompañante para registrarse después (?registro=<token>).
  registroToken?: string;
};

export default function SideEvents({ info, password, preview, registroToken }: invProps) {
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
  // Estilo de bloques (body.blockStyle): variables de la piel de las
  // tarjetas, también para lo que se abre fuera de ellas (hojas, aviso).
  const estiloBloque = estiloDe(info?.body);
  const varsEstilo = variablesDeEstilo(estiloBloque, info?.body?.color);
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
  // Dibujos a mano (herramienta Dibujar del editor) anclados a la FOTO: van en
  // el recuadro de la foto tal como se ve (cover de la portada, que es más
  // alta que la pantalla), así lo que se calcó sobre la foto cuadra aunque la
  // foto y el lienzo de los PNG se recorten distinto. Igual en el editor.
  const heroRef = useRef<HTMLDivElement>(null);
  // iPad y Mac (handoff "Evento Flash en iPad y Mac", 9b): la foto de la
  // portada a pantalla completa, los elementos en la pieza del editor
  // (357 × 631) centrada, y debajo las tarjetas (una columna en tableta,
  // mosaico de dos en escritorio). En celular no cambia nada.
  const esFlash = Boolean(info && !info.invitation_id);
  const ancho = useAnchoFlash();
  const escena = esFlash && ancho !== "tel";
  const mosaico = esFlash && ancho === "escritorio";
  const escenaRef = useRef<HTMLDivElement>(null);
  const [tamFoto, setTamFoto] = useState<{ w: number; h: number } | null>(null);
  // Carrusel de la portada (Flash): cambian solas cada CAMBIO_CARRUSEL_MS.
  const fotos = info?.body.video ? [] : fotosDePortada(info?.body);
  const [fotoActiva, setFotoActiva] = useState(0);
  const clavesFotos = fotos.join("|");
  useEffect(() => {
    setFotoActiva(0);
    if (fotos.length < 2) return undefined;
    const id = setInterval(() => setFotoActiva((i) => (i + 1) % fotos.length), CAMBIO_CARRUSEL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clavesFotos]);
  const [marcoFoto, setMarcoFoto] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const [draftCompanions, setDraftCompanions] = useState<SideGuestSubabasePayload[]>([]);
  const [draftMainName, setDraftMainName] = useState<string>("");
  const [draftMainRejected, setDraftMainRejected] = useState<boolean>(false);
  // Asistentes (solo Flash, opcional): la lista y el avatar que elige quien
  // confirma. En la vista previa del organizador, sin confirmados, un ejemplo.
  const mostrarAsistentes = Boolean(info && !info.invitation_id && info.body?.showAttendees);
  const [listaAsistentes, setListaAsistentes] = useState<ListaAsistentes | null>(null);
  const [avatar, setAvatar] = useState<AvatarElegido>({ emoji: null, perfil: null });
  // Emoji o iniciales (lo elige el organizador). Con emoji, el invitado ya
  // confirmado puede tocar su avatar para cambiarlo (no se le pide al confirmar).
  const modo = modoAvatar(info?.body?.attendeesStyle);
  const [editandoAvatar, setEditandoAvatar] = useState(false);
  const [guardandoAvatar, setGuardandoAvatar] = useState(false);
  // Chat de asistentes (opcional, con Asistentes visible): solo confirmados.
  const chatActivo = mostrarAsistentes && Boolean(info?.body?.chat?.enabled);
  const codigoChat = guestInfo?.state === "confirmado" ? guestInfo.password : null;
  const chat = useChatFlash({ eventoId: info?.id, codigo: codigoChat, activo: chatActivo, preview });
  const [chatAbierto, setChatAbierto] = useState(false);
  const marcarVistoChat = chat.marcarVisto;
  const cerrarChat = useCallback(() => { setChatAbierto(false); marcarVistoChat(); }, [marcarVistoChat]);

  // Acomodo 3a (handoff "Flash Layout"): el pase y el formulario salen del
  // scroll y se abren en una hoja; el formulario llega como aviso al confirmar.
  const [hoja, setHoja] = useState<null | "pase" | "form">(null);
  const [confeti, setConfeti] = useState<number | null>(null);
  // En la vista previa, "Asistiré" no guarda nada: solo enseña el confeti y el aviso.
  const [previewConfirmado, setPreviewConfirmado] = useState(false);
  const formActivo = Boolean(info && !info.invitation_id && info.body?.form?.enabled)
    && (formPublicado(info?.body?.form)?.sections.length ?? 0) > 0;
  const formPreguntas = formActivo ? formVisible(formPublicado(info!.body!.form)!).sections.reduce((n, sec) => n + sec.fields.length, 0) : 0;
  const yaConfirmo = guestInfo?.state === "confirmado" || Boolean(registroToken) || (preview && previewConfirmado);
  const estadoForm = useEstadoRegistro({
    eventoId: info?.id, codigo: codigoChat, token: registroToken ?? null,
    activo: formActivo && (Boolean(preview) || Boolean(codigoChat) || Boolean(registroToken)), preview,
  });
  const formPendiente = formActivo && yaConfirmo && estadoForm.pendiente;

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
    backgroundColor: "var(--bloque-suave, #FFFFFF20)",
    borderWidth: "1px",
    color: "var(--bloque-tinta, #FFF)",
    // 16 px: con menos, iOS hace zoom al enfocar el campo.
    fontSize: "16px",
    borderRadius: "12px",
    minHeight: "48px",
    fontFamily: "Poppins",
    width: "100%",
  };

  const rejectButtonStyle: React.CSSProperties = {
    color: "var(--bloque-tinta, #FFFFFF)",
    backgroundColor: "var(--bloque-suave, #FFFFFF25)",
    border: "1px solid var(--bloque-linea, #FFFFFF55)",
    borderRadius: "10px",
    fontSize: "12px",
    height: "44px",
    paddingInline: "12px",
    whiteSpace: "nowrap",
    fontFamily: 'Poppins',
  };

  const undoButtonStyle: React.CSSProperties = {
    color: "var(--bloque-tinta, #FFFFFF)",
    backgroundColor: "transparent",
    border: "1px solid var(--bloque-linea, #FFFFFF40)",
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
      recargarAsistentes();
      // messageApi.success("Estado actualizado");

    } catch (error) {
      console.log(error);
    }
  };

  // Vista previa: el editor manda los confirmados reales que ya tiene.
  const asistentesDelEditor = preview && info?._asistentes?.total ? info._asistentes : null;
  const recargarAsistentes = useCallback(async () => {
    if (!mostrarAsistentes || !info?.id) return;
    if (asistentesDelEditor) { setListaAsistentes(asistentesDelEditor); return; }
    const lista = await cargarAsistentes(info.id);
    // Vista previa: sin confirmados (o con el interruptor sin guardar) se ve el ejemplo.
    if (preview) setListaAsistentes(lista && lista.total > 0 ? lista : LISTA_EJEMPLO);
    else if (lista) setListaAsistentes(lista);
  }, [mostrarAsistentes, info?.id, preview, asistentesDelEditor]);

  useEffect(() => {
    if (!mostrarAsistentes) { setListaAsistentes(null); return; }
    if (preview) setListaAsistentes((prev) => prev ?? asistentesDelEditor ?? LISTA_EJEMPLO);
    recargarAsistentes();
    if (preview) return;
    // Quien tiene la página abierta ve llegar a los demás.
    const id = window.setInterval(() => { if (document.visibilityState === "visible") recargarAsistentes(); }, 20000);
    return () => window.clearInterval(id);
  }, [mostrarAsistentes, recargarAsistentes, preview]);

  // Vista previa "Confirmado" (dock de "Ver en vivo" en vite): un invitado de
  // ejemplo ya confirmado, para ver su tarjeta, "Ver mi pase", el aviso del
  // formulario, etc. Al apagarlo vuelve la vista sin confirmar.
  const vistaConfirmada = Boolean(preview && info?._vistaConfirmada);
  useEffect(() => {
    if (!preview) return;
    if (vistaConfirmada) {
      setGuestInfo(INVITADO_EJEMPLO);
      setCompanions([]);
      setPreviewConfirmado(true);
    } else {
      setGuestInfo(null);
      setPreviewConfirmado(false);
      setHoja(null);
    }
  }, [preview, vistaConfirmada]);

  // Confeti en explosión desde el botón (ConfetiExplosion).
  const onClick = useCallback(() => setConfeti(Date.now()), []);
  // Al confirmar (cuando sale el confeti) se abre solo el boleto, después de
  // la explosión. Al cerrarlo llega, si hay, el aviso del formulario.
  useEffect(() => {
    if (!confeti) return;
    const t = window.setTimeout(() => setHoja((h) => h ?? "pase"), 1300);
    return () => window.clearTimeout(t);
  }, [confeti]);
  const finConfeti = useCallback(() => setConfeti(null), []);

  // Mide la capa de PNG (del alto de la pantalla) para su lienzo. La portada
  // ocupa toda la pantalla, sin zona segura: los botones flotan encima.
  useLayoutEffect(() => {
    const medir = () => {
      const capa = capaStickersRef.current;
      if (!capa) return;
      // Tamaño de layout (offset*), no getBoundingClientRect: ese incluye el
      // zoom del scroll y, medido a media página, descentraba los PNG.
      setLienzoStickers(lienzoCover(capa.offsetWidth, capa.offsetHeight));
      // Recuadro de la foto dentro de la capa: la foto cubre la portada (todo
      // el ancho, centrada) y la capa es la columna centrada.
      const hero = heroRef.current;
      const columna = capa.parentElement;
      if (escena && hero && columna && tamFoto) {
        // iPad / Mac: la foto cubre toda la ventana y la capa es la pieza
        // centrada (a lo ancho y a lo alto).
        const escala = Math.max(hero.offsetWidth / tamFoto.w, hero.offsetHeight / tamFoto.h);
        const width = tamFoto.w * escala;
        const height = tamFoto.h * escala;
        setMarcoFoto({ left: (hero.offsetWidth - width) / 2 - columna.offsetLeft, top: (hero.offsetHeight - height) / 2 - columna.offsetTop, width, height });
      } else if (hero && tamFoto) {
        const escala = Math.max(hero.offsetWidth / tamFoto.w, hero.offsetHeight / tamFoto.h);
        const width = tamFoto.w * escala;
        const height = tamFoto.h * escala;
        const izquierdaCapa = (hero.offsetWidth - capa.offsetWidth) / 2;
        setMarcoFoto({ left: (hero.offsetWidth - width) / 2 - izquierdaCapa, top: (hero.offsetHeight - height) / 2, width, height });
      }
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
  }, [validated, confirmStep, info, tamFoto, escena]);

  const handleConfirmAttendance = () => {
    if (!guestInfo) {
      if (esPublico) setRegistro("confirmado");
      else if (preview) { setPreviewConfirmado(true); onClick(); }
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

  // El invitado confirmado cambia su emoji / color desde su tarjeta.
  const abrirAvatar = () => {
    if (!guestInfo) return;
    const id = String(guestInfo.id ?? "");
    setAvatar({ emoji: emojiDe({ id, emoji: guestInfo.emoji ?? null }), perfil: perfilDe({ id, perfil: guestInfo.profile ?? null }) });
    setEditandoAvatar(true);
  };
  const guardarAvatar = async () => {
    if (!guestInfo || guardandoAvatar) return;
    setGuardandoAvatar(true);
    const { data, error } = await supabase
      .from("side_events_guests")
      .update({ emoji: avatar.emoji, profile: avatar.perfil })
      .eq("password", guestInfo.password)
      .eq("side_events_id", info?.id)
      .select()
      .maybeSingle();
    setGuardandoAvatar(false);
    if (error || !data) {
      messageApi.error("No se pudo guardar tu avatar");
      return;
    }
    setGuestInfo(data);
    setEditandoAvatar(false);
    recargarAsistentes();
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
          // Asistentes: emoji y color automáticos (luego los puede cambiar tocando su avatar).
          ...(mostrarAsistentes && registro === "confirmado" ? (({ emoji, perfil }) => ({ emoji, perfil }))(avatarAlAzar()) : {}),
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
      recargarAsistentes();
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
        .update({
          state: draftMainRejected ? "rechazado" : "confirmado",
          name: draftMainName,
        })
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
      recargarAsistentes();
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
    // iPad / Mac: la portada (foto a pantalla completa + elementos) no se
    // acerca; se desvanece (1 → 0.15) y crece un 4% en los primeros 520 px.
    // Con movimiento reducido, solo opacidad.
    if (escena) {
      const capas = [heroRef.current, escenaRef.current].filter((el): el is HTMLDivElement => Boolean(el));
      document.querySelectorAll<HTMLElement>("[data-zoom]").forEach((el) => { el.style.transform = ""; });
      const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const aplicarEscena = () => {
        const k = Math.min(1, Math.max(0, pagina.scrollTop / 520));
        const opacidad = String(Math.round((1 - 0.85 * k) * 1000) / 1000);
        const escala = reducir ? "" : `scale(${Math.round((1 + 0.04 * k) * 1000) / 1000})`;
        capas.forEach((el) => { el.style.opacity = opacidad; el.style.transform = escala; });
      };
      const onScrollEscena = () => {
        cancelAnimationFrame(cuadro);
        cuadro = requestAnimationFrame(aplicarEscena);
      };
      aplicarEscena();
      pagina.addEventListener("scroll", onScrollEscena, { passive: true });
      return () => {
        cancelAnimationFrame(cuadro);
        pagina.removeEventListener("scroll", onScrollEscena);
        capas.forEach((el) => { el.style.opacity = ""; el.style.transform = ""; });
      };
    }
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
  }, [validated, info?.body.effect?.type, escena]);

  useEffect(() => {

    if (preview || registroToken) {
      // Vista previa, o un acompañante con su link de registro (el token ya
      // prueba que lo invitaron): entra sin código.
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


  // Privada y dirigida a alguien que aún no confirma: su dedicatoria va en la
  // primera pantalla, arriba de los botones de confirmar.
  const dedicatoriaArriba = !esPublico && Boolean(guestInfo?.name) && guestInfo?.state !== "confirmado" && !confirmStep && !registro;
  // Tarjeta del invitado ("Invitación dirigida a" / "Registrado como").
  const tarjetaInvitado = guestInfo?.name ? (
    <motion.div
      key="guest-name-card"
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.98 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className={`${styles.tarjeta} ${styles.invitado}`}
    >
      {/* Avatar flotante con las iniciales del invitado. */}
      {/* Con "Asistentes" y ya confirmado: su avatar de la lista. En
          modo emoji se toca para cambiarlo (lápiz chico). */}
      {mostrarAsistentes && guestInfo.state === "confirmado" ? (() => {
        const a = { id: String(guestInfo.id ?? ""), emoji: guestInfo.emoji ?? null, perfil: guestInfo.profile ?? null, iniciales: inicialesDe(guestInfo.name) };
        const contenido = (
          <span style={{ background: fondoDe(a, modo, info?.body.color), fontSize: modo === "initials" ? "26px" : "34px" }}>
            {contenidoDe(a, modo)}
          </span>
        );
        return modo === "emoji" ? (
          <button type="button" className={`${styles.invitado_avatar} ${styles.invitado_avatar_boton}`} onClick={abrirAvatar} aria-label="Cambiar mi emoji">
            {contenido}
            <span className={styles.invitado_avatar_lapiz} aria-hidden>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
            </span>
          </button>
        ) : <span className={styles.invitado_avatar} aria-hidden>{contenido}</span>;
      })() : (
        <span className={styles.invitado_avatar} aria-hidden>
          <span>{iniciales(guestInfo.name)}</span>
        </span>
      )}
      <span className={styles.invitado_etiqueta}>
        {esPublico ? "Registrado como" : "Invitación dirigida a"}
      </span>
      <span className={styles.invitado_nombre}>{guestInfo.name}</span>
      {/* El selector de avatar entra y sale animando su alto (la tarjeta
          crece / se encoge suave) y "Ver mi pase" hace lo contrario. */}
      <AnimatePresence initial={false}>
        {editandoAvatar && (
          <motion.div key="selector-avatar" {...DESPLIEGUE} style={{ width: "100%", display: "flex", flexDirection: "column" }}>
            <div className={styles.invitado_selector}>
              <SelectorAvatar nombre={guestInfo.name ?? ""} valor={avatar} onChange={setAvatar} idBase={String(guestInfo.id ?? "")} />
              <div className={styles.invitado_selector_botones}>
                <Button type="text" onClick={() => setEditandoAvatar(false)} style={{ color: "var(--bloque-tinta, #FFFFFF)", opacity: 0.8 }}>Cancelar</Button>
                <Button className={styles.locked_btn} style={{ ...btnStyle, width: "auto", height: "44px", fontSize: "14px", letterSpacing: "1px", paddingInline: "24px" }} loading={guardandoAvatar} onClick={guardarAvatar}>
                  Listo
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
      <AnimatePresence initial={false}>
        {guestInfo.state === "confirmado" && !editandoAvatar && (
          <motion.div key="ver-pase" {...DESPLIEGUE} style={{ width: "100%", display: "flex", flexDirection: "column" }}>
            <button type="button" className={layout.ver_pase} onClick={() => setHoja("pase")}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
                <path d="M13 5v2M13 17v2M13 11v2" />
              </svg>
              Ver mi pase
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {esPublico && (
        <button type="button" onClick={olvidarRegistro} className={styles.invitado_no_eres}>
          ¿No eres {guestInfo.name}?
        </button>
      )}
    </motion.div>
  ) : null;

  // Dibujo anclado a la foto (sin foto medida todavía, va en el lienzo).
  const enFoto = (st: NonNullable<SideEvent["body"]["stickers"]>[number]) => st.kind === "dibujo" && Boolean(st.foto) && Boolean(marcoFoto);
  // Los elementos de la portada en un recuadro (lienzo de los PNG o foto).
  const pintarStickers = (lista: NonNullable<SideEvent["body"]["stickers"]>) => lista.map((st) => {
                const giro = `translate(-50%, -50%) rotate(${st.rot ?? 0}deg)${st.flipX || st.flipY ? ` scale(${st.flipX ? -1 : 1}, ${st.flipY ? -1 : 1})` : ""}`;
                // Texto, ícono, forma, línea o decoración del panel Elementos.
                if (st.kind && st.kind !== "sticker") {
                  return (
                    <div
                      key={st.id}
                      className={`${styles.sticker} ${styles.elemento}`}
                      style={{ left: `${st.x}%`, top: `${st.y}%`, width: `${st.w}%`, transform: giro, opacity: st.opacity ?? 1 }}
                    >
                      <FlashElemento s={st} titleFont={info?.body.title?.font ?? "Poppins"} />
                    </div>
                  );
                }
                if (!st.url) return null;
                return (
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
                    transform: giro,
                    opacity: st.opacity ?? 1,
                  }}
                />
                );
  });

  // Velo opcional del panel Fondo y tinte del tema: tiñen la portada y los PNG,
  // detrás del texto, en toda la pantalla.
  const veloYTinte = (
    <>
      {colorDeVelo(info?.body.color, info?.body.veil) && (
        <div aria-hidden className={styles.velo_fijo} style={{ background: colorDeVelo(info?.body.color, info?.body.veil) }} />
      )}
      <div
        aria-hidden
        className={styles.tinte_fijo}
        style={{ "--blur-color": info?.body.color ?? "#000000" } as React.CSSProperties}
      />
    </>
  );

  return (
    <>
      {contextHolder}
      {chatActivo && (
        <ChatFlash
          open={chatAbierto}
          onClose={cerrarChat}
          modo={modo}
          preview={preview}
          confirmados={listaAsistentes?.total ?? 0}
          asistentes={listaAsistentes?.asistentes ?? []}
          vars={varsEstilo}
          colorTema={info?.body.color}
          // Vista previa: el fijado sale de lo que se está editando (sin guardar).
          chat={preview ? { ...chat, fijado: info?.body?.chat?.pinned?.text ? { text: info.body.chat.pinned.text } : null } : chat}
        />
      )}
      {confeti && <ConfetiExplosion key={confeti} onFin={finConfeti} />}
      {/* Escritorio (≥ 1024): los disparadores del panel lateral van fijos a la
          derecha (formulario arriba, chat abajo) y se desvanecen mientras el
          panel está abierto. */}
      {mosaico && formPendiente && (
        <button
          type="button"
          className={`${layout.disparador_form} ${hoja !== null || chatAbierto ? layout.disparador_oculto : ""}`}
          style={{ "--blur-color": info?.body.color ?? "#6E7FD8", ...varsEstilo } as React.CSSProperties}
          onClick={() => setHoja("form")}
        >
          <span className={layout.disparador_orbe} aria-hidden><ClipboardList size={20} strokeWidth={2} /></span>
          <span className={layout.disparador_textos}>
            <span className={layout.disparador_titulo}>Formulario</span>
            <span className={layout.disparador_sub}>Te falta responder</span>
          </span>
        </button>
      )}
      {mosaico && chatActivo && (
        <button
          type="button"
          className={`${layout.disparador_chat} ${hoja !== null || chatAbierto ? layout.disparador_oculto : ""}`}
          onClick={() => {
            // Sin confirmar: a los botones de confirmar, arriba.
            if (!preview && !codigoChat) { paginaRef.current?.scrollTo({ top: 0, behavior: "smooth" }); return; }
            setChatAbierto(true);
            chat.marcarVisto();
          }}
        >
          <MessageCircle size={20} strokeWidth={2} />
          Chat
          {chat.noLeidos > 0 && (
            <span className={layout.disparador_contador} aria-label={`${chat.noLeidos} ${chat.noLeidos === 1 ? "mensaje nuevo" : "mensajes nuevos"}`}>
              {chat.noLeidos > 99 ? "99+" : chat.noLeidos}
            </span>
          )}
        </button>
      )}
      {/* No se puede cerrar: se queda mientras el formulario esté pendiente. */}
      {!mosaico && formPendiente && hoja === null && !chatAbierto && (
        <NotificacionFormulario
          // Al volver (ya confirmado de antes) entra casi al momento.
          retrasoMs={confeti ? 900 : 400}
          vars={varsEstilo}
          titulo={formPublicado(info!.body!.form)!.title || "Formulario"}
          preguntas={formPreguntas}
          color={info?.body.color}
          onLlenar={() => setHoja("form")}
        />
      )}
      {/* Boleto ("Ver mi pase"; se abre solo al confirmar): título del pase
          (body.wallet) o el del evento, y la imagen del link; Apple Wallet si el
          organizador lo ofrece. En la vista previa, un invitado de ejemplo. */}
      {info && (
        <TicketFlash
          open={hoja === "pase"}
          onClose={() => setHoja(null)}
          titulo={String(info.body?.wallet?.title ?? "").trim() || info.name || "Tu evento"}
          // Foto del pase (vite → Pase digital) o, sin ella, la imagen del
          // link (la portada con sus elementos; con video, la que eligió el
          // organizador).
          imagen={info.body?.wallet?.image || info.url_image || info.body?.image || null}
          fecha={fechaCorta(info.body?.hour)}
          hora={hora12(info.body?.hour)}
          nombre={guestInfo?.name || "Invitado de ejemplo"}
          personas={guestInfo ? 1 + companions.filter((c) => c.state === "confirmado").length : 1}
          folio={estadoForm.folio}
          qr={guestInfo?.id != null ? qrPaseSide(guestInfo.id) : guestInfo?.password || "side:0"}
          color={darker(info.body?.color ?? "#3B332D", 0.35) ?? info.body?.color}
          conWallet={info.body?.wallet?.enabled !== false}
          eventoId={preview ? null : info.id}
          invitadoId={guestInfo?.id}
        />
      )}
      <HojaFlash
        vars={varsEstilo}
        open={hoja === "form"}
        // Al cerrar el formulario (a medias o terminado) se vuelve a leer su
        // estado: el pendiente y el folio del pase.
        onClose={() => { if (hoja === "form" && !preview) estadoForm.recargar(); setHoja(null); }}
        color={info?.body.color}
        label="Formulario"
        // iPad y Mac: encabezado del panel (el pase ya trae el suyo).
        titulo={hoja === "form" ? formPublicado(info?.body?.form)?.title || "Formulario" : undefined}
        subtitulo={hoja === "form" ? "Menos de un minuto · solo lo ve el organizador" : undefined}
      >
        {hoja === "form" && formActivo && (
          <RegistroCard
            form={info!.body!.form!}
            eventoId={info!.id}
            codigo={codigoChat}
            token={registroToken ?? null}
            preview={preview}
            enHoja
            onTerminado={() => { if (preview) estadoForm.terminar(); else estadoForm.recargar(); }}
          />
        )}
      </HojaFlash>
      {/* Canción de un Flash: el mismo reproductor compacto del Save the Date
          (disco arriba a la izquierda; gira mientras suena). */}
      {info?.body.song && (
        <SongPlayer song={info.body.song} accent="#FFFFFF" secondary="#FFFFFF" dev={false} compact />
      )}
      {/* Con video de fondo se apagan los desenfoques en vivo (con_video): se
          recalculaban en cada cuadro del video y lo trababan. */}
      <div
        ref={paginaRef}
        className={`${styles.side_event_main_cont} ${info?.body.video ? styles.con_video : ""} ${esFlash ? styles.flash : ""}`}
        // Lo que se asome detrás de la portada (p. ej. bajo la barra de Safari)
        // es el color del tema oscurecido, no el gris de arranque.
        style={info?.body.color ? { backgroundColor: darker(info.body.color, 0.8) ?? undefined, backgroundImage: "none", "--tema": info.body.color } as React.CSSProperties : undefined}
      >
        <div ref={heroRef} className={styles.hero}>
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
              onLoadedMetadata={(e) => setTamFoto({ w: e.currentTarget.videoWidth, h: e.currentTarget.videoHeight })}
            />
          ) : fotos.length > 1 ? (
            // Carrusel (helpers/fotosPortada.ts): las fotos encimadas, cambian
            // con un fundido; el zoom del scroll va en el contenedor y los
            // dibujos se anclan a la primera.
            <div className={styles.hero_bg} data-zoom>
              {fotos.map((src, i) => (
                <div key={src + i} className={styles.carrusel_foto} style={{ opacity: i === fotoActiva ? 1 : 0 }}>
                  <Image
                    fill
                    src={src}
                    alt=""
                    priority={i === 0}
                    style={{ objectFit: "cover" }}
                    onLoad={i === 0 ? (e) => setTamFoto({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight }) : undefined}
                  />
                </div>
              ))}
            </div>
          ) : (
            info?.body.image && <Image className={styles.hero_bg} data-zoom fill src={info?.body.image} alt="" style={{ objectFit: "cover" }} onLoad={(e) => setTamFoto({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })} />
          )}
          <div className={styles.blur_cover}></div>
          <div className={styles.shadow}></div>
        </div>

        {/* Portada fija: no se mueve con el scroll (como la foto, que es
            sticky). Lleva los PNG, los efectos, el velo y el título, la fecha y
            el lugar; los botones y las tarjetas (.info_cont, z 2) suben encima
            al hacer scroll. */}
        <div ref={escenaRef} className={styles.portada_fija}>
        {/* Columna de la pieza (450 px como máximo): en pantallas anchas los
            PNG y los efectos se quedan en ella y su zoom se recorta a sus
            orillas; el velo, el tinte y el fundido sí cubren todo el ancho. */}
        {/* En iPad y Mac la foto sigue a pantalla completa (el hero) y los
            elementos van en la pieza del editor (357 × 631) escalada al alto
            de la pantalla y centrada, sin recuadro visible. */}
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
              {pintarStickers((info?.body.stickers ?? []).filter((st) => !st.hidden && !enFoto(st)))}
            </div>
            {/* Dibujos anclados a la foto, en su recuadro. */}
            {marcoFoto && (
              <div className={styles.stickers_lienzo} style={marcoFoto}>
                {pintarStickers((info?.body.stickers ?? []).filter((st) => !st.hidden && enFoto(st)))}
              </div>
            )}
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

        {veloYTinte}

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
                ...varsEstilo,
              } as React.CSSProperties
            }
          >
            {/* Primera pantalla: título, fecha, lugar y botones de confirmar,
                con los botones al fondo de la pantalla (16 px abajo). Al hacer
                scroll todo esto y lo demás (itinerario, cómo llegar, notas…)
                sube encima de la portada fija. El editor (iattend-vite,
                SideCanvas) acomoda la pieza igual. */}
            <div className={`${styles.primera_pantalla} ${!confirmStep && !registro && (guestInfo?.state === "confirmado" || registroToken) ? styles.primera_confirmado : ""}`}>
              {/* Título, fecha y lugar se pueden ocultar desde Capas (coverHidden). */}
              {!portadaOculta(info?.body, "title") && <span
                className={styles.titulo_portada}
                style={{
                  // En iPad y Mac crece con la escena (side-event.module.css).
                  "--titulo-tam": info?.body.title.size ?? 32,
                  fontFamily: info?.body.title.font,
                  fontWeight: info?.body.title.weight,
                  fontSize: `${info?.body.title.size}px`,
                  lineHeight: info?.body.title.line_height,
                  opacity: info?.body.title.opacity,
                  textAlign: "center",
                  color: info?.body.title.color || "#FFF",
                  textShadow: sombraDeTexto(info?.body.title.shadow) ?? "0px 0px 18px rgba(0, 0, 0, 0.35)",
                  // Cursiva, subrayado, tachado, mayúsculas y espaciado: la misma
                  // barra de texto que la invitación (editor de iattend-vite).
                  ...fontExtras({
                    italic: info?.body.title.italic ?? undefined,
                    underline: info?.body.title.underline ?? undefined,
                    strike: info?.body.title.strike ?? undefined,
                    transform: info?.body.title.transform ?? undefined,
                    letterSpacing: info?.body.title.letterSpacing ?? undefined,
                  } as Parameters<typeof fontExtras>[0]),
                } as React.CSSProperties}
              >
                {info?.name}
              </span>}

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
                {!portadaOculta(info?.body, "date") && lineasDeFechas(info?.body, { state: info?.body.address?.state, timezone: info?.body.timezone }).map((linea) => (
                  <span key={linea}>{linea}</span>
                ))}
                {portadaOculta(info?.body, "place") ? null : info?.body.place_name ? (
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
              <AnimatePresence>
                {dedicatoriaArriba && tarjetaInvitado}
              </AnimatePresence>
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
                      color: "var(--bloque-tinta, #FFFFFF)",
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
                        backgroundColor: "var(--bloque-suave, #FFFFFF20)",
                        borderWidth: "1px",
                        color: "var(--bloque-tinta, #FFF)",
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
                            backgroundColor: "var(--bloque-suave, #FFFFFF20)",
                            borderWidth: "1px",
                            color: "var(--bloque-tinta, #FFF)",
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
                        color: "var(--bloque-tinta, #FFFFFF)",
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
                  <Button type="text" onClick={cancelConfirmStep} style={{ color: "var(--bloque-tinta, #FFFFFF)", opacity: 0.7 }}>
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
                            style={{ color: "var(--bloque-tinta, #FFFFFF)", opacity: 0.8 }}
                          />
                        </div>
                      ))}
                      {regAcompanantes.length < 10 && (
                        <Button
                          type="text"
                          onClick={() => setRegAcompanantes((prev) => [...prev, ""])}
                          style={{ color: "var(--bloque-tinta, #FFFFFF)", fontFamily: "Poppins" }}
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
                  <Button type="text" onClick={() => setRegistro(null)} style={{ color: "var(--bloque-tinta, #FFFFFF)", opacity: 0.7 }}>
                    Cancelar
                  </Button>
                </motion.div>
              ) : guestInfo?.state === 'confirmado' || registroToken ? null : (
                // Ya confirmó (o llega con su link de registro, que ya prueba que
                // confirmó): sin botones de asistencia; su tarjeta
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
                    <>
                    <Button onClick={handleConfirmAttendance} style={{ height: 'var(--alto-botones, 80px)', borderRadius: '99px 0px 0px 99px' }} icon={<LuCircleCheck size={20} strokeWidth={1.6} style={{ opacity: "0.8" }} />} type="text" className={styles.side_buttons}>
                      Asistiré
                    </Button>
                    <span className={styles.botones_divisor} aria-hidden />
                    </>
                  }
                  {
                    <Button onClick={() => (!guestInfo && esPublico ? setRegistro("rechazado") : preview && !guestInfo ? setPreviewConfirmado(false) : updateGuestStatus(guestInfo?.state === 'rechazado' ? 'creado' : 'rechazado'))} style={{ height: 'var(--alto-botones, 80px)', borderRadius: guestInfo?.state === 'rechazado' ? '99px' : '0px 99px 99px 0px' }} icon={guestInfo?.state !== 'rechazado' && <LuCircleX size={20} strokeWidth={1.6} style={{ opacity: "0.8" }} />} type="text" className={styles.side_buttons}>
                      {guestInfo?.state === 'rechazado' ? 'Asistencia declinada' : 'No asistiré'}
                    </Button>
                  }

                </motion.div>
              )}
              </AnimatePresence>
            </div>

            {/* Tarjeta del invitado. Privada y dirigida a alguien que aún no
                confirma: va arriba, en la primera pantalla, con los botones de
                confirmar debajo de la dedicatoria. */}
            <AnimatePresence>
              {!dedicatoriaArriba && !confirmStep && guestInfo?.name && tarjetaInvitado}
            </AnimatePresence>

            {/* Tarjetas debajo de la portada, en el orden y sin las ocultas del
                panel Capas del editor (helpers/tarjetasSide.ts), agrupadas bajo
                su etiqueta (INFORMACIÓN · UBICACIÓN · ASISTENTES, handoff
                "Flash Layout" 3a). Cada una conserva sus condiciones
                (dirección completa, ciudad, etc.); una etiqueta solo sale si
                su grupo tiene algo. El formulario ya no va aquí: llega como
                aviso y se abre en la hoja. */}
            {(() => {
              const body = info?.body;
              if (!body) return null;
              const fecha = getEventDateOnly(body.hour, { state: body.address?.state, timezone: body.timezone });
              const clima = body.address?.city ? {
                modo: body.weatherMode,
                ciudad: body.address.city,
                horasEvento: horasDelEvento(body, fecha),
                fechaEvento: fecha,
              } : null;
              const hay: Record<string, boolean> = {
                itinerary: itinerarioPorDia(body).length > 0,
                notes: Boolean(body.extras),
                map: direccionCompleta(body),
                weather: Boolean(clima),
                attendees: mostrarAsistentes && Boolean(listaAsistentes),
              };
              const grupos = agruparTarjetas(tarjetasDe(body, !info?.invitation_id).filter((c) => !c.hidden && hay[c.key]).map((c) => c.key));
              const etiqueta = (g: GrupoTarjetas) => <span className={layout.etiqueta}>{ETIQUETA_DE_GRUPO[g]}</span>;
              // Cada grupo en su envoltura (display: contents en celular y
              // tableta). En escritorio, mosaico de dos columnas: los grupos
              // impares a la izquierda y los pares a la derecha, sin huecos.
              const bloques = grupos.map(({ id, keys }) => (
                <div key={id} className={`${layout.grupo} ${esFlash ? layout.grupo_flash : ""}`}>
                  {/* Solo el clima (sin mapa): su tarjeta grande, y la etiqueta
                      solo si hay pronóstico que enseñar. */}
                  {id === "lugar" && !keys.includes("map") ? (
                    clima && <ClimaVidrio {...clima} antes={etiqueta(id)} />
                  ) : etiqueta(id)}
                  {keys.map((key) => (
                    <React.Fragment key={key}>
                      {key === "itinerary" && <ItinerarioWidget body={body} sinTitulo />}
                      {key === "notes" && (
                        <div className={styles.mapa_container} style={{ padding: "20px" }}>
                          <span
                            style={{
                              whiteSpace: "pre-line",
                              width: "100%",
                              // Tipografía, tamaño, color… de la barra de texto del editor.
                              ...estiloNotas(body),
                              // Con otro estilo de bloques: el color elegido si se lee, si no la tinta del estilo.
                              ...(tintaDeNotas(estiloBloque, body.color, body.notes_style?.color)
                                ? { color: tintaDeNotas(estiloBloque, body.color, body.notes_style?.color)!, mixBlendMode: "normal" as const }
                                : {}),
                            }}
                          >
                            {renderTextWithStrong(body.extras ?? "")}
                          </span>
                        </div>
                      )}
                      {/* Lugar: mapa y, si no está oculto, la fila del clima. */}
                      {key === "map" && <TarjetaLugar body={body} clima={keys.includes("weather") ? clima : null} />}
                      {key === "attendees" && listaAsistentes && (
                        <Asistentes
                          lista={listaAsistentes}
                          colorTema={body.color}
                          modo={modo}
                          sinTitulo
                          pie={chatActivo ? (
                            <FilaChat
                              bloqueada={!preview && !codigoChat}
                              noLeidos={chat.noLeidos}
                              ultimo={chat.ultimo ? {
                                nombre: chat.ultimo.autor === chat.yo ? "Tú" : chat.autores[chat.ultimo.autor]?.nombre ?? "",
                                texto: chat.ultimo.text,
                              } : null}
                              onOpen={() => {
                                // Sin confirmar: a los botones de confirmar, arriba.
                                if (!preview && !codigoChat) { paginaRef.current?.scrollTo({ top: 0, behavior: "smooth" }); return; }
                                setChatAbierto(true);
                                chat.marcarVisto();
                              }}
                            />
                          ) : null}
                        />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              ));
              if (!mosaico || !bloques.length) return bloques;
              // Mosaico por altura: cada grupo, en orden, va a la columna que
              // lleva menos alto (empate: izquierda). El alto es aproximado,
              // según lo que trae cada tarjeta (momentos del día más largo,
              // renglones de las notas…). Así un itinerario largo a la
              // izquierda manda Ubicación y Asistentes a la derecha.
              const masMomentos = Math.max(1, ...itinerarioPorDia(body).map((d) => d.momentos.length));
              const altoTarjeta: Record<string, number> = {
                itinerary: 150 + 85 * masMomentos,
                notes: 90 + 30 * Math.max(1, String(body.extras ?? "").split("\n").length + Math.floor(String(body.extras ?? "").length / 60)),
                map: grupos.some((g) => g.keys.includes("map") && g.keys.includes("weather")) ? 520 : 400,
                attendees: 260 + (chatActivo ? 80 : 0),
              };
              const altos = [0, 0];
              const izquierda: React.ReactNode[] = [];
              const derecha: React.ReactNode[] = [];
              grupos.forEach((g, i) => {
                const lado = altos[1] < altos[0] ? 1 : 0;
                // El clima va dentro de la tarjeta del lugar; solo, en su tarjeta grande.
                const alto = (k: string) => (k === "weather" ? (g.keys.includes("map") ? 0 : 260) : altoTarjeta[k] ?? 200);
                altos[lado] += 60 + g.keys.reduce((t, k) => t + alto(k), 0);
                (lado ? derecha : izquierda).push(bloques[i]);
              });
              return (
                <div className={`${layout.mosaico} ${derecha.length ? "" : layout.mosaico_uno}`}>
                  <div className={layout.mosaico_col}>{izquierda}</div>
                  {derecha.length > 0 && <div className={layout.mosaico_col}>{derecha}</div>}
                </div>
              );
            })()}

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
