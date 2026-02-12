"use client";

import React, { useState } from "react";
import styles from "./cta.module.css";
import { Button } from "antd";
import { FaBars, FaPaperPlane } from "react-icons/fa";
import { LuArrowUpRight } from "react-icons/lu";

export const CTA = () => {
  const [activeCard, setActiveCard] = useState<number | null>(null);

  const questions = [1, 1, 1, 1, 1, 1];

  return (
    <div className={styles.key_cont}>

      <span className={styles.key_title}>Todo tu evento, bajo control</span>
      <span className={styles.cta_text}>
        Crea tu evento, gestiona invitados y controla la asistencia desde un solo lugar. Sin complicaciones, sin herramientas extra.
      </span>

      <div className={styles.action_wrap}>
        <Button
          icon={<LuArrowUpRight size={16} />}
          className={styles.action_button}
        >
          PLATICA CON NOSOTROS
        </Button>
      </div>
      {/* <Button icon={<FaPaperPlane />} className={styles.cta_button}>
        QUIERO MÁS INFORMACIÓN
      </Button> */}
    </div>
  );
};
