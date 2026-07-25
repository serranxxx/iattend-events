"use client";
import { Button } from "antd";
import { CircleCheck } from "lucide-react";
import { popContent } from "@/types/side_event";
import { QuickEventGuest } from "@/types/guests";
import { formatEventDateTime } from "@/helpers/functions";
import styles from "./cover.module.css";

type CoverProps = {
  titleCfg: popContent["title"];
  eventInfo: popContent["information"];
  event: QuickEventGuest;
  onConfirmClick: () => void;
};

export function Cover({ titleCfg, eventInfo, event, onConfirmClick }: CoverProps) {
  const { address } = eventInfo;
  return (
    <>
      <span translate="no" className="notranslate" style={{
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
        <span>{formatEventDateTime(eventInfo?.date, eventInfo?.address?.state)}</span>
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
