"use client";

import React from "react";
import styles from "./footer.module.css";
import { FaInstagram } from "react-icons/fa";
import { Clock } from "lucide-react";
import Link from "next/link";
import { NewInvitation } from "@/types/new_invitation";
import { darker } from "@/helpers/functions";

type Props = {
  invitation?: NewInvitation;
};

export const FooterLand = ({ invitation }: Props) => {
  const primary  = invitation?.generals.colors.primary  ?? "#0c171b";
  const accent   = invitation?.generals.colors.accent   ?? "#EEE9DE";
  const actions  = invitation?.generals.colors.actions  ?? "#AAC186";

  const darkPrimary = darker(primary, 0.98) ?? "#071013";

  const bg = `repeating-linear-gradient(
    90deg,
    ${primary} 0px,
    ${primary} 20px,
    ${darkPrimary} 20px,
    ${darkPrimary} 50px
  )`;

  return (
    <div className={styles.main_cont} style={{ background: bg, borderTopColor: `${primary}` , marginBottom:'82px'}}>

      <div className={styles.cta_section}>
        <p className={styles.created_with} style={{ color: accent }}>
          Esta invitación fue creada con
        </p>
        <div className={styles.logo} style={{ backgroundColor: accent }} />

        <h2 className={styles.cta_heading} style={{ color: accent }}>
          ¿Tú también estás organizando algo?
        </h2>

        <Link
          style={{ marginTop: '12px', background: accent, color: primary,  }}
          href="https://iattend.mx"
          className={styles.cta_button}
        >
          Crea la tuya →
        </Link>

        <span className={styles.cta_subtext} style={{ color: accent }}>
          <Clock size={14} />
          Lista en minutos · sin tarjeta para empezar
        </span>
      </div>

      <div className={styles.bottom_bar} style={{ borderTopColor: `${accent}20`, color: accent }}>
        <a
          href="https://www.instagram.com/iattend.mx"
          target="_blank"
          rel="noreferrer"
          className={styles.bottom_link}
          style={{ color: accent }}
        >
          <FaInstagram size={14} /> @iattend.mx
        </a>
        <span className={styles.dot} style={{ color: accent }}>·</span>
        <a
          href="https://wa.me/6145338500"
          target="_blank"
          rel="noreferrer"
          className={styles.bottom_link}
          style={{ color: accent }}
        >
          Contacto
        </a>
        <span className={styles.dot} style={{ color: accent }}>·</span>
        <Link href="/about/legal" className={styles.bottom_link} style={{ color: accent }}>
          Legal
        </Link>
      </div>

    </div>
  );
};
