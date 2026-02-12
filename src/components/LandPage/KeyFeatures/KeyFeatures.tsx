"use client";

import React, { useState } from "react";
import styles from "./key.module.css";
import { Button, Drawer } from "antd";
import Image from "next/image";
import { LuArrowUpRight } from "react-icons/lu";
import Link from "next/link";

type Feature = {
  label: React.ReactNode | null;
  seed: string | null;
  image: string;
};

export type KeyFeature = {
  key: string;
  title: string;
  value: string;
  image: string | null;
  path: string;
  type: "video" | "image";
};

export const KEY_FEATURES: KeyFeature[] = [
  {
    key: "paperless",
    title: "Invitación Paperless",
    value:
      "Invitaciones digitales paperless para bodas y eventos: elegantes, personalizables y fáciles de usar. Comparte toda tu información en un solo enlace, actualizable, visual y accesible desde cualquier dispositivo.",
    image: "https://jblcqcxckefmydvtrxbi.supabase.co/storage/v1/object/public/land_page/C0014.mp4",
    path: "invitacion-digital",
    type: "video",
  },
  {
    key: "invitados",
    title: "Gestión de invitados",
    value:
      "Guest Management de I attend: controla invitados en un solo lugar. Envía invitaciones por WhatsApp, gestiona accesos, confirma asistencias en tiempo real y mantén tu evento organizado, claro y sin estrés.",
    image: "https://jblcqcxckefmydvtrxbi.supabase.co/storage/v1/object/public/land_page/guest-management%20(1).jpg",
    path: "guest-management",
    type: "image",
  },
  {
    key: "privacidad",
    title: "Evento privado",
    value:
      "Privacidad total en tus invitaciones digitales: elige eventos públicos o privados, controla accesos, personaliza cada invitado y cambia la modalidad cuando quieras, con seguridad, flexibilidad y control absoluto.",
    image: "https://jblcqcxckefmydvtrxbi.supabase.co/storage/v1/object/public/land_page/C0003%20(1).mp4",
    path: "privacidad",
    type: "video",
  },
  {
    key: "pases",
    title: "Pases digitales",
    value:
      "Pases digitales personalizados para bodas y eventos: acceso seguro desde el celular, generación automática al confirmar asistencia, mesas asignadas y control claro de invitados, sin boletos físicos y con una experiencia moderna.",
    image: "https://jblcqcxckefmydvtrxbi.supabase.co/storage/v1/object/public/land_page/C0007%202.mp4",
    path: "pases-digitales",
    type: "video",
  },
  {
    key: "whatsapp",
    title: "Envíos automáticos",
    value:
      "Envía invitaciones por WhatsApp de forma automática y segura con I attend. Usa el API oficial, evita bloqueos, controla envíos con créditos y comunica tu evento de manera profesional y confiable.",
    image: "https://jblcqcxckefmydvtrxbi.supabase.co/storage/v1/object/public/land_page/C0018.mp4",
    path: "envios-whatsapp",
    type: "video",
  },
  {
    key: "mesas",
    title: "Acomodo por mesas",
    value:
      "Organiza a tus invitados sin estrés con el seating chart digital de I attend: mapa de mesas interactivo, asignación visual, edición flexible y control total para bodas y eventos de cualquier tamaño.",
    image: "https://jblcqcxckefmydvtrxbi.supabase.co/storage/v1/object/public/land_page/mesas.png",
    path: "mapa-de-mesas",
    type: "image",
  },
];

const FEATURES: Feature[] = [
  {
    label: (
      <>
        Invitación <b>Paperless</b>
      </>
    ),
    seed: "paperless",
    image: "https://jblcqcxckefmydvtrxbi.supabase.co/storage/v1/object/public/land_page/key-1.jpg",
  },
  {
    label: (
      <>
        Gestión de <b>invitados</b>
      </>
    ),
    seed: "invitados",
    image: "https://jblcqcxckefmydvtrxbi.supabase.co/storage/v1/object/public/land_page/key-2.jpg",
  },
  {
    label: (
      <>
        {" "}
        Evento <b>Privado</b>
      </>
    ),
    seed: "privacidad",
    image: "https://jblcqcxckefmydvtrxbi.supabase.co/storage/v1/object/public/land_page/key-3.jpg",
  },
  {
    label: (
      <>
        <b>Pases</b> digitales
      </>
    ),
    seed: "pases",
    image: "https://jblcqcxckefmydvtrxbi.supabase.co/storage/v1/object/public/land_page/key-4.jpg",
  },
  {
    label: (
      <>
        Acomodo por <b>mesas</b>
      </>
    ),
    seed: "mesas",
    image: "https://jblcqcxckefmydvtrxbi.supabase.co/storage/v1/object/public/land_page/key-5.jpg",
  },
  {
    label: (
      <>
        Envíos <b>automáticos</b>
      </>
    ),
    seed: "whatsapp",
    image: "https://jblcqcxckefmydvtrxbi.supabase.co/storage/v1/object/public/land_page/key-6.jpg",
  },
];

export const KeyFeatures = () => {
  const [open, setOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);

  return (
    <div className={styles.main_cont}>
      <section className={styles.key_cont}>
        <span className={styles.key_title}>Todo fluye cuando tienes el control</span>
        <div className={styles.key_main_cont}>
          {FEATURES.map((feature, colIndex) => (
            <div key={colIndex} className={styles.key_item}>
              <img src={`${feature.image}`} alt=""  style={{ position: "absolute", objectFit: "cover", width:'100%', height:'100%', left:0, top:0 }} />
              <div className={styles.shadow}></div>
              <span className={styles.key_label}>{feature.label}</span>
              <div style={{ position: "absolute", top: "8px", right: "8px" }}>
                <div className={styles.key_wrap}>
                  <Button
                    icon={<LuArrowUpRight />}
                    onClick={() => {
                      setOpen(true);
                      setCurrentItem(feature.seed);
                    }}
                    className={styles.key_button}
                    //
                  ></Button>
                </div>
              </div>
            </div>
            // <div key={colIndex} className={styles.key_col}>
            //   {column.map((feature, index) =>
            //     feature && feature.seed ? (

            //     ) : (
            //       <div key={index} className={styles.key_space} />
            //     )
            //   )}
            // </div>
          ))}
          <img className={styles.loop_img} src="/assets/images/espiral.svg" alt="" />
        </div>
        {/* <div className={styles.key_grid}>
          {FEAT.map((feature, index) => (
            <div key={index} className={styles.grid_card}>
              <div className={styles.single_row}>
                <feature.icon size={18} style={{ color: "#CFBEE6" }} />
                <span style={{ fontWeight: 600 }}>{feature.label}</span>
              </div>

              <span style={{ fontWeight: 400, lineHeight: "1.4" }}>{feature.desc}</span>
              <Button
                icon={<FaAngleRight />}
                onClick={() => {
                  setOpen(true);
                  setCurrentItem(feature.seed);
                }}
                className={styles.key_button}
                style={{ position: "absolute", top: "0px", right: "16px" }}
              ></Button>
            </div>
          ))}
        </div> */}
      </section>

      <Drawer
        placement="left"
        open={open}
        onClose={() => setOpen(false)}
        height="auto"
        closeIcon={false}
        style={{
          borderRadius: "0px 12px 12px 0",
          backgroundImage: `linear-gradient(to bottom, #FFF 40%, #CFBEE660)`,
          maxWidth: "90%",
        }}
        styles={{
          header: {
            display: "none",
            // backgroundColor: content.inverted ? secondary : primary,
          },
          body: {
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "flex-start",
            flexDirection: "column",
            gap: "12px",
            color: "#FFF",
            padding: "8px",
          },
        }}
      >
        <div className={styles.image_cont}>
          {KEY_FEATURES.find((k) => k.key === currentItem)?.type === "video" ? (
            <video
              // ref={videoRef}
              src={KEY_FEATURES.find((k) => k.key === currentItem)?.image!}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              controls={false}
              style={{
                width: "100%",
                borderRadius: 0,
                position: "absolute",
                border: "none",
                objectFit: "cover",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
              }}
            />
          ) : (
            <Image
              src={KEY_FEATURES.find((k) => k.key === currentItem)?.image!}
              fill
              alt=""
              style={{
                position: "absolute",
                objectFit: "cover",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
              }}
            />
          )}

          {/* <Image
            src={KEY_FEATURES.find((k) => k.key === currentItem)?.image!}
            fill
            alt=""
            style={{
              position: "absolute", objectFit: "cover",
              left: '50%', top: '50%', transform: 'translate(-50%, -50%)'
            }}
          /> */}
        </div>

        <span className={styles.drawer_title}>{KEY_FEATURES.find((k) => k.key === currentItem)?.title}</span>
        <span className={styles.drawer_value}>{KEY_FEATURES.find((k) => k.key === currentItem)?.value}</span>
        <div style={{ marginTop: "16px" }} className={styles.action_wrap}>
          <Button icon={<LuArrowUpRight size={16} />} className={styles.action_button}>
            <Link href={`/about/${KEY_FEATURES.find((k) => k.key === currentItem)?.path ?? "privacidad"}`}>Más información</Link>
          </Button>
        </div>

        {/* <a className={styles.drawer_a} href={`about/features/${KEY_FEATURES.find((k) => k.key === currentItem)?.path ?? 'privacidad'}`}>Ver más</a> */}
      </Drawer>

      <section className={styles.seo_content}>
        {KEY_FEATURES.map((f) => (
          <article key={f.key}>
            <h2>{f.title}</h2>
            <p>{f.value}</p>
          </article>
        ))}
      </section>
    </div>
  );
};
