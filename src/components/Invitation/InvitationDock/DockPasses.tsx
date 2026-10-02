"use client";

import { DockCopy, InvitationUIBundle, NewInvitation } from "@/types/new_invitation";
import { GuestSubabasePayload } from "@/types/guests";
import { Ticket } from "../Ticket/Ticket";
import { fmt } from "./copy";
import styles from "./invitation-dock.module.css";

type DockPassesProps = {
  t: DockCopy;
  ui: InvitationUIBundle;
  invitation: NewInvitation;
  invitationID?: string;
  guests: GuestSubabasePayload[];
  colors: { primary: string; secondary: string; accent: string };
};

// Carrusel de pases. Cada pase trae su propio botón de Apple Wallet (dentro
// de la tarjeta), para que quede claro qué pase se está agregando.
export function DockPasses({ t, ui, invitation, invitationID, guests, colors }: DockPassesProps) {
  return (
    <div className={styles.passes_panel}>
      <div className={`${styles.carousel} ${guests.length === 1 ? styles.carousel_single : ""}`}>
        {guests.map((guest, i) => (
          <Ticket
            key={guest.id ?? i}
            id={invitationID}
            guest={guest}
            invitation={invitation}
            ui={ui}
            colors={colors}
            onClose={() => {}}
            variant="dock"
            passLabel={fmt(t.passLabel, { i: i + 1, n: guests.length })}
          />
        ))}
      </div>

      <div className={styles.passes_footer}>
        <span className={styles.passes_hint}>{t.passHint}</span>
      </div>
    </div>
  );
}
