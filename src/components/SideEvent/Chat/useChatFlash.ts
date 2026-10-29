"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Asistente } from "../Asistentes/datosAsistentes";

/*
  Datos del chat de asistentes de un Flash. Todo pasa por el backend
  (iattend--backend router/sideEventChat.js) con el código del invitado:
  solo los confirmados leen y escriben. El tiempo real es un aviso sin
  contenido ("cambio") por broadcast en side_chat_<id> → se vuelve a pedir;
  "en línea" (presence) y "escribiendo" (broadcast) van por el mismo canal.
  En la vista previa del organizador no hay código: se ven mensajes de ejemplo.
*/

const API = process.env.NEXT_PUBLIC_IATTEND_API_URL;

export type MensajeChat = { id: string; autor: string; text: string; created_at: string; estado?: "enviando" | "fallido" };
export type ReaccionesChat = Record<string, Record<string, { count: number; mine: boolean }>>;
export type AutorChat = Asistente;

const visto = (id: number | string) => `iattend_chat_visto_${id}`;

// Vista previa del organizador ("Ver en vivo"): conversación de ejemplo.
const EJEMPLO_AUTORES: Record<string, AutorChat> = {
  a: { id: "a", nombre: "Sofía", iniciales: "SR", emoji: "🎉", perfil: 1, titular: null },
  b: { id: "b", nombre: "Mateo", iniciales: "MH", emoji: "🍾", perfil: 5, titular: null },
  c: { id: "c", nombre: "Regina", iniciales: "RS", emoji: "🥂", perfil: 3, titular: null },
};
const hace = (min: number) => new Date(Date.now() - min * 60000).toISOString();
const EJEMPLO_MENSAJES: MensajeChat[] = [
  { id: "e1", autor: "a", text: "¡Ya confirmé! ¿Alguien sabe si hay estacionamiento? 🚗", created_at: hace(42) },
  { id: "e2", autor: "b", text: "Sí, en la entrada hay valet 🙌", created_at: hace(38) },
  { id: "e3", autor: "c", text: "¡Nos vemos ahí! Llevo mis mejores pasos de baile 💃", created_at: hace(12) },
];
const EJEMPLO_REACCIONES: ReaccionesChat = { e2: { "👏": { count: 3, mine: false } }, e3: { "🔥": { count: 5, mine: false }, "😂": { count: 2, mine: false } } };

export function useChatFlash({ eventoId, codigo, activo, preview }: { eventoId?: number | string; codigo: string | null; activo: boolean; preview?: boolean }) {
  const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
  const [autores, setAutores] = useState<Record<string, AutorChat>>({});
  const [reacciones, setReacciones] = useState<ReaccionesChat>({});
  const [fijado, setFijado] = useState<{ text: string } | null>(null);
  const [yo, setYo] = useState<string | null>(null);
  const [hayMas, setHayMas] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [enLinea, setEnLinea] = useState(0);
  const [escribiendo, setEscribiendo] = useState<Record<string, { nombre: string; hasta: number }>>({});
  const [ultimoVisto, setUltimoVisto] = useState<string>("");
  const canalRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const ultimoAvisoEscribiendo = useRef(0);

  const puede = Boolean(activo && eventoId && codigo && !preview);

  // Vista previa: ejemplo fijo, sin red.
  useEffect(() => {
    if (!activo || !preview) return;
    setMensajes(EJEMPLO_MENSAJES);
    setAutores(EJEMPLO_AUTORES);
    setReacciones(EJEMPLO_REACCIONES);
    setYo(null);
  }, [activo, preview]);

  useEffect(() => {
    if (eventoId) setUltimoVisto(window.localStorage.getItem(visto(eventoId)) ?? "");
  }, [eventoId]);

  const pedir = useCallback(async (antes?: string) => {
    if (!puede) return null;
    const url = `${API}/side-events/${eventoId}/chat${antes ? `?antes=${encodeURIComponent(antes)}` : ""}`;
    const res = await fetch(url, { headers: { "x-codigo-invitado": codigo! }, cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.ok ? data : null;
  }, [puede, eventoId, codigo]);

  // Lo más reciente: se mezcla con lo que ya estaba (los optimistas siguen).
  const recargar = useCallback(async () => {
    const data = await pedir();
    if (!data) return;
    setYo(data.yo);
    setFijado(data.fijado);
    setAutores((prev) => ({ ...prev, ...data.autores }));
    setReacciones((prev) => ({ ...prev, ...data.reacciones, ...Object.fromEntries((data.mensajes as MensajeChat[]).filter((m) => !data.reacciones[m.id]).map((m) => [m.id, {}])) }));
    setMensajes((prev) => {
      const nuevos: MensajeChat[] = data.mensajes;
      const ids = new Set(nuevos.map((m) => m.id));
      const desde = nuevos[0]?.created_at ?? "";
      // Lo viejo cargado antes (paginado) se queda; lo que el servidor ya no
      // trae dentro de la ventana reciente (borrado por el organizador) se va.
      const viejos = prev.filter((m) => !m.estado && !ids.has(m.id) && desde && m.created_at < desde);
      const pendientes = prev.filter((m) => m.estado);
      return [...viejos, ...nuevos, ...pendientes];
    });
    setHayMas((h) => h || data.hayMas);
  }, [pedir]);

  const cargarMas = useCallback(async () => {
    const primero = mensajes.find((m) => !m.estado);
    if (!primero) return;
    const data = await pedir(primero.created_at);
    if (!data) return;
    setAutores((prev) => ({ ...prev, ...data.autores }));
    setReacciones((prev) => ({ ...data.reacciones, ...prev }));
    setMensajes((prev) => [...data.mensajes.filter((m: MensajeChat) => !prev.some((p) => p.id === m.id)), ...prev]);
    setHayMas(data.hayMas);
  }, [mensajes, pedir]);

  // Carga y tiempo real.
  useEffect(() => {
    if (!puede) return;
    setCargando(true);
    recargar().finally(() => setCargando(false));
    const supabase = createClient();
    const canal = supabase.channel(`side_chat_${eventoId}`, { config: { presence: { key: codigo! } } });
    canal
      .on("broadcast", { event: "cambio" }, () => { recargar(); })
      .on("broadcast", { event: "escribiendo" }, ({ payload }) => {
        if (!payload?.id) return;
        setEscribiendo((prev) => ({ ...prev, [payload.id]: { nombre: String(payload.nombre ?? ""), hasta: Date.now() + 3000 } }));
      })
      .on("presence", { event: "sync" }, () => setEnLinea(Object.keys(canal.presenceState()).length))
      .subscribe((estado) => { if (estado === "SUBSCRIBED") canal.track({ t: Date.now() }); });
    canalRef.current = canal;
    // Respaldo por si se pierde algún aviso.
    const intervalo = window.setInterval(() => { if (document.visibilityState === "visible") recargar(); }, 30000);
    return () => {
      window.clearInterval(intervalo);
      supabase.removeChannel(canal);
      canalRef.current = null;
    };
  }, [puede, eventoId, codigo, recargar]);

  // "Escribiendo" caduca a los 3 s sin aviso nuevo.
  useEffect(() => {
    const ids = Object.keys(escribiendo);
    if (!ids.length) return;
    const t = window.setTimeout(() => {
      setEscribiendo((prev) => Object.fromEntries(Object.entries(prev).filter(([, v]) => v.hasta > Date.now())));
    }, 1000);
    return () => window.clearTimeout(t);
  }, [escribiendo]);

  const avisarEscribiendo = useCallback(() => {
    const ahora = Date.now();
    if (!canalRef.current || !yo || ahora - ultimoAvisoEscribiendo.current < 1500) return;
    ultimoAvisoEscribiendo.current = ahora;
    canalRef.current.send({ type: "broadcast", event: "escribiendo", payload: { id: yo, nombre: autores[yo]?.nombre ?? "" } });
  }, [yo, autores]);

  const enviar = useCallback(async (texto: string, reintentoDe?: string) => {
    if (!puede || !yo) return;
    const temporal = reintentoDe ?? `tmp-${Date.now()}`;
    const optimista: MensajeChat = { id: temporal, autor: yo, text: texto, created_at: new Date().toISOString(), estado: "enviando" };
    setMensajes((prev) => (reintentoDe ? prev.map((m) => (m.id === reintentoDe ? optimista : m)) : [...prev, optimista]));
    try {
      const res = await fetch(`${API}/side-events/${eventoId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-codigo-invitado": codigo! },
        body: JSON.stringify({ texto }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.msg);
      setMensajes((prev) => {
        const sinTemporal = prev.filter((m) => m.id !== temporal);
        return sinTemporal.some((m) => m.id === data.mensaje.id) ? sinTemporal : [...sinTemporal.filter((m) => !m.estado), data.mensaje, ...sinTemporal.filter((m) => m.estado)];
      });
      setReacciones((prev) => ({ ...prev, [data.mensaje.id]: prev[data.mensaje.id] ?? {} }));
    } catch {
      setMensajes((prev) => prev.map((m) => (m.id === temporal ? { ...m, estado: "fallido" } : m)));
    }
  }, [puede, yo, eventoId, codigo]);

  const reaccionar = useCallback(async (msgId: string, emoji: string) => {
    if (!puede || msgId.startsWith("tmp-")) return;
    // Optimista: se prende / apaga al instante.
    setReacciones((prev) => {
      const del = { ...(prev[msgId] ?? {}) };
      const r = del[emoji] ?? { count: 0, mine: false };
      del[emoji] = r.mine ? { count: Math.max(0, r.count - 1), mine: false } : { count: r.count + 1, mine: true };
      return { ...prev, [msgId]: del };
    });
    try {
      const res = await fetch(`${API}/side-events/${eventoId}/chat/${msgId}/reaccion`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-codigo-invitado": codigo! },
        body: JSON.stringify({ emoji }),
      });
      if (!res.ok) throw new Error();
    } catch {
      recargar();
    }
  }, [puede, eventoId, codigo, recargar]);

  // No leídos: de otros, después de la última vez que se abrió.
  const noLeidos = useMemo(
    () => mensajes.filter((m) => !m.estado && m.autor !== yo && (!ultimoVisto || m.created_at > ultimoVisto)).length,
    [mensajes, yo, ultimoVisto],
  );
  const marcarVisto = useCallback(() => {
    if (!eventoId) return;
    const ahora = new Date().toISOString();
    window.localStorage.setItem(visto(eventoId), ahora);
    setUltimoVisto(ahora);
  }, [eventoId]);

  const nombresEscribiendo = Object.entries(escribiendo).filter(([id]) => id !== yo).map(([, v]) => v.nombre).filter(Boolean);
  const ultimo = [...mensajes].reverse().find((m) => !m.estado) ?? null;

  return {
    mensajes, autores, reacciones, fijado, yo, hayMas, cargando, enLinea,
    escribiendo: nombresEscribiendo, noLeidos, ultimo,
    enviar, reaccionar, cargarMas, marcarVisto, avisarEscribiendo,
  };
}
