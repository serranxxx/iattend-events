"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";
import { downloadICS, type CalendarEvent } from "@/components/AddToCalendar/AddToCalendar";
import { fechasDelEvento, itinerarioPorDia } from "@/helpers/functions";
import type { SideEvent } from "@/types/side_event";
import styles from "./layout.module.css";

/*
  "Agregar al calendario" de un side event / Pop, ya confirmado (tarjeta del
  invitado en SideEvent.tsx). Lo que se puede agregar sale de la página:
  · con itinerario, cada momento (por día): empieza a su hora y termina a la
    hora del siguiente del mismo día (el último, una hora);
  · sin itinerario, cada fecha del evento (tres horas).
  Con una sola cosa se abre el menú de siempre (AddToCalendar); con varias,
  la hoja para elegir cuáles (todas marcadas de entrada) y se baja un .ics
  con las elegidas (Calendario, Google y Outlook las importan juntas).
  Horas de pared con la zona del evento (`body.timezone`, TZID del .ics).
*/

export type EntradaCalendario = CalendarEvent & { id: string; dia: string; tituloDia: string | null; hora: string | null };

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

const sumarMinutos = (hhmm: string, min: number) => {
  const [h, m] = hhmm.split(":").map(Number);
  const total = Math.min(23 * 60 + 59, h * 60 + m + min);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};

const tituloDe = (dia: string) => {
  const [y, m, d] = dia.split("-").map(Number);
  const fecha = new Date(y, m - 1, d, 12);
  return `${DIAS[fecha.getDay()]} ${d} ${MESES[m - 1]}`;
};

export const lugarDe = (body: SideEvent["body"]) => {
  const a = body?.address;
  const direccion = [`${a?.street ?? ""} ${a?.number ?? ""}`.trim(), a?.neighborhood, a?.city, a?.state].filter(Boolean).join(", ");
  return [body?.place_name, direccion].filter(Boolean).join(" · ");
};

export const entradasDeCalendario = (info: SideEvent | null): EntradaCalendario[] => {
  if (!info) return [];
  const body = info.body;
  const lugar = lugarDe(body) || undefined;
  const zona = body?.timezone || undefined;
  const url = typeof window !== "undefined" ? window.location.origin + window.location.pathname : "";
  const dias = itinerarioPorDia(body as Parameters<typeof itinerarioPorDia>[0]);
  type Dia = ReturnType<typeof itinerarioPorDia>[number];
  const conHora = (d: Dia) => d.momentos.filter((m) => m.time);

  if (dias.some((d) => conHora(d).length)) {
    const primerDia = String(fechasDelEvento(body)[0] ?? "").slice(0, 10);
    return dias.flatMap((d) => {
      const dia = d.dia ?? primerDia;
      const momentos = conHora(d).sort((a, b) => String(a.time).localeCompare(String(b.time)));
      return momentos.map((m, i) => {
        const inicio = String(m.time).slice(0, 5);
        const siguiente = momentos[i + 1]?.time ? String(momentos[i + 1].time).slice(0, 5) : null;
        return {
          id: `${dia}-${m.id ?? i}`,
          dia,
          tituloDia: dias.length > 1 ? tituloDe(dia) : null,
          hora: inicio,
          name: `${m.name} · ${info.name ?? ""}`.trim(),
          startDate: dia,
          startTime: inicio,
          endTime: siguiente && siguiente > inicio ? siguiente : sumarMinutos(inicio, 60),
          description: [m.desc || m.place, url].filter(Boolean).join("\n"),
          location: lugar,
          timeZone: zona,
        };
      });
    });
  }

  // Sin itinerario: cada fecha del evento.
  const fechas = fechasDelEvento(body);
  return fechas.map((f, i) => {
    const dia = String(f).slice(0, 10);
    const hora = /\d{2}:\d{2}/.exec(String(f).slice(10))?.[0] ?? null;
    return {
      id: `${dia}-${i}`,
      dia,
      tituloDia: fechas.length > 1 ? tituloDe(dia) : null,
      hora,
      name: info.name ?? "Evento",
      startDate: dia,
      startTime: hora ?? undefined,
      endTime: hora ? sumarMinutos(hora, 180) : undefined,
      description: url,
      location: lugar,
      timeZone: zona,
    };
  });
};

// Contenido de la hoja: la lista por día, con casillas, y el botón.
export function ElegirCalendario({ entradas, titulo, onListo }: { entradas: EntradaCalendario[]; titulo: string; onListo: () => void }) {
  const [elegidas, setElegidas] = useState<Set<string>>(() => new Set(entradas.map((e) => e.id)));
  const clave = entradas.map((e) => e.id).join("|");
  useEffect(() => { setElegidas(new Set(entradas.map((e) => e.id))); }, [clave]); // eslint-disable-line react-hooks/exhaustive-deps
  const porDia = useMemo(() => {
    const m = new Map<string, EntradaCalendario[]>();
    entradas.forEach((e) => { if (!m.has(e.dia)) m.set(e.dia, []); m.get(e.dia)!.push(e); });
    return [...m.entries()];
  }, [entradas]);
  const todas = elegidas.size === entradas.length;
  const alternar = (id: string) => setElegidas((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const agregar = () => {
    const lista = entradas.filter((e) => elegidas.has(e.id));
    if (!lista.length) return;
    downloadICS(lista, titulo);
    onListo();
  };

  return (
    <div className={styles.calendario}>
      <div className={styles.calendario_cabeza}>
        <span className={styles.calendario_titulo}>Agregar al calendario</span>
        <button type="button" className={styles.calendario_todas} onClick={() => setElegidas(todas ? new Set() : new Set(entradas.map((e) => e.id)))}>
          {todas ? "Quitar todas" : "Elegir todas"}
        </button>
      </div>
      <span className={styles.calendario_sub}>Elige qué quieres guardar en tu calendario.</span>
      {porDia.map(([dia, lista]) => (
        <div key={dia} className={styles.calendario_dia}>
          {lista[0].tituloDia && <span className={styles.calendario_dia_titulo}>{lista[0].tituloDia}</span>}
          {lista.map((e) => {
            const on = elegidas.has(e.id);
            return (
              <button key={e.id} type="button" role="checkbox" aria-checked={on} className={styles.calendario_item} data-on={on || undefined} onClick={() => alternar(e.id)}>
                <span className={styles.calendario_check} aria-hidden>{on && <Check size={14} strokeWidth={3} />}</span>
                <span className={styles.calendario_nombre}>{e.name.split(" · ")[0]}</span>
                {e.hora && <span className={styles.calendario_hora}>{e.hora}</span>}
              </button>
            );
          })}
        </div>
      ))}
      <button type="button" className={styles.ver_pase} disabled={!elegidas.size} style={!elegidas.size ? { opacity: 0.5 } : undefined} onClick={agregar}>
        {elegidas.size === 1 ? "Agregar 1 al calendario" : `Agregar ${elegidas.size} al calendario`}
      </button>
    </div>
  );
}
