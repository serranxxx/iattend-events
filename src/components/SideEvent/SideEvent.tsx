"use client";

import { SideEvent } from "@/types/side_event";
import React, { useCallback, useEffect, useState } from "react";
import styles from "./side-event.module.css";
import Image from "next/image";
import { Button, Input, message } from "antd";
import { LuCircleCheck, LuCircleX } from "react-icons/lu";
import { simpleaddress } from "../Invitation/Itinerary/OpenCard/OpenCard";
import WeatherWidget from "../Invitation/Itinerary/WeatherApi/WeatherWidget";
import { FooterLand } from "../LandPage/Footer/Footer";
import { FaLock } from "react-icons/fa";
import { createClient } from "@/lib/supabase/client";
import {  SideGuestSubabasePayload } from "@/types/guests";
import { darker, formatEventDateTime } from "@/helpers/functions";
import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "motion/react";

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

  const handleConfirmAttendance = () => {
    if (!guestInfo) return;

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

  const companionsLabel = (() => {
    if (companions.length > 1) return `+${companions.length} acompañantes`;
    if (companions.length === 1) {
      const only = companions[0];
      return only.name && only.name.trim() !== "" ? `+ ${only.name}` : "+1 acompañante";
    }
    return null;
  })();

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
                "--blur-color--dark": `${darker(info?.body.color ?? "#000", 0.8) ?? "#000000"}80`,
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
              <span>{formatEventDateTime(info?.body.hour, { state: info?.body.address?.state, timezone: info?.body.timezone })}</span>
              <span>
                {info?.body.address.street} {info?.body.address.number},
              </span>
              <span>
                {info?.body.address.state} {info?.body.address.country}
              </span>
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
                      fontSize: "14px",
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
                          fontSize: "14px",
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
            ) : (
              <motion.div
                key="buttons-step"
                initial={{ opacity: 0, y: -12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.98 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className={styles.buttons_cont}
              >
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

              </motion.div>
            )}
            </AnimatePresence>

            <AnimatePresence>
              {!confirmStep && guestInfo?.name && (
                <motion.div
                  key="guest-name-card"
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.98 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className={styles.mapa_container}
                  style={{ padding: "12px 18px" }}
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
                    Invitación dirigida a
                  </span>
                  <span
                    style={{
                      color: "#FFFFFF",
                      textAlign: "center",
                      fontFamily: "Poppins",
                      fontSize: "16px",
                      fontWeight: 700,
                    }}
                  >
                    {guestInfo.name}
                  </span>
                  {guestInfo.has_companion && companionsLabel && (
                    <span
                      style={{
                        color: "#FFFFFF",
                        textAlign: "center",
                        fontFamily: "Poppins",
                        fontSize: "14px",
                        opacity: 0.85,
                      }}
                    >
                      {companionsLabel}
                    </span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

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
              <WeatherWidget item={info?.body} isSide={true} color={`${darker(info?.body.color ?? '#000', 0.8) ?? "#000000"}80`} />
            }

            <div className={styles.mapa_container}>
              <FooterLand bordered={false} light />
            </div>
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
