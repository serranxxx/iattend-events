"use client";

import React from "react";
import { createPortal } from "react-dom";
import { QRCode } from "antd";
import { supportsAppleWallet, useWalletPass } from "@/components/Invitation/Ticket/useWalletPass";
import { WalletHelpSheet } from "@/components/Invitation/Ticket/WalletHelpSheet";
import styles from "./layout.module.css";

/*
  Pase de un Flash (handoff "Flash Layout" 3a, se abre con "Ver mi pase"):
  quiénes entran, el QR y el folio del formulario (o el código del invitado
  si no hay formulario). El QR lleva "side:<id del invitado>" (helpers/
  paseSide.ts), que lee el lector de pases de iattend-vite. En iPhone / iPad /
  Mac se puede agregar a Apple Wallet (/api/wallet/side-pass, mismo QR).
*/

type Props = {
  nombres: string[];
  qr: string;
  folio?: string | null;
  codigo?: string | null;
  // Para Apple Wallet: sin ellos (vista previa) no sale el botón.
  eventoId?: number | string | null;
  invitadoId?: number | string | null;
  color?: string;
};

const unir = (n: string[]) => (n.length > 1 ? `${n.slice(0, -1).join(", ")} y ${n[n.length - 1]}` : n[0] ?? "");

export default function PaseFlash({ nombres, qr, folio, codigo, eventoId, invitadoId, color }: Props) {
  const personas = Math.max(1, nombres.length);
  const clave = folio || codigo;
  const wallet = useWalletPass(undefined, eventoId ?? undefined);
  const conWallet = eventoId != null && invitadoId != null && supportsAppleWallet();

  return (
    <div className={styles.pase}>
      <div className={styles.pase_cabecera}>
        <span className={styles.pase_col}>
          <span className={styles.pase_titulo}>Tu pase</span>
          <span className={styles.pase_nombres}>{unir(nombres)}</span>
        </span>
        <span className={styles.pase_chip}>{personas} {personas === 1 ? "persona" : "personas"}</span>
      </div>
      <div className={styles.pase_boleto}>
        <QRCode value={qr} size={112} bordered={false} errorLevel="H" color="#2A2730" bgColor="#FFFFFF" style={{ padding: 0, flexShrink: 0 }} />
        {clave && (
          <span className={styles.pase_col}>
            <span className={styles.pase_etiqueta}>{folio ? "FOLIO" : "CÓDIGO"}</span>
            <span className={styles.pase_folio}>{clave}</span>
            <span className={styles.pase_nota}>Muéstralo en la entrada</span>
          </span>
        )}
      </div>
      {conWallet && (
        <button
          type="button"
          className={styles.pase_wallet}
          onClick={() => wallet.addToWallet(invitadoId)}
          aria-busy={wallet.addingToWallet}
          aria-label="Agregar a Apple Wallet"
        >
          <img src="/assets/tools/wallet_add.png" alt="" />
        </button>
      )}
      {/* La hoja de respaldo (navegador embebido) va sobre la hoja del pase. */}
      {wallet.passUrl && typeof document !== "undefined" && createPortal(
        <div className={styles.pase_wallet_ayuda}>
          <WalletHelpSheet wallet={wallet} primary={color ?? "#2A2730"} accent="#FFFFFF" font="Poppins" />
        </div>,
        document.body,
      )}
    </div>
  );
}
