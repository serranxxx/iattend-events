"use client";

import { NewInvitation, InvitationUIBundle } from "@/types/new_invitation";
import { GuestSubabasePayload } from "@/types/guests";
import Image from "next/image";
import { darker } from "@/helpers/functions";
import styles from "./ticket.module.css";
import { QRCode, Spin } from "antd";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { supportsAppleWallet, useWalletPass } from "./useWalletPass";
import { WalletHelpSheet } from "./WalletHelpSheet";

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
  // "dock": tarjeta compacta del carrusel de pases del dock (plan Pro).
  variant?: "overlay" | "dock";
  passLabel?: string;
};

const formatShortDate = (dateString: string) => {
  const [, month, day] = dateString.split("T")[0].split("-");
  const months = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
  return `${months[Number(month) - 1]} ${Number(day)}`;
};



const toCoverImageUrl = (src: string | string[] | null | undefined): string | null => {
  if (!src || typeof src !== 'string' && !Array.isArray(src)) return null;
  if (typeof src === 'string') return src.trim() || null;
  return src.find(s => typeof s === 'string' && s.trim()) ?? null;
};

export function Ticket({ guest, invitation, ui, colors, onClose, id, variant = "overlay", passLabel }: TicketProps) {
  const { primary, accent } = colors;
  const font = invitation.generals.fonts.body?.value ?? "Poppins";
  const coverImageSrc = toCoverImageUrl(invitation.cover.image.prod);
  const supabase = createClient();
  const wallet = useWalletPass(id);
  const isDock = variant === "dock";

  const [tables, setTables] = useState<{ id: string; number: number }[]>([])

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
    <div
      onClick={isDock ? undefined : onClose}
      className={`${styles.ticket_container} ${isDock ? styles.ticket_dock : ""}`}
      style={{ backgroundColor: isDock ? primary : `${primary}80`, transition: "all 0.3s ease" }}
    >
      <div
        className={styles.ticket_first_section}
        style={{ background: `linear-gradient(to top, ${primary} 0%, ${darker(primary, 0.5)} 100%)` }}
      >
        <div className={`${styles.ticket_image} ${isDock ? styles.ticket_image_dock : ""}`}>
          {coverImageSrc && <Image fill src={coverImageSrc} alt="" style={{ objectFit: "cover" }} />}
          <div
            style={{ background: `linear-gradient(to top, ${darker(primary, 0.8)} 0%, transparent 30%, transparent 70%, ${darker(primary, 0.6)} 110%)` }}
            className={styles.ticket_shadow}
          />
          <div className={styles.ticket_logo}>
            <img src="/assets/images/nuevo_blanco.png" alt="" style={{ width: isDock ? "64px" : "70px" }} />
          </div>

          {isDock && passLabel && (
            <span className={styles.ticket_pass_label}>{passLabel}</span>
          )}

          {supportsAppleWallet() && (
            <div
              onClick={(e) => { e.stopPropagation(); wallet.addToWallet(guest.id); }}
              className={styles.wallet_btn} style={{
                zIndex:999, position:'absolute', left: isDock ? '16px' : '24px', top: isDock ? '14px' : '24px',
                boxShadow:'0px 0px 12px rgba(0,0,0,0.4)', height:'31px', borderRadius:'8px'
              }}>
              <img src="/assets/tools/wallet_add.png" alt="" style={{ width: 100 }} />
            </div>
          )}

          {wallet.addingToWallet && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 1000,
              backgroundColor: `${primary}50`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 'inherit',
            }}>
              <Spin size="large" />
            </div>
          )}
        </div>

        <div className={styles.ticket_row} style={{ fontFamily: font, color: accent }}>
          <QRCode
            size={isDock ? 100 : 125}
            style={{ border: "none", flexShrink: 0, padding: isDock ? 0 : undefined }}
            errorLevel="H"
            color={accent}
            bgColor="transparent"
            value={guest.id?.toString() ?? ""}
          />

          <div className={styles.ticket_col} style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: isDock ? "16px" : "17px", fontWeight: 600, lineHeight: 1.2 }}>
              {invitation.cover.title.text.value}
            </span>
            <div className={styles.ticket_col} style={{ flexDirection: 'row', gap: '8px' }}>
              <span style={{ fontWeight: 600, fontSize: "13px" }}>{formatShortDate(invitation.cover.date.value)}</span>
              <span>/</span>
              <span style={{ fontSize: "13px", opacity: 0.7 }}>{invitation.itinerary.object[0]?.time ?? ""}</span>
            </div>
            <div className={styles.ticket_col} style={{ gap: "2px", marginTop: "4px", maxWidth: "100%" }}>
              <span style={{ opacity: 0.4, fontSize: "12px", lineHeight: 1 }}>{ui.confirm.digital_name}</span>
              <span className={styles.ticket_value} style={{ fontSize: isDock ? "15px" : "16px" }}>{guest.name ?? "Sin nombre"}</span>
            </div>
            <div className={styles.ticket_col} style={{ gap: "2px", marginTop: "4px" }}>
              <span style={{ opacity: 0.4, fontSize: "12px", lineHeight: 1 }}>{ui.confirm.digital_table}</span>
              <span className={styles.ticket_value} style={{ fontSize: isDock ? "15px" : "16px" }}>{tables?.find(t => t.id === guest.table)?.number ?? "-"}</span>
            </div>
          </div>
        </div>
      </div>



      <div className={styles.ticket_effect} />

      <WalletHelpSheet wallet={wallet} primary={primary} accent={accent} font={font} />
    </div>
  );
}
