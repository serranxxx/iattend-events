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
        width="100%"
        height="100%"
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        src={simpleaddress(
          address.street, address.number, address.neighborhood,
          address.zipcode, address.city, address.state, address.country
        )}
      />
    </div>
  );
}
