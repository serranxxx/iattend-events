"use client";

import { Button, Dropdown } from "antd";
import type { DropdownProps, MenuProps } from "antd";
import { CalendarPlus } from "lucide-react";
import { FaApple, FaGoogle } from "react-icons/fa";
import { BsMicrosoftTeams } from "react-icons/bs";

type AddToCalendarProps = {
  name: string;
  startDate: string;   // YYYY-MM-DD
  startTime?: string;  // HH:MM
  endTime?: string;    // HH:MM
  description?: string;
  location?: string;
  timeZone?: string;
  primary: string;
  accent: string;
  label?: string;
  buttonStyle?: React.CSSProperties;  // overrides sobre el estilo base del botón
  buttonClassName?: string;           // clase del botón (acabado liquid glass)
  menuClassName?: string;             // clase para el dropdown portaleado
  placement?: DropdownProps["placement"]; // posición del menú (default "top")
};

function toICSDate(date: string, time?: string) {
  const d = date.replace(/-/g, "");
  if (!time) return d;
  return `${d}T${time.replace(":", "")}00`;
}

function nextDay(date: string) {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

export type CalendarEvent = {
  name: string;
  startDate: string;   // YYYY-MM-DD
  startTime?: string;  // HH:MM
  endTime?: string;    // HH:MM
  endDate?: string;    // YYYY-MM-DD, si termina otro día (p. ej. después de medianoche)
  description?: string;
  location?: string;
  timeZone?: string;
};

// RFC 5545: comas, punto y coma y saltos de línea van escapados en los textos.
function escapeICS(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

function veventLines({ name, startDate, startTime, endTime, endDate, description, location, timeZone }: CalendarEvent) {
  const tzPrefix = (t?: string) => (timeZone && t ? `;TZID=${timeZone}` : "");
  const isAllDay = !startTime;
  const uid = `${typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`}@iattend.events`;
  const dtStamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  // Sin hora → evento de día completo (DTEND exclusivo al día siguiente, RFC 5545).
  // Un evento de día completo no tiene zona horaria, consistente con las fechas
  // absolutas de la plataforma.
  const dtStartLine = isAllDay
    ? `DTSTART;VALUE=DATE:${toICSDate(startDate)}`
    : `DTSTART${tzPrefix(startTime)}:${toICSDate(startDate, startTime)}`;
  const dtEndLine = isAllDay
    ? `DTEND;VALUE=DATE:${nextDay(startDate)}`
    : `DTEND${tzPrefix(endTime ?? startTime)}:${toICSDate(endDate ?? startDate, endTime ?? startTime)}`;

  return [
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `SUMMARY:${escapeICS(name)}`,
    dtStartLine,
    dtEndLine,
    description ? `DESCRIPTION:${escapeICS(description)}` : null,
    location    ? `LOCATION:${escapeICS(location)}`       : null,
    "STATUS:CONFIRMED",
    "END:VEVENT",
  ].filter(Boolean) as string[];
}

// Un solo VCALENDAR con uno o varios VEVENT (Apple Calendar / Outlook los
// importan todos de una vez).
export function downloadICS(events: CalendarEvent | CalendarEvent[], fileName?: string) {
  const list = Array.isArray(events) ? events : [events];
  if (list.length === 0) return;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//I attend//Save the date//ES",
    "CALSCALE:GREGORIAN",
    ...list.flatMap(veventLines),
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([lines], { type: "text/calendar;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `${(fileName ?? list[0].name).replace(/\s+/g, "_")}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

export function googleUrl({ name, startDate, startTime, endTime, endDate, location, description, timeZone }: CalendarEvent) {
  const fmt = (d: string, t?: string) => `${d.replace(/-/g, "")}${t ? `T${t.replace(":", "")}00` : ""}`;
  const dates = startTime
    ? `${fmt(startDate, startTime)}/${fmt(endDate ?? startDate, endTime ?? startTime)}`
    : `${fmt(startDate)}/${nextDay(startDate)}`;

  const params = new URLSearchParams({ action: "TEMPLATE", text: name, dates });
  if (location)    params.set("location", location);
  if (description) params.set("details", description);
  if (timeZone)    params.set("ctz", timeZone);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function outlookUrl({ name, startDate, startTime, endTime, location, description }: CalendarEvent) {
  const iso = (d: string, t?: string) => `${d}${t ? `T${t}:00` : ""}`;

  const params = new URLSearchParams({
    subject:  name,
    startdt:  iso(startDate, startTime),
    enddt:    iso(startDate, endTime ?? startTime),
  });
  if (!startTime) params.set("allday", "true");
  if (location)    params.set("location", location);
  if (description) params.set("body", description);

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

export function AddToCalendar(props: AddToCalendarProps) {
  const { primary, accent, label = "Agregar al calendario", buttonStyle, buttonClassName, menuClassName, placement = "top" } = props;

  const items: MenuProps["items"] = [
    {
      key: "apple",
      icon: <FaApple size={16} />,
      label: "Apple Calendar",
      onClick: () => downloadICS(props),
    },
    {
      key: "google",
      icon: <FaGoogle size={14} />,
      label: "Google Calendar",
      onClick: () => window.open(googleUrl(props), "_blank"),
    },
    {
      key: "outlook",
      icon: <BsMicrosoftTeams size={15} />,
      label: "Outlook",
      onClick: () => window.open(outlookUrl(props), "_blank"),
    },
  ];

  return (
    <Dropdown menu={{ items }} placement={placement} trigger={["click"]} overlayClassName={menuClassName}>
      <Button
        className={buttonClassName}
        icon={<CalendarPlus size={18} />}
        style={{
          backgroundColor: accent,
          color: primary,
          borderRadius: "16px",
          minHeight: "52px",
          width: "100%",
          fontSize: "16px",
          border: "none",
          letterSpacing: "1px",
          ...buttonStyle,
        }}
      >
        {label}
      </Button>
    </Dropdown>
  );
}
