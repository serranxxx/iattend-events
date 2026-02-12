// CountDown.tsx
"use client";

import { Col, Row } from "antd";
import React, { useEffect, useMemo, useState } from "react";
import { lighter } from "@/helpers/functions";
import { CoverSection, Generals, InvitationUIBundle } from "@/types/new_invitation";
import styles from "./count.module.css";
import ConfettiButton from "../Confetti/Confetti";

type CountdownProps = {
  cover: CoverSection;
  generals?: Generals;
  dev: boolean;
  validated?: boolean;
  ui?: InvitationUIBundle | null;
};

type Units = "days" | "hours" | "minutes" | "seconds";
type TimeLeft = Record<Units, number>;

const ZERO: TimeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };

/**
 * Parsea una fecha de invitación como "date-only".
 * Toma solo YYYY-MM-DD y crea un Date en UTC (00:00),
 * evitando el desfase por timezone del usuario.
 */
function parseDateOnly(dateString?: string | null): Date | null {
  if (!dateString) return null;

  // Nos quedamos con "YYYY-MM-DD"
  const ymd = dateString.slice(0, 10);
  const [y, m, d] = ymd.split("-").map(Number);

  if (!y || !m || !d) return null;

  // 00:00 UTC de ese día (no se mueve por TZ local)
  return new Date(Date.UTC(y, m - 1, d));
}

/**
 * Formatea la fecha para mostrar SIEMPRE el mismo día
 * sin importar timezone.
 */
export function formatDate(dateString: string) {
  if (!dateString) return "";

  const ymd = dateString.slice(0, 10);
  const [y, m, d] = ymd.split("-").map(Number);

  if (!y || !m || !d) return "";

  const utcDate = new Date(Date.UTC(y, m - 1, d));

  return utcDate.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function diffToTimeLeft(target: Date, now = new Date()): TimeLeft {
  const ms = Math.max(0, +target - +now);
  const totalSeconds = Math.floor(ms / 1000);

  const days = Math.floor(totalSeconds / (24 * 3600));
  const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  return { days, hours, minutes, seconds };
}

function isSameYMD_UTC(a: Date, b: Date) {
  return a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth() && a.getUTCDate() === b.getUTCDate();
}

const labels: Record<Units, { singular: string; plural: string }> = {
  days: { singular: "día", plural: "días" },
  hours: { singular: "hora", plural: "horas" },
  minutes: { singular: "minuto", plural: "minutos" },
  seconds: { singular: "segundo", plural: "segundos" },
};

export default function Countdown({ ui, cover, generals, dev, validated = true }: CountdownProps) {
  const targetDate = useMemo(() => {
    const t = parseDateOnly(cover?.date?.value);
    return t && !isNaN(+t) ? t : null;
  }, [cover?.date?.value]);

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(ZERO);
  const [isToday, setIsToday] = useState(false);

  useEffect(() => {
    if (!targetDate) {
      setTimeLeft(ZERO);
      setIsToday(false);
      return;
    }

    const tick = () => {
      setTimeLeft(diffToTimeLeft(targetDate));
      setIsToday(isSameYMD_UTC(new Date(), targetDate));
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  const color = cover.date.color ?? lighter(generals?.colors.accent ?? "#FFFFFF", 0.6);
  const font = generals?.fonts.body?.typeFace ?? "Poppins";

  if (!targetDate) {
    return (
      <div className={styles.date_container}>
        <span className={styles.date_date} style={{ color, fontFamily: font }}>
          {cover?.date?.value ? formatDate(cover.date.value) : "Fecha por definir"}
        </span>
      </div>
    );
  }

  return (
    <div className={styles.date_container}>
      <span className={styles.date_date} style={{ color, fontFamily: font }}>
        {formatDate(cover.date.value)}
      </span>

      {isToday ? (
        <ConfettiButton cover={cover} generals={generals} validated={validated} />
      ) : (
        <>
          <hr className={styles.date_divider} style={{ border: "1px solid", color, borderColor: color }} />

          <Row className={!dev ? styles.date_row : styles.date_row_dev}>
            {(["days", "hours", "minutes", "seconds"] as Units[]).map((u) => (
              <Col key={u} className={styles.date_col}>
                <span className={styles.date_time} style={{ color, fontFamily: font }}>
                  {timeLeft[u]}
                </span>
                <span className={styles.date_unit} style={{ color, fontFamily: font }}>
                  {timeLeft[u] === 1 ? labels[u].singular : labels[u].plural}
                </span>
              </Col>
            ))}
          </Row>
        </>
      )}
    </div>
  );
}
