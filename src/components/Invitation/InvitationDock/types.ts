import { GuestSubabasePayload } from "@/types/guests";

export type DockPhase = "pill" | "form" | "success" | "tour" | "bar" | "tool" | "declined";
export type DockTool = "passes" | "lia" | "photos";

// Una fila de "¿Quién asiste?": el invitado principal o un acompañante.
export type DockPerson = {
  guest: GuestSubabasePayload;
  name: string;
  going: boolean;
  // Acompañante que el anfitrión creó sin nombre: el invitado lo escribe.
  editable: boolean;
};

export const isGoingState = (state?: GuestSubabasePayload["state"] | null) =>
  state === "confirmado" || state === "asistente";
