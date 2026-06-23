"use client";

import Link from "next/link";
import { QrCode, RefreshCw, Camera, SquarePen, Sparkles } from "lucide-react";
import { GuestSubabasePayload } from "@/types/guests";
import { InvitationUIBundle } from "@/types/new_invitation";
import styles from "./invitation-control-bar.module.css";
import { MdOutlineCamera } from "react-icons/md";
import { IoSparkles } from "react-icons/io5";

type InvitationControlBarProps = {
  plan?: string;
  dev: boolean;
  guestInfo: GuestSubabasePayload | null;
  ui: InvitationUIBundle;
  actions: string;
  primary: string;
  accent: string;
  phone_number?: string | null;
  scrolledDown?: boolean;
  onOpenConfirm: () => void;
  onShowTicket: () => void;
  onShowCamera?: () => void;
  onAskLia?: () => void;
};

export default function InvitationControlBar({
  plan,
  dev,
  guestInfo,
  ui,
  primary,
  accent,
  actions,
  phone_number,
  scrolledDown = false,
  onOpenConfirm,
  onShowTicket,
  onShowCamera,
  onAskLia,
}: InvitationControlBarProps) {
  const isConfirmed = guestInfo?.state === 'confirmado' || guestInfo?.state === 'asistente';
  const showPill = isConfirmed && plan === 'pro';
  const showLite = isConfirmed && plan === 'lite';

  const wrapperClass = `${styles.wrapper} ${scrolledDown ? styles.wrapperSmall : ''}`;

  // --- Paperless plan ---
  if (plan === 'paperless') {
    if (!phone_number) return null;
    const messagePaperless = encodeURIComponent("¡Hola! Confirmo mi asistencia.");
    return (
      <div className={wrapperClass}>
        <Link
          href={`https://wa.me/${phone_number}?text=${messagePaperless}`}
          rel="noreferrer"
          target="_blank"
        >
          <button className={styles.confirmBtn} style={{ color: primary }}>
            {ui?.buttons.confirm}
          </button>
        </Link>
      </div>
    );
  }

  // --- Lite plan: confirmed, solo editar respuesta ---
  if (showLite) {
    return (
      <div className={wrapperClass}>
        <div className={styles.pill}>
          <button
            className={styles.liaBtn}
            style={{ color: accent }}
            onClick={!dev ? onOpenConfirm : undefined}
            aria-label="Editar respuesta"
          >
            <SquarePen size={18} />
            <span>Editar respuesta</span>
          </button>
        </div>
      </div>
    );
  }

  // --- Pro plan: icon pill completo ---
  if (showPill) {
    return (
      <div className={wrapperClass}>
        <div className={styles.pill}>
          <button
            className={styles.iconBtn}
            style={{ color: accent }}
            onClick={!dev ? onOpenConfirm : undefined}
            aria-label="Actualizar estado"
          >
            <SquarePen size={18} />
          </button>

          <span className={styles.divider} />

          <button
            className={styles.iconBtn}
            style={{ color: accent }}
            onClick={onShowTicket}
            aria-label="Pase digital"
          >
            <QrCode size={20} />
          </button>

          {onShowCamera && (
            <>
              <span className={styles.divider} />
              <button
                className={styles.iconBtn}
                style={{ color: accent }}
                onClick={onShowCamera}
                aria-label="Photo Wall"
              >
                <Camera size={20} />
              </button>
            </>
          )}

          <span className={styles.divider} />

          <button
            className={styles.liaBtn}
            style={{ color: accent, gap:'12px' }}
            onClick={onAskLia}
            aria-label="Ask Lia"
          >
            <Sparkles size={18} />
            <span>¿Dudas?</span>
          </button>
        </div>
      </div>
    );
  }

  // --- Not confirmed: big confirm button ---
  return (
    <div className={wrapperClass} style={{
      background: `${actions}70`, borderRadius:'99px'
    }}>
      <button
        className={styles.confirmBtn}
        style={{ color: primary,}}
        onClick={!dev ? onOpenConfirm : undefined}
      >
        {ui?.buttons.confirm}
      </button>
    </div>
  );
}
