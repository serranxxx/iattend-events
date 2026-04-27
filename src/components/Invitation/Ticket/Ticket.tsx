"use client";

import { NewInvitation, InvitationUIBundle } from "@/types/new_invitation";
import { GuestSubabasePayload } from "@/types/guests";
import Image from "next/image";
import { darker } from "@/helpers/functions";
import styles from "./ticket.module.css";
import { QRCode } from "antd";

type TicketColors = {
  primary: string;
  secondary: string;
  accent: string;
};

type TicketProps = {
  guest: GuestSubabasePayload;
  invitation: NewInvitation;
  tables: any[];
  ui: InvitationUIBundle;
  colors: TicketColors;
  onClose: () => void;
};

const formatShortDate = (dateString: string) => {
  const [, month, day] = dateString.split("T")[0].split("-");
  const months = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
  return `${months[Number(month) - 1]} ${Number(day)}`;
};

export function Ticket({ guest, invitation, tables, ui, colors, onClose }: TicketProps) {
  const { primary, accent } = colors;
  const font = invitation.generals.fonts.body?.value ?? "Poppins";
  const tableNumber = tables.find((t) => t.id === guest.table)?.number ?? "Sin asignar";

  return (
    <div onClick={onClose} className={styles.ticket_container} style={{ backgroundColor: `${primary}80`, transition: "all 0.3s ease" }}>
      <div
        className={styles.ticket_first_section}
        style={{ background: `linear-gradient(to top, ${primary} 0%, ${darker(primary, 0.5)} 100%)` }}
      >
        <div className={styles.ticket_image}>
          <Image fill src={invitation.cover.image.prod!} alt="" style={{ objectFit: "cover" }} />
          <div
            style={{ background: `linear-gradient(to top, ${darker(primary, 0.8)} 0%, transparent 30%, transparent 70%, ${darker(primary, 0.6)} 110%)` }}
            className={styles.ticket_shadow}
          />
          <div className={styles.ticket_logo}>
            <img src="/assets/images/blanco.png" alt="" style={{ width: "70px" }} />
          </div>
        </div>

        <div className={styles.ticket_row} style={{ fontFamily: font, color: accent }}>

          {/* <QRCode style={{border:'none', minWidth:'136px'}} errorLevel="L" color={colors.accent} value="https://www.iattend.site/admin" /> */}
          <div className={styles.ticket_col} style={{ gap: "12px", marginBottom: "12px" }}>
            <div className={styles.ticket_col}>
              <span style={{ fontSize: "16px", fontWeight: 600 }}>{invitation.cover.title.text.value}</span>
            </div>
            <div className={styles.ticket_col}>
              <span style={{ fontWeight: 600, fontSize: "14px" }}>{formatShortDate(invitation.cover.date.value)}</span>
              <span>{invitation.itinerary.object[0].time ?? ""}</span>
            </div>
          </div>

          <div className={styles.ticket_col} style={{ gap: "12px", maxWidth:'140px' }}>
            {/* <div className={styles.ticket_col}>
              <span style={{ fontSize: "18px", fontWeight: 600 }}>{invitation.cover.title.text.value}</span>
            </div>
            <div className={styles.ticket_col}>
              <span style={{ fontWeight: 600, fontSize: "14px" }}>{formatShortDate(invitation.cover.date.value)}</span>
              <span>{invitation.itinerary.object[0].time ?? ""}</span>
            </div> */}
            <div className={styles.ticket_col} style={{ gap: "0" }}>
              <span style={{ opacity: "0.4", fontSize: "12px", lineHeight: 1 }}>{ui.confirm.digital_name}</span>
              <span>{guest.name ?? "Sin nombre"}</span>
            </div>
            <div className={styles.ticket_col}>
              <span style={{ opacity: "0.4", fontSize: "12px", lineHeight: 1 }}>{ui.confirm.digital_table}</span>
              <span>{tableNumber}</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.ticket_effect} />
    </div>
  );
}
