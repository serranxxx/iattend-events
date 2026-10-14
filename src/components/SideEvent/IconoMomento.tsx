"use client";

import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import { LuBadgeHelp } from "react-icons/lu";
import { getItineraryIcon, type ItineraryIconId } from "@/helpers/icons";

/*
  Ícono de un momento del itinerario de un Flash. Dos catálogos:
  · número: los clásicos del itinerario de la invitación (helpers/icons).
  · "lucide:<nombre>": cualquier ícono de Lucide, cargado bajo demanda.
  Contraparte de IconoMomento en iattend-vite (modules/SideEvents).
*/

const PREFIJO_LUCIDE = "lucide:";

export const IconoMomento = ({ icon, size = 18 }: { icon: number | string | null; size?: number }) => {
  if (typeof icon === "string" && icon.startsWith(PREFIJO_LUCIDE)) {
    return (
      <DynamicIcon
        name={icon.slice(PREFIJO_LUCIDE.length) as IconName}
        size={size}
        fallback={() => <LuBadgeHelp size={size} />}
      />
    );
  }
  const Clasico = typeof icon === "number" ? getItineraryIcon(icon as ItineraryIconId) : undefined;
  return Clasico ? <Clasico size={size} /> : <LuBadgeHelp size={size} />;
};
