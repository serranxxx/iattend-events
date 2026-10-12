import React from "react";
import Link from "next/link";
import { File } from "lucide-react";
import { FaInstagram, FaWhatsapp } from "react-icons/fa";
import styles from "./footer-compact.module.css";

// Footer delgado para side events y pop events (variante 2c).
// Todo es blanco con alpha para verse bien sobre cualquier color de evento;
// el fondo de los botones toma --blur-color--dark del contenedor padre.
export const FooterCompact = () => {
  return (
    <footer className={styles.footer_compact}>
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
