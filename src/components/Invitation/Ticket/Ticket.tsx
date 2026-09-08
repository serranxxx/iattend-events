"use client";

import { NewInvitation, InvitationUIBundle } from "@/types/new_invitation";
import { GuestSubabasePayload } from "@/types/guests";
import Image from "next/image";
import { darker } from "@/helpers/functions";
import styles from "./ticket.module.css";
import { Button, QRCode, Spin } from "antd";
import { useEffect, useRef, useState } from "react";
import { Check, Compass, Copy, ExternalLink, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const isIOS = () =>
  typeof navigator !== "undefined" &&
  /iPad|iPhone|iPod/.test(navigator.userAgent);

/**
 * Solo Safari puede entregar un .pkpass a Apple Wallet. Los navegadores
 * embebidos (WhatsApp, Instagram, Facebook) son un webview dentro de la app:
 * en lugar de la hoja de "Agregar a Apple Wallet" muestran el archivo como
 * texto crudo.
 *
 * NO se puede distinguir por user agent — el navegador de WhatsApp también
 * incluye el token "Safari/". La prueba confiable es `ApplePaySession`: Apple
 * la expone únicamente en Safari, nunca en un webview embebido.
 */
const canAddPassToWallet = () =>
  typeof window !== "undefined" && "ApplePaySession" in window;

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



const toCoverImageUrl = (src: string | string[] | null | undefined): string | null => {
  if (!src || typeof src !== 'string' && !Array.isArray(src)) return null;
  if (typeof src === 'string') return src.trim() || null;
  return src.find(s => typeof s === 'string' && s.trim()) ?? null;
};

export function Ticket({ guest, invitation, ui, colors, onClose, id }: TicketProps) {
  const { primary, accent } = colors;
  const font = invitation.generals.fonts.body?.value ?? "Poppins";
  const coverImageSrc = toCoverImageUrl(invitation.cover.image.prod);
  const supabase = createClient();

  const [tables, setTables] = useState<{ id: string; number: number }[]>([])
  const [addingToWallet, setAddingToWallet] = useState(false)
  const [passUrl, setPassUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const timers = useRef<number[]>([])

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const buildPassUrl = () => {
    const url = new URL("/api/wallet/pass", window.location.origin)
    url.searchParams.set("invitation", String(id))
    url.searchParams.set("guest", String(guest.id))
    return url.toString()
  }

  const addToWallet = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (addingToWallet || !id || guest.id == null) return

    const url = buildPassUrl()

    // Fuera de Safari no hay forma de agregar el pase: hay que salir del
    // webview primero. La hoja explica cómo y ofrece el intento automático.
    if (!canAddPassToWallet()) {
      setPassUrl(url)
      return
    }

    // Safari entrega el pase a Apple Wallet cuando *navega* a un recurso con
    // MIME type application/vnd.apple.pkpass — no con un blob + <a download>.
    setAddingToWallet(true)
    window.location.href = url
    later(() => setAddingToWallet(false), 3000)
  }

  /**
   * Salta a Safari con el esquema `x-safari-https://`. Se dispara con un tap
   * del invitado porque los webviews solo permiten abrir otra app a partir de
   * un gesto del usuario. Si Safari ya es el navegador activo (falso negativo
   * de `canAddPassToWallet`) el esquema lo maneja Safari mismo y también
   * termina abriendo la hoja de Wallet.
   */
  const openPassInSafari = () => {
    if (!passUrl) return
    window.location.href = passUrl.replace(/^http(s?):\/\//, "x-safari-http$1://")
  }

  const copyPassUrl = async () => {
    if (!passUrl) return
    try {
      await navigator.clipboard.writeText(passUrl)
      setCopied(true)
      later(() => setCopied(false), 2000)
    } catch (err) {
      console.error("No se pudo copiar la liga del pase:", err)
    }
  }

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
          {coverImageSrc && <Image fill src={coverImageSrc} alt="" style={{ objectFit: "cover" }} />}
          <div
            style={{ background: `linear-gradient(to top, ${darker(primary, 0.8)} 0%, transparent 30%, transparent 70%, ${darker(primary, 0.6)} 110%)` }}
            className={styles.ticket_shadow}
          />
          <div className={styles.ticket_logo}>
            <img src="/assets/images/nuevo_blanco.png" alt="" style={{ width: "70px" }} />
          </div>

          {isIOS() && (
            <div
              onClick={addToWallet}
              className={styles.wallet_btn} style={{
                zIndex:999, position:'absolute', left:'24px', top:'24px',
                boxShadow:'0px 0px 12px rgba(0,0,0,0.4)', height:'31px', borderRadius:'8px'
              }}>
              <img src="/assets/tools/wallet_add.png" alt="" style={{ width: 100 }} />
            </div>
          )}

          {addingToWallet && (
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
            size={125}
            style={{ border: "none", flexShrink: 0 }}
            errorLevel="H"
            color={accent}
            bgColor="transparent"
            value={guest.id?.toString() ?? ""}
          />

          <div className={styles.ticket_col} style={{ flex: 1 }}>
            <span style={{ fontSize: "17px", fontWeight: 600, lineHeight: 1.2 }}>
              {invitation.cover.title.text.value}
            </span>
            <div className={styles.ticket_col} style={{ flexDirection: 'row', gap: '8px' }}>
              <span style={{ fontWeight: 600, fontSize: "13px" }}>{formatShortDate(invitation.cover.date.value)}</span>
              <span>/</span>
              <span style={{ fontSize: "13px", opacity: 0.7 }}>{invitation.itinerary.object[0].time ?? ""}</span>
            </div>
            <div className={styles.ticket_col} style={{ gap: "2px", marginTop: "4px" }}>
              <span style={{ opacity: 0.4, fontSize: "12px", lineHeight: 1 }}>{ui.confirm.digital_name}</span>
              <span style={{ fontSize: "16px", fontWeight: 500, lineHeight: 1 }}>{guest.name ?? "Sin nombre"}</span>
            </div>
            <div className={styles.ticket_col} style={{ gap: "2px", marginTop: "4px" }}>
              <span style={{ opacity: 0.4, fontSize: "12px", lineHeight: 1 }}>{ui.confirm.digital_table}</span>
              <span style={{ fontSize: "16px", fontWeight: 500, lineHeight: 1 }}>{tables?.find(t => t.id === guest.table)?.number ?? "-"}</span>
            </div>
          </div>
        </div>
      </div>



      <div className={styles.ticket_effect} />

      {passUrl && (
        <div
          className={styles.wallet_help}
          style={{ backgroundColor: `${darker(primary, 0.5) ?? primary}D9` }}
          onClick={(e) => { e.stopPropagation(); setPassUrl(null) }}
        >
          <div
            className={styles.wallet_help_card}
            style={{
              fontFamily: font,
              backgroundColor: primary,
              color: accent,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              type="text"
              shape="circle"
              className={styles.wallet_help_close}
              icon={<X size={14} />}
              onClick={() => setPassUrl(null)}
            />

            <Compass size={28} className={styles.wallet_help_icon} />

            <span className={`s1 ${styles.wallet_help_title}`}>
              Ábrelo en Safari
            </span>
            <span className={`b3 ${styles.wallet_help_text}`}>
              Apple Wallet solo acepta pases desde Safari, y estás dentro del
              navegador de WhatsApp.
            </span>

            <Button
              block
              size="large"
              type="primary"
              icon={<ExternalLink size={14} />}
              onClick={openPassInSafari}
            >
              Abrir en Safari
            </Button>

            <span className={`c1 ${styles.wallet_help_hint}`}>
              Si no se abre, toca el botón <b>···</b> de arriba a la derecha y
              elige <b>Abrir en Safari</b>, o copia la liga y pégala allá.
            </span>

            <Button
              block
              size="small"
              type="text"
              icon={copied ? <Check size={14} /> : <Copy size={14} />}
              onClick={copyPassUrl}
            >
              {copied ? "Liga copiada" : "Copiar liga del pase"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
