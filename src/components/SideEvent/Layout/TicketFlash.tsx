"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { QRCode, Spin } from "antd";
import { supportsAppleWallet, useWalletPass } from "@/components/Invitation/Ticket/useWalletPass";
import { WalletHelpSheet } from "@/components/Invitation/Ticket/WalletHelpSheet";
import { useFocoAtrapado } from "./useAnchoFlash";
import styles from "./ticket-flash.module.css";

/*
  Boleto de un side event / Flash ("Ver mi pase", y se abre solo al
  confirmar): flota sobre la página desenfocada, como el pase de la
  invitación (Invitation/Ticket). Arriba la foto del pase con el botón de
  Apple Wallet y el logo de I attend; abajo el QR, el título, la fecha y la
  hora, el nombre y el acceso (personas del pase) y, con formulario, el folio.
  · Foto y título: los del pase (`body.wallet`, editor de vite → Pase digital)
    o los de la portada.
  · Apple Wallet: si el organizador lo ofrece (`body.wallet.enabled`), en
    iPhone / iPad / Mac. En la vista previa se ve pero no hace nada.
  · El QR lleva "side:<id del invitado>" (helpers/paseSide.ts), el que lee el
    lector de pases de iattend-vite.
  Se cierra tocando fuera o con Esc.
*/

type Props = {
  open: boolean;
  onClose: () => void;
  titulo: string;
  imagen?: string | null;
  fecha: string;
  hora: string;
  nombre: string;
  personas: number;
  folio?: string | null;
  qr: string;
  color?: string | null;
  conWallet: boolean;
  // Sin ellos (vista previa) el botón de Wallet no hace nada.
  eventoId?: number | string | null;
  invitadoId?: number | string | null;
};

const SALIDA_MS = 220;

export default function TicketFlash({ open, onClose, titulo, imagen, fecha, hora, nombre, personas, folio, qr, color, conWallet, eventoId, invitadoId }: Props) {
  const [montado, setMontado] = useState(open);
  const [saliendo, setSaliendo] = useState(false);
  const tarjetaRef = useRef<HTMLDivElement>(null);
  const wallet = useWalletPass(undefined, eventoId ?? undefined);
  const [enApple, setEnApple] = useState(false);
  useEffect(() => { setEnApple(supportsAppleWallet()); }, []);

  useEffect(() => {
    if (open) { setMontado(true); setSaliendo(false); return; }
    if (!montado) return;
    setSaliendo(true);
    const t = window.setTimeout(() => { setMontado(false); setSaliendo(false); }, SALIDA_MS);
    return () => window.clearTimeout(t);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useFocoAtrapado(tarjetaRef, open && montado);

  if (!montado || typeof document === "undefined") return null;

  const tema = color || "#3B332D";
  const puedeAgregar = eventoId != null && invitadoId != null;
  const verWallet = conWallet && enApple;

  return createPortal(
    <div
      className={`${styles.capa} ${saliendo ? styles.saliendo : ""}`}
      style={{ "--tema": tema } as React.CSSProperties}
      onClick={onClose}
    >
      <div
        ref={tarjetaRef}
        className={styles.boleto}
        role="dialog"
        aria-modal="true"
        aria-label="Tu pase"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.foto}>
          {imagen && <img src={imagen} alt="" />}
          <div className={styles.foto_sombra} />
          {verWallet && (
            <button
              type="button"
              className={styles.wallet}
              aria-label="Agregar a Apple Wallet"
              aria-busy={wallet.addingToWallet}
              onClick={() => { if (puedeAgregar) wallet.addToWallet(invitadoId); }}
            >
              <img src="/assets/tools/wallet_add.png" alt="" />
            </button>
          )}
          <img className={styles.logo} src="/assets/images/iattend_logo_claro.png" alt="I attend" />
          {wallet.addingToWallet && <div className={styles.cargando}><Spin size="large" /></div>}
        </div>

        <div className={styles.datos}>
          <div className={styles.qr}>
            <QRCode value={qr} size={132} bordered={false} errorLevel="H" color="#1F1B2E" bgColor="#FFFFFF" style={{ padding: 0 }} />
          </div>
          <div className={styles.textos}>
            <span className={styles.titulo}>{titulo}</span>
            <span className={styles.cuando}>
              <b>{fecha}</b>
              {hora && <><span aria-hidden>/</span><span>{hora}</span></>}
            </span>
            <span className={styles.campo}>
              <span className={styles.etiqueta}>Nombre</span>
              <span className={styles.valor}>{nombre}</span>
            </span>
            <span className={styles.campo}>
              <span className={styles.etiqueta}>Acceso</span>
              <span className={styles.valor}>{personas} {personas === 1 ? "persona" : "personas"}</span>
            </span>
            {folio && (
              <span className={styles.campo}>
                <span className={styles.etiqueta}>Folio</span>
                <span className={styles.valor}>{folio}</span>
              </span>
            )}
          </div>
        </div>
      </div>
      {/* La hoja de respaldo (navegador embebido) va sobre el boleto. */}
      {wallet.passUrl && (
        <div className={styles.ayuda} onClick={(e) => e.stopPropagation()}>
          <WalletHelpSheet wallet={wallet} primary={tema} accent="#FFFFFF" font="Poppins" />
        </div>
      )}
    </div>,
    document.body,
  );
}
