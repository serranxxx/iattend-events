"use client";

import { useEffect, useState } from "react";
import styles from "./clima.module.css";

/*
  Clima de un side event (handoff design_handoff_widgets_liquid_glass →
  "Clima"): tarjeta de vidrio con el tinte profundo del tema, resplandor de
  sol, temperatura grande y pronóstico por hora: 6 horas alrededor del evento
  (desde una antes de que empiece) con el rango del evento resaltado (de la
  primera a la última hora: inicio y actividades del itinerario). Solo
  aparece cuando el pronóstico ya alcanza el día del evento; antes, oculto.
  El organizador elige el modo (body.weatherMode): "auto" (eso) o "always"
  (siempre: sin pronóstico del día todavía, el de hoy marcado "Hoy"). Oculto
  = hideWeather.
  Misma API que WeatherWidget (el de las invitaciones, que no se toca), en
  español.
*/

type Condicion = { text: string; icon: string; code?: number };
type Hora = { time: string; temp_c: number; is_day?: number; condition: Condicion };
type Dia = {
  date: string;
  day: {
    maxtemp_c: number; mintemp_c: number; avgtemp_c: number; condition: Condicion;
    daily_will_it_rain?: number; daily_chance_of_rain?: number; totalprecip_mm?: number;
  };
  hour?: Hora[];
};
type Respuesta = {
  location: { name: string; localtime: string };
  current: { temp_c: number; is_day?: number; condition: Condicion };
  forecast: { forecastday: Dia[] };
};

type Tipo = "sol" | "luna" | "nube" | "mixto" | "lluvia";

// Códigos de weatherapi.com → los íconos del diseño (de noche, luna).
const tipoDe = (code?: number, esDeDia = true): Tipo => {
  if (code === 1000) return esDeDia ? "sol" : "luna";
  if (code === 1003) return "mixto";
  if (code === undefined) return "nube";
  const lluvia = [1063, 1072, 1087, 1150, 1153, 1168, 1171, 1180, 1183, 1186, 1189, 1192, 1195, 1198, 1201, 1240, 1243, 1246, 1273, 1276];
  return lluvia.includes(code) ? "lluvia" : "nube";
};

const RAYOS = "M20 4v5M20 31v5M4 20h5M31 20h5M8.7 8.7l3.5 3.5M27.8 27.8l3.5 3.5M8.7 31.3l3.5-3.5M27.8 12.2l3.5-3.5";

const Icono = ({ tipo, size }: { tipo: Tipo; size: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
    {tipo === "sol" && (
      <>
        <circle cx="20" cy="20" r="8" fill="#ffd34d" />
        <g stroke="#ffd34d" strokeWidth={size > 30 ? 2.5 : 3} strokeLinecap="round">
          <path d={RAYOS} />
        </g>
      </>
    )}
    {tipo === "luna" && <path d="M26 30a11 11 0 0 1-8.5-18 11 11 0 1 0 14 14A11 11 0 0 1 26 30z" fill="#f2f6ff" />}
    {tipo === "nube" && <path d="M12 30h17a7 7 0 0 0 0-14 9 9 0 0 0-17 2 6 6 0 0 0 0 12z" fill="#f2f6ff" />}
    {tipo === "mixto" && (
      <>
        <circle cx="15" cy="14" r="6" fill="#ffd34d" />
        <path d="M14 32h15a6 6 0 0 0 0-12 8 8 0 0 0-15 2 5 5 0 0 0 0 10z" fill="#f2f6ff" />
      </>
    )}
    {tipo === "lluvia" && (
      <>
        <path d="M12 26h17a7 7 0 0 0 0-14 9 9 0 0 0-17 2 6 6 0 0 0 0 12z" fill="#f2f6ff" />
        <g stroke="#9fd0ff" strokeWidth="2.5" strokeLinecap="round">
          <path d="M14 30l-2 5M21 30l-2 5M28 30l-2 5" />
        </g>
      </>
    )}
  </svg>
);

type Props = {
  ciudad: string;
  modo?: "auto" | "always" | null;
  // Fecha del evento (YYYY-MM-DD, en la zona del lugar).
  fechaEvento?: string | null;
  // Horas (0–23) del día del evento en que pasa algo: inicio y actividades.
  horasEvento?: number[];
};

const hh = (h: Hora) => Number(h.time.slice(11, 13));

export default function ClimaVidrio({ ciudad, fechaEvento, horasEvento = [], modo }: Props) {
  const [clima, setClima] = useState<Respuesta | null>(null);

  useEffect(() => {
    const key = "fa4d2a7fce5841d5a51205220251009";
    fetch(`https://api.weatherapi.com/v1/forecast.json?key=${key}&q=${encodeURIComponent(ciudad)}&days=10&aqi=no&alerts=no&lang=es`)
      .then((r) => r.json())
      .then((d) => setClima(d))
      .catch(() => setClima(null));
  }, [ciudad]);

  if (!clima?.forecast) return null;

  const dias = clima.forecast.forecastday ?? [];
  const hoy = clima.location?.localtime?.slice(0, 10);
  // Solo el clima del día del evento: si el pronóstico todavía no llega a
  // ese día (o el evento ya pasó), no se muestra nada. Antes caía al de hoy
  // y confundía: parecía el clima del evento.
  const delEvento = fechaEvento ? dias.find((d) => d.date === fechaEvento) : null;
  // "Siempre": sin pronóstico del día todavía (o ya pasó), el de hoy.
  const elegido = delEvento ?? (modo === "always" ? dias.find((d) => d.date === hoy) ?? dias[0] ?? null : null);
  if (!elegido) return null;
  const deHoySinEvento = !delEvento;
  const lluvia = elegido.day.daily_chance_of_rain ?? 0;

  const esHoy = elegido.date === hoy;
  const temp = Math.round(esHoy ? clima.current.temp_c : elegido.day.avgtemp_c);
  const condicion = esHoy ? clima.current.condition : elegido.day.condition;

  // Por hora, siempre alrededor del evento: 6 horas desde una antes de que
  // empiece (o desde las 9 si no hay hora), sin pasarse de las 23.
  // Se resalta el rango del evento completo (de la primera a la última hora:
  // inicio y actividades), p. ej. 16 a 18.
  const primera = horasEvento.length ? Math.min(...horasEvento) : null;
  const ultima = horasEvento.length ? Math.max(...horasEvento) : null;
  const enRango = (h: number) => primera !== null && ultima !== null && h >= primera && h <= ultima;
  const desde = Math.max(0, Math.min((primera ?? 10) - 1, 18));
  const franja = (elegido.hour ?? [])
    .filter((h) => hh(h) >= desde)
    .slice(0, 6)
    .map((h) => ({ hora: h, destacada: enRango(hh(h)), etiqueta: `${hh(h)}:00` }));

  return (
    <div className={styles.clima}>
      <span className={styles.resplandor} aria-hidden />
      <div className={styles.arriba}>
        <div className={styles.izquierda}>
          <span className={styles.ciudad}>
            {clima.location.name}
            {/* Siempre visible y sin pronóstico del día del evento: es el de hoy. */}
            {deHoySinEvento && <span className={styles.hoy}>Hoy</span>}
          </span>
          <span className={styles.temperatura}>{temp}°</span>
        </div>
        <div className={styles.derecha}>
          <Icono tipo={tipoDe(condicion?.code, !esHoy || clima.current.is_day !== 0)} size={40} />
          <span className={styles.condicion}>{condicion?.text}</span>
          <span className={styles.rango}>
            Máx {elegido.day.maxtemp_c}° · Mín {elegido.day.mintemp_c}°{lluvia > 0 ? ` · Lluvia ${lluvia}%` : ""}
          </span>
        </div>
      </div>
      <div className={styles.franja} style={{ gridTemplateColumns: `repeat(${Math.max(1, franja.length)}, minmax(0, 1fr))` }}>
        {franja.map(({ hora, destacada, etiqueta }) => (
          <div key={hora.time} className={`${styles.celda} ${destacada ? styles.celdaEvento : ""}`}>
            <span className={styles.celdaDia}>{etiqueta}</span>
            <Icono tipo={tipoDe(hora.condition?.code, hora.is_day !== 0)} size={26} />
            <span className={styles.celdaTemp}>{Math.round(hora.temp_c)}°</span>
          </div>
        ))}
      </div>
    </div>
  );
}
