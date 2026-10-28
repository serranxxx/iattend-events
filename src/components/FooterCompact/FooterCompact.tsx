import React from "react";
import Link from "next/link";
import { File } from "lucide-react";
import { Camera as FaInstagram, MessageCircle as FaWhatsapp } from 'lucide-react';
import styles from "./footer-compact.module.css";

// Footer delgado para side events y pop events (variante 2c).
// Todo es blanco con alpha para verse bien sobre cualquier color de evento;
// el fondo de los botones toma --blur-color--dark del contenedor padre.
// `color` (opcional): pinta el footer con un color en vez de blanco, para
// usarlo sobre fondos claros (la invitación principal usa el color de texto
// de su tema). Sin él se ve como siempre en side events y pop events.
export const FooterCompact = ({ color }: { color?: string }) => {
  const tone = color
    ? ({
        "--fc-color": color,
        "--fc-line": `${color}25`,
        "--fc-border": `${color}30`,
        "--fc-btn": `${color}10`,
        "--fc-btn-hover": `${color}20`,
      } as React.CSSProperties)
    : undefined;
  return (
    <footer className={styles.footer_compact} style={tone}>
      <a href="https://iattend.mx" target="_blank" rel="noreferrer" className={styles.signature}>
        <span className={styles.signature_label}>HECHO CON</span>
        <div className={styles.logo} aria-label="I attend" />
      </a>

      <div className={styles.actions}>
        <a
          href="https://www.instagram.com/iattend.mx"
          target="_blank"
          rel="noreferrer"
          className={styles.action_button}
          aria-label="Instagram"
          title="Instagram"
        >
          <FaInstagram size={18} />
        </a>
        <a
          href="https://wa.me/6145338500"
          target="_blank"
          rel="noreferrer"
          className={styles.action_button}
          aria-label="WhatsApp"
          title="WhatsApp"
        >
          <FaWhatsapp size={18} />
        </a>
        <Link href="/about/legal" className={styles.action_button} aria-label="Legal" title="Legal">
          <File size={18} strokeWidth={2} />
        </Link>
      </div>
    </footer>
  );
};
