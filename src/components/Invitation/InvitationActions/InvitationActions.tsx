"use client";

import { Button } from "antd";
import Link from "next/link";
import { QrCode, RefreshCw, Camera } from "lucide-react";
import { GuestSubabasePayload } from "@/types/guests";
import { InvitationUIBundle } from "@/types/new_invitation";
import styles from "./invitation-actions.module.css";

type InvitationActionsProps = {
  plan?: string;
  dev: boolean;
  guestInfo: GuestSubabasePayload | null;
  ui: InvitationUIBundle;
  actions: string;
  primary: string;
  phone_number?: string | null;
  onOpenConfirm: () => void;
  onShowTicket: () => void;
  onShowCamera?: () => void;
};

export default function InvitationActions({
  plan,
  dev,
  guestInfo,
  ui,
  actions,
  primary,
  phone_number,
  onOpenConfirm,
  onShowTicket,
  onShowCamera,
}: InvitationActionsProps) {
  const isConfirmed = guestInfo?.state === 'confirmado' || guestInfo?.state === 'asistente';
  const messagePaperless = encodeURIComponent("¡Hola! Confirmo mi asistencia.");

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    position: 'fixed',
    left: '50%',
    transform: 'translateX(-50%)',
    bottom: '20px',
    zIndex: 3,
  };

  if (plan !== 'paperless') {
    return (
      <div style={containerStyle}>
        <Button
          onClick={!dev ? onOpenConfirm : () => {}}
          style={{
            letterSpacing: '2px',
            fontSize: '16px',
            height: '44px',
            width: isConfirmed && plan === 'pro' ? 'auto' : '200px',
            backgroundColor: `${actions}99`,
            backdropFilter: 'blur(10px)',
            color: primary,
            boxShadow: '0 0 12px rgba(0, 0, 0, 0.26)',
          }}
        >
          {isConfirmed && plan === 'pro' ? <RefreshCw size={18} /> : ui?.buttons.confirm}
        </Button>

        {isConfirmed && plan === 'pro' && (
          <Button
            className={styles.glow_button}
            icon={<QrCode size={18} />}
            onClick={onShowTicket}
            style={{
              letterSpacing: '2px',
              fontSize: '18px',
              height: '44px',
              minWidth: '44px',
              backgroundColor: `${actions}99`,
              backdropFilter: 'blur(10px)',
              color: primary,
              boxShadow: '0 0 8px 0 rgba(0, 0, 0, 0.25)',
              zIndex: 99999,
            }}
          >
            {ui.confirm.digital_pass}
          </Button>
        )}

        {isConfirmed && onShowCamera && (
          <Button
            icon={<Camera size={18} />}
            onClick={onShowCamera}
            style={{
              letterSpacing: '2px',
              fontSize: '16px',
              height: '44px',
              minWidth: '44px',
              backgroundColor: `${actions}99`,
              backdropFilter: 'blur(10px)',
              color: primary,
              boxShadow: '0 0 8px 0 rgba(0, 0, 0, 0.25)',
            }}
          >
            Photo Wall
          </Button>
        )}
      </div>
    );
  }

  if (phone_number) {
    return (
      <div style={containerStyle}>
        <Link href={`https://wa.me/${phone_number}?text=${messagePaperless}`} rel="noreferrer" target="_blank">
          <Button
            style={{
              letterSpacing: '2px',
              fontSize: '16px',
              height: '44px',
              width: isConfirmed ? 'auto' : '200px',
              backgroundColor: actions,
              color: primary,
              boxShadow: '0 0 12px rgba(0, 0, 0, 0.26)',
            }}
          >
            {ui?.buttons.confirm}
          </Button>
        </Link>
      </div>
    );
  }

  return null;
}
