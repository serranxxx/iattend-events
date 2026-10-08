"use client";

import { createContext, useContext, useSyncExternalStore } from "react";

// A partir de este ancho (iPad y escritorio) la invitación usa el layout
// "Split + Dock": portada fija a la izquierda y módulos con su propio scroll
// a la derecha. Debajo se queda la columna móvil de siempre.
export const LARGE_SCREEN_QUERY = "(min-width: 768px)";

const subscribe = (onChange: () => void) => {
  const mql = window.matchMedia(LARGE_SCREEN_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
};

// En el servidor no hay viewport: se asume móvil y el cliente corrige al hidratar.
export function useIsLargeScreen() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(LARGE_SCREEN_QUERY).matches,
    () => false,
  );
}

export type InvitationLayout = "mobile" | "split";

// Lo provee Invitation.tsx. Fuera de él (pop, side-event) siempre es móvil,
// así esos módulos compartidos no cambian de layout por accidente.
const InvitationLayoutContext = createContext<InvitationLayout>("mobile");

export const InvitationLayoutProvider = InvitationLayoutContext.Provider;

export const useIsSplitLayout = () => useContext(InvitationLayoutContext) === "split";
