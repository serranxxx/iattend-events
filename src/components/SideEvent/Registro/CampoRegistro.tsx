"use client";
import React from "react";
import { AlertCircle, Check } from "lucide-react";
import type { Campo } from "./datosRegistro";
import styles from "./registro.module.css";

// Un campo del registro (handoff 2a, "Tipos de campo"): texto, una opción,
// varias, sí/no y casilla, con su ayuda y su error.

type Props = { field: Campo; value: unknown; error?: string; onChange: (_v: unknown) => void; onEnter: () => void; privacyUrl?: string };

export default function CampoRegistro({ field: f, value, error, onChange, onEnter, privacyUrl }: Props) {
  const arr = (Array.isArray(value) ? value : []) as string[];
  return (
    <div className={styles.field}>
      {f.type !== "check" && (
        <div className={styles.label_row}>
          <span className={styles.label}>{f.label}</span>
          {!f.required && f.type !== "multi" && <span className={styles.optional}>Opcional</span>}
          {f.type === "multi" && <span className={styles.counter}>{arr.length}/{f.max}</span>}
        </div>
      )}

      {f.type === "text" && (
        <div className={`${styles.input_wrap} ${error ? styles.has_error : ""}`}>
          {f.prefix && <span className={styles.prefix}>{f.prefix}</span>}
          <input
            className={styles.input} autoFocus
            value={(value as string) ?? ""} placeholder={f.placeholder}
            inputMode={f.inputMode} maxLength={f.maxLength}
            onChange={e => onChange(f.inputMode === "numeric" ? e.target.value.replace(/\D/g, "") : e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); onEnter(); } }}
          />
        </div>
      )}

      {f.type === "single" && (
        <div className={styles.single} role="radiogroup" aria-label={f.label}>
          {f.options!.map(o => (
            <button key={o} type="button" role="radio" aria-checked={value === o}
              className={`${styles.option} ${value === o ? styles.on : ""}`} onClick={() => onChange(o)}>
              <span className={styles.radio}><span /></span>{o}
            </button>
          ))}
        </div>
      )}

      {f.type === "multi" && (
        <div className={styles.multi}>
          {f.options!.map(o => {
            const on = arr.includes(o), full = !on && arr.length >= (f.max ?? Infinity);
            return (
              <button key={o} type="button" aria-pressed={on} disabled={full}
                className={`${styles.chip} ${on ? styles.on : ""}`}
                onClick={() => onChange(on ? arr.filter(x => x !== o) : [...arr, o])}>{o}</button>
            );
          })}
        </div>
      )}

      {f.type === "yesno" && (
        <div className={styles.yesno}>
          <button type="button" className={`${styles.choice} ${value === true ? styles.on : ""}`} onClick={() => onChange(true)}>Sí, me interesa</button>
          <button type="button" className={`${styles.choice} ${value === false ? styles.on : ""}`} onClick={() => onChange(false)}>Por ahora no</button>
        </div>
      )}

      {f.type === "check" && (
        <div role="checkbox" aria-checked={value === true} tabIndex={0}
          className={`${styles.check} ${error ? styles.has_error : ""}`}
          onClick={() => onChange(!(value === true))}
          onKeyDown={e => (e.key === " " || e.key === "Enter") && (e.preventDefault(), onChange(!(value === true)))}>
          <span className={`${styles.box} ${value === true ? styles.box_on : ""}`}><Check size={14} strokeWidth={3.2} /></span>
          <span className={styles.check_col}>
            <span className={styles.check_label}>{f.label}{!f.required && <span className={styles.optional}>Opcional</span>}</span>
            {f.help && <span className={styles.check_help}>{f.help}</span>}
            {f.link && privacyUrl && <a href={privacyUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className={styles.link}>{f.link}</a>}
          </span>
        </div>
      )}

      {f.help && f.type !== "check" && <span className={styles.help}>{f.help}</span>}
      {error && <span className={styles.error}><AlertCircle size={14} />{error}</span>}
    </div>
  );
}
