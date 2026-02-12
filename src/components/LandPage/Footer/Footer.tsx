"use client";

import React, { useEffect, useState } from "react";
import styles from "./footer.module.css";
import { Button } from "antd";
import { FaBars, FaHeadset, FaInstagram, FaRegEnvelope, FaRegPaperPlane, FaWhatsapp } from "react-icons/fa";
import { Generals, NewInvitation } from "@/types/new_invitation";
import { darker, lighter } from "@/helpers/functions";
import Link from "next/link";



type Props = {
  invitation?: NewInvitation;
  color?: string;
}

export const FooterLand = ({ invitation, color }: Props) => {


  const secondary = color ? color : (invitation?.generals.colors.secondary ?? "#CFBEE6")
  return (
    <div className={styles.main_cont} style={{
      background: (color || invitation )? `linear-gradient(to top, ${darker(secondary, 0.5)} 0%, ${darker(secondary,1)} 100%)` : 'linear-gradient(to bottom, #CFBEE680 0%, #CFBEE6 100%)',
    }}>
      <div className={styles.footer_cont}>
        <div className={styles.footer_main_col}>
          <Link href="/about">
            <div className={styles.footer_row}>
              <img className={styles.footer_logo} src="/assets/images/blanco.png" alt="" />
              <div className={styles.footer_col}>
                <span style={{ fontWeight: "500", fontSize: "18px", textTransform: "uppercase" }}>Guest management</span>
                <span style={{ fontWeight: "200", fontSize: "14px" }}>Plan with ease</span>
              </div>
            </div>
          </Link>

          <div className={styles.links_col}>
            <a href="https://wa.me/6145338500" rel="noreferrer" target="_blank" className={styles.footer_link}>
              <FaHeadset /> Ayuda
            </a>
            <a href="https://wa.me/6145338500" rel="noreferrer" target="_blank" className={styles.footer_link}>
              <FaWhatsapp /> Contacto
            </a>
            <a href="https://www.instagram.com/iattend.mx" rel="noreferrer" target="_blank" className={styles.footer_link}>
              <FaInstagram />
              @iattend.mx
            </a>
            <a href="mailto:contacto.iattend@gmail.com" rel="noreferrer" target="_blank" className={styles.footer_link}>
              <FaRegEnvelope /> Mail
            </a>
            <a href="/about/legal" className={styles.footer_link}>
              <FaRegPaperPlane /> Legal
            </a>
          </div>
        </div>

        <div className={styles.links}>
          <div className={styles.link_cont}>
            <span style={{ fontWeight: 900, marginBottom: '8px' }}><b>Servicios</b></span>
            <a href="/about/invitacion-digital">Invitación Paperless</a>
            <a href="/about/guest-management">Gestión de invitados</a>
            <a href="/about/mapa-de-mesas">Organización por mesas</a>
            <a href="/about/pases-digitales">Pases digitales</a>
            <a href="/about/privacidad">Eventos privados</a>
            <a href="/about/envios-whatsapp">Envíos automáticos</a>
          </div>

          <div className={styles.link_cont}>
            <span style={{ fontWeight: 900, marginBottom: '8px' }}><b>Extras</b></span>
            <a href="/about/cliente-ideal">I attend para ti</a>
            <a href="/about/como-funciona">Cómo usar I attend</a>
            <a href="/about/opiniones">Reviews</a>
            <a href="/about/faqs">FAQs</a>
          </div>
        </div>



      </div>
    </div>

  );
};
