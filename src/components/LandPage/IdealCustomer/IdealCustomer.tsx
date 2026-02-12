"use client";

import React, { useState } from "react";
import styles from "./customer.module.css";
import { Button } from "antd";
import { FaBars, FaHeart, FaPlus } from "react-icons/fa";
import { BsPersonHearts } from "react-icons/bs";
import { LuNotebook } from "react-icons/lu";
import { FaCalendarDays, FaCircleNodes } from "react-icons/fa6";

export type AudienceItem = {
  id: number;
  icon: React.ReactNode;
  title: string;
  description: string;
};

export const AUDIENCE_ITEMS: AudienceItem[] = [
  {
    icon: <FaHeart />,
    id: 0,
    title: "Parejas",
    description:
      "Tengan el control total de su boda desde el primer invitado hasta el gran día. Organicen su evento sin estrés innecesario, gestionen invitados, confirmaciones y acomodos con claridad, y disfruten cada etapa del proceso con tranquilidad y confianza.",
  },
  {
    icon: <FaCalendarDays />,
    id: 1,
    title: "Event Planners",
    description:
      "Gestionen múltiples eventos de forma clara, ordenada y profesional desde un solo lugar. i attend les permite tener mayor control sobre invitados, accesos y confirmaciones, brindando una mejor experiencia tanto para ustedes como para sus clientes.",
  },
  {
    icon: <FaCircleNodes />,
    id: 2,
    title: "Hosts",
    description:
      "Ideal para quienes cuidan cada detalle de su evento. Desde la organización de invitados hasta el control de asistencia, i attend facilita una gestión clara y estructurada para que todo fluya sin contratiempos desde el primer invitado.",
  },
];

export const IdealCustomer = () => {
  const [activeCard, setActiveCard] = useState<number>(0);

  return (
    <div className={styles.main_cont}>
      <div className={styles.key_cont}>
        <span className={styles.key_title}>Para quienes organizan eventos</span>

        <div className={styles.ideal_cont}>
          {AUDIENCE_ITEMS.map((item, index) => (
            <div
              key={index}
              onClick={() => setActiveCard(item.id)}
              style={{
                height: activeCard === item.id ? "auto" : undefined,
              }}
              className={styles.ideal_card}
            >
              <div className={styles.card_row}>
                {item.icon}
                <span>{item.title}</span>
              </div>
              <span className={styles.card_desc}>{item.description}</span>
            </div>
          ))}
        </div>
      </div>
    </div>

  );
};
