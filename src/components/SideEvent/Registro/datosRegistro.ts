/*
  Formulario de un Pop (body.form). El organizador lo arma desde cero en el
  editor de iattend-vite (modules/SideEvents/Formularios/) y lo guarda en "Mis
  formularios"; al Pop llega como snapshot congelado (body.form.snapshot)
  junto a sus reglas. Mismas reglas y mensajes que el backend (iattend--backend
  router/sideEventForm.js).
*/

export type TipoCampo = "text" | "long" | "single" | "multi" | "yesno" | "date" | "check";
export type Regla = "name2" | "age16" | "cp5" | "digits4" | "phone10" | "email" | "number";

export type Campo = {
  id: string; label: string; type: TipoCampo; required: boolean; enabled?: boolean;
  // Tipo del editor (short, phone, email, number…): solo informativo aquí.
  kind?: string;
  placeholder?: string; help?: string; link?: string;
  inputMode?: "text" | "numeric" | "tel" | "email"; prefix?: string; maxLength?: number;
  options?: string[]; max?: number; validate?: Regla; address?: boolean;
  prefillFrom?: "name" | "phone_number";
};

export type Seccion = { id?: string; title: string; fields: Campo[] };

export type FormRegistro = {
  enabled?: boolean;
  formId?: string;
  snapshot?: { title: string; intro: string; sections: Seccion[]; version?: string } | null;
  title: string; intro: string;
  // Reglas del Pop.
  scope?: "grupo" | "persona"; allowLater?: boolean; required?: boolean; accepting?: boolean; privacyUrl?: string;
  folioPrefix?: string; version?: string;
  // Formularios viejos de plantilla (antes del snapshot).
  hostLabel?: string; hostInitials?: string; allowCopyAddress?: boolean;
  sections: Seccion[];
};

export type Miembro = {
  id: string; nombre: string; nombreCompleto: string; emoji: string | null; perfil: number | null;
  telefono: string | null; estado: "sin" | "completo" | "pendiente"; folio: string | null; token: string | null;
};

export type Respuestas = Record<string, unknown>;

// body.form tal como se pinta: el snapshot con las reglas del Pop (o un formulario viejo de plantilla).
export const formPublicado = (form?: Partial<FormRegistro> | null): FormRegistro | null => {
  if (!form) return null;
  const base = form.snapshot ? { ...form, ...form.snapshot } : form;
  return { ...base, title: base.title ?? "", intro: base.intro ?? "", sections: base.sections ?? [] } as FormRegistro;
};

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

const fechaValida = (s: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const f = new Date(Date.UTC(y, m - 1, d));
  return f.getUTCFullYear() === y && f.getUTCMonth() === m - 1 && f.getUTCDate() === d && y >= 1900 && y <= 2100;
};

export function errorDe(f: Campo, v: unknown): string | null {
  if (f.required && !presente(f, v))
    return f.type === "check" ? "Necesitamos tu autorización para continuar" : f.type === "single" ? "Elige una opción" : f.type === "date" ? "Elige una fecha" : "Este dato es obligatorio";
  if (!presente(f, v)) return null;
  const s = String(v).trim();
  if (f.type === "date") return fechaValida(s) ? null : "Revisa la fecha";
  if (!f.validate) return null;
  switch (f.validate) {
    case "name2": return s.split(/\s+/).length < 2 ? "Escribe nombre y apellido" : null;
    case "age16": return +s >= 16 && +s <= 110 ? null : "Escribe una edad entre 16 y 110";
    case "cp5": return /^\d{5}$/.test(s) ? null : "El código postal tiene 5 dígitos";
    case "digits4": return /^\d{4}$/.test(s) ? null : "La sección tiene 4 dígitos";
    case "phone10": return s.replace(/\D/g, "").length === 10 ? null : "Escribe 10 dígitos";
    case "email": return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s) ? null : "Revisa el correo";
    case "number": return /^\d+$/.test(s) ? null : "Escribe solo números";
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

// Línea corta del resumen: las dos primeras respuestas escritas.
export const lineaResumen = (form: FormRegistro, a: Respuestas) => {
  const campos = form.sections.flatMap((s) => s.fields);
  return campos
    .filter((f) => f.type === "text" && f.prefillFrom !== "name" && f.prefillFrom !== "phone_number" && presente(f, a[f.id]))
    .slice(0, 2).map((f) => String(a[f.id])).join(" · ");
};

// Chip del resumen: la primera respuesta de opción única.
export const chipResumen = (form: FormRegistro, a: Respuestas) => {
  const f = form.sections.flatMap((s) => s.fields).find((x) => x.type === "single" && presente(x, a[x.id]));
  return f ? String(a[f.id]) : null;
};
