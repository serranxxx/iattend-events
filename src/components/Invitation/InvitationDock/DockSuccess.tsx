"use client";

import { useMemo, useState } from "react";
import { CalendarPlus, Check, Ticket } from "lucide-react";
import { DockCopy, NewInvitation } from "@/types/new_invitation";
import { CalendarEvent, downloadICS, googleUrl } from "@/components/AddToCalendar/AddToCalendar";
import { allDayEvent, eventDateYMD, eventTitle, itineraryMoments, shortDateLabel } from "./calendar";
import { fmt } from "./copy";
import styles from "./invitation-dock.module.css";

type CalendarKey = "apple" | "google" | "outlook";

type DockSuccessProps = {
  t: DockCopy;
  invitation: NewInvitation;
  lang?: string | null;
  firstName: string;
  goingCount: number;
  onContinue: () => void;
};

export function DockSuccess({ t, invitation, lang, firstName, goingCount, onContinue }: DockSuccessProps) {
  const moments = useMemo(() => itineraryMoments(invitation), [invitation]);
  const fallback = useMemo(() => allDayEvent(invitation), [invitation]);
  const hasItinerary = moments.length > 0;

  const [off, setOff] = useState<Record<number, boolean>>({});
  const [done, setDone] = useState<Partial<Record<CalendarKey, boolean>>>({});
  // Google solo acepta un evento por link: se van agregando uno por uno.
  const [googleNext, setGoogleNext] = useState(0);

  const selected: CalendarEvent[] = hasItinerary
    ? moments.filter((_, i) => !off[i]).map((m) => m.event)
    : fallback ? [fallback] : [];
  const disabled = selected.length === 0;

  const toggleMoment = (index: number) => {
    setOff((prev) => ({ ...prev, [index]: !prev[index] }));
    setDone({});
    setGoogleNext(0);
  };

  const fileName = eventTitle(invitation) || "evento";

  const onCalendar = (key: CalendarKey) => {
    if (disabled) return;
    if (key === "google") {
      const event = selected[googleNext];
      if (!event) return;
      window.open(googleUrl(event), "_blank");
      const next = googleNext + 1;
      setGoogleNext(next);
      if (next >= selected.length) setDone((prev) => ({ ...prev, google: true }));
      return;
    }
    downloadICS(selected, fileName);
    setDone((prev) => ({ ...prev, [key]: true }));
  };

  const calendarLabel = (key: CalendarKey, label: string) => {
    if (done[key]) return t.calDone;
    if (key === "google" && googleNext > 0 && selected.length > 1) {
      return fmt(t.calNext, { i: googleNext + 1, n: selected.length });
    }
    return label;
  };

  const selectedCount = selected.length;
  const note = selectedCount === 0
    ? t.calNoteNone
    : selectedCount === 1 ? t.calNoteOne : fmt(t.calNoteMany, { n: selectedCount });

  return (
    <div className={`${styles.stack} ${styles.center}`} style={{ gap: 20 }}>
      <div className={styles.round_icon}>
        <Check size={30} strokeWidth={2.5} />
      </div>

      <div className={styles.stack} style={{ gap: 8 }}>
        <span className={styles.title} style={{ fontSize: 28, lineHeight: 1.15 }}>
          {fmt(t.thanks, { name: firstName })}
        </span>
        <span className={styles.body_text}>{t.thanksSub}</span>
      </div>

      <div className={styles.confirmed_chip}>
        <Ticket size={18} />
        <span>{goingCount === 1 ? t.confirmedOne : fmt(t.confirmedMany, { n: goingCount })}</span>
      </div>

      {(hasItinerary || fallback) && (
        <div className={styles.calendar}>
          <div className={styles.section_row}>
            <span className={styles.section_label}>{t.saveCalendar}</span>
            <span className={styles.section_meta}>{shortDateLabel(eventDateYMD(invitation), lang)}</span>
          </div>

          {hasItinerary ? (
            <>
              <div className={styles.moments}>
                {moments.map((m, i) => {
                  const on = !off[i];
                  const meta = [m.place, m.isLast ? t.hours2 : fmt(t.until, { time: m.endTime })].filter(Boolean).join(" · ");
                  return (
                    <button
                      key={`${m.time}-${i}`}
                      type="button"
                      role="checkbox"
                      aria-checked={on}
                      onClick={() => toggleMoment(i)}
                      className={styles.moment_row}
                    >
                      <span className={`${styles.checkbox} ${on ? styles.checkbox_on : ""}`}>
                        {on && <Check size={14} strokeWidth={3} />}
                      </span>
                      <span className={`${styles.moment_time} ${on ? "" : styles.off}`}>{m.time}</span>
                      <span className={styles.stack} style={{ gap: 1, flex: 1, minWidth: 0 }}>
                        <span className={`${styles.moment_name} ${on ? "" : styles.off}`}>{m.name}</span>
                        {meta && <span className={styles.moment_meta}>{meta}</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
              <span className={styles.cal_note}>{note}</span>
            </>
          ) : (
            <div className={styles.all_day_row}>
              <CalendarPlus size={18} />
              <span>{[eventTitle(invitation), t.allDay].filter(Boolean).join(" · ")}</span>
            </div>
          )}

          <div className={styles.cal_grid}>
            {([["apple", "Apple"], ["google", "Google"], ["outlook", "Outlook"]] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                disabled={disabled}
                onClick={() => onCalendar(key)}
                className={`${styles.cal_btn} ${done[key] ? styles.cal_btn_done : ""}`}
              >
                {done[key] ? <Check size={18} /> : <CalendarPlus size={18} />}
                <span>{calendarLabel(key, label)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <button type="button" onClick={onContinue} className={styles.cta}>{t.continue}</button>
    </div>
  );
}
