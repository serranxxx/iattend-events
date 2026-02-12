"use client";

import { SideEvent } from "@/types/side_event";
import React, { useCallback, useEffect, useState } from "react";
import styles from "./side-event.module.css";
import Image from "next/image";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import "dayjs/locale/es";
import { Button, Input, message } from "antd";
import { LuCircleCheck, LuCircleHelp, LuCircleX } from "react-icons/lu";
import { simpleaddress } from "../Invitation/Itinerary/OpenCard/OpenCard";
import WeatherWidget from "../Invitation/Itinerary/WeatherApi/WeatherWidget";
import { FooterLand } from "../LandPage/Footer/Footer";
import { color } from "motion";
import { FaLock } from "react-icons/fa";
import { createClient } from "@/lib/supabase/client";
import { GuestSubabasePayload, SideGuestSubabasePayload } from "@/types/guests";
import { darker } from "@/helpers/functions";
import confetti from "canvas-confetti";

type invProps = {
  info: SideEvent | null;
  password?: string;
  preview?: boolean
};

export default function SideEvents({ info, password, preview }: invProps) {
  dayjs.extend(utc);
  dayjs.extend(timezone);
  dayjs.locale("es");

  const [validated, setValidated] = useState<boolean>(false);
  const [guestCode, setGuestCode] = useState<string>("");
  const supabase = createClient();
  const [messageApi, contextHolder] = message.useMessage();
  const [guestInfo, setGuestInfo] = useState<SideGuestSubabasePayload | null>(null);

  interface CSSVars extends React.CSSProperties {
    ["--hover-color"]?: string;
  }

  const btnStyle: CSSVars = {
    ["--hover-color"]: `${color}`,
    height: "56px",
    width: "280px",
    fontSize: "18px",
    fontWeight: 600,
    letterSpacing: "2px",
    boxShadow: "0px 0px 12px rgba(0,0,0,0.2)",
    fontFamily: 'Poppins',
  };

  const formatDateMexico = (isoString: string | null | undefined): string => {
    if (!isoString) return "";

    return dayjs.utc(isoString).tz("America/Mexico_City").format("ddd D [de] MMMM, HH:mm");
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

      // messageApi.success(`Bienvenido ${data.name}`);
      console.log('valid user: ', data)
      setValidated(true);
      setGuestInfo(data)


    } catch (error) {

    }
  };

  const onMagicLogin = async (code: string) => {

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
        messageApi.error(`Código incorrecto`);
        return
      }

      setValidated(true);
      setGuestInfo(data)
    }
    catch (error) {
      console.log(error)
    }
  }

  const updateGuestStatus = async (state: string) => {
    console.log(guestInfo?.password)
    console.log(info?.id)
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

  const handleConfirmAttendance = () => {
    if (!guestInfo) return;

    if (guestInfo.state === 'confirmado') {
      updateGuestStatus('creado');
    } else {
      updateGuestStatus('confirmado');
      onClick(); // si esto cierra modal, avanza paso, etc.
    }
  };


  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY;

      // ajusta estos valores a tu gusto
      const scale = Math.min(1 + scrollY / 1000, 1.8);
      document.documentElement.style.setProperty("--bg-scale", scale.toString());
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {

    if (preview) {
      setValidated(true);
    } else {
      if (info?.type === "open") {

        setValidated(true);
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
      <div className={styles.side_event_main_cont}>
        <div className={styles.hero}>
          {info?.body.image && <Image className={styles.hero_bg} fill src={info?.body.image} alt="" style={{ objectFit: "cover" }} />}
          <div className={styles.blur_cover}></div>
          <div className={styles.shadow}></div>
        </div>

        {
          validated &&

          <div
            className={styles.info_cont}
            style={
              {
                "--blur-color": `${info?.body.color ?? "#000000"}`,
                "--blur-color--dark": `${darker(info?.body.color!, 0.8) ?? "#000000"}80`,
              } as React.CSSProperties
            }
          >
            <span
              style={{
                fontFamily: info?.body.title.font,
                fontWeight: info?.body.title.weight,
                fontSize: `${info?.body.title.size}px`,
                lineHeight: info?.body.title.line_height,
                opacity: info?.body.title.opacity,
                textAlign: "center",
                color: "#FFF",
                textShadow: "0px 0px 18px rgba(0, 0, 0, 0.35)",
              }}
            >
              {info?.name}
            </span>

            <div
              className={styles.col}
              style={{
                fontFamily: 'Poppins',
                zIndex: 99,
              }}
            >
              <span>{formatDateMexico(info?.body.hour)}</span>
              <span>
                {info?.body.address.street} {info?.body.address.number},
              </span>
              <span>
                {info?.body.address.state} {info?.body.address.country}
              </span>
            </div>


            <div className={styles.buttons_cont}>
              {
                guestInfo?.state !== 'rechazado' &&
                <Button onClick={handleConfirmAttendance} style={{ height: '64px', borderRadius: guestInfo?.state === 'confirmado' ? '99px' : '99px 0px 0px 99px' }} icon={guestInfo?.state !== 'confirmado' && <LuCircleCheck size={18} style={{ opacity: "0.5" }} />} type="text" className={styles.side_buttons}>
                  {
                    guestInfo?.state === 'confirmado' ? 'Asistencia confirmada' : 'Asistiré'
                  }
                </Button>
              }
              {
                guestInfo?.state !== 'confirmado' &&
                <Button onClick={() => updateGuestStatus(guestInfo?.state === 'rechazado' ? 'creado' : 'rechazado')} style={{ height: '64px', borderRadius: guestInfo?.state === 'rechazado' ? '99px' : '0px 99px 99px 0px' }} icon={guestInfo?.state !== 'rechazado' && <LuCircleX size={18} style={{ opacity: "0.5" }} />} type="text" className={styles.side_buttons}>
                  {guestInfo?.state === 'rechazado' ? 'Asistencia declinada' : 'No asistiré'}
                </Button>
              }

            </div>


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

            {info?.body.address.street &&
              info?.body.address.number &&
              info?.body.address.neighborhood &&
              info?.body.address.zipcode &&
              info?.body.address.city &&
              info?.body.address.state &&
              info?.body.address.country && (
                <div className={styles.mapa_container}>
                  <Button className={styles.get_there} type="text">
                    Como llegar
                  </Button>
                  <iframe
                    title="Mapa"
                    width="100%"
                    height="100%"
                    // style={{ borderColor: content.inverted ? primary : secondary }}
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
                </div>
              )}



            {
              info?.body.address.city &&
              <WeatherWidget item={info?.body} isSide={true} color={`${darker(info?.body.color!, 0.8) ?? "#000000"}80`} />
            }
          </div>
        }
        <div
          className={styles.inv_locked_blured}
          style={{ pointerEvents: validated ? "none" : undefined, opacity: validated ? "0" : "1", backgroundColor: `${color}20` }}
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
      {
        validated &&
        <FooterLand color={info?.body.color}></FooterLand>
      }
    </>
  );
}
