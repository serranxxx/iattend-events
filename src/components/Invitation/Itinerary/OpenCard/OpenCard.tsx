import { ItineraryItem, NewInvitation } from "@/types/new_invitation";
import styles from "./open.module.css";
import { Button } from "antd";
import { buttonsColorText, darker, getMexicoHour } from "@/helpers/functions";
import Image from "next/image";
import { IoMdClose } from "react-icons/io";
import { IoCloseSharp } from "react-icons/io5";
import { BsFillPinAngleFill } from "react-icons/bs";
import { RiMapPin2Fill } from "react-icons/ri";
import { FaDiamondTurnRight } from "react-icons/fa6";
import { useEffect } from "react";
import WeatherWidget from "../WeatherApi/WeatherWidget";

type CardProps = {
  invitation: NewInvitation;
  dev: boolean;
  item: ItineraryItem;
  setActiveSteps?: React.Dispatch<React.SetStateAction<ItineraryItem[]>>;
  activeSteps?: ItineraryItem[];
};

export default function OpenCard({ invitation, dev, item, activeSteps, setActiveSteps }: CardProps) {
  const content = invitation.itinerary;
  const generals = invitation.generals;

  const primary = generals?.colors.primary ?? "#FFFFFF";
  const secondary = generals?.colors.secondary ?? "#FFFFFF";
  const accent = generals?.colors.accent ?? "#FFFFFF";
  const actions = generals.colors.actions ?? "#FFFFFF";

  const extractSpotifyPath = (url: string | undefined) => {
    if (!url) return "";

    try {
      const parsedUrl = new URL(url);
      // ejemplo: /album/2Ek1q2haOnxVqhvVKqMvJe
      const path = parsedUrl.pathname.substring(1); // quita el "/"
      return path; // "album/2Ek1q2haOnxVqhvVKqMvJe"
    } catch {
      return "";
    }
  };

  useEffect(() => {
    extractSpotifyPath(item.music);
  }, []);

  return (
    <div
      className={styles.open_card_container}
      style={{
        fontFamily: generals.fonts.body?.typeFace,
        color: content.inverted ? primary : accent,
        // position:'absolute',
        // width:'100%',
        // backgroundColor: primary,
        // zIndex:10,
        // padding:'16px',
        // borderRadius:'16px',
        // boxShadow:'0px 0px 12px rgba(0,0,0,0.5)'
      }}
    >
      {/* {
                generals.texture !== null &&
                <div className="image-texture-container">
                    <div className="image-texture-container">
                        {Array.from({ length: 100 }).map((_, index) => (
                            <img alt='' key={index} src={textures[generals.texture].image} className="texture-img"
                                style={{
                                    opacity: textures[generals.texture].opacity,
                                    filter: textures[generals.texture].filter,
                                    mixBlendMode: textures[generals.texture].blend
                                }}
                            />
                        ))}
                    </div>
                </div>
            } */}

      {/* <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          gap: "8px",
          position: "absolute",
          top: "0px",
          right: "0px",
          zIndex: 999
        }}
      >
        {item?.address?.url && (
          <div className={styles.how_to_button}>
            <Button
              href={item.address.url}
              target="_blank"
              rel="noopener noreferrer"
              icon={<FaDiamondTurnRight size={14} />}
              style={{
                margin: "16px 0",
                background: content.inverted ? primary : actions,
                color: content.inverted ? accent : buttonsColorText(actions),
                boxShadow: "0 0 6px 0 rgba(0, 0, 0, 0.25), 0 0 6px 0 rgba(134, 134, 134, 0.25) inset",
              }}
            >
              ¿Cómo llegar?
            </Button>
          </div>
        )}

        <Button
          onClick={() => setActiveSteps(activeSteps?.filter((step) => step !== item) ?? [])}
          className={styles.open_card_button}
          icon={<IoMdClose size={18} />}
          style={{
            background: content.background ? secondary : content.inverted ? primary : secondary ?? "#FFF",
            color: content.inverted ? accent : buttonsColorText(primary),
          }}
        />
      </div> */}

      {item.image && (
        <div className={styles.image_header_container}>
          <Image alt="" fill src={item.image!} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
        </div>
      )}

      <div className={styles.open_card_info}>
        <span className={styles.open_sub}> {item.time} </span>
        <span className={styles.open_text}> {item.subtext} </span>
        {item.address && (
          <span className={styles.open_card_address} style={{ color: content.inverted ? `${primary}80` : `${accent}80` }}>
            {`${item.address.street ?? ""} ${item.address.number ?? ""} ${item.address.neighborhood ?? ""} ${item.address.zip ?? ""} ${item.address.city ?? ""} ${item.address.state ?? ""} ${item.address.country ?? ""}`}
          </span>
        )}
      </div>

      {item.moments && item.moments.length > 0 && (
        <div className={styles.custom_card_subitems} style={{ borderColor: accent }}>
          {item.moments.map((subitem) => (
            <div key={subitem.name} className={styles.custom_card_subitem} style={{ lineHeight: "1.3" }}>
              <div className={styles.custom_card_subitem_bullet} style={{ backgroundColor: accent }} />
              <span className={styles.custom_card_subitem_title}>{subitem.name}</span>
              <span className={styles.custom_card_subitem_time}>{subitem.time}</span>
              <span className={styles.custom_card_subitem_description} style={{ color: content.inverted ? `${primary}80` : `${accent}80` }}>
                {subitem.description}
              </span>
            </div>
          ))}
        </div>
      )}

      {item.address && (
        <>
          <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "flex-start", gap: "12px" }}>
            {
              item.address.city &&(
                <>
                  {<WeatherWidget invitation={invitation} dev={dev} item={item} />}

                  <div className={styles.mapa_container} style={{ backgroundColor: secondary }}>
                    <iframe
                      title="Mapa"
                      width="100%"
                      height="100%"
                      style={{ borderColor: content.inverted ? primary : secondary }}
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                      src={simpleaddress(
                        item.address.street,
                        item.address.number,
                        item.address.neighborhood,
                        item.address.zip,
                        item.address.city,
                        item.address.state,
                        item.address.country
                      )}
                    />
                  </div>
                </>
              )}
          </div>
        </>
      )}

      {/* {item.music && (
                <iframe
                    style={{ borderRadius: "12px", boxShadow: '0 0 6px 0 rgba(0, 0, 0, 0.25), 0 0 6px 0 rgba(134, 134, 134, 0.25) inset' }}
                    src={`https://open.spotify.com/embed/${extractSpotifyPath(item.music)}?utm_source=generator&theme=2`}
                    width="100%"
                    height="152"
                    frameBorder="0"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                />
            )} */}
    </div>
  );
}

export function simpleaddress(direccion: string | null, numero: string | null, colonia: string | null, codigoPostal: string | null, ciudad: string | null, estado: string | null, pais: string | null) {
  const direccionCompleta = `${direccion} ${numero}, ${colonia}, ${codigoPostal}, ${ciudad}, ${estado}, ${pais}`;
  const direccionCodificada = encodeURIComponent(direccionCompleta);
  const key = "AIzaSyBZ8NLpvAl4DiTeE2gYekBqhmSZFx43R0M";
  const urlMapaGenerado = `https://www.google.com/maps/embed/v1/place?key=${key}&q=${direccionCodificada}`;

  console.log(urlMapaGenerado);
  return urlMapaGenerado;
}
