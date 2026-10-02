"use client";

import { Button } from "antd";
import { Check, Compass, Copy, ExternalLink, Wallet, X } from "lucide-react";
import { darker } from "@/helpers/functions";
import { browserDiagnostics, WalletPass } from "./useWalletPass";
import styles from "./ticket.module.css";

type WalletHelpSheetProps = {
  wallet: WalletPass;
  primary: string;
  accent: string;
  font: string;
};

// Hoja de respaldo cuando el salto a Safari no ocurrió (navegador embebido).
export function WalletHelpSheet({ wallet, primary, accent, font }: WalletHelpSheetProps) {
  if (!wallet.passUrl) return null;

  return (
    <div
      className={styles.wallet_help}
      style={{ backgroundColor: `${darker(primary, 0.5) ?? primary}D9` }}
      onClick={(e) => { e.stopPropagation(); wallet.closeHelp(); }}
    >
      <div
        className={`scroll-cont ${styles.wallet_help_card}`}
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
          onClick={wallet.closeHelp}
        />

        <Compass size={28} className={styles.wallet_help_icon} />

        <span className={`s1 ${styles.wallet_help_title}`}>
          Agregar a Apple Wallet
        </span>

        <Button
          block
          size="large"
          type="primary"
          loading={wallet.addingToWallet}
          icon={<Wallet size={14} />}
          onClick={wallet.downloadPass}
        >
          Agregar el pase
        </Button>

        <span className={`c1 ${styles.wallet_help_hint}`}>
          Si en lugar del pase aparece texto raro, la app abrió la liga en
          su propio navegador. Apple Wallet solo acepta pases desde Safari:
          toca el botón <b>···</b> de arriba a la derecha y elige
          {" "}<b>Abrir en Safari</b>, o intenta con esto:
        </span>

        <Button
          block
          size="large"
          icon={<ExternalLink size={14} />}
          onClick={wallet.openPassInSafari}
        >
          Abrir en Safari
        </Button>

        <Button
          block
          size="small"
          type="text"
          icon={wallet.copied ? <Check size={14} /> : <Copy size={14} />}
          onClick={wallet.copyPassUrl}
        >
          {wallet.copied ? "Liga copiada" : "Copiar liga del pase"}
        </Button>

        {/* TEMPORAL: identificar el navegador de WhatsApp. Borrar después. */}
        <span className={`c3 ${styles.wallet_help_diag}`}>
          {browserDiagnostics()}
        </span>
      </div>
    </div>
  );
}
