"use client";

import { InvitationType, InvitationUIBundle, NewInvitation } from "@/types/new_invitation";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./invitation.module.css";
import { Cover } from "../Cover/Cover";
import { Greeting } from "../Greeting/Greeting";
import { People } from "../Family/Family";
import { Quote } from "../Quote/Quote";
import { Itinerary } from "../Itinerary/Itinerary";
import { DressCode } from "../DressCode/DressCode";
import { Gifts } from "../Gifts/Gifts";
import { Destinations } from "../Destinations/Destinations";
import { Notices } from "../Notices/Notices";
import { Gallery } from "../Gallery/Gallery";
import Image from "next/image";
import { Texture } from "@/lib/textures/cache";
import type { GiftBrand } from "@/lib/giftBrands/cache";
import { TextureOverlay } from "./TexturesOverlay";
import { Button, Input, message } from "antd";
import Confirm from "../Confirm/Confirm";
import { Lock as FaLock } from 'lucide-react';
import { X as IoClose } from 'lucide-react';
import SlideOverlay from "@/components/SlideOverlay/SlideOverlay";
import { GuestSubabasePayload } from "@/types/guests";
import { createClient } from "@/lib/supabase/client";
import AnimatedPath from "@/components/Motion/AnimatedPath";
import { FooterCompact } from "@/components/FooterCompact/FooterCompact";
import SongPlayer from "../SongPlayer/SongPlayer";
import InvitationControlBar from "../InvitationControlBar/InvitationControlBar";
import InvitationDock from "../InvitationDock/InvitationDock";
import LanguageToggle from "../LanguageToggle/LanguageToggle";
import { InvitationLayoutProvider, useIsLargeScreen } from "../layout/InvitationLayout";
import { useBrowserBarsColor } from "@/hooks/useBrowserBarsColor";
import { Eye, EyeOff, Paintbrush } from "lucide-react";
import { SectionLayer } from "../SectionLayer/SectionLayer";
import { ModuleTexturesContext } from "../ModuleBackdrop";
import { TextStylesContext } from "../fontExtras";
import { ModuleSeparator } from "../ModuleSeparator";

type invProps = {
  invitation: NewInvitation | null;
  loader: boolean;
  type: InvitationType;
  mongoID: string | null;
  dev: boolean;
  height: number | string | null;
  ui: InvitationUIBundle;
  lang?: string | null;
  availableLanguages?: string[] | null;
  invitationID?: string;
  password?: string;
  plan?: string;
  phone_number?: string | null;
  scrollToSection?: string | null;
  // Cambia en cada pedido de scroll del host, aunque repita la sección
  scrollKey?: number;
  onSectionChange?: (_section: string) => void;
  textures?: Texture[];
  giftBrands?: GiftBrand[];
  textureOverride?: Texture | null;
  // Modo edición (solo desde /host, el editor de iattend-vite): cada módulo es
  // una zona que se toca para elegirlo en el editor, y algunos textos se
  // escriben directo sobre la pieza. Ver docs/entorno-edicion.md en vite.
  editMode?: boolean;
  textBar?: boolean; // editor con barra de texto: sin las "T" de los textos
  selectedSection?: string | null;
  onSelectSection?: (_section: string, _field?: string) => void;
  onFieldChange?: (_path: string, _value: unknown) => void;
  onFieldTool?: (_field: string, _rect: { x: number; y: number; w: number; h: number }, _section?: string) => void;
  // Se soltó la parte elegida de la portada (título/fecha) sin elegir otra
  // cosa: el editor solo esconde sus herramientas, no cambia de módulo.
  onClearField?: () => void;
};

// Módulos con herramientas de fondo y separador sobre la pieza (modo edición).
const TOOL_SECTIONS = new Set(["greeting", "family", "quote", "itinerary", "dresscode", "gifts", "destinations", "notices", "gallery"]);

// Sección del editor que corresponde a cada módulo de `generals.positions`
// (mismos nombres que el scrollspy de abajo).
const SECTION_BY_MODULE: Record<number, string> = {
  1: "greeting", 2: "family", 3: "quote", 4: "itinerary", 5: "dresscode",
  6: "gifts", 7: "destinations", 8: "notices", 9: "gallery",
};

// Llave de cada módulo en la invitación (donde vive su `active`) y su nombre
// para el botón "Activar …" del modo edición.
const MODULE_KEY: Record<number, keyof NewInvitation> = {
  1: "greeting", 2: "people", 3: "quote", 4: "itinerary", 5: "dresscode",
  6: "gifts", 7: "destinations", 8: "notices", 9: "gallery",
};
const MODULE_NAME: Record<"es" | "en", Record<number, string>> = {
  es: { 1: "Bienvenida", 2: "Personas", 3: "Cita", 4: "Itinerario", 5: "Dresscode", 6: "Regalos", 7: "Destinos", 8: "Avisos", 9: "Galería" },
  en: { 1: "Welcome", 2: "People", 3: "Quote", 4: "Itinerary", 5: "Dress code", 6: "Gifts", 7: "Destinations", 8: "Notices", 9: "Gallery" },
};





export default function Invitation({ password, invitationID, ui, lang, availableLanguages, invitation, loader, type, mongoID, dev, plan, phone_number, scrollToSection, scrollKey, onSectionChange, textures = [], textureOverride = null, giftBrands = [], editMode = false, textBar = false, selectedSection = null, onSelectSection, onFieldChange, onFieldTool, onClearField }: invProps) {
  const coverRef = useRef<HTMLDivElement>(null);
  const greetingRef = useRef<HTMLDivElement>(null);
  const peopleRef = useRef<HTMLDivElement>(null);
  const quoteRef = useRef<HTMLDivElement>(null);
  const itineraryRef = useRef<HTMLDivElement>(null);
  const dresscodeRef = useRef<HTMLDivElement>(null);
  const giftsRef = useRef<HTMLDivElement>(null);
  const noticesRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const destinationRef = useRef<HTMLDivElement>(null);
  const scrollableContentRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const [heightSize, setHeightSize] = useState<number>(0);
  const supabase = createClient();

  // ≥768 (iPad y escritorio): layout "Split + Dock". La portada queda fija a
  // la izquierda (con el dock anclado a ella) y los módulos hacen scroll en
  // su propia columna a la derecha. Debajo, la columna móvil de siempre.
  const isSplit = useIsLargeScreen();
  const [asideRect, setAsideRect] = useState<{ w: number; h: number } | null>(null);
  const asideObserver = useRef<ResizeObserver | null>(null);
  const asideRef = useCallback((el: HTMLElement | null) => {
    asideObserver.current?.disconnect();
    if (!el) return;
    asideObserver.current = new ResizeObserver(([entry]) => {
      setAsideRect({ w: Math.round(entry.contentRect.width), h: Math.round(entry.contentRect.height) });
    });
    asideObserver.current.observe(el);
  }, []);
  useEffect(() => () => asideObserver.current?.disconnect(), []);

  const [open, setOpen] = useState(false);
  const [footerVisible, setFooterVisible] = useState(false);
  const [coverBehindDock, setCoverBehindDock] = useState(true);
  const [scrolledDown, setScrolledDown] = useState(false);
  const lastScrollY = useRef(0);
  const scrollDirection = useRef<'up' | 'down'>('up');
  const [guestCode, setGuestCode] = useState<string>("");
  const [validated, setValidated] = useState<boolean>(false);
  const [animation, setAnimation] = useState<boolean>(false);
  const [animatedText, setAnimatedText] = useState<boolean>(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [guestInfo, setGuestInfo] = useState<GuestSubabasePayload | null>(null);
  const [allCompanions, setAllCompanions] = useState<GuestSubabasePayload[]>([])

  // html/body solo tienen min-height (sin overflow:hidden) porque otras rutas
  // (pop, side-event) sí dependen del scroll normal del documento. Acá el
  // scroll real vive únicamente en .invitation_main_cont (scrollableContentRef,
  // con overscroll-behavior-y: contain) — si body también termina siendo
  // scrolleable por un pixel de más, quedan dos contenedores de scroll
  // independientes y en iOS el gesto de swipe hacia arriba se puede "perder"
  // entre uno y otro sin llegar al tope real. Se bloquea solo mientras esta
  // página está montada, y se revierte al salir para no afectar otras rutas.
  //
  // Solo overflow, sin forzar height: el min-height:100dvh ya definido en
  // main.css sigue mandando (y sí sigue la animación de la barra de Safari
  // en tiempo real); forzar un height:100dvh por JS aquí competía con ese
  // recálculo dinámico y dejaba un margen abajo en Safari.
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = { overflow: html.style.overflow };
    const prevBody = { overflow: body.style.overflow };
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtml.overflow;
      body.style.overflow = prevBody.overflow;
    };
  }, []);

  const primary = invitation?.generals?.colors.primary ?? "#FFFFFF";
  const secondary = invitation?.generals?.colors.secondary ?? "#FFFFFF";
  const accent = invitation?.generals?.colors.accent ?? "#FFFFFF";
  const actions = invitation?.generals?.colors.actions ?? "#FFFFFF";
  const font = invitation?.generals.fonts.body?.typeFace ?? "Poppins";
  const coverSong = invitation?.cover?.song;

  // Franjas de Safari (hora y barra de abajo) del color de la portada mientras
  // se ve; al bajar, del color de la invitación. Solo en el layout móvil.
  const coverMedia = invitation?.cover?.image?.prod;
  useBrowserBarsColor({
    enabled: !dev && !isSplit,
    coverUrl: (Array.isArray(coverMedia) ? coverMedia[0] : coverMedia) || null,
    pageColor: primary,
    coverRef,
    scrollRef: scrollableContentRef,
  });

  // const scrollableContentRef = useRef<HTMLDivElement | null>(null);

  const programmaticScrollGuardRef = useRef(0);
  const lastReportedSectionRef = useRef<string | null>(null);

  useEffect(() => {
    if (!scrollToSection) return;
    const sectionRefs: Record<string, React.RefObject<HTMLDivElement | null>> = {
      generals: coverRef,
      cover: coverRef,
      greeting: greetingRef,
      family: peopleRef,
      quote: quoteRef,
      itinerary: itineraryRef,
      dresscode: dresscodeRef,
      gifts: giftsRef,
      destinations: destinationRef,
      notices: noticesRef,
      gallery: galleryRef,
    };
    const target = sectionRefs[scrollToSection]?.current;
    const container = scrollableContentRef.current;
    if (!target || !container) return;
    // En el split la portada vive en el panel izquierdo, fuera del scroll:
    // ir a ella equivale a volver al inicio de la columna de módulos.
    if (!container.contains(target)) {
      container.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    // Evita que el scrollspy reporte las secciones intermedias mientras dura el scroll animado
    programmaticScrollGuardRef.current = Date.now() + 700;
    // Scroll manual acotado al contenedor: scrollIntoView() puede propagar el
    // "hacer visible" al documento padre (y hasta al padre del iframe cuando se
    // embebe en el wizard/preview), causando un scroll indeseado fuera de aquí.
    // En modo edición se deja aire arriba: el editor pone sus chips encima de
    // la pieza y, con el módulo pegado arriba, tapaban sus botones (fondo,
    // separador). La portada no lo necesita: va hasta arriba.
    const headroom = editMode && scrollToSection !== "cover" && scrollToSection !== "generals" ? 64 : 0;
    const targetTop = target.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop - headroom;
    container.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });

    // Bug conocido de WebKit/iOS: tras un scrollTo({behavior:'smooth'}) sobre un
    // contenedor con -webkit-overflow-scrolling:touch, el momentum scroll se queda
    // "congelado" y el swipe manual deja de responder hasta que algo fuerza un
    // reflow. Se espera a que el scroll se asiente (polling en vez de 'scrollend',
    // que no existe en Safari viejo) y se alterna esa propiedad para destrabarlo.
    let settleTimer: ReturnType<typeof setTimeout>;
    let lastTop = container.scrollTop;
    const waitForSettle = () => {
      if (container.scrollTop === lastTop) {
        container.style.setProperty("-webkit-overflow-scrolling", "auto");
        void container.offsetHeight;
        container.style.removeProperty("-webkit-overflow-scrolling");
        return;
      }
      lastTop = container.scrollTop;
      settleTimer = setTimeout(waitForSettle, 100);
    };
    settleTimer = setTimeout(waitForSettle, 100);

    return () => clearTimeout(settleTimer);
  }, [scrollToSection, scrollKey]);

  // Scrollspy: avisa al host qué sección está a la vista mientras el invitado navega libremente
  useEffect(() => {
    if (!validated || !onSectionChange) return;
    const container = scrollableContentRef.current;
    if (!container) return;

    const sections: Array<[string, React.RefObject<HTMLDivElement | null>]> = [
      ["cover", coverRef],
      ["greeting", greetingRef],
      ["family", peopleRef],
      ["quote", quoteRef],
      ["itinerary", itineraryRef],
      ["dresscode", dresscodeRef],
      ["gifts", giftsRef],
      ["destinations", destinationRef],
      ["notices", noticesRef],
      ["gallery", galleryRef],
    ];

    const visibleRatios = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const name = (entry.target as HTMLElement).dataset.scrollSection;
          if (!name) return;
          visibleRatios.set(name, entry.isIntersecting ? entry.intersectionRatio : 0);
        });

        if (Date.now() < programmaticScrollGuardRef.current) return;

        let bestSection: string | null = null;
        let bestRatio = 0;
        visibleRatios.forEach((ratio, name) => {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestSection = name;
          }
        });

        if (bestSection && bestSection !== lastReportedSectionRef.current) {
          lastReportedSectionRef.current = bestSection;
          onSectionChange(bestSection);
        }
      },
      { root: container, threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    sections.forEach(([name, ref]) => {
      if (ref.current) {
        ref.current.dataset.scrollSection = name;
        observer.observe(ref.current);
      }
    });

    return () => observer.disconnect();
  }, [validated, isSplit, invitation?.generals?.positions?.join(","), onSectionChange]);


  // Zona del modo edición: envuelve un módulo para que tocarlo lo elija en el
  // editor. Fuera del modo edición devuelve el módulo tal cual.
  // `module` (id de positions) solo para los módulos: con él aparece el botón
  // de deshabilitar, y si está deshabilitado se dibuja opaco con "Activar …".
  // Elementos sueltos de la sección (stickers, íconos, textos, líneas): la
  // capa va encima del módulo. Fuera del modo edición solo se monta si hay algo.
  const layerFor = (section: string) => (
    <SectionLayer
      section={section}
      items={invitation?.decorations?.[section] ?? []}
      editMode={editMode}
      accent={invitation?.generals?.colors?.accent ?? "#29262D"}
      titleFont={invitation?.generals?.fonts?.titles?.typeFace ?? invitation?.generals?.fonts?.body?.typeFace}
      bodyFont={invitation?.generals?.fonts?.body?.typeFace}
      palette={[
        invitation?.generals?.colors?.primary,
        invitation?.generals?.colors?.secondary,
        invitation?.generals?.colors?.accent,
        invitation?.generals?.colors?.actions,
        invitation?.generals?.fonts?.titles?.color,
        "#FFFFFF",
        "#000000",
      ].filter((c): c is string => Boolean(c))}
      onChange={(list) => onFieldChange?.(`decorations.${section}`, list)}
    />
  );

  const zone = (section: string, node: React.ReactNode, key?: React.Key, module?: { path: string; name: string; disabled: boolean }) => {
    // Fuera del modo edición también va envuelto: el espacio entre bloques es
    // su padding (data-module-zone), no un gap del contenedor.
    if (!editMode) {
      return (
        <div key={key} className={styles.layerHost} data-module-zone={section}>
          {/* Antes del módulo: sus elementos "detrás" quedan bajo el contenido. */}
          {invitation?.decorations?.[section]?.length ? layerFor(section) : null}
          {node}
        </div>
      );
    }
    const selected = selectedSection === section;
    const openTool = (field: string) => (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      const r = e.currentTarget.getBoundingClientRect();
      onFieldTool?.(field, { x: r.left, y: r.top, w: r.width, h: r.height }, section);
    };
    return (
      <div
        key={key}
        className={styles.editZone}
        data-edit-zone={section}
        data-module-zone={section}
        data-selected={selected || undefined}
        data-disabled={module?.disabled || undefined}
        onClick={(e) => { e.stopPropagation(); onSelectSection?.(section); }}
      >
        {/* Capa de elementos sueltos antes del módulo (ver section-layer.module.css). */}
        {!module?.disabled && layerFor(section)}
        {/* Herramientas del módulo elegido: el fondo arriba a la izquierda (el
            separador se toca directo en la pieza) y ocultar arriba a la derecha.
            Con barra (escritorio) el fondo se edita en la barra de arriba al
            elegir el bloque: sin brocha. */}
        {selected && module && !module.disabled && !textBar && TOOL_SECTIONS.has(section) && (
          <div className={styles.zoneTools} data-edit-hit>
            <button type="button" className={styles.zoneTool} data-edit-hit aria-label="Fondo" title="Fondo" onClick={openTool("background")}>
              <Paintbrush size={15} strokeWidth={2.2} />
            </button>
          </div>
        )}
        {selected && module && !module.disabled && (
          <div className={`${styles.zoneTools} ${styles.zoneToolsRight}`} data-edit-hit>
            <button
              type="button"
              className={styles.zoneGlass}
              data-edit-hit
              aria-label={`Deshabilitar ${module.name}`}
              title={`Deshabilitar ${module.name}`}
              onClick={(e) => { e.stopPropagation(); onFieldChange?.(`${module.path}.active`, false); }}
            >
              <EyeOff size={15} strokeWidth={2} />
            </button>
          </div>
        )}
        {module?.disabled ? (
          <>
            {/* Deshabilitado: no desaparece mientras se edita, se ve opaco. En
                la invitación publicada sigue sin mostrarse. */}
            <div className={styles.zoneDimmed}>{node}</div>
            <button
              type="button"
              className={`${styles.zoneGlass} ${styles.zoneActivate}`}
              data-edit-hit
              onClick={(e) => { e.stopPropagation(); onFieldChange?.(`${module.path}.active`, true); onSelectSection?.(section); }}
            >
              <Eye size={15} strokeWidth={2} />
              Activar {module.name}
            </button>
          </>
        ) : node}
      </div>
    );
  };

  // Separador de un módulo: va entre bloques, fuera de su zona (antes cada
  // módulo lo pintaba al pie de su propio bloque).
  const separatorAfter = (id: number, index: number, shown: boolean) => {
    const section = SECTION_BY_MODULE[id];
    if (!invitation) return null;
    const content = invitation[MODULE_KEY[id]] as { dynamic_separator?: Parameters<typeof ModuleSeparator>[0]["separator"] } | undefined;
    if (!section || !shown || (!editMode && !content?.dynamic_separator?.active)) return null;
    return (
      <div key={`sep-${index}`} className={styles.betweenBlocks} data-separator-of={section}>
        <ModuleSeparator
          separator={content?.dynamic_separator}
          generals={invitation.generals}
          // Va sobre el fondo de la invitación, no sobre el del bloque:
          // "Invertir color" del bloque ya no le toca.
          inverted={false}
          editMode={editMode}
          section={section}
          onFieldTool={(field, rect, sec) => { onFieldTool?.(field, rect, sec); onSelectSection?.(section); }}
        />
      </div>
    );
  };

  const handlePosition = (id: number, invitation: NewInvitation, index: number) => {
    const block = blockAt(id, invitation, index);
    const content = invitation[MODULE_KEY[id]] as { active?: boolean } | undefined;
    // En edición se ve aunque esté apagado (el bloque se dibuja opaco); el
    // separador de un bloque apagado no.
    const sep = separatorAfter(id, index, Boolean(content?.active));
    return sep ? [block, sep] : block;
  };

  const blockAt = (id: number, invitation: NewInvitation, index: number) => {
    const section = SECTION_BY_MODULE[id];
    if (editMode && section) {
      const key = MODULE_KEY[id];
      const content = invitation[key] as { active?: boolean } | undefined;
      const disabled = !content?.active;
      // Para dibujarlo opaco hay que dibujarlo: cada módulo se esconde solo
      // si `active` es falso, así que aquí se le pasa encendido.
      const shown = disabled ? ({ ...invitation, [key]: { ...content, active: true } } as NewInvitation) : invitation;
      const name = MODULE_NAME[lang === "en" ? "en" : "es"][id];
      return zone(section, renderModule(id, shown, index), `zone-${index}`, { path: String(key), name, disabled });
    }
    // Publicada: igual pasa por la zona para pintar sus elementos sueltos.
    if (section && invitation?.[MODULE_KEY[id]] && (invitation[MODULE_KEY[id]] as { active?: boolean }).active) {
      return zone(section, renderModule(id, invitation, index), `zone-${index}`);
    }
    return renderModule(id, invitation, index);
  };

  const renderModule = (id: number, invitation: NewInvitation, index: number) => {
    switch (id) {
      case 1:
        return <Greeting key={index} ref={greetingRef} dev={false} invitation={invitation} editMode={editMode} onFieldChange={onFieldChange} onFieldTool={onFieldTool} />;
      case 2:
        return <People invitationID={invitationID} key={index} ref={peopleRef} dev={false} invitation={invitation} editMode={editMode} onFieldChange={onFieldChange} onFieldTool={onFieldTool} />;
      case 3:
        return <Quote key={index} ref={quoteRef} dev={dev} invitation={invitation} editMode={editMode} textBar={textBar} onFieldChange={onFieldChange} onFieldTool={onFieldTool} onClearField={onClearField} onSelectText={() => onSelectSection?.("quote", "quote_text")} />;
      case 4:
        return <Itinerary invitationID={invitationID} ui={ui} key={index} ref={itineraryRef} dev={false} invitation={invitation} editMode={editMode} onFieldChange={onFieldChange} onFieldTool={onFieldTool} />;
      case 5:
        return <DressCode ui={ui} key={index} ref={dresscodeRef} dev={dev} invitation={invitation} editMode={editMode} textBar={textBar} onFieldChange={onFieldChange} onFieldTool={onFieldTool} />;
      case 6:
        return <Gifts ui={ui} key={index} ref={giftsRef} dev={false} invitation={invitation} brands={giftBrands} editMode={editMode} textBar={textBar} onFieldChange={onFieldChange} onFieldTool={onFieldTool} />;
      case 7:
        return <Destinations invitationID={invitationID} ui={ui} key={index} ref={destinationRef} dev={false} invitation={invitation} editMode={editMode} onFieldChange={onFieldChange} onFieldTool={onFieldTool} />;
      case 8:
        return <Notices key={index} ref={noticesRef} dev={false} invitation={invitation} editMode={editMode} onFieldChange={onFieldChange} onFieldTool={onFieldTool} />;
      case 9:
        return <Gallery key={index} ref={galleryRef} dev={dev} invitation={invitation} ui={ui} editMode={editMode} onFieldChange={onFieldChange} onFieldTool={onFieldTool} />;

      default:
        break;
    }
  };

  interface CSSVars extends React.CSSProperties {
    ["--hover-color"]?: string;
  }

  const btnStyle: CSSVars = {
    ["--hover-color"]: `${actions}`,
    height: "56px",
    width: "280px",
    fontSize: "18px",
    fontWeight: 600,
    letterSpacing: "2px",
    boxShadow: "0px 0px 12px rgba(0,0,0,0.2)",
    fontFamily: font,
  };


  const onValidateUser = async (code: string) => {

    try {
      const { data, error } = await supabase
        .from("guests")
        .select("*")
        .eq("password", code)
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
        const { data: companions, error: isErr } = await supabase
          .from("guests")
          .select("*")
          .eq("companion_id", data.id)

        if (isErr) {
          console.log(isErr, 'not found')
        }
        setAllCompanions(companions ?? [])
      }

      // messageApi.success(`Bienvenido ${data.name}`);
      setValidated(true);
      setGuestInfo(data)
      if (data?.name) localStorage.setItem(`guest_${invitationID}`, data.name);

    } catch (error) {
      console.log(error)
    }
  };

  const onMagicLogin = async (code: string) => {

    // console.log('getting guest ----')
    try {
      const { data, error } = await supabase
        .from("guests")
        .select("*")
        .eq("password", code)
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
        const { data: companions, error: isErr } = await supabase
          .from("guests")
          .select("*")
          .eq("companion_id", data.id)

        if (isErr) {
          console.log(isErr, 'not found')
        }
        setAllCompanions(companions ?? [])
      }


      setValidated(true);
      setGuestInfo(data)
      if (data?.name) localStorage.setItem(`guest_${invitationID}`, data.name);
    }
    catch (error) {
      console.log(error)
    }
  }

  const refreshGuest = async () => {

    try {
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .eq('id', guestInfo?.id)
        .maybeSingle()

      if (error || !data) {
        messageApi.error('Código incorrecto')
        return
      }

      if (data?.has_companion) {
        const { data: companions, error: isErr } = await supabase
          .from("guests")
          .select("*")
          .eq("companion_id", data.id)

        if (isErr) {
          console.log(isErr, 'not found')
        }
        setAllCompanions(companions ?? [])
      }

      setGuestInfo(data)
    } catch (err) {
      console.error('Error al refrescar invitado:', err)
      messageApi.error('Ocurrió un error inesperado')
    }
  }




  useEffect(() => {


    if (type === "open") {

      setValidated(true);
      setAnimation(true)
    } else {
      setValidated(false);
      if (password) {
        onMagicLogin(password)
      }
    }
  }, []);

  useEffect(() => {

    if (!open && type === "open") {
      const active_guest = localStorage.getItem(invitationID!)
      if (active_guest) {
        onValidateUser(active_guest)
      }
    }
  }, [open])


  useEffect(() => {
    if (validated && guestInfo) {
      // messageApi.info(`Bienvenido ${guestInfo?.name}`);
      setAnimation(true)
      setTimeout(() => {
        setAnimatedText(true)
        const coverHeightPx = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
        setHeightSize(coverHeightPx);
      }, 1800);
    }
  }, [validated])

  useEffect(() => {
    if (animation) {
      setTimeout(() => {
        setAnimation(false)
        setAnimatedText(false)
      }, 3000);
    }
  }, [animation])

  useEffect(() => {
    const container = scrollableContentRef.current;
    if (!container) return;

    const onScroll = () => {
      const currentY = container.scrollTop;
      const delta = currentY - lastScrollY.current;
      if (Math.abs(delta) < 4) return;
      const dir = delta > 0 ? 'down' : 'up';
      if (dir !== scrollDirection.current) {
        scrollDirection.current = dir;
        setScrolledDown(dir === 'down');
      }
      lastScrollY.current = currentY;
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, [isSplit, loader]);

  // El dock (plan Pro) nunca debe tapar la portada: se oculta mientras la
  // portada llegue a la franja inferior de la pantalla, donde flota el dock.
  // Se mide en cada scroll/resize en vez de con un IntersectionObserver con
  // rootMargin fijo: en Safari iOS el alto visible cambia con la barra del
  // navegador y esa medida inicial no era confiable.
  useEffect(() => {
    // En el split la portada nunca está detrás del dock: viven lado a lado.
    if (isSplit) {
      setCoverBehindDock(false);
      return;
    }
    const container = scrollableContentRef.current;
    if (!container) return;
    const DOCK_BAND_PX = 100; // alto de la barra (68) + su margen inferior (20) + aire
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const cover = coverRef.current;
        if (!cover) return;
        const viewportH = window.visualViewport?.height ?? window.innerHeight;
        setCoverBehindDock(cover.getBoundingClientRect().bottom > viewportH - DOCK_BAND_PX);
      });
    };
    measure();
    container.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    window.visualViewport?.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(frame);
      container.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("resize", measure);
    };
  }, [validated, isSplit]);

  useEffect(() => {
    const el = footerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setFooterVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [validated, isSplit]);





  if (loader || !invitation) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <Image alt="" src={"/assets/tools/load.gif"} width={250} />
      </div>
    );
  }

  const textureId = invitation.generals?.texture ?? textures[0]?.id;
  const tex = textureOverride ?? textures.find((t) => t.id === textureId);
  const showTexture = Boolean(textureOverride) || invitation.generals.texture !== null;

  const modules = validated && (
    <>
      {invitation?.generals.positions.map((position, index) => handlePosition(position, invitation, index))}
      {mongoID === "68ffdb9cd673a17f84312991" && (
        <div
          style={{
            width: "80%",
            alignSelf: "center",
          }}
        >
          <img
            src="/assets/AA.png"
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>
      )}
      {/* Mismo footer que los Eventos Flash / side events (FooterCompact),
          sin fondo propio (encima de la invitación y bajo su textura) y con el
          color de texto del tema en vez de blanco. */}
      <div
        ref={footerRef}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          // 22px arriba = la otra mitad del espacio entre bloques.
          padding: "22px 24px 32px",
          boxSizing: "border-box",
        }}
      >
        <FooterCompact color={invitation?.generals?.colors?.accent ?? "#1B1B1B"} />
      </div>
    </>
  );

  const lockedOverlay = (
    <div
      className={styles.inv_locked_blured}
      style={{ pointerEvents: validated ? "none" : undefined, opacity: validated ? "0" : "1", backgroundColor: `${primary}20` }}
    >
      <div className={styles.locked_icon}>
        <FaLock size={32} style={{ color: "#FFF" }} />
      </div>
      <span style={{ fontFamily: font }} className={styles.locked_title}>
        {ui?.locked.title}
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
        <span style={{ fontFamily: font }} className={styles.locked_text}>
          {ui?.locked?.p1}
        </span>
        <span style={{ fontFamily: font }} className={styles.locked_text}>
          {ui?.locked?.p2}
        </span>
      </div>
      <Input
        value={guestCode}
        // length={6}
        size="large"
        onChange={(e) => setGuestCode(e.target.value)}
        placeholder={ui?.locked.placeholder}
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
          fontFamily: font,
        }}
      />

      <Button className={styles.locked_btn} style={btnStyle} onClick={() => onValidateUser(guestCode)}>
        {ui?.locked.access}
      </Button>
    </div>
  );

  const textureOverlay = showTexture && tex && (
    <TextureOverlay
      // En el split la portada no está en el scroll: la textura cubre todo.
      key={isSplit ? `split-${validated}` : "mobile"}
      containerRef={scrollableContentRef as unknown as React.RefObject<HTMLElement>}
      coverHeightPx={isSplit ? 0 : heightSize}
      texture={{
        image: tex.image,
        opacity: tex.opacity,
        blend: tex.blend,
        filter: tex.filter,
      }}
      tileW={1024}
      tileH={1024}
    />
  );

  const songPlayer = validated && coverSong && (
    <SongPlayer song={coverSong} accent={accent} secondary={secondary} dev={dev} inline={isSplit} />
  );

  // Plan Pro: un solo contenedor que se transforma (confirmación, pases, Lia, Photo Wall)
  const dock = validated && plan === "pro" && (
    <InvitationDock
      invitation={invitation}
      invitationID={invitationID}
      ui={ui}
      lang={lang}
      type={type}
      dev={dev}
      guestInfo={guestInfo}
      companions={allCompanions}
      refreshGuest={refreshGuest}
      onGuestCreated={onValidateUser}
      hidden={isSplit ? false : footerVisible || coverBehindDock}
      scrolledDown={isSplit ? false : scrolledDown}
      container={isSplit ? asideRect ?? { w: 600, h: 800 } : null}
    />
  );

  const controlBar = validated && plan !== "pro" && (
    <InvitationControlBar
      plan={plan}
      dev={dev}
      guestInfo={guestInfo}
      ui={ui}
      actions={actions}
      primary={primary}
      accent={accent}
      phone_number={phone_number}
      scrolledDown={isSplit ? false : scrolledDown}
      hidden={isSplit ? false : footerVisible}
      anchored={isSplit}
      onOpenConfirm={() => setOpen(true)}
    />
  );

  return (
    <ModuleTexturesContext.Provider value={textures}>
    <TextStylesContext.Provider value={{ styles: invitation?.text_styles ?? {}, titles: invitation?.generals?.fonts?.titles, body: invitation?.generals?.fonts?.body }}>
    <InvitationLayoutProvider value={isSplit ? "split" : "mobile"}>
      {contextHolder}

      {!dev && <LanguageToggle languages={availableLanguages} currentLang={lang} />}

      {isSplit ? (
        <div
          className={styles.split_shell}
          style={{
            backgroundColor: primary,
            // Tamaño de títulos de la invitación para las secciones web
            // (web-section.module.css): igual que en celular, no un tamaño fijo.
            ["--inv-title-size" as string]: `${invitation.generals?.fonts?.titles?.size || 22}px`,
          } as React.CSSProperties}
        >
          <aside ref={asideRef} className={styles.split_aside}>
            <Cover
              variant="aside"
              topSlot={songPlayer}
              reserveDock={Boolean(validated)}
              ui={ui}
              lang={lang}
              ref={coverRef}
              dev={dev}
              invitation={invitation}
              height="100%"
              validated={validated}
            />
            {dock}
            {controlBar}
          </aside>

          <main ref={scrollableContentRef} className={`${styles.split_main} scroll-invitation`}>
            {modules}
            {textureOverlay}
          </main>

          {lockedOverlay}
        </div>
      ) : (
        <>
          <div
            ref={scrollableContentRef}
            className={`${styles.invitation_main_cont} scroll-invitation`}
            style={{
              backgroundColor: invitation.generals.colors.primary ?? "#FFF",
              paddingBottom: "0px",
              maxHeight: "100dvh",
              // El 110vmax del CSS es para que Safari esconda sus barras al
              // hacer scroll en el teléfono. En el editor (iframe, dev) la
              // caja quedaba más alta que la pantalla y el final (footer) no
              // se alcanzaba.
              ...(dev ? { minHeight: "100dvh" } : {}),
              position: "relative",
            }}
          >
            {zone("cover", (
              <Cover ui={ui} lang={lang} ref={coverRef} dev={dev} invitation={invitation} height={"100vh"} validated={validated} bleed={!dev} editMode={editMode} textBar={textBar} onFieldChange={onFieldChange} onSelectField={(field) => (field ? onSelectSection?.("cover", field) : onClearField?.())} onFieldTool={onFieldTool} />
            ))}
            {songPlayer}
            {modules}
            {lockedOverlay}
            {textureOverlay}
          </div>

          {/* Editando, el dock y la barra solo se miran: sus botones son del invitado. */}
          {editMode ? <div style={{ pointerEvents: "none" }}>{dock}{controlBar}</div> : <>{dock}{controlBar}</>}
        </>
      )}

      <div style={{ opacity: animation ? 1 : 0 }} className={styles.animation_cont}>
        {animation && (
          <AnimatedPath color={primary} opacityStart={0.3} opacityEnd={0.5} duration={2.5} />
        )}
      </div>
      <div
        style={{
          opacity: animatedText ? 1 : 0, fontFamily: invitation.generals.fonts.body?.value ?? "Poppins",
          color: '#FFFFFF99', display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
          gap: '0px', flexWrap: 'wrap'
        }}
        className={styles.welcome_label}
      >
        <span style={{ marginRight: '8px' }}>{ui.confirm.hello}</span>
        <b translate="no" className="notranslate" style={{ color: '#FFF', textAlign: 'left' }}>{guestInfo?.name}</b>
      </div>
      {/* Confirmación de los planes que no son Pro (Lite y anteriores) */}
      <SlideOverlay open={open}>
        <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", backgroundColor: primary }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "6px",
              padding: "16px 20px",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontFamily: invitation.generals.fonts.body?.typeFace,
                fontSize: "20px",
                color: accent,
              }}
            >
              {ui?.confirm.drawerTitle}
            </span>
            <button
              onClick={() => setOpen(false)}
              aria-label={ui?.liaGuest.close ?? "Cerrar"}
              style={{ background: "transparent", border: "none", cursor: "pointer", color: accent, padding: "4px" }}
            >
              <IoClose size={24} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 20px" }}>
            {(guestInfo || type === "open") && (
              <Confirm invitationID={invitationID} ui={ui} invitation={invitation} guestInfo={guestInfo} refreshGuest={refreshGuest} />
            )}
          </div>
        </div>
      </SlideOverlay>
    </InvitationLayoutProvider>
    </TextStylesContext.Provider>
    </ModuleTexturesContext.Provider>
  );
}
