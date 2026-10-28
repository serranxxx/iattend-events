"use client";

import { createContext, useContext, useSyncExternalStore } from "react";

// Pantallas anchas y horizontales (iPad girado y escritorio): la invitación
// usa el layout "Split + Dock": portada fija a la izquierda y módulos con su
// propio scroll a la derecha. En vertical (celular y iPad vertical) se queda
// la columna móvil de siempre. Los ajustes de "pantalla grande" de los
// módulos (useIsLargeScreen) y los @media de 768px usan esta misma regla.
export const LARGE_SCREEN_QUERY = "(min-width: 768px) and (orientation: landscape)";

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

// Tablet en vertical (iPad vertical): usa la columna móvil, pero los drawers
// salen como hoja centrada y no a todo el ancho.
export const TABLET_PORTRAIT_QUERY = "(min-width: 600px) and (orientation: portrait)";
const subscribeTablet = (onChange: () => void) => {
  const mql = window.matchMedia(TABLET_PORTRAIT_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
};
export function useIsTabletPortrait() {
  return useSyncExternalStore(
    subscribeTablet,
    () => window.matchMedia(TABLET_PORTRAIT_QUERY).matches,
    () => false,
  );
}

export type InvitationLayout = "mobile" | "split";

// Lo provee Invitation.tsx. Fuera de él (pop, side-event) siempre es móvil,
// así esos módulos compartidos no cambian de layout por accidente.
const InvitationLayoutContext = createContext<InvitationLayout>("mobile");

export const InvitationLayoutProvider = InvitationLayoutContext.Provider;

// ¿La invitación está en el layout dividido (portada fija + columna)? Para lo
// que depende de la columna (p. ej. la galería que se sale hasta su orilla).
export const useIsSplitColumn = () => useContext(InvitationLayoutContext) === "split";

// Los módulos tenían una versión propia para pantallas grandes (WebSection,
// ItineraryWeb, DestinationsCatalog…) que ignoraba el estilo del catálogo que
// eligió el usuario. Ahora en el layout dividido se ve la misma versión que en
// celular, así que para los módulos esto es siempre falso.
export const useIsSplitLayout = () => false;
