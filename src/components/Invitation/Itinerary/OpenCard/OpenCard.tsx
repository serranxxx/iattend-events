import { ItineraryItem, NewInvitation } from "@/types/new_invitation";
import styles from "./open.module.css";
import Image from "next/image";
import { useEffect } from "react";
import WeatherWidget from "../WeatherApi/WeatherWidget";

type CardProps = {
  invitation: NewInvitation;
  dev: boolean;
  item: ItineraryItem;
  setActiveSteps?: React.Dispatch<React.SetStateAction<ItineraryItem[]>>;
  activeSteps?: ItineraryItem[];
};

export default function OpenCard({ invitation, dev, item,  }: CardProps) {
  const content = invitation.itinerary;
  const generals = invitation.generals;

  const primary = generals?.colors.primary ?? "#FFFFFF";
  const secondary = generals?.colors.secondary ?? "#FFFFFF";
  const accent = generals?.colors.accent ?? "#FFFFFF";

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
      className={ `${styles.open_card_container}`}
      style={{
        fontFamily: generals.fonts.body?.typeFace,
        color: content.inverted ? primary : accent,
      }}
    >

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
