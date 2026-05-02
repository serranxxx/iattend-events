"use client";

import { NewInvitation, InvitationUIBundle } from "@/types/new_invitation";
import { GuestSubabasePayload } from "@/types/guests";
import Image from "next/image";
import { darker } from "@/helpers/functions";
import styles from "./ticket.module.css";
import { QRCode } from "antd";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type TicketColors = {
  primary: string;
  secondary: string;
  accent: string;
};

type TicketProps = {
  guest: GuestSubabasePayload;
  invitation: NewInvitation;
  ui: InvitationUIBundle;
  colors: TicketColors;
  onClose: () => void;
  id?: string,
};

const formatShortDate = (dateString: string) => {
  const [, month, day] = dateString.split("T")[0].split("-");
  const months = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
  return `${months[Number(month) - 1]} ${Number(day)}`;
};



export function Ticket({ guest, invitation, ui, colors, onClose, id }: TicketProps) {
  const { primary, accent } = colors;
  const font = invitation.generals.fonts.body?.value ?? "Poppins";
    const supabase = createClient();

  const [tables, setTables] = useState<any[]>([])

    const getTables = async () => {
        if (id) {
            const { data, error } = await supabase
                .from('tables')
                .select('*')
                .eq('invitation_id', id)

            if (error) {
                console.error('Error al obtener mesas:', error)
                return
            }
            setTables(data)
        }
    }

  useEffect(() => {
    getTables()
  }, [])
  
  
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
          <QRCode
            size={125}
            style={{ border: "none", flexShrink: 0 }}
            errorLevel="H"
            color={accent}
            bgColor="transparent"
            value={guest.id?.toString() ?? ""}
          />

          <div className={styles.ticket_col} style={{  flex: 1}}>
            <span style={{ fontSize: "17px", fontWeight: 600, lineHeight: 1.2 }}>
              {invitation.cover.title.text.value}
            </span>
            <div className={styles.ticket_col} style={{ flexDirection:'row', gap:'8px'}}>
              <span style={{ fontWeight: 600, fontSize: "13px" }}>{formatShortDate(invitation.cover.date.value)}</span>
              <span>/</span>
              <span style={{ fontSize: "13px", opacity: 0.7 }}>{invitation.itinerary.object[0].time ?? ""}</span>
            </div>
            <div className={styles.ticket_col} style={{ gap: "2px", marginTop: "4px" }}>
              <span style={{ opacity: 0.4, fontSize: "12px", lineHeight: 1 }}>{ui.confirm.digital_name}</span>
              <span style={{ fontSize: "16px", fontWeight: 500, lineHeight:1 }}>{guest.name ?? "Sin nombre"}</span>
            </div>
            <div className={styles.ticket_col} style={{ gap: "2px", marginTop: "4px" }}>
              <span style={{ opacity: 0.4, fontSize: "12px", lineHeight: 1 }}>{ui.confirm.digital_table}</span>
              <span style={{ fontSize: "16px", fontWeight: 500, lineHeight:1 }}>{tables?.find(t => t.id === guest.table)?.number ?? "-"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.ticket_effect} />
    </div>
  );
}
