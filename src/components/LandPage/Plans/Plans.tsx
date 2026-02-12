"use client";

import React, { useState } from "react";
import styles from "./plans.module.css";
import {
  LuArmchair,
  LuArrowRight,
  LuClipboardList,
  LuLockKeyhole,
  LuLockOpen,
  LuMessageSquareQuote,
  LuPalette,
  LuPencilRuler,
  LuSend,
  LuSmartphone,
  LuStar,
  LuTicket,
} from "react-icons/lu";
import { FaStar } from "react-icons/fa";

const cards = [
  {
    user: "Alberto",
    review:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
  },
  {
    user: "Alberto",
    review:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
  },
  {
    user: "Alberto",
    review:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
  },
];

const plan_paperless = [
  {
    text: "Invitación Paperless",
    icon: LuSmartphone,
  },
  {
    text: "Diseño libre",
    icon: LuPalette,
  },
  {
    text: "Ediciones ilimitadas",
    icon: LuPencilRuler,
  },
  {
    text: "Evento público",
    icon: LuLockOpen,
  },
  {
    text: "Confirmación manual",
    icon: LuMessageSquareQuote,
  },
];

const plan_pro = [
  {
    text: "Invitación Paperless",
    icon: LuSmartphone,
  },
  {
    text: "Diseño libre",
    icon: LuPalette,
  },
  {
    text: "Ediciones ilimitadas",
    icon: LuPencilRuler,
  },
  {
    text: "Evento público o privado",
    icon: LuLockKeyhole,
  },
  {
    text: "Lista de asistencia",
    icon: LuClipboardList,
  },
  {
    text: "Mapa de mesas",
    icon: LuArmchair,
  },
  {
    text: "Envíos automáticos",
    icon: LuSend,
  },
  {
    text: "Pases digitales",
    icon: LuTicket,
  },
];

const plan_lite = [
  {
    text: "Invitación Paperless",
    icon: LuSmartphone,
  },
  {
    text: "Diseño libre",
    icon: LuPalette,
  },
  {
    text: "Ediciones ilimitadas",
    icon: LuPencilRuler,
  },
  {
    text: "Evento público o privado",
    icon: LuLockKeyhole,
  },
  {
    text: "Lista de asistencia",
    icon: LuClipboardList,
  },
  {
    text: "Mapa de mesas",
    icon: LuArmchair,
  },
];

export const Plans = () => {
  const [active, setActive] = useState(1);
  return (
    <div className={styles.main_cont}>
      <div className={styles.key_cont}>
        <span className={styles.key_title}>Elige como comenzar</span>

        <div className={styles.plans_cont}>
          <div
            onClick={() => setActive(0)}
            className={styles.plan_card}
            style={{
              zIndex: active === 0 ? 3 : undefined,
              transform: active === 0 ? "scale(1.04)" : "rotate(-4deg)",
              position: active === 0 ? "absolute" : "static",
              minWidth: active === 0 ? "240px" : "auto",

              backgroundColor: "#FFF",
            }}
          >
            <img className={styles.plan_image} src="/assets/images/PAPERLESS.svg" alt="" />
            <span
              style={{
                maxWidth: "180px",
                textAlign: "center",
                lineHeight: "1.2",
                fontWeight: 400,
                opacity: "0.5",
                fontSize: "12px",
                marginTop: "12px",
              }}
            >
              La invitación digital esencial, simple y sin límites.
            </span>
            <div className={styles.price_cont}>
              {/* <span style={{
                                textDecoration: 'line-through',
                                fontSize: '20px', fontWeight: '500', opacity: '0.5'
                            }}>$1200</span> */}
              <span>$849</span>
            </div>
            <div style={{ fontSize: active === 0 ? "12px" : "10px" }} className={styles.plan_info_cont}>
              {plan_paperless.map((i, index) => (
                <div key={index} className={styles.plan_item}>
                  <i.icon />
                  <span>{i.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            onClick={() => setActive(1)}
            className={styles.plan_card}
            style={{
              zIndex: active === 1 ? 3 : undefined,
              transform: active === 1 ? "scale(1.04)" : active === 2 ? "rotate(4deg)" : "rotate(-4deg)",
              position: active === 1 ? "absolute" : "static",
              backgroundColor: "#414251",
              color: "#FFF",
              minWidth: active === 1 ? "240px" : "auto",
            }}
          >
            <div className={styles.card_relative_cont}>
              <img className={styles.plan_image} src="/assets/images/PRO.svg" alt="" />
              <span
                style={{
                  maxWidth: "180px",
                  textAlign: "center",
                  lineHeight: "1.2",
                  fontWeight: 400,
                  opacity: "0.5",
                  fontSize: "12px",
                  marginTop: "12px",
                }}
              >
                La experiencia completa: invita, gestiona y automatiza.
              </span>

              <div className={styles.price_cont} style={{ color: "#FDFCFD" }}>
                {/* <span style={{
                                textDecoration: 'line-through',
                                fontSize: '20px', fontWeight: '500', opacity: '0.5'
                            }}>$3,999</span> */}
                <span>$3,499</span>
              </div>
              <div style={{ fontSize: active === 1 ? "12px" : "10px" }} className={styles.plan_info_cont}>
                {plan_pro.map((i, index) => (
                  <div key={index} className={styles.plan_item} style={{ borderColor: "#20212B40" }}>
                    <i.icon style={{ color: "#E0DAF4" }} />
                    <span>{i.text}</span>
                  </div>
                ))}
              </div>
              <div className={styles.tag}>
                <FaStar size={16} />
                <span style={{ minWidth: "auto" }}>Más popular</span>
              </div>
            </div>
          </div>

          <div
            onClick={() => setActive(2)}
            className={styles.plan_card}
            style={{
              zIndex: active === 2 ? 3 : undefined,
              transform: active === 2 ? "scale(1.04)" : "rotate(4deg)",
              position: active === 2 ? "absolute" : "static",
              minWidth: active === 2 ? "240px" : "auto",
              backgroundColor: "#E0DAF4",
            }}
          >
            <div className={styles.card_relative_cont} style={{ border: "none" }}>
              <img className={styles.plan_image} src="/assets/images/LITE.svg" alt="" />
              <span
                style={{
                  maxWidth: "180px",
                  textAlign: "center",
                  lineHeight: "1.2",
                  fontWeight: 400,
                  opacity: "0.5",
                  fontSize: "12px",
                  marginTop: "12px",
                }}
              >
                Invitación digital con control de invitados.
              </span>
              <div className={styles.price_cont} style={{ color: "#706787" }}>
                <div className={styles.single_row} style={{ marginTop: "-12px" }}>
                  <span
                    style={{
                      textDecoration: "line-through",
                      fontSize: "20px",
                      fontWeight: "500",
                      opacity: "0.5",
                    }}
                  >
                    $3,125
                  </span>

                  <div className={styles.price_tag}>20% OFF</div>
                </div>
                <span>$2,499</span>
              </div>
              <div style={{ fontSize: active === 2 ? "12px" : "10px" }} className={styles.plan_info_cont}>
                {plan_lite.map((i, index) => (
                  <div key={index} className={styles.plan_item} style={{ borderColor: "#BDB4D040", color: "#706787" }}>
                    <i.icon />
                    <span>{i.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
