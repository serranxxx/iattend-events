"use client";

import { InvitationType, InvitationUIBundle, NewInvitation } from "@/types/new_invitation";
import { useEffect, useRef, useState } from "react";
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
import { TextureOverlay } from "./TexturesOverlay";
import { createPortal } from "react-dom";
import { Button, Drawer, Input, message } from "antd";
import Confirm from "../Confirm/Confirm";
import { FaLock } from "react-icons/fa";
import { GuestSubabasePayload } from "@/types/guests";
import { useScreenWidth } from "@/hooks/useScreenWidth";
import { createClient } from "@/lib/supabase/client";
import AnimatedPath from "@/components/Motion/AnimatedPath";
import { FooterLand } from "@/components/LandPage/Footer/Footer";
import { Ticket } from "../Ticket/Ticket";
import SongPlayer from "../SongPlayer/SongPlayer";
import InvitationControlBar from "../InvitationControlBar/InvitationControlBar";
import LanguageToggle from "../LanguageToggle/LanguageToggle";
import CameraView from "../CameraView/CameraView";
import LiaGuest from "../LiaGuest/LiaGuest";
import { PhotoWall } from "@/components/PhotoWall/PhotoWall";

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
  onSectionChange?: (_section: string) => void;
  textures?: Texture[];
  textureOverride?: Texture | null;
};





export default function Invitation({ password, invitationID, ui, lang, availableLanguages, invitation, loader, type, mongoID, dev, plan, phone_number, scrollToSection, onSectionChange, textures = [], textureOverride = null }: invProps) {
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

  const [open, setOpen] = useState(false);
  const [onShowTicket, setOnShowTicket] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showLia, setShowLia] = useState(false);
  const [showPhotoWall, setShowPhotoWall] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [footerVisible, setFooterVisible] = useState(false);
  const [scrolledDown, setScrolledDown] = useState(false);
  const lastScrollY = useRef(0);
  const scrollDirection = useRef<'up' | 'down'>('up');
  const [guestCode, setGuestCode] = useState<string>("");
  const [validated, setValidated] = useState<boolean>(false);
  const [animation, setAnimation] = useState<boolean>(false);
  const [animatedText, setAnimatedText] = useState<boolean>(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [guestInfo, setGuestInfo] = useState<GuestSubabasePayload | null>(null);
  const [companions, setCompanions] = useState<GuestSubabasePayload[]>([])

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
  const coverSong = (invitation?.cover as unknown as Record<string, unknown>)?.song as { id: string; name: string; artist: string; albumArt?: string } | null | undefined;

  const width = useScreenWidth();
  const isLargeScreen = width >= 768;

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
    // Evita que el scrollspy reporte las secciones intermedias mientras dura el scroll animado
    programmaticScrollGuardRef.current = Date.now() + 700;
    // Scroll manual acotado al contenedor: scrollIntoView() puede propagar el
    // "hacer visible" al documento padre (y hasta al padre del iframe cuando se
    // embebe en el wizard/preview), causando un scroll indeseado fuera de aquí.
    const targetTop = target.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop;
    container.scrollTo({ top: targetTop, behavior: "smooth" });
  }, [scrollToSection]);

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
  }, [validated, invitation?.generals?.positions?.join(","), onSectionChange]);


  const handlePosition = (id: number, invitation: NewInvitation, index: number) => {
    switch (id) {
      case 1:
        return <Greeting key={index} ref={greetingRef} dev={false} invitation={invitation} />;
      case 2:
        return <People invitationID={invitationID} key={index} ref={peopleRef} dev={false} invitation={invitation} />;
      case 3:
        return <Quote key={index} ref={quoteRef} dev={dev} invitation={invitation} />;
      case 4:
        return <Itinerary invitationID={invitationID} ui={ui} key={index} ref={itineraryRef} dev={false} invitation={invitation} />;
      case 5:
        return <DressCode ui={ui} key={index} ref={dresscodeRef} dev={dev} invitation={invitation} />;
      case 6:
        return <Gifts ui={ui} key={index} ref={giftsRef} dev={false} invitation={invitation} />;
      case 7:
        return <Destinations invitationID={invitationID} ui={ui} key={index} ref={destinationRef} dev={false} invitation={invitation} />;
      case 8:
        return <Notices key={index} ref={noticesRef} dev={false} invitation={invitation} />;
      case 9:
        return <Gallery key={index} ref={galleryRef} dev={dev} invitation={invitation} />;

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
        setCompanions(companions?.filter(c => c.state === 'confirmado' || c.state === 'asistente') ?? [])
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

        setCompanions(companions?.filter(c => c.state === 'confirmado' || c.state === 'asistente') ?? [])
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

        setCompanions(companions?.filter(c => c.state === 'confirmado' || c.state === 'asistente') ?? [])
      }

      setGuestInfo(data)
    } catch (err) {
      console.error('Error al refrescar invitado:', err)
      messageApi.error('Ocurrió un error inesperado')
    }
  }




  useEffect(() => { setMounted(true); }, []);

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
  }, []);

  useEffect(() => {
    const el = footerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setFooterVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [validated]);





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

  return (
    <>
      {contextHolder}

      {!dev && <LanguageToggle languages={availableLanguages} currentLang={lang} />}

      <div
        ref={scrollableContentRef}
        className={`${styles.invitation_main_cont} scroll-invitation`}
        style={{
          backgroundColor: invitation.generals.colors.primary ?? "#FFF",
          paddingBottom: "0px",
          maxHeight: "100dvh",
          position: "relative",
        }}
      >

        <Cover ui={ui} lang={lang} ref={coverRef} dev={dev} invitation={invitation} height={"100vh"} validated={validated} />
        {validated && coverSong && (
          <SongPlayer song={coverSong} accent={accent} secondary={secondary} dev={dev} />
        )}
        {validated && (
          <>
            {invitation?.generals.positions.map((position, index) => handlePosition(position, invitation, index))}
            {mongoID === "68ffdb9cd673a17f84312991" && (
              <div
                style={{
                  width: "80%",
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
            <div ref={footerRef} style={{ width: '100%' }}>
              <FooterLand invitation={invitation} />
            </div>
          </>
        )}

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
        {showTexture && tex && (
          <TextureOverlay
            containerRef={scrollableContentRef as unknown as React.RefObject<HTMLElement>}
            coverHeightPx={heightSize}
            texture={{
              image: tex.image,
              opacity: tex.opacity,
              blend: tex.blend,
              filter: tex.filter,
            }}
            tileW={1024}
            tileH={1024}
          />
        )}

      </div>

      {validated && (
        <InvitationControlBar
          plan={plan}
          dev={dev}
          guestInfo={guestInfo}
          ui={ui}
          actions={actions}
          primary={primary}
          accent={accent}
          phone_number={phone_number}
          scrolledDown={scrolledDown}
          hidden={showLia || footerVisible}
          onOpenConfirm={() => setOpen(true)}
          onShowTicket={() => setOnShowTicket(true)}
          onShowCamera={(guestInfo?.state === 'confirmado' || guestInfo?.state === 'asistente') ? () => setShowCamera(true) : undefined}
          onAskLia={() => setShowLia(true)}
        />
      )}

      {showLia && invitationID && (
        <LiaGuest
          invitationID={invitationID}
          guestName={guestInfo?.name ?? undefined}
          accentColor={'#000'}
          ui={ui}
          onClose={() => setShowLia(false)}
        />
      )}

      {showCamera && guestInfo && invitationID && (
        <CameraView
          invitation={invitation}
          invitationID={invitationID}
          guestInfo={guestInfo}
          ui={ui}
          onClose={() => setShowCamera(false)}
          onOpenPhotoWall={() => { setShowCamera(false); setShowPhotoWall(true); }}
        />
      )}

      {showPhotoWall && mounted && invitationID && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: '#0a0a0a' }}>
          <PhotoWall
            eventId={invitationID}
            eventTitle={invitation?.cover?.title?.text?.value ?? ""}
            onClose={() => setShowPhotoWall(false)}
          />
        </div>,
        document.body
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
      {onShowTicket && (
        <div onClick={() => setOnShowTicket(false)} className={styles.ticket_bg} />
      )}
      <div
        className={`${styles.ticket_cont} scroll-invitation`}
        style={{ bottom: onShowTicket ? '0px' : '-80vh', transition: 'all 0.3s ease', justifyContent: companions.length === 0 ? 'center' : 'flex-start', padding: '12px 24px', gap: '12px' }}
      >
        {guestInfo && (
          <Ticket id={invitationID} guest={guestInfo} invitation={invitation} ui={ui} colors={{ primary, secondary, accent }} onClose={() => setOnShowTicket(false)} />
        )}
        {companions?.map((companion) => (
          <Ticket id={invitationID} key={companion.id} guest={companion} invitation={invitation} ui={ui} colors={{ primary, secondary, accent }} onClose={() => setOnShowTicket(false)} />
        ))}
      </div>

      <Drawer
        placement={isLargeScreen ? "left" : "top"}
        onClose={() => setOpen(false)}
        open={open}
        title={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              gap: "6px",
              fontFamily: invitation.generals.fonts.body?.typeFace,
              fontSize: "20px",
              color: accent,
            }}
          >
            {" "}
            {ui?.confirm.drawerTitle}
          </div>
        }
        height={isLargeScreen ? "100%" : "80%"}
        closeIcon={false}
        style={{
          maxHeight: isLargeScreen ? "1010vh" : "800px",
          borderRadius: isLargeScreen ? "0px 32px 32px 0px" : "0px 0px 32px 32px",
          backgroundColor: primary,
        }}
        styles={{
          header: {
            backgroundColor: primary,
          },
          body: {
            backgroundColor: primary,
            paddingTop: "12px",
          },
        }}
      >
        {(guestInfo || type === "open") && (
          <Confirm invitationID={invitationID} ui={ui} invitation={invitation} guestInfo={guestInfo} refreshGuest={refreshGuest} />
        )}
      </Drawer>
    </>
  );
}
