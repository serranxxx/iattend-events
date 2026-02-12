"use client";

import React from "react";
import styles from "./hero.module.css";
import { Button } from "antd";
import { FaBars, FaPaperPlane } from "react-icons/fa";
import Image from "next/image";
import AnimatedPath from "@/components/Motion/AnimatedPath";
import { LuArrowUpRight } from "react-icons/lu";
import Link from "next/link";

export const HeroSection = () => {
  const message = encodeURIComponent("¡Hola! Me interesan los servicios de I attend");

  return (
    <div
      className={styles.hero_cont}
    //   style={{
    //     backgroundImage: `url(https://picsum.photos/1200/800)`,
    //   }}
    >
      <Image
        src="https://jblcqcxckefmydvtrxbi.supabase.co/storage/v1/object/public/land_page/hero_2.jpg"
        alt=""
        fill
        style={{ objectFit: "cover", position: "absolute", zIndex: "-1", left: 0, }}
      />
      <div className={styles.shadow}></div>
      {/* <div className={styles.hero_first_row}>
        <img className={styles.hero_logo} src="/assets/images/blanco.png" alt="i attend" />
      </div> */}

      <div className={styles.hero_info_box}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "flex-start", flexDirection: "column", gap: "8px" }}>
          <span className={styles.hero_h1}>Organiza a tus invitados sin estrés</span>
          <span className={styles.hero_h2}>I attend te acompaña durante todo el proceso</span>
          {/* <div className={styles.action_wrap}>
            <Link href={`https://wa.me/6145338500?text=${message}`}
              rel="noreferrer"
              target="_blank">
              <Button
                icon={<LuArrowUpRight size={16} />}
                className={styles.action_button}
              >
                PLATICA CON NOSOTROS
              </Button>
            </Link>
          </div> */}

          {/* <div className={styles.hero_first_row}>
            <img className={styles.hero_logo} src="/assets/images/blanco.png" alt="i attend" />
          </div> */}
        </div>

        <div className={styles.action_wrap}>
          <Link href={`https://wa.me/6145338500?text=${message}`} rel="noreferrer" target="_blank">
            <Button icon={<LuArrowUpRight size={16} />} className={styles.action_button}>
              PLATICA CON NOSOTROS
            </Button>
          </Link>
        </div>



        {/* <Button icon={<FaPaperPlane />} className={styles.hero_cta}>
          QUIERO MÁS INFORMACIÓN
        </Button> */}
      </div>

      <div className={styles.animated}>
        <AnimatedPath color={"#ffffff"} opacityStart={0.9} opacityEnd={0.8} duration={1.5} />
      </div>
    </div>
  );
};
