"use client";

import React from "react";
import styles from "./footer.module.css";
import { FaInstagram } from "react-icons/fa";
import Link from "next/link";
import { NewInvitation } from "@/types/new_invitation";
import { File, Phone } from "lucide-react";
// import { darker } from "@/helpers/functions";

type Props = {
  invitation?: NewInvitation;
};

export const FooterLand = ({ invitation }: Props) => {
  const primary = invitation?.generals.colors.primary ?? "#0c171b";
  const accent = invitation?.generals.colors.accent ?? "#EEE9DE";

  // const darkPrimary = darker(primary, 0.98) ?? "#071013";

  // const bg = `repeating-linear-gradient(
  //   90deg,
  //   ${primary} 0px,
  //   ${primary} 20px,
  //   ${darkPrimary} 20px,
  //   ${darkPrimary} 50px
  // )`;

  return (
    <div className={styles.main_cont} style={{ background: 'transparent', borderTopColor: `${primary}20` }}>

      <div className={styles.cta_section}>

        <a href="https://iattend.mx" target="_blank" rel="noreferrer">
          <div className={styles.logo} style={{ backgroundColor: accent }} />
        </a>

      </div>

      <div className={styles.bottom_bar} style={{ borderTopColor: `${accent}20`, color: accent }}>
        <a
          href="https://www.instagram.com/iattend.mx"
          target="_blank"
          rel="noreferrer"
          className={styles.bottom_link}
          style={{ color: accent }}
        >
          <FaInstagram size={14} />iattend.mx
        </a>
        <span className={styles.dot} style={{ color: accent }}>·</span>
        <a
          href="https://wa.me/6145338500"
          target="_blank"
          rel="noreferrer"
          className={styles.bottom_link}
          style={{ color: accent }}
        >
          <Phone size={14} />
          Contacto
        </a>
        <span className={styles.dot} style={{ color: accent }}>·</span>
        <Link href="/about/legal" className={styles.bottom_link} style={{ color: accent }}>
          <File size={14} />
          Legal
        </Link>
      </div>

    </div>
  );
};
