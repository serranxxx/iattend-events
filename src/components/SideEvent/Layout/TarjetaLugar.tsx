"use client";

import React from "react";
import type { SideEvent } from "@/types/side_event";
import { simpleaddress } from "../../Invitation/Itinerary/OpenCard/OpenCard";
import { ClimaFila } from "../ClimaVidrio";
import styles from "./layout.module.css";
import base from "../side-event.module.css";

/*
  Tarjeta Lugar de un Pop (handoff "Pop Layout" 3a): mapa y clima en una
  sola tarjeta, bajo la etiqueta UBICACIÓN. Encabezado con el nombre del
  lugar y la dirección, el mapa y, si hay ciudad y el clima no está oculto,
  la fila del clima. Ocultar el clima en Capas solo apaga la fila.
*/

type Body = SideEvent["body"];

// Dirección completa: lo que necesita el mapa.
export const direccionCompleta = (body?: Body | null) => {
  const a = body?.address;
  return Boolean(a?.street && a.number && a.neighborhood && a.zipcode && a.city && a.state && a.country);
};

type Props = {
  body: Body;
  clima: React.ComponentProps<typeof ClimaFila> | null;
};

export default function TarjetaLugar({ body, clima }: Props) {
  const a = body.address;
  const direccion = [`${a.street ?? ""} ${a.number ?? ""}`.trim(), a.city].filter(Boolean).join(", ");
  const nombre = body.place_name || a.neighborhood || direccion;
  const enlace = a.url || `https://maps.google.com/?q=${encodeURIComponent([body.place_name, a.street, a.number, a.city, a.state].filter(Boolean).join(" "))}`;

  return (
    <div className={`${base.tarjeta} ${styles.lugar}`}>
      <div className={styles.lugar_cabecera}>
        <span className={styles.lugar_textos}>
          <span className={styles.lugar_nombre}>{nombre}</span>
          {nombre !== direccion && <span className={styles.lugar_direccion}>{direccion}</span>}
        </span>
        <a className={`${base.relieve} ${styles.lugar_abrir}`} href={enlace} target="_blank" rel="noopener noreferrer">
          Abrir
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
            <path d="M7 17L17 7M9 7h8v8" />
          </svg>
        </a>
      </div>
      <div className={styles.lugar_mapa}>
        <iframe
          title="Mapa"
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          src={simpleaddress(a.street, a.number, a.neighborhood, a.zipcode, a.city, a.state, a.country)}
        />
      </div>
      {clima && <ClimaFila {...clima} />}
    </div>
  );
}
