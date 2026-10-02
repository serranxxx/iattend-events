"use client";

import { Plus, Ticket, X } from "lucide-react";
import { DockCopy } from "@/types/new_invitation";
import { fmt } from "./copy";
import { DockPerson } from "./types";
import styles from "./invitation-dock.module.css";

const initials = (name: string) =>
  name.split(" ").filter(Boolean).map((part) => part[0]).slice(0, 2).join("").toUpperCase();

type ClosedFormProps = {
  t: DockCopy;
  people: DockPerson[];
  onToggle: (_index: number) => void;
  onRename: (_index: number, _name: string) => void;
};

// Invitación cerrada: saludo, bloque de pases y un interruptor por persona.
export function DockFormClosed({ t, people, onToggle, onRename }: ClosedFormProps) {
  const total = people.length;
  const goingCount = people.filter((p) => p.going).length;
  const companions = total - 1;
  const firstName = (people[0]?.name ?? "").split(" ")[0];
  const passCopy = companions === 0
    ? t.individual
    : companions === 1 ? t.forYouAndOne : fmt(t.forYouAndMany, { n: companions });

  return (
    <div className={styles.stack} style={{ gap: 18 }}>
      <span className={styles.title} style={{ fontSize: 30 }}>
        {fmt(t.hi, { name: firstName })}
      </span>

      <div className={styles.passes_block}>
        <div className={styles.passes_count}>
          <span className={styles.passes_number}>{total}</span>
          <span className={styles.passes_word}>{total === 1 ? t.pass : t.passes}</span>
        </div>
        <div className={styles.passes_divider} />
        <div className={styles.stack} style={{ gap: 8, flex: 1, minWidth: 0 }}>
          <span className={styles.passes_copy}>{passCopy}</span>
          <div className={styles.mini_tickets}>
            {people.map((p, i) => (
              <span key={p.guest.id ?? i} className={`${styles.mini_ticket} ${p.going ? styles.mini_ticket_on : ""}`}>
                <Ticket size={14} />
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.stack} style={{ gap: 4 }}>
        <div className={styles.section_row} style={{ padding: "0 2px 6px" }}>
          <span className={styles.section_label}>{t.whoAttends}</span>
          <span className={styles.section_meta}>{fmt(t.countOf, { n: goingCount, total })}</span>
        </div>

        {people.map((p, i) => {
          const empty = !p.name.trim();
          const missing = p.editable && p.going && empty;
          const status = p.going
            ? (i === 0 ? t.youGoing : missing ? t.needsName : t.going)
            : (i === 0 ? t.youNotGoing : t.notGoing);

          return (
            <div key={p.guest.id ?? i} className={`${styles.person_row} ${missing ? styles.person_row_missing : ""}`}>
              <span className={`${styles.avatar} ${p.going ? styles.avatar_on : ""}`}>
                {empty ? String(i + 1) : initials(p.name)}
              </span>

              {p.editable ? (
                // El input se queda montado aunque ya tenga texto, para no perder el foco.
                <span className={`${styles.person_info} ${styles.person_info_editable}`}>
                  <input
                    value={p.name}
                    onChange={(e) => onRename(i, e.target.value)}
                    placeholder={fmt(t.companionPlaceholder, { n: i })}
                    disabled={!p.going}
                    className={`${styles.person_input} ${missing ? styles.person_input_missing : ""}`}
                  />
                  <span className={`${styles.person_status} ${missing ? styles.person_status_missing : ""}`}>{status}</span>
                </span>
              ) : (
                <span className={styles.person_info}>
                  <span translate="no" className={`notranslate ${styles.person_name} ${p.going ? "" : styles.struck}`}>{p.name}</span>
                  <span className={styles.person_status}>{status}</span>
                </span>
              )}

              <button
                type="button"
                role="switch"
                aria-checked={p.going}
                aria-label={p.name || fmt(t.companionPlaceholder, { n: i })}
                onClick={() => onToggle(i)}
                className={styles.switch_btn}
              >
                <span className={`${styles.switch_track} ${p.going ? styles.switch_track_on : ""}`}>
                  <span className={styles.switch_knob} />
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type OpenFormProps = {
  t: DockCopy;
  rows: string[];
  onChange: (_index: number, _value: string) => void;
  onAdd: () => void;
  onRemove: (_index: number) => void;
};

// Invitación abierta: el invitado escribe su nombre y el de sus acompañantes.
export function DockFormOpen({ t, rows, onChange, onAdd, onRemove }: OpenFormProps) {
  const filled = rows.filter((r, i) => i === 0 || r.trim()).length;

  return (
    <div className={styles.stack} style={{ gap: 16 }}>
      <div className={styles.stack} style={{ gap: 6 }}>
        <span className={styles.title} style={{ fontSize: 30 }}>{t.openHi}</span>
        <span className={styles.body_text}>{t.openSub}</span>
      </div>

      <div className={styles.open_chip}>
        <Ticket size={20} />
        <span>{filled === 1 ? t.openCountOne : fmt(t.openCountMany, { n: filled })}</span>
      </div>

      <div className={styles.stack} style={{ gap: 10 }}>
        {rows.map((value, i) => (
          <div key={i} className={styles.input_row}>
            <input
              value={value}
              onChange={(e) => onChange(i, e.target.value)}
              placeholder={i === 0 ? t.yourName : t.companionName}
              className={styles.text_input}
            />
            {i > 0 && (
              <button type="button" onClick={() => onRemove(i)} aria-label={t.remove} className={styles.square_btn}>
                <X size={18} />
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={onAdd} className={styles.dashed_btn}>
          <Plus size={18} />
          {t.addCompanion}
        </button>
      </div>
    </div>
  );
}
