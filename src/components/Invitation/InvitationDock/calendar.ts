import { Address, NewInvitation } from "@/types/new_invitation";
import { CalendarEvent } from "@/components/AddToCalendar/AddToCalendar";
import { getTimezoneForState } from "@/helpers/functions";

export type ItineraryMoment = {
  name: string;
  place: string;
  time: string;     // HH:MM
  endTime: string;  // HH:MM
  endsNextDay: boolean;
  isLast: boolean;
  event: CalendarEvent;
};

// La hora del itinerario es texto libre que escribe el organizador:
// "17:00", "5:00 pm", "5 PM"... Se normaliza a HH:MM o null si no se entiende.
export function parseTime(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const match = raw.trim().toLowerCase().match(/^(\d{1,2})(?::(\d{2}))?\s*([ap])?\.?\s*m?\.?/);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2] ?? 0);
  const meridiem = match[3];
  if (meridiem === "p" && hours < 12) hours += 12;
  if (meridiem === "a" && hours === 12) hours = 0;
  if (hours > 23 || minutes > 59) return null;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

const fromMinutes = (total: number) => {
  const wrapped = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(wrapped / 60)).padStart(2, "0")}:${String(wrapped % 60).padStart(2, "0")}`;
};

const addDays = (ymd: string, days: number) => {
  const d = new Date(`${ymd}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

export function formatAddress(address?: Address | null): string {
  if (!address) return "";
  const line1 = [address.street, address.number].filter(Boolean).join(" ");
  const line2 = [address.zip, address.city].filter(Boolean).join(" ");
  return [line1, address.neighborhood, line2, address.state, address.country]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");
}

// "2026-04-04T00:00:00.000Z" -> "2026-04-04"
export function eventDateYMD(invitation: NewInvitation): string {
  const raw = invitation.cover?.date?.value ?? "";
  const ymd = raw.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(ymd) ? ymd : "";
}

export function eventTitle(invitation: NewInvitation): string {
  return invitation.cover?.title?.text?.value ?? "";
}

// "Sáb 4 abr" en el idioma de la invitación, sin depender de la zona horaria.
export function shortDateLabel(ymd: string, lang?: string | null): string {
  if (!ymd) return "";
  const [y, m, d] = ymd.split("-").map(Number);
  const parts = new Intl.DateTimeFormat(lang ?? "es-MX", {
    weekday: "short", day: "numeric", month: "short", timeZone: "UTC",
  }).formatToParts(new Date(Date.UTC(y, m - 1, d)));
  const get = (type: string) => (parts.find((p) => p.type === type)?.value ?? "").replace(/\./g, "");
  const weekday = get("weekday");
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${get("day")} ${get("month")}`;
}

/**
 * Un evento de calendario por momento del itinerario: termina cuando empieza
 * el siguiente y el último dura 2 h. Si un momento cruza la medianoche
 * (p. ej. 23:00 → 01:00) el fin cae al día siguiente.
 */
export function itineraryMoments(invitation: NewInvitation): ItineraryMoment[] {
  const date = eventDateYMD(invitation);
  if (!date || !invitation.itinerary?.active) return [];

  const title = eventTitle(invitation);
  const items = (invitation.itinerary.object ?? [])
    .map((item) => ({ item, time: parseTime(item.time) }))
    .filter((entry): entry is { item: typeof entry.item; time: string } => Boolean(entry.time));

  const fallbackState = items.find(({ item }) => item.address?.state)?.item.address?.state;
  let dayOffset = 0;

  return items.map(({ item, time }, index) => {
    const prev = items[index - 1];
    if (prev && toMinutes(time) < toMinutes(prev.time)) dayOffset += 1;

    const next = items[index + 1];
    const endTime = next ? next.time : fromMinutes(toMinutes(time) + 120);
    const endsNextDay = toMinutes(endTime) < toMinutes(time);
    const startDate = addDays(date, dayOffset);
    const location = formatAddress(item.address);

    return {
      name: item.name,
      place: item.subtext?.trim() || [item.address?.street, item.address?.number].filter(Boolean).join(" "),
      time,
      endTime,
      endsNextDay,
      isLast: !next,
      event: {
        name: [title, item.name].filter(Boolean).join(" · "),
        startDate,
        startTime: time,
        endTime,
        endDate: endsNextDay ? addDays(startDate, 1) : startDate,
        location: location || undefined,
        timeZone: getTimezoneForState(item.address?.state ?? fallbackState),
      },
    };
  });
}

// Sin itinerario: un solo evento de día completo (comportamiento anterior).
export function allDayEvent(invitation: NewInvitation): CalendarEvent | null {
  const date = eventDateYMD(invitation);
  if (!date) return null;
  return { name: eventTitle(invitation) || "Evento", startDate: date };
}
