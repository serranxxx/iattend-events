"use client";
import { ItineraryItem, NewInvitation } from "@/types/new_invitation";
import { useEffect, useState } from "react";
import styles from "./weather.module.css";
import { SideAddress, SideEventBody } from "@/types/side_event";
import { CloudOff } from "lucide-react";

interface WeatherForecastHour {
  time: string;
  temp_c: number;
  condition: { icon: string; text: string };
}

interface WeatherForecastDay {
  date: string;
  day: {
    maxtemp_c: number;
    mintemp_c: number;
    avgtemp_c: number;
    condition: { icon: string; text: string };
  };
  hour: WeatherForecastHour[];
}

interface WeatherResponse {
  location: { name: string; localtime: string };
  current: { temp_c: number; condition: { icon: string; text: string } };
  forecast: {
    forecastday: WeatherForecastDay[];
  };
}

type CardProps = {
  invitation?: NewInvitation;
  dev?: boolean;
  item: ItineraryItem | SideEventBody | {
      date: string,
      type: string,
      address: SideAddress
    } |  undefined;
  isSide?: boolean;
  color?: string;
  radius?: number;
  // Fecha del evento (YYYY-MM-DD, ya resuelta en la zona del venue) para
  // buscar ese día dentro del forecast en vez de asumir "hoy". Si no se
  // pasa, se conserva el comportamiento anterior (día actual).
  eventDate?: string | null;
};

export default function WeatherWidget({ invitation, item, isSide, color, radius, eventDate }: CardProps) {
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const key = "fa4d2a7fce5841d5a51205220251009";

  useEffect(() => {
    const getForecast = () => {
      fetch(`https://api.weatherapi.com/v1/forecast.json?key=${key}&q=${item?.address?.city}=1&days=10&aqi=no&alerts=no`)
        .then((res) => res.json())
        .then((data) => setWeather(data));
    };

    getForecast();
  }, []);

  if (!weather) return <p>Cargando clima...</p>;

  const forecastDays = weather.forecast?.forecastday ?? [];
  const todayStr = weather.location?.localtime?.slice(0, 10);
  const matchedDay = eventDate ? forecastDays.find((d) => d.date === eventDate) : forecastDays[0];
  const isToday = !!matchedDay && matchedDay.date === todayStr;

  // El evento cae fuera de la ventana de pronóstico que devolvió la API
  // (aún faltan más días de los que el plan contratado alcanza a predecir).
  if (eventDate && !matchedDay) {
    return (
      <div
        className={styles.wdiget_container}
        style={{
          maxWidth: isSide ? "450px" : "130px",
          width: "100%",
          height: isSide ? "200px" : undefined,
          padding: isSide ? "24px" : "12px",
          alignItems: "center",
          justifyContent: "center",
          gap: isSide ? "8px" : "4px",
          textAlign: "center",
          backdropFilter: "blur(10px)",
          border: isSide ? "1px solid #FFFFFF40" : undefined,
          background: isSide ? (color ?? "var(--blur-color--dark)") : undefined,
          borderRadius: radius,
          fontFamily: invitation?.generals.fonts.body?.typeFace ?? "Poppins",
        }}
      >
        <CloudOff size={isSide ? 24 : 16} style={{ opacity: 0.7, flexShrink: 0 }} />
        <span className={styles.weather_label} style={{ opacity: 0.7, fontSize: isSide ? undefined : "11px" }}>
          Pronóstico aún no disponible
        </span>
      </div>
    );
  }

  const displayTemp = isToday ? weather.current?.temp_c : matchedDay?.day?.avgtemp_c;
  const displayCondition = isToday ? weather.current?.condition : matchedDay?.day?.condition;

  const hoursToShow = (() => {
    const hours = matchedDay?.hour ?? [];

    if (isToday) {
      const nowStr = weather.location.localtime; // "2025-09-11 09:01"
      const currentHour = parseInt(nowStr.slice(11, 13), 10); // -> 9
      const getHour = (h: WeatherForecastHour) => parseInt(h.time.slice(11, 13), 10);

      if (currentHour >= 18) {
        return hours.slice(-6);
      }
      const nextHours = hours.filter((h) => getHour(h) > currentHour);
      const limit = nextHours.slice(0, 6).map((h) => h.time);
      return hours.filter((h) => limit.includes(h.time));
    }

    // Día futuro: no hay "ahora", mostramos una muestra fija repartida en el día.
    const targetHours = [8, 11, 14, 17, 20, 23];
    return hours.filter((h) => targetHours.includes(parseInt(h.time.slice(11, 13), 10)));
  })();

  return (
    <>
      {isSide ? (
        <div
          className={styles.wdiget_container}
          style={{
            maxWidth: "450px",
            height: "200px",
            padding: "24px",
            backdropFilter: "blur(10px)",
            border: "1px solid #FFFFFF40",
            background: color ?? "var(--blur-color--dark)",
            borderRadius: radius,
            fontFamily: invitation?.generals.fonts.body?.typeFace ?? "Poppins",
          }}
        >
          <div className={styles.widget_row}>
            <div className={styles.widget_col}>
              <span className={styles.weather_label}>{weather.location.name}</span>
              <span className={styles.weather_temperture}>{Math.round(displayTemp ?? 0)}°</span>
            </div>

            <div className={styles.widget_col} style={{ alignItems: "flex-end" }}>
              <img src={displayCondition?.icon} alt="icono" style={{ margin: "0px -5px -6px 0px", height: "36px", padding: 0 }} />
              <span className={styles.weather_sec_label}>{displayCondition?.text}</span>
              <span className={styles.weather_sec_label}>
                Max.: {matchedDay?.day?.maxtemp_c}° Min.: {matchedDay?.day?.mintemp_c}°{" "}
              </span>
            </div>
          </div>

          <div className={styles.widget_row}>
            {hoursToShow.map((hour: WeatherForecastHour, index: number) => {
              // cortar la hora del string "YYYY-MM-DD HH:mm"
              const hourOnly = hour.time.slice(11, 13); // "09", "10", etc.
              // quitar el 0 inicial para que quede "9", "10", etc.
              const cleanHour = parseInt(hourOnly, 10);

              return (
                <div key={index} className={styles.widget_col} style={{ alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  <span style={{ opacity: 0.6 }} className={styles.weather_sec_label}>
                    {cleanHour}
                  </span>
                  <img src={hour.condition.icon} alt="icono" style={{ margin: "-4px 0px", height: "36px", padding: 0 }} />
                  <span style={{ fontWeight: 600 }} className={styles.weather_sec_label}>
                    {Math.round(hour.temp_c)}°
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div
          className={styles.wdiget_container}
          style={{
            maxWidth: "130px",
            padding: "12px",
            gap: "4px",
            maxHeight: "134px",
            fontFamily: invitation?.generals.fonts.body?.typeFace ?? "Poppins",
            ...(color !== undefined && {
              position: "relative",
              overflow: "hidden",
              background: "rgba(255, 255, 255, 0.06)",
              backdropFilter: "blur(22px) saturate(180%) brightness(1.1)",
              WebkitBackdropFilter: "blur(22px) saturate(180%) brightness(1.1)",
              borderTop: "1px solid rgba(255, 255, 255, 0.55)",
              borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
              borderLeft: "1px solid rgba(255, 255, 255, 0.25)",
              borderRight: "1px solid rgba(255, 255, 255, 0.25)",
              boxShadow: "0 0 14px 0 rgba(0,0,0,0.10), 0 8px 32px rgba(0,0,0,0.18), inset 0 -2px 6px rgba(0,0,0,0.2)",
              padding: "16px 12px",
              maxHeight: "144px",
            }),
            ...(radius !== undefined && { borderRadius: radius }),
          }}
        >
          {color !== undefined && (
            <div style={{
              position: "absolute",
              inset: 0,
              height: "50%",
              borderRadius: `${radius ?? 0}px ${radius ?? 0}px 0 0`,
              background: "linear-gradient(to bottom, rgba(255,255,255,0.18), transparent)",
              pointerEvents: "none",
              zIndex: 1,
            }} />
          )}
          <span className={styles.weather_label}>{weather?.location?.name}</span>
          <span className={styles.weather_temperture}>{Math.round(displayTemp ?? 0)}°</span>
          <img src={displayCondition?.icon} alt="icono" style={{ margin: "-4px 0px", height: "22px", padding: 0 }} />
          <span className={styles.weather_sec_label}>{displayCondition?.text}</span>
          <span className={styles.weather_sec_label}>
            Max.: {Math.round(matchedDay?.day?.maxtemp_c ?? 0)}° Min.:{" "}
            {Math.round(matchedDay?.day?.mintemp_c ?? 0)}°{" "}
          </span>
        </div>
      )}
    </>
  );
}
