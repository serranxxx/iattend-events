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
import { textures } from "@/helpers/textures";
import { TextureOverlay } from "./TexturesOverlay";
import { Button, Drawer, Input, Layout, message, QRCode } from "antd";
import Confirm from "../Confirm/Confirm";
import { FaLock } from "react-icons/fa";
import axios from "axios";
import { GuestAccessPayload, GuestSubabasePayload } from "@/types/guests";
import GoogleTranslate from "@/components/GoogleTranslate/GoogleTranslate";
import { useScreenWidth } from "@/hooks/useScreenWidth";
import { createClient } from "@/lib/supabase/client";
import { PiTicketDuotone } from "react-icons/pi";
import { BsPass } from "react-icons/bs";
import { FaArrowsRotate } from "react-icons/fa6";
import AnimatedPath from "@/components/Motion/AnimatedPath";
import { Footer } from "antd/es/layout/layout";
import { FooterLand } from "@/components/LandPage/Footer/Footer";
import { darker } from "@/helpers/functions";
import Link from "next/link";

type invProps = {
  invitation: NewInvitation | null;
  loader: boolean;
  type: InvitationType;
  mongoID: string | null;
  dev: boolean;
  height: number | string | null;
  ui: InvitationUIBundle;
  invitationID?: string;
  password?: string;
  plan?: string;
  phone_number?: string | null;
};





export default function Invitation({ password, invitationID, ui, invitation, loader, type, mongoID, dev, height, plan, phone_number }: invProps) {
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
  const [heightSize, setHeightSize] = useState<number>(0);
  const supabase = createClient();

  const [open, setOpen] = useState(false);
  const [onShowTicket, setOnShowTicket] = useState(false)
  const [guestCode, setGuestCode] = useState<string>("");
  const [validated, setValidated] = useState<boolean>(false);
  const [animation, setAnimation] = useState<boolean>(false);
  const [animatedText, setAnimatedText] = useState<boolean>(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [guestInfo, setGuestInfo] = useState<GuestSubabasePayload | null>(null);
  const [companions, setCompanions] = useState<GuestSubabasePayload[]>([])
  const [tables, setTables] = useState<any[]>([])

  const primary = invitation?.generals?.colors.primary ?? "#FFFFFF";
  const secondary = invitation?.generals?.colors.secondary ?? "#FFFFFF";
  const accent = invitation?.generals?.colors.accent ?? "#FFFFFF";
  const actions = invitation?.generals?.colors.actions ?? "#FFFFFF";
  const font = invitation?.generals.fonts.body?.typeFace ?? "Poppins";

  const width = useScreenWidth();
  const isLargeScreen = width >= 768;

  const messagePaperless = encodeURIComponent(
    "¡Hola! Confirmo mi asistencia."
  );
  // const scrollableContentRef = useRef<HTMLDivElement | null>(null);


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
        getTables()
        setCompanions(companions?.filter(c => c.state === 'confirmado') ?? [])
      }

      // messageApi.success(`Bienvenido ${data.name}`);
      setValidated(true);
      setGuestInfo(data)


    } catch (error) {

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

        getTables()
        setCompanions(companions?.filter(c => c.state === 'confirmado') ?? [])
      }


      setValidated(true);
      setGuestInfo(data)
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

        setCompanions(companions?.filter(c => c.state === 'confirmado') ?? [])
      }

      setGuestInfo(data)
    } catch (err) {
      console.error('Error al refrescar invitado:', err)
      messageApi.error('Ocurrió un error inesperado')
    }
  }

  const getTables = async () => {
    if (invitationID) {
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .eq('invitation_id', invitationID)

      if (error) {
        console.error('Error al obtener mesas:', error)
        return
      }

      setTables(data)
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



  const formatShortDate = (dateString: string) => {
    const [year, month, day] = dateString.split("T")[0].split("-");

    const months = [
      "ENE", "FEB", "MAR", "ABR", "MAY", "JUN",
      "JUL", "AGO", "SEP", "OCT", "NOV", "DIC",
    ];

    return `${months[Number(month) - 1]} ${Number(day)}`;
  }


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

  const tex = textures[invitation.generals?.texture ?? 0];

  return (
    <>
      {contextHolder}



      <div
        ref={scrollableContentRef}
        className={`${styles.invitation_main_cont} scroll-invitation`}
        style={{
          backgroundColor: invitation.generals.colors.primary ?? "#FFF",
          paddingBottom: "0px",
          maxHeight: "100vh",
          position: "relative",
        }}
      >

        <Cover ui={ui} ref={coverRef} dev={dev} invitation={invitation} height={"100vh"} validated={validated} />
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
            {!dev && (plan !== 'paperless') ?
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                position: "fixed",
                left: "50%",
                transform: "translateX(-50%)",
                bottom: "20px",
                zIndex: 3,
                // flexDirection:'column'
              }}>
                <Button
                  onClick={() => setOpen(true)}
                  style={{

                    // height: '44px',
                    letterSpacing: "2px",
                    fontSize: "16px",
                    height: "44px",
                    width: guestInfo?.state === 'confirmado' ? "auto" : '200px',
                    backgroundColor: `${actions}80`,
                    backdropFilter: "blur(10px)",
                    border: `1px solid ${actions}40`,
                    color: accent,
                    boxShadow: "0 0 6px 0 rgba(0, 0, 0, 0.25)",
                  }}
                >
                  {
                    guestInfo?.state === 'confirmado' ?
                      <FaArrowsRotate />
                      : ui?.buttons.confirm
                  }

                </Button>

                {
                  guestInfo?.state === 'confirmado' &&
                  <Button
                    className={styles.glow_button}
                    icon={<PiTicketDuotone size={20} />}
                    onClick={() => setOnShowTicket(true)}
                    style={{

                      // height: '44px',
                      letterSpacing: "2px",
                      fontSize: "16px",
                      height: "44px",
                      minWidth: '44px',
                      backgroundColor: `${secondary}80`,
                      backdropFilter: "blur(10px)",
                      border: `1px solid ${secondary}40`,
                      color: accent,
                      boxShadow: "0 0 6px 0 rgba(0, 0, 0, 0.25)",
                      // zIndex: 99999999999999
                    }}
                  >
                    {ui.confirm.digital_pass}
                  </Button>
                }
              </div>

              : phone_number && <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                position: "fixed",
                left: "50%",
                transform: "translateX(-50%)",
                bottom: "20px",
                zIndex: 3,
                // flexDirection:'column'
              }}>
                <Link href={`https://wa.me/${phone_number}?text=${messagePaperless}`}
                  rel="noreferrer"
                  target="_blank">
                  <Button
                    style={{

                      // height: '44px',
                      letterSpacing: "2px",
                      fontSize: "16px",
                      height: "44px",
                      width: '200px',
                      backgroundColor: `${actions}80`,
                      backdropFilter: "blur(10px)",
                      border: `1px solid ${actions}40`,
                      color: accent,
                      boxShadow: "0 0 6px 0 rgba(0, 0, 0, 0.25)",
                    }}
                  >
                    {
                      ui?.buttons.confirm
                    }

                  </Button>
                </Link>

              </div>
            }

            <FooterLand invitation={invitation}></FooterLand>
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
        <div style={{ opacity: animation ? 1 : 0 }} className={styles.animation_cont}>
          {
            animation &&
            <AnimatedPath
              color={primary}
              opacityStart={0.3}
              opacityEnd={0.5}
              duration={2.5}
            />
          }


        </div>
        <div
          style={{
            opacity: animatedText ? 1 : 0, fontFamily: invitation.generals.fonts.body?.value ?? "Poppins", color: '#FFFFFF99', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: '0px',
            flexWrap: 'wrap'

          }}
          className={styles.welcome_label}><span style={{ marginRight: '8px' }}>{ui.confirm.hello}</span> <b style={{ color: '#FFF', textAlign: 'left', }}>{guestInfo?.name}</b></div>
        {
          onShowTicket &&
          <div onClick={() => setOnShowTicket(false)} className={styles.ticket_bg}>
          </div>
        }

        <div className={styles.ticket_cont}
          style={{ bottom: onShowTicket ? '20px' : '-80vh', transition: 'all 0.3s ease', justifyContent: companions.length === 0 ? 'center' : 'flex-start' }}>

          <div onClick={() => setOnShowTicket(false)} className={styles.ticket_container} style={{
            backgroundColor: `${accent}20`,
            transition: 'all 0.3s ease'
          }} >
            <div className={styles.ticket_first_section} style={{
              background: `linear-gradient(to top, ${accent} 0%, ${secondary} 100%)`,
              color: accent,
              borderColor: accent
            }}>
              <div className={styles.ticket_head} style={{ fontFamily: invitation.generals.fonts.body?.value ?? 'Poppins', color: primary }}>
                <span style={{ fontSize: '16px', fontWeight: 600 }}>{invitation.cover.title.text.value}</span>
                <div className={styles.ticket_col}>
                  <span style={{ fontWeight: 600, fontSize: '14px' }}>{formatShortDate(invitation.cover.date.value)}</span>
                  <span>{invitation.itinerary.object[0].time ?? ""}</span>
                </div>

              </div>

              <div className={styles.ticket_image}>
                <Image fill src={invitation.cover.image.prod!} alt="" style={{ objectFit: 'cover' }} />
                <div style={{
                  background: `linear-gradient(to top, ${accent} 0%, transparent 30%,  transparent 70%, ${accent} 110%)`
                }} className={styles.ticket_shadow}></div>

                <div className={styles.ticket_logo}>
                  <img src="/assets/images/blanco.png" alt="" style={{ width: '70px', }} />
                </div>
              </div>



              <div className={styles.ticket_row} style={{ fontFamily: invitation.generals.fonts.body?.value ?? 'Poppins', color: primary }}>
                <div className={styles.ticket_col} style={{ gap: '12px' }}>
                  <div className={styles.ticket_col}>
                    <span style={{ opacity: '0.4' }}>{ui.confirm.digital_name}</span>
                    <span>{guestInfo?.name ?? "Sin nombre"}</span>
                  </div>
                  <div className={styles.ticket_col}>
                    <span style={{ opacity: '0.4' }}>{ui.confirm.digital_table}</span>
                    <span>{tables.find(t => t.id === guestInfo?.table)?.number ?? 'Sin asignar'}</span>
                  </div>
                </div>

                <QRCode size={140} color={primary} value="www.iattend.mx" />
              </div>


            </div>

            <div className={styles.ticket_effect}></div>
          </div>

          {
            companions?.map((companion) => (
              <div key={companion.id} onClick={() => setOnShowTicket(false)} className={styles.ticket_container} style={{
                backgroundColor: `${accent}20`, bottom: onShowTicket ? '20px' : '-80vh',
                transition: 'all 0.3s ease'
              }} >
                <div className={styles.ticket_first_section} style={{
                  background: `linear-gradient(to top, ${accent} 0%, ${secondary} 100%)`,
                  color: accent,
                  borderColor: accent
                }}>
                  <div className={styles.ticket_head} style={{ fontFamily: invitation.generals.fonts.body?.value ?? 'Poppins', color: primary }}>
                    <span style={{ fontSize: '16px', fontWeight: 600 }}>{invitation.cover.title.text.value}</span>
                    <div className={styles.ticket_col}>
                      <span style={{ fontWeight: 600, fontSize: '14px' }}>{formatShortDate(invitation.cover.date.value)}</span>
                      <span>{invitation.itinerary.object[0].time ?? ""}</span>
                    </div>

                  </div>

                  <div className={styles.ticket_image}>
                    <Image fill src={invitation.cover.image.prod!} alt="" style={{ objectFit: 'cover' }} />
                    <div style={{
                      background: `linear-gradient(to top, ${accent} 0%, transparent 30%,  transparent 70%, ${accent} 110%)`
                    }} className={styles.ticket_shadow}></div>

                    <div className={styles.ticket_logo}>
                      <img src="/assets/images/blanco.png" alt="" style={{ width: '70px', }} />
                    </div>
                  </div>



                  <div className={styles.ticket_row} style={{ fontFamily: invitation.generals.fonts.body?.value ?? 'Poppins', color: primary }}>
                    <div className={styles.ticket_col} style={{ gap: '12px' }}>
                      <div className={styles.ticket_col}>
                        <span style={{ opacity: '0.4' }}>Nombre</span>
                        <span>{companion?.name ?? "Sin nombre"}</span>
                      </div>
                      <div className={styles.ticket_col}>
                        <span style={{ opacity: '0.4' }}>Mesa</span>
                        <span>{tables.find(t => t.id === companion?.table)?.number ?? 'Sin asignar'}</span>
                      </div>
                    </div>

                    <QRCode size={140} color={primary} value="www.iattend.mx" />
                  </div>


                </div>

                <div className={styles.ticket_effect}></div>
              </div>
            ))
          }
        </div>

        {invitation.generals.texture !== null && tex && (
          <TextureOverlay
            containerRef={scrollableContentRef as unknown as React.RefObject<HTMLElement>}
            coverHeightPx={heightSize}
            extraMarginPx={mongoID === "68ffdb9cd673a17f84312991" ? 400 : 0}
            texture={{
              image: tex.image, // StaticImageData o "/public/..."
              opacity: tex.opacity,
              blend: tex.blend,
              filter: tex.filter,
            }}
            tileW={1024} // ajusta a tu imagen
            tileH={1024}
          />
        )}

      </div>
      <Drawer
        placement={isLargeScreen ? "left" : "bottom"}
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
          borderRadius: isLargeScreen ? "0px 32px 32px 0px" : "32px 32px 0px 0px",
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
        {(guestInfo || type === "open") && mongoID && (
          <Confirm invitationID={invitationID} ui={ui} invitation={invitation} type={type} guestInfo={guestInfo} mongoID={mongoID} refreshGuest={refreshGuest} />
        )}
      </Drawer>
    </>
  );
}
