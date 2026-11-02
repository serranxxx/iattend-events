"use client";

import { useCallback, useEffect, useState } from "react";

/*
  ¿Al invitado le falta el formulario de un Pop? Para el aviso que llega al
  confirmar y el "Te falta el formulario" de su tarjeta (handoff "Pop
  Layout" 3a). Pendiente = alguien de su pase todavía no lo responde ni lo
  dejó para después con su link. Con el formulario cerrado no se insiste.
  También da el folio del titular (para su pase). Mismo endpoint que
  RegistroCard (iattend--backend router/sideEventForm.js).
*/

const API = process.env.NEXT_PUBLIC_IATTEND_API_URL;

type Opciones = {
  eventoId?: number | string | null;
  codigo?: string | null;
  token?: string | null;
  activo: boolean;
  preview?: boolean;
};

export function useEstadoRegistro({ eventoId, codigo, token, activo, preview }: Opciones) {
  const [pendiente, setPendiente] = useState(false);
  const [folio, setFolio] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    if (!activo || !eventoId) { setPendiente(false); setFolio(null); return; }
    // Vista previa: siempre "pendiente", para ver el aviso.
    if (preview) { setPendiente(true); return; }
    if (!codigo && !token) { setPendiente(false); return; }
    try {
      const headers: Record<string, string> = token ? { "x-token-registro": token } : { "x-codigo-invitado": codigo! };
      const res = await fetch(`${API}/side-events/${eventoId}/registro`, { headers, cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.ok) { setPendiente(false); return; }
      const miembros: { estado: string; folio: string | null }[] = data.miembros ?? [];
      setPendiente(!data.cerrado && miembros.some((m) => m.estado === "sin"));
      setFolio(miembros[0]?.folio ?? null);
    } catch {
      setPendiente(false);
    }
  }, [activo, eventoId, codigo, token, preview]);

  useEffect(() => { cargar(); }, [cargar]);

  return { pendiente, folio, recargar: cargar, terminar: () => setPendiente(false) };
}
