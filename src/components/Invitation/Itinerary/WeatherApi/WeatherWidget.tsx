"use client";
import { ItineraryItem, NewInvitation } from "@/types/new_invitation";
import { useEffect, useState } from "react";
import styles from "./weather.module.css";
import { SideEventBody } from "@/types/side_event";

type CardProps = {
  invitation?: NewInvitation;
  dev?: boolean;
  item: ItineraryItem | SideEventBody | undefined;
  isSide?: boolean;
  color?: string;
};

export default function WeatherWidget({ invitation, item, isSide, color }: CardProps) {
  const [weather, setWeather] = useState<any>(null);
  const key = "fa4d2a7fce5841d5a51205220251009";

  useEffect(() => {
    const getForecast = () => {
      fetch(`https://api.weatherapi.com/v1/forecast.json?key=${key}&q=${item?.address?.city}=1&aqi=no&alerts=no`)
        .then((res) => res.json())
        .then((data) => setWeather(data));
    };

    getForecast();
  }, []);

  if (!weather) return <p>Cargando clima...</p>;

  return (
    <>
      {isSide ? (
        <div
          className={styles.wdiget_container}
          style={{
            maxWidth: "450px",
            backdropFilter: "blur(10px)",
            border: "1px solid #FFFFFF40",
            background: color,
            fontFamily: invitation?.generals.fonts.body?.typeFace ?? "Poppins",
          }}
        >
          <div className={styles.widget_row}>
            <div className={styles.widget_col}>
              <span className={styles.weather_label}>{weather.location.name}</span>
              <span className={styles.weather_temperture}>{Math.round(weather.current.temp_c)}°</span>
            </div>

            <div className={styles.widget_col} style={{ alignItems: "flex-end" }}>
              <img src={weather.current.condition.icon} alt="icono" style={{ margin: "0px -5px -6px 0px", height: "36px", padding: 0 }} />
              <span className={styles.weather_sec_label}>{weather.current.condition.text}</span>
              <span className={styles.weather_sec_label}>
                Max.: {weather.forecast.forecastday[0].day.maxtemp_c}° Min.: {weather.forecast.forecastday[0].day.mintemp_c}°{" "}
              </span>
            </div>
          </div>

          <div className={styles.widget_row}>
            {weather.forecast.forecastday[0].hour
              // 1. Filtrar las 6 horas que quieres mostrar
              .filter((hour: any, index: number, arr: any[]) => {
                const nowStr = weather.location.localtime; // "2025-09-11 09:01"
                const currentHour = parseInt(nowStr.slice(11, 13), 10); // -> 9

                const getHour = (h: any) => parseInt(h.time.slice(11, 13), 10);

                if (currentHour >= 18) {
                  // últimas 6 horas del día
                  return index >= arr.length - 6;
                } else {
                  // las siguientes 6 horas después de la actual
                  const nextHours = arr.filter((h: any) => getHour(h) > currentHour);
                  const limit = nextHours.slice(0, 6).map((h: any) => h.time);
                  return limit.includes(hour.time);
                }
              })
              // 2. Mapear esas 6 horas
              .map((hour: any, index: number) => {
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
          }}
        >
          <span className={styles.weather_label}>{weather?.location?.name}</span>
          <span className={styles.weather_temperture}>{Math.round(weather?.current?.temp_c)}°</span>
          <img src={weather?.current?.condition?.icon} alt="icono" style={{ margin: "-4px 0px", height: "22px", padding: 0 }} />
          <span className={styles.weather_sec_label}>{weather?.current?.condition?.text}</span>
          <span className={styles.weather_sec_label}>
            Max.: {Math.round(weather?.forecast?.forecastday[0]?.day?.maxtemp_c)}° Min.:{" "}
            {Math.round(weather?.forecast?.forecastday[0]?.day?.mintemp_c)}°{" "}
          </span>
        </div>
      )}
    </>
  );
}
