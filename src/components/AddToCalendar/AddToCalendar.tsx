"use client";

import { Button, Dropdown } from "antd";
import type { MenuProps } from "antd";
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
};

function toICSDate(date: string, time?: string) {
  const d = date.replace(/-/g, "");
  if (!time) return d;
  return `${d}T${time.replace(":", "")}00`;
}

function downloadICS({ name, startDate, startTime, endTime, description, location, timeZone }: Omit<AddToCalendarProps, "primary" | "accent" | "label">) {
  const dtStart = toICSDate(startDate, startTime);
  const dtEnd   = toICSDate(startDate, endTime ?? startTime);
  const tzPrefix = (t?: string) => (timeZone && t ? `;TZID=${timeZone}` : "");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `SUMMARY:${name}`,
    `DTSTART${tzPrefix(startTime)}:${dtStart}`,
    `DTEND${tzPrefix(endTime ?? startTime)}:${dtEnd}`,
    description ? `DESCRIPTION:${description}` : null,
    location    ? `LOCATION:${location}`       : null,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");

  const blob = new Blob([lines], { type: "text/calendar;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `${name.replace(/\s+/g, "_")}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

function googleUrl({ name, startDate, startTime, endTime, location, description, timeZone }: Omit<AddToCalendarProps, "primary" | "accent" | "label">) {
  const fmt = (d: string, t?: string) => `${d.replace(/-/g, "")}${t ? `T${t.replace(":", "")}00` : ""}`;
  const dates = `${fmt(startDate, startTime)}/${fmt(startDate, endTime ?? startTime)}`;

  const params = new URLSearchParams({ action: "TEMPLATE", text: name, dates });
  if (location)    params.set("location", location);
  if (description) params.set("details", description);
  if (timeZone)    params.set("ctz", timeZone);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function outlookUrl({ name, startDate, startTime, endTime, location, description }: Omit<AddToCalendarProps, "primary" | "accent" | "label">) {
  const iso = (d: string, t?: string) => `${d}${t ? `T${t}:00` : ""}`;

  const params = new URLSearchParams({
    subject:  name,
    startdt:  iso(startDate, startTime),
    enddt:    iso(startDate, endTime ?? startTime),
  });
  if (location)    params.set("location", location);
  if (description) params.set("body", description);

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

export function AddToCalendar(props: AddToCalendarProps) {
  const { primary, accent, label = "Agregar al calendario" } = props;

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
    <Dropdown menu={{ items }} placement="top" trigger={["click"]}>
      <Button
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
        }}
      >
        {label}
      </Button>
    </Dropdown>
  );
}
