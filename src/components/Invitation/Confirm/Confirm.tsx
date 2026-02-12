"use client";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { useCallback, useEffect, useState } from "react";
import { Button, Input, message } from "antd";
import { FaMinus, FaRegCalendarCheck } from "react-icons/fa";
import { FaRegCalendarXmark } from "react-icons/fa6";
import { InvitationType, InvitationUIBundle, NewInvitation } from "@/types/new_invitation";
import { GuestSubabasePayload } from "@/types/guests";
import styles from "./confirm.module.css";
import { IoClose } from "react-icons/io5";
import { AddToCalendarButton } from "add-to-calendar-button-react";
import { createClient } from "@/lib/supabase/client";
import { generateSimpleId } from "@/helpers/functions";
import { IoMdAdd } from "react-icons/io";
import { FiMinus } from "react-icons/fi";
import confetti from "canvas-confetti";

dayjs.extend(utc);
dayjs.extend(timezone);

type ConfirmProps = {
  invitation: NewInvitation;
  type: InvitationType;
  guestInfo: GuestSubabasePayload | null;
  mongoID: string;
  ui: InvitationUIBundle;
  invitationID?: string;
  refreshGuest: () => Promise<void>;
};

export default function Confirm({ invitationID, ui, invitation, type, guestInfo, mongoID, refreshGuest }: ConfirmProps) {
  const [messageApi, contextHolder] = message.useMessage();

  const generals = invitation?.generals;
  const primary = generals?.colors.primary ?? "#FFFFFF";
  const secondary = generals?.colors.secondary ?? "#FFFFFF";
  const accent = generals?.colors.accent ?? "#FFFFFF";
  const actions = generals?.colors.actions ?? "#FFFFFF";

  const supabase = createClient();
  const [mainGuest, setMainGuest] = useState<GuestSubabasePayload | null>(null);
  const [localStatus, setLocalStatus] = useState<"creado" | "esperando" | "confirmado" | "rechazado">("esperando");
  const [companions, setCompanions] = useState<GuestSubabasePayload[] | null>(null);
  const [openInvitation, setOpenInvitation] = useState<boolean>(false);

  const onClick = useCallback(() => {
    confetti({
      particleCount: 200,
      spread: 80,
      angle: 90,                 // 90 = hacia abajo, 270 = hacia arriba
      origin: { x: 0.5, y: 0.9 }
    });
  }, []);

  const rejectInvitation = async () => {
    // Si no hay mainGuest, no hacemos nada
    if (!mainGuest) return;

    // 1. Formatear invitado principal
    const mainGuestUpdate = formatGuestForUpdateRejected(mainGuest);

    // 2. Formatear acompañantes SOLO si existen
    const companionsUpdate = Array.isArray(companions) ? companions.map((c) => formatGuestForUpdateRejected(c)) : [];

    // 3. Combinar
    const allUpdates = [mainGuestUpdate, ...companionsUpdate];

    // 4. Guardar en Supabase
    const { data, error } = await supabase.from("guests").upsert(allUpdates, { onConflict: "id" });

    if (error) {
      console.error("❌ Error al actualizar:", error);
      return;
    }

    // console.log("✅ Invitados actualizados:", data);
    setLocalStatus("rechazado");
    refreshGuest();
  };

  const getTitle = (title: unknown): string => {
    // si ya es string
    if (typeof title === "string") return title;
    // si es objeto con .text o .value (ajústalo a tu modelo)
    if (title && typeof title === "object") {
      // @ts-expect-error acceder flexible
      return title.text ?? title.value ?? "Mi evento";
    }
    return "Mi evento";
  };

  const toYYYYMMDD = (dateLike: unknown): string => {
    let raw: string | undefined;

    if (typeof dateLike === "string") raw = dateLike;
    else if (dateLike && typeof dateLike === "object") {
      raw = (dateLike as any).value;
    }

    if (!raw) return "";

    // Si ya viene ISO, lo seguro es cortar el día
    // ("2026-04-04T00:00:00.000Z" -> "2026-04-04")
    const ymd = raw.slice(0, 10);

    // Validación básica
    return /^\d{4}-\d{2}-\d{2}$/.test(ymd) ? ymd : "";
  };

  const getCompanions = async () => {
    try {
      const { data, error } = await supabase.from("guests").select("*").eq("companion_id", guestInfo?.id);

      if (error) {
        console.log(error, "not found");
        return;
      }

      // console.log('companions: ', data)
      setCompanions(data);
    } catch (error) {}
  };

  const createNewCompanion = (invitationID: string): GuestSubabasePayload => ({
    invitation_id: invitationID,
    password: generateSimpleId(),
    phone_number: "",
    name: "",
    tier: "A",
    tag: "",
    table: null,
    state: "creado",
    last_action: "creado",
    notes: "",
    meal: null,
    companion_id: null,
    ticket: true,
    has_companion: false,
    last_action_by: false,
    created_at: new Date().toISOString(),
    last_update_date: new Date().toISOString(),
    side: null,
  });

  const addCompanion = () => {
    setCompanions((prev) => {
      const list = prev ?? [];
      return [...list, createNewCompanion(invitationID!)];
    });
  };

  const removeCompanion = () => {
    setCompanions((prev) => {
      if (!prev || prev.length === 0) return prev; // nada que eliminar
      return prev.slice(0, -1);
    });
  };

  useEffect(() => {
    if (guestInfo) {
      setMainGuest(guestInfo);
      if (guestInfo.has_companion) {
        getCompanions();
      }
      setOpenInvitation(false);
      setLocalStatus(guestInfo.state === "creado" ? "esperando" : guestInfo.state);
    } else {
      if (invitationID) {
        const newguest: GuestSubabasePayload = {
          invitation_id: invitationID,
          password: generateSimpleId(),
          phone_number: "",
          name: "",
          tier: "A",
          tag: "",
          table: null,
          state: "creado",
          last_action: "creado",
          notes: "",
          meal: null,
          companion_id: null,
          ticket: true,
          has_companion: false,
          last_action_by: false,
          created_at: new Date().toISOString(),
          last_update_date: new Date().toISOString(),
          side: null,
          // id se genera en supabase → NO lo pones aquí
        };
        setOpenInvitation(true);
        setMainGuest(newguest);
        setLocalStatus("creado");
      }
    }
    // else {
    //   setOpenInvitation(true)
    // }
  }, []);

  const getUpdatedState = (state: string) => {
    if (state === "creado" || state === "esperando") return "confirmado";
    return state; // rechazado o confirmado no cambian
  };

  const getUpdatedStateRejected = (state: string) => {
    if (state === "creado" || state === "esperando") return "rechazado";
    return state; // rechazado o confirmado no cambian
  };

  const formatGuestForUpdateRejected = (guest: GuestSubabasePayload) => {
    const updatedState = getUpdatedStateRejected(guest.state);

    return {
      id: guest.id,
      name: guest.name,
      state: updatedState,
      last_action: updatedState,
      last_update_date: new Date().toISOString(),
      last_action_by: false,
    };
  };

  const formatGuestForUpdate = (guest: GuestSubabasePayload) => {
    const updatedState = getUpdatedState(guest.state);

    return {
      id: guest.id,
      name: guest.name,
      state: updatedState,
      last_action: updatedState,
      last_update_date: new Date().toISOString(),
      last_action_by: false,
    };
  };

  const onConfirmAssitence = async () => {
    // Si no hay mainGuest, no hacemos nada
    if (!mainGuest) return;

    // 1. Formatear invitado principal
    const mainGuestUpdate = formatGuestForUpdate(mainGuest);

    // 2. Formatear acompañantes SOLO si existen
    const companionsUpdate = Array.isArray(companions) ? companions.map((c) => formatGuestForUpdate(c)) : [];

    // 3. Combinar
    const allUpdates = [mainGuestUpdate, ...companionsUpdate];

    // 4. Guardar en Supabase
    const { data, error } = await supabase.from("guests").upsert(allUpdates, { onConflict: "id" });

    if (error) {
      console.error("❌ Error al actualizar:", error);
      return;
    }

    // console.log("✅ Invitados actualizados:", data);
    setLocalStatus("confirmado");
    onClick()
    refreshGuest();
  };

  const changeAnswer = () => {
    if (openInvitation) {
      setLocalStatus("creado");
    } else {
      setLocalStatus("esperando");
      setMainGuest((prev) => ({ ...prev!, state: "esperando" }));
      if (companions && companions.length > 0) {
        setCompanions((prev) => prev!.map((c) => ({ ...c, state: "esperando" })));
      }
    }
  };

  const onInsertGuests = async () => {
    if (!mainGuest) return;

    if (!mainGuest.name || mainGuest.name === "") {
      messageApi.error("Agrega tu nombre por favor");
      return;
    }

    // 🔎 Filtrar companions sin nombre
    const validCompanions = Array.isArray(companions) ? companions.filter((c) => c.name && c.name.trim() !== "") : [];

    const hasCompanions = validCompanions.length > 0;

    // 1. Preparar mainGuest
    const formattedMainGuest = {
      ...mainGuest,
      state: "confirmado",
      last_action: "creado",
      has_companion: hasCompanions,
    };

    // 2. Insertar mainGuest
    const { data: mainInserted, error: mainError } = await supabase.from("guests").insert([formattedMainGuest]).select();

    if (mainError) {
      console.error("❌ Error insertando mainGuest:", mainError);
      return;
    }

    const mainGuestID = mainInserted?.[0]?.id;

    localStorage.setItem(mainInserted?.[0]?.invitation_id, mainInserted?.[0]?.password);

    if (!mainGuestID) {
      console.error("❌ No se recibió ID del mainGuest desde Supabase");
      return;
    }

    // console.log("🟢 Main guest creado con ID:", mainGuestID);

    // 3. Si NO hay companions válidos, terminamos
    if (!hasCompanions) {
      setLocalStatus("confirmado");
      return;
    }

    // 4. Preparar companions válidos
    const formattedCompanions = validCompanions.map((c) => ({
      ...c,
      companion_id: mainGuestID,
      state: "confirmado",
      last_action: "creado",
    }));

    // 5. Insertar companions válidos
    const { data: companionsInserted, error: companionsError } = await supabase.from("guests").insert(formattedCompanions).select();

    if (companionsError) {
      console.error("❌ Error insertando companions:", companionsError);
      return;
    }

    // console.log("🟢 Companions creados:", companionsInserted);

    // 6. Actualizar UI
    setLocalStatus("confirmado");
  };

  return (
    <>
      {contextHolder}

      {localStatus === "creado" && (
        <div className={styles.confirm_container}>
          <span className={styles.confirm_label}>{ui.confirm.open_hi}</span>

          <span className={styles.confirm_label}>
            <b>{ui.confirm.open_add_name}</b>
          </span>

          <div className={styles.inputs_cont}>
            <Input
              value={mainGuest?.name ?? ""}
              onChange={(e) => setMainGuest((prev) => ({ ...prev!, name: e.target.value }))}
              className={styles.confirm_input}
              placeholder="Tu nombre"
              style={{
                color: accent,
                borderColor: `${accent}20`,
              }}
            />

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
              <span style={{ width: "auto" }} className={styles.confirm_label}>
                <b>{ui.confirm.add_companion}</b>
              </span>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                <Button
                  style={{ backgroundColor: secondary }}
                  onClick={removeCompanion}
                  icon={<FiMinus style={{ color: accent }} />}
                ></Button>
                <Button style={{ backgroundColor: accent }} onClick={addCompanion} icon={<IoMdAdd style={{ color: primary }} />}></Button>
              </div>
            </div>
            {companions?.map((c, index) => (
              <div
                key={index}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "-6px" }}
              >
                <Input
                  onChange={(e) =>
                    setCompanions((prev) => (prev ? prev.map((c, i) => (i === index ? { ...c, name: e.target.value } : c)) : prev))
                  }
                  placeholder={`Acompañante de ${mainGuest?.name}`}
                  className={styles.confirm_input}
                  value={c.name ?? ""}
                  style={{
                    color: accent,
                    borderColor: `${accent}20`,
                  }}
                />
              </div>
            ))}

            {companions?.find((comp) => comp.name === "" || comp.name === undefined || comp.name === null) && (
              <span className={styles.confirm_label_tip}>{ui.confirm.dont_forget}</span>
            )}
          </div>

          <div className={styles.buttons_container}>
            <Button
              onClick={onInsertGuests}
              style={{
                color: primary,
                backgroundColor: accent,
                letterSpacing: "2px",
                borderRadius: "16px",
                minHeight: "52px",
                width: "100%",
                fontSize: "16px",
              }}
            >
              {ui?.confirm.cta}
            </Button>
          </div>
        </div>
      )}

      {localStatus === "esperando" && (
        <div className={styles.confirm_container}>
          <span className={styles.confirm_label}>
            {ui.confirm.closed_hi} <b>{mainGuest?.name}</b>, {ui.confirm.closed_happy}.
          </span>
          {companions && (
            <span className={styles.confirm_label}>
              {ui.confirm.closed_invitation}{" "}
              <b>
                {companions?.length} {ui.confirm.closed_companion}.
              </b>
            </span>
          )}

          {companions && (
            <span className={styles.confirm_label}>
              <b>{ui.confirm.closed_notgoing}.</b>
            </span>
          )}

          <div className={styles.inputs_cont}>
            <Input
              value={mainGuest?.name ?? ""}
              onChange={(e) => setMainGuest((prev) => ({ ...prev!, name: e.target.value }))}
              className={styles.confirm_input}
              placeholder="Tu nombre"
              style={{
                color: accent,
                borderColor: `${accent}20`,
              }}
            />
            {companions?.map((c, index) => (
              <div key={index} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <div key={index} style={{ position: "relative", width: "100%" }}>
                  <Input
                    onChange={(e) =>
                      setCompanions((prev) => (prev ? prev.map((c, i) => (i === index ? { ...c, name: e.target.value } : c)) : prev))
                    }
                    placeholder={`Acompañante de ${mainGuest?.name}`}
                    className={styles.confirm_input}
                    value={c.name ?? ""}
                    style={{
                      color: accent,
                      borderColor: `${accent}20`,
                    }}
                  />
                  {c.state === "confirmado" && (
                    <div style={{ backgroundColor: accent, color: primary }} className={styles.confirm_tag}>
                      {ui.confirm.confirmed}
                    </div>
                  )}

                  {c.state === "rechazado" && (
                    <div style={{ backgroundColor: secondary, color: accent, borderColor: "transparent" }} className={styles.confirm_tag}>
                      {ui.confirm.not_going}
                    </div>
                  )}
                </div>
                {c.state == "rechazado" ? (
                  <Button
                    onClick={() =>
                      setCompanions((prev) => (prev ? prev.map((c, i) => (i === index ? { ...c, state: "esperando" } : c)) : prev))
                    }
                  >
                    Editar
                  </Button>
                ) : (
                  c.state !== "confirmado" && (
                    <Button
                      style={{ height: "38px" }}
                      onClick={() =>
                        setCompanions((prev) => (prev ? prev.map((c, i) => (i === index ? { ...c, state: "rechazado" } : c)) : prev))
                      }
                    >
                      <IoClose />
                    </Button>
                  )
                )}
              </div>
            ))}

            {companions?.find((comp) => comp.name === "" || comp.name === undefined || comp.name === null) && (
              <span className={styles.confirm_label_tip}>{ui.confirm.dont_forget}</span>
            )}
          </div>

          <div className={styles.buttons_container}>
            <Button
              onClick={onConfirmAssitence}
              style={{
                color: primary,
                backgroundColor: accent,
                letterSpacing: "2px",
                borderRadius: "16px",
                minHeight: "52px",
                width: "100%",
                fontSize: "16px",
              }}
            >
              {ui?.confirm.cta}
            </Button>

            <Button
              onClick={rejectInvitation}
              style={{
                border: `1px solid  ${accent}`,
                color: accent,
                borderRadius: "16px",
                backgroundColor: "transparent",
                minHeight: "52px",
                width: "100%",
                fontSize: "16px",
              }}
            >
              {ui?.confirm.decline}
            </Button>
          </div>
        </div>
      )}

      {localStatus === "confirmado" && (
        <div className={styles.confirm_cont}>
          <div className={styles.icon_cont}>
            <FaRegCalendarCheck size={50} style={{ color: accent }} />
          </div>

          <span
            className={styles.confirm_label}
            style={{
              color: accent,
              maxWidth: "80%",
            }}
          >
            {ui.confirm.confirmedMsgBold}
          </span>

          <div
            style={{
              width: "50%",
              height: "2px",
              borderRadius: "5px",
              backgroundColor: secondary,
            }}
          />

          <span
            className={styles.confirm_label}
            style={{
              color: accent,
            }}
          >
            {ui?.confirm.addToCalendar}
          </span>
          {invitation && (
            <AddToCalendarButton
              name={invitation?.cover?.title?.text?.value ?? ""}
              options={["Google"]}
              // startDate={formatISODate(invitation.cover.date)}
              startDate={toYYYYMMDD(invitation?.cover?.date?.value)}
              timeZone="America/Los_Angeles"
            ></AddToCalendarButton>
          )}

          {!openInvitation && (
            <Button
              onClick={changeAnswer}
              style={{
                background: "transparent",
                minHeight: "52px",
                width: "100%",
                fontSize: "16px",
                borderRadius: "16px",
                maxWidth: "80%",
                border: `1px solid  ${accent}`,
                color: accent,
              }}
            >
              {ui?.confirm.changeAnswer}
            </Button>
          )}
        </div>
      )}

      {localStatus == "rechazado" && (
        <div className={styles.confirm_cont}>
          <div className={styles.icon_cont}>
            <FaRegCalendarXmark size={50} style={{ color: accent }} />
          </div>

          <span
            className={styles.confirm_label}
            style={{
              color: accent,
            }}
          >
            {ui?.confirm.declinedMsg}
          </span>
          <Button
            onClick={changeAnswer}
            style={{
              background: "transparent",
              minHeight: "52px",
              width: "100%",
              fontSize: "16px",
              borderRadius: "16px",
              maxWidth: "80%",
              border: `1px solid  ${accent}`,
              color: accent,
            }}
          >
            {ui?.confirm.changeAnswer}
          </Button>
        </div>
      )}
    </>
  );
}
