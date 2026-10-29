/*
  Registro de asistentes de un Flash (body.form; lo arma el organizador en el
  editor de iattend-vite con plantillas: plantillasRegistro.js). Mismas reglas
  y mensajes que el backend (iattend--backend router/sideEventForm.js).
*/

export type TipoCampo = "text" | "single" | "multi" | "yesno" | "check";
export type Regla = "name2" | "age16" | "cp5" | "digits4" | "phone10" | "email";

export type Campo = {
  id: string; label: string; type: TipoCampo; required: boolean; enabled?: boolean;
  placeholder?: string; help?: string; link?: string;
  inputMode?: "text" | "numeric" | "tel" | "email"; prefix?: string; maxLength?: number;
  options?: string[]; max?: number; validate?: Regla; address?: boolean;
  prefillFrom?: "name" | "phone_number";
};

export type FormRegistro = {
  enabled?: boolean;
  title: string; hostLabel?: string; hostInitials?: string; intro: string;
  scope?: "grupo" | "persona"; allowCopyAddress?: boolean; allowLater?: boolean; privacyUrl?: string;
  folioPrefix?: string; version?: string;
  sections: { title: string; fields: Campo[] }[];
};

export type Miembro = {
  id: string; nombre: string; nombreCompleto: string; emoji: string | null; perfil: number | null;
  telefono: string | null; estado: "sin" | "completo" | "pendiente"; folio: string | null; token: string | null;
};

export type Respuestas = Record<string, unknown>;

// Solo secciones y preguntas prendidas.
export const formVisible = (form: FormRegistro): FormRegistro => ({
  ...form,
  sections: (form.sections ?? [])
    .map((s) => ({ ...s, fields: (s.fields ?? []).filter((f) => f.enabled !== false) }))
    .filter((s) => s.fields.length),
});

export const presente = (f: Campo, v: unknown) =>
  f.type === "multi" ? Array.isArray(v) && v.length > 0
  : f.type === "yesno" ? v === true || v === false
  : f.type === "check" ? v === true
  : typeof v === "string" && v.trim().length > 0;

export function errorDe(f: Campo, v: unknown): string | null {
  if (f.required && !presente(f, v))
    return f.type === "check" ? "Necesitamos tu autorización para registrarte" : f.type === "single" ? "Elige una opción" : "Este dato es obligatorio";
  if (!presente(f, v) || !f.validate) return null;
  const s = String(v).trim();
  switch (f.validate) {
    case "name2": return s.split(/\s+/).length < 2 ? "Escribe nombre y apellido" : null;
    case "age16": return +s >= 16 && +s <= 110 ? null : "Escribe una edad entre 16 y 110";
    case "cp5": return /^\d{5}$/.test(s) ? null : "El código postal tiene 5 dígitos";
    case "digits4": return /^\d{4}$/.test(s) ? null : "La sección tiene 4 dígitos";
    case "phone10": return s.replace(/\D/g, "").length === 10 ? null : "Escribe 10 dígitos";
    case "email": return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s) ? null : "Revisa el correo";
  }
  return null;
}

// Prellenado desde el invitado (nombre y teléfono, sin el +52).
export const prellenado = (form: FormRegistro, m: Miembro): Respuestas => {
  const r: Respuestas = {};
  for (const s of form.sections) for (const f of s.fields) {
    if (f.prefillFrom === "name" && m.nombreCompleto) r[f.id] = m.nombreCompleto;
    if (f.prefillFrom === "phone_number" && m.telefono) r[f.id] = m.telefono.replace(/^\+?52/, "").replace(/\D/g, "").slice(-10);
  }
  return r;
};

// Línea corta del resumen: la dirección si la hay; si no, las dos primeras respuestas de texto.
export const lineaResumen = (form: FormRegistro, a: Respuestas) => {
  const campos = form.sections.flatMap((s) => s.fields);
  const dir = campos.filter((f) => f.address).map((f) => {
    const v = a[f.id];
    if (!presente(f, v)) return null;
    return f.validate === "cp5" ? `CP ${v}` : f.validate === "digits4" ? `Secc. ${v}` : String(v);
  }).filter(Boolean);
  if (dir.length) return dir.join(" · ");
  return campos.filter((f) => f.type === "text" && f.prefillFrom !== "name" && presente(f, a[f.id])).slice(0, 2).map((f) => String(a[f.id])).join(" · ");
};

// Chip del resumen: la primera respuesta de opción única.
export const chipResumen = (form: FormRegistro, a: Respuestas) => {
  const f = form.sections.flatMap((s) => s.fields).find((x) => x.type === "single" && presente(x, a[x.id]));
  return f ? String(a[f.id]) : null;
};
