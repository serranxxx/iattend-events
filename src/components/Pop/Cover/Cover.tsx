"use client";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import "dayjs/locale/es";
import { Button } from "antd";
import { CircleCheck } from "lucide-react";
import { popContent } from "@/types/side_event";
import { QuickEventGuest } from "@/types/guests";
import styles from "./cover.module.css";

dayjs.extend(utc);
dayjs.extend(timezone);

type CoverProps = {
  titleCfg: popContent["title"];
  eventInfo: popContent["information"];
  event: QuickEventGuest;
  onConfirmClick: () => void;
};

function formatDateMexico(isoString: string | null | undefined): string {
  if (!isoString) return "";
  return dayjs.utc(isoString).tz("America/Mexico_City").locale("es").format("ddd D [de] MMMM, HH:mm");
}

export function Cover({ titleCfg, eventInfo, event, onConfirmClick }: CoverProps) {
  const { address } = eventInfo;
  return (
    <>
      <span style={{
        fontFamily: titleCfg.family,
        fontWeight: titleCfg.weight,
        fontSize: `${titleCfg.size}px`,
        lineHeight: titleCfg.line_height,
        opacity: titleCfg.opacity,
        textAlign: "center",
        color: titleCfg.color ?? "#FFF",
        textShadow: "0px 0px 18px rgba(0, 0, 0, 0.35)",
      }}>
        {titleCfg.value ?? ""}
      </span>

      <div className={styles.col} style={{ fontFamily: "Poppins", zIndex: 99 }}>
        <span>{formatDateMexico(eventInfo?.date)}</span>
        <span>{address?.street} {address?.number},</span>
        <span>{address?.state} {address?.country}</span>
      </div>

      {event.state !== "confirmado" && (
        <div className={styles.buttons_cont}>
          <Button
            icon={<CircleCheck size={16} />}
            onClick={onConfirmClick}
            style={{ height: "56px", textTransform: "uppercase", letterSpacing: "1px" }}
            type="text"
            className={styles.side_buttons}
          >
            Confirmar asistencia
          </Button>
        </div>
      )}
    </>
  );
}
