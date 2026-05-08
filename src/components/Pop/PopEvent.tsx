"use client";

import { PopEvent } from "@/types/side_event";
import React, { useEffect, useRef, useState } from "react";
import styles from "./quick-events.module.css";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import "dayjs/locale/es";
import { message } from "antd";
import { FooterLand } from "../LandPage/Footer/Footer";
import { createClient } from "@/lib/supabase/client";
import { ParticipansType, QuickEventGuest, QuickEventUser } from "@/types/guests";
import { darker, generateSimpleId } from "@/helpers/functions";
import { ConfirmCard } from "../ConfirmCard/ConfirmCard";
import WeatherWidget from "../Invitation/Itinerary/WeatherApi/WeatherWidget";
import { Hero } from "./Hero/Hero";
import { Cover } from "./Cover/Cover";
import { ExtraInfo } from "./ExtraInfo/ExtraInfo";
import { EventMap } from "./Map/Map";
import { Attendees } from "./Attendees/Attendees";
import { PrivateAccess } from "./PrivateAccess/PrivateAccess";

dayjs.extend(utc);
dayjs.extend(timezone);

type invProps = {
  info: PopEvent | null;
  password?: string;
  preview?: boolean;
};

interface CSSVars extends React.CSSProperties {
  ["--hover-color"]?: string;
  ["--blur-color"]?: string;
  ["--blur-color--dark"]?: string;
  ["--blur-color--darker"]?: string;
  ["--widget-tint"]?: string;
}

export default function PopEvents({ info, preview, password }: invProps) {
  dayjs.locale("es");

  const participantIdsRef = useRef<Set<string | null>>(new Set());

  // ── Aliases ────────────────────────────────────────────────────────────────
  const body = info?.body;
  const theme = body?.theme;
  const primary = theme?.palette.primary ?? "#000000";
  const secondary = theme?.palette.secondary;
  const background = theme?.background;
  const content = body?.content;
  const titleCfg = content?.title;
  const eventInfo = content?.information;
  const address = eventInfo?.address;
  const extra = content?.extra;
  const hasFullAddress = !!(
    address?.street && address?.number && address?.neighborhood &&
    address?.zipcode && address?.city && address?.state && address?.country
  );
  // ──────────────────────────────────────────────────────────────────────────

  const supabase = createClient();
  const [messageApi, contextHolder] = message.useMessage();

  const [validated, setValidated] = useState<boolean>(false);
  const [user, setUser] = useState<QuickEventUser>({ name: "", phone_number: "", type: null, profile: 0, emoji: "A", id: null });
  const [event, setEvent] = useState<QuickEventGuest>({ id: null, quick_event_id: null, quick_event_user_id: "", password: "", state: "", last_action: "", anonymous: false });
  const [guestInfo, setGuestInfo] = useState<QuickEventGuest | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [anonymous, setAnonymous] = useState(false);
  const [participants, setParticipants] = useState<ParticipansType[] | null>(null);

  const onValidateUser = async (code: string) => {
    try {
      const { data, error } = await supabase
        .from("pop_guests")
        .select("*")
        .eq("password", code)
        .eq("quick_event_id", info?.id)
        .maybeSingle();

      if (error) { console.log(error); return; }
      if (!data) {
        messageApi.error("Código incorrecto");
        return;
      }
      setValidated(true);
      setGuestInfo(data);
    } catch { }
  };

  const confirmAssitance = async (user: QuickEventUser, isAnonymous: boolean) => {
    try {
      const newguest = {
        quick_event_id: info?.id,
        quick_event_user_id: isAnonymous ? process.env.NEXT_PUBLIC_ANONYMOUS_ID : user.id,
        password: generateSimpleId(),
        state: "confirmado",
        last_action: "creado",
        anonymous: isAnonymous
      };

      const { data, error } = await supabase
        .from("pop_guests")
        .insert([newguest])
        .select()
        .maybeSingle();

      if (error) {
        messageApi.error("No se pudo agregar el invitado");
        return;
      }

      if (!data) {
        messageApi.error("No se pudo crear el invitado");
        return;
      }

      localStorage.setItem(`quick_event_${info?.id}`, JSON.stringify({
        quick_event_id: data.id,
        guest_id: data.quick_event_user_id,
        anonymous: data.anonymous
      }));

      messageApi.success("Asistencia confirmada");
      setEvent(data);

      if (isAnonymous) getUser(process.env.NEXT_PUBLIC_ANONYMOUS_ID ?? "");
      else setUser(user);

    } catch (err) {
      messageApi.error("Error inesperado al agregar invitado");
    }
  };

  const insertUSer = async (g: QuickEventUser) => {
    try {
      const newUser = {
        phone_number: `+52${g.phone_number}`,
        name: g.name,
        type: g.type,
        profile: g.profile,
        emoji: g.emoji
      };

      const { data, error } = await supabase
        .from("pop_users")
        .insert([newUser])
        .select()
        .maybeSingle();

      if (error || !data) {
        messageApi.error("No se pudo agregar el invitado");
        return;
      }

      localStorage.setItem("quick_event_user_id", data.id);
      setUser(data);
      confirmAssitance(data, false);
      messageApi.success("Invitado agregado correctamente");

    } catch {
      messageApi.error("Error inesperado al agregar invitado");
    }
  };

  const findEvent = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("pop_guests")
        .select("*")
        .eq("id", id)
        .eq("quick_event_id", info?.id)
        .maybeSingle();

      if (error || !data) return;

      setEvent(data);

      if (!localStorage.getItem(`quick_event_${info?.id}`)) {
        localStorage.setItem(`quick_event_${info?.id}`, JSON.stringify({
          quick_event_id: data.id,
          guest_id: data.quick_event_user_id,
          anonymous: data.anonymous
        }));
      }

    } catch { }
  };

  const getUser = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("pop_users")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (!error && data) setUser(data);

    } catch { }
  };

  const updateAnonymous = async (anon: boolean) => {
    try {
      const { data, error } = await supabase
        .from("pop_guests")
        .update({ anonymous: anon })
        .eq("id", event?.id)
        .select()
        .maybeSingle();

      if (error || !data) return;

      localStorage.setItem(`quick_event_${info?.id}`, JSON.stringify({
        quick_event_id: data.id,
        guest_id: data.quick_event_user_id,
        anonymous: data.anonymous
      }));

      messageApi.success("Privacidad editada");
      setEvent(data);

    } catch { }
  };

  const insertUserAndUpgradeGuest = async (g: QuickEventUser) => {
    try {
      const newUser = {
        phone_number: `+52${g.phone_number}`,
        name: g.name,
        type: g.type,
        profile: g.profile,
        emoji: g.emoji
      };

      const { data: userData, error: userError } = await supabase
        .from("pop_users")
        .insert([newUser])
        .select()
        .maybeSingle();

      if (userError || !userData) {
        messageApi.error("No se pudo crear el usuario");
        return;
      }

      localStorage.setItem("quick_event_user_id", userData.id);
      setUser(userData);

      const { data: newEvent, error: guestError } = await supabase
        .from("pop_guests")
        .update({ quick_event_user_id: userData.id, anonymous: false })
        .eq("id", event.id)
        .select()
        .maybeSingle();

      if (guestError) {
        messageApi.error("No se pudo actualizar la confirmación");
        return;
      }

      localStorage.setItem(`quick_event_${info?.id}`, JSON.stringify({
        quick_event_id: newEvent.id,
        guest_id: userData.id,
        anonymous: false
      }));

      messageApi.success("¡Perfil creado y asistencia confirmada!");

    } catch {
      messageApi.error("Error inesperado");
    }
  };

  const getParticipants = async () => {
    const { data, error } = await supabase
      .rpc("get_pop_users_by_event", { p_quick_event_id: info?.id });

    if (!error) setParticipants(data);
  };

  // Parallax scroll + blur
  useEffect(() => {
    const onScroll = () => {
      const progress = Math.min(window.scrollY / 600, 1);
      const scale = 1 + progress * 0.8;
      const blur = Math.pow(progress, 0.7) * 12;
      document.documentElement.style.setProperty("--bg-scale", scale.toString());
      document.documentElement.style.setProperty("--bg-blur", `${blur}px`);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Init
  useEffect(() => {
    if (eventInfo?.type === "open" || preview) setValidated(true);
    const raw = localStorage.getItem(`quick_event_${info?.id}`);
    const eventData = raw ? JSON.parse(raw) : null;
    if (eventData) {
      getUser(eventData.guest_id);
      findEvent(eventData.quick_event_id);
      setAnonymous(eventData.anonymous);
    } else {
      const userID = localStorage.getItem("quick_event_user_id");
      if (userID) getUser(userID);
    }
    getParticipants();
  }, []);

  // Sync participantIdsRef
  useEffect(() => {
    participantIdsRef.current = new Set(participants?.map(p => p.id));
  }, [participants]);

  // Realtime channel
  useEffect(() => {
    if (!supabase) return;
    const channel = supabase.channel("upload_dynamic_participants")
      .on("postgres_changes", { event: "*", schema: "public", table: "pop_guests" }, (payload) => {
        const row = (payload.new ?? payload.old) as QuickEventGuest | null;
        if (row?.quick_event_id === info?.id) getParticipants();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "pop_users" }, (payload) => {
        const row = (payload.new ?? payload.old) as QuickEventUser | null;
        if (row && participantIdsRef.current.has(row.id)) getParticipants();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  useEffect(() => {
    if (password) {
      onValidateUser(password)
    }
  }, [password])


  const infoCssVars: CSSVars = {
    "--blur-color": primary,
    "--blur-color--dark": `${darker(primary, 0.8)}80`,
    "--blur-color--darker": `${darker(primary, 0.2)}80`,
    "--widget-tint": secondary ? `${secondary}40` : "rgba(255, 255, 255, 0.1)",
  };

  useEffect(() => {
    console.log("----")
    console.log(titleCfg)
    console.log(event)
    console.log(eventInfo)
    console.log("----")
  }, [titleCfg, event, eventInfo])
  

  return (
    <>
      {contextHolder}
      <div className={styles.side_event_main_cont}>
        <Hero background={background} />

        {validated && titleCfg && eventInfo && (
          <div className={styles.info_cont} style={infoCssVars as React.CSSProperties}>
            <Cover
              titleCfg={titleCfg}
              eventInfo={eventInfo}
              event={event}
              onConfirmClick={() => setOpenModal(true)}
            />

            {extra?.info && (
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "center", width: "100%", maxWidth: "450px" }}>
                <ExtraInfo info={extra.info} />
                <small style={{ fontSize: "12px", color: "#FFF", fontWeight: 400, fontFamily: "Poppins" }}>Extras</small>
              </div>
            )}

            <div style={{ display: "flex", gap: "16px", width: "100%", maxWidth: "450px" }}>
              {hasFullAddress && address && (
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "4px", alignItems: "center" }}>
                  <div style={{ width: "100%", height: "144px" }}>
                    <EventMap address={address} />
                  </div>
                  <small style={{ fontSize: "12px", color: "#FFF", fontWeight: 400, fontFamily: "Poppins" }}>Ubicación</small>
                </div>
              )}
              {address?.city && (
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "center" }}>
                  <WeatherWidget item={eventInfo} color="#FFFFFF40" radius={24} />
                  <small style={{ fontSize: "12px", color: "#FFF", fontWeight: 400, fontFamily: "Poppins" }}>Clima</small>
                </div>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "center", width: "100%", maxWidth: "450px" }}>
              <Attendees participants={participants} />
              <small style={{ fontSize: "12px", color: "#FFF", fontWeight: 400, fontFamily: "Poppins" }}>Asistentes</small>
            </div>
          </div>
        )}

        <PrivateAccess validated={validated} onValidate={onValidateUser} />
      </div>

      <div className={styles.card_port_view}>
        <div className={styles.port_view}>
          <div className={styles.confirm_card}>
            <ConfirmCard
              getUser={getUser} setUser={setUser} setEvent={setEvent}
              setOpenModal={setOpenModal} openModal={openModal}
              confirmAssitance={confirmAssitance} insertUSer={insertUSer}
              updateAnonymous={updateAnonymous} insertUserAndUpgradeGuest={insertUserAndUpgradeGuest}
              event={event} user={user}
            />
          </div>
        </div>
      </div>

      {/* {validated && <FooterLand color={primary} />} */}
    </>
  );
}
