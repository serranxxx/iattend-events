"use client";
import { SideAddress } from "@/types/side_event";
import { simpleaddress } from "@/components/Invitation/Itinerary/OpenCard/OpenCard";
import styles from "./map.module.css";

type MapProps = { address: SideAddress };

export function EventMap({ address }: MapProps) {
  return (
    <div className={styles.container}>
      <iframe
        title="Mapa"
        width="120%"
        height="120%"
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        style={{borderRadius:'24px', marginLeft:'-5%', marginTop:'-5%', opacity:'0.8'}}
        src={simpleaddress(
          address.street, address.number, address.neighborhood,
          address.zipcode, address.city, address.state, address.country
        )}
      />
    </div>
  );
}
