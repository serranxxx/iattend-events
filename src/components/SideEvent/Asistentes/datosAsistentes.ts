import { profilesMap } from "@/components/ConfirmCard/profiles";

/*
  Asistentes de un Flash (side event sin invitación, `body.showAttendees`).
  La lista sale de GET /api/side-events/:id/asistentes (iattend--backend,
  router/sideEventPublic.js): solo primer nombre, iniciales y avatar.
  Avatar = emoji y/o color que el invitado eligió al confirmar
  (side_events_guests.emoji / .profile, índice de `profiles`). Sin ellos, un
  emoji y un color fijos por invitado (salen de su id): nunca letras.
  Contraparte en el editor: iattend-vite/src/modules/SideEvents/asistentesMuestra.js.
*/

export type Asistente = {
  id: string;
  nombre: string;
  iniciales: string;
  emoji: string | null;
  perfil: number | null;
  // Id del titular si es acompañante (side_events_guests.companion_id): la
  // tarjeta los junta en una cápsula "Antonio +2".
  titular?: string | null;
};

export type ListaAsistentes = { total: number; asistentes: Asistente[]; ejemplo?: boolean };

export const EMOJIS_AVATAR = [
  "🎉", "🥂", "💃", "🕺", "🍾", "✨", "🥳", "😎", "🌸", "💐", "🤍", "❤️",
  "🎶", "🪩", "🔥", "🌟", "🦋", "🌻", "🍸", "🎂", "👑", "😍", "🌈", "🎊",
];

// Modo de los avatares que elige el organizador (body.attendeesStyle):
// "emoji" (por omisión, colores alegres) o "initials" (iniciales, colores
// sobrios). Con iniciales el invitado no elige nada.
export type ModoAvatar = "emoji" | "initials";
export const modoAvatar = (estilo?: string | null): ModoAvatar => (estilo === "initials" ? "initials" : "emoji");

// Colores alegres (modo emoji): la paleta de perfiles sin grises, café ni marino.
export const PERFILES_AVATAR = [1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 13].filter((id) => profilesMap[id]);

// Colores sobrios (modo iniciales): [claro, oscuro].
const FORMALES: [string, string][] = [
  ["#2F3B52", "#1F2839"], ["#4A4E57", "#33363D"], ["#5B6B73", "#45525A"], ["#7A6A58", "#5E5143"],
  ["#3F5A4A", "#2D4236"], ["#6B3F48", "#4F2E35"], ["#8C7B5E", "#6E6049"], ["#4B4F6B", "#363950"],
];

const hashDe = (id: string, semilla: number) => {
  let h = semilla;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
};

// Color fijo de quien no eligió: el mismo en cada visita.
export const perfilDe = (a: { id: string; perfil: number | null }) => {
  if (a.perfil != null && profilesMap[a.perfil]) return a.perfil;
  return PERFILES_AVATAR[hashDe(a.id, 0) % PERFILES_AVATAR.length];
};

// Emoji de quien no eligió: uno de la lista, fijo por invitado (sin letras).
export const emojiDe = (a: { id: string; emoji: string | null }) =>
  a.emoji || EMOJIS_AVATAR[hashDe(a.id, 7) % EMOJIS_AVATAR.length];

// Al abrir la confirmación de alguien nuevo (sin id todavía): emoji y color al
// azar ya elegidos, para que lo que ve sea lo que se guarda.
export const avatarAlAzar = () => ({
  emoji: EMOJIS_AVATAR[Math.floor(Math.random() * EMOJIS_AVATAR.length)],
  perfil: PERFILES_AVATAR[Math.floor(Math.random() * PERFILES_AVATAR.length)],
});

const formalDe = (id: string) => FORMALES[hashDe(id, 3) % FORMALES.length];

export const fondoDe = (a: { id: string; perfil: number | null }, modo: ModoAvatar = "emoji") => {
  if (modo === "initials") { const [claro, oscuro] = formalDe(a.id); return `linear-gradient(to bottom, ${claro}, ${oscuro})`; }
  return profilesMap[perfilDe(a)].gradient;
};
export const brilloDe = (a: { id: string; perfil: number | null }, modo: ModoAvatar = "emoji") =>
  modo === "initials" ? formalDe(a.id)[0] : profilesMap[perfilDe(a)].light;

// Tono oscuro de cada quien (burbujas del chat).
export const oscuroDe = (a: { id: string; perfil: number | null }, modo: ModoAvatar = "emoji") =>
  modo === "initials" ? formalDe(a.id)[1] : profilesMap[perfilDe(a)].dark;

// Lo que va dentro del círculo según el modo.
export const contenidoDe = (a: { id: string; emoji: string | null; iniciales: string }, modo: ModoAvatar = "emoji") =>
  modo === "initials" ? a.iniciales : emojiDe(a);

// Solo letras: "Abuela (Lupita)" → "AL", no "A(".
export const inicialesDe = (nombre?: string | null) =>
  (nombre ?? "").trim().split(/\s+/).map((p) => p.match(/\p{L}/u)?.[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "?";

// Mientras nadie confirma, la vista previa del organizador (editor y "Ver en
// vivo") enseña cómo se verá. Nunca se muestra a los invitados.
// [nombre, emoji, perfil, índice del titular si es acompañante]
export const ASISTENTES_EJEMPLO: Asistente[] = ([
  ["Sofía Ramírez", "🎉", 1, null], ["Diego Torres", null, null, 0], ["Valeria Cruz", "💃", 11, 0],
  ["Mateo Herrera", "🍾", 5, null], ["Camila Ortiz", null, 13, 3], ["Andrés Molina", "🕺", null, null],
  ["Regina Salas", "🥂", 3, null], ["Emilio Vargas", null, null, 6], ["Lucía Navarro", "🌸", 13, null],
  ["Santiago Ríos", "😎", 7, null], ["Daniela Fuentes", null, null, 9], ["Pablo Medina", "🎶", 10, 9],
  ["Mariana León", "✨", 2, null], ["Rodrigo Peña", null, 6, null],
] as [string, string | null, number | null, number | null][]).map(([nombre, emoji, perfil, titular], i) => ({
  id: `ejemplo-${i}`,
  nombre: nombre.split(" ")[0],
  iniciales: inicialesDe(nombre),
  emoji,
  perfil,
  titular: titular == null ? null : `ejemplo-${titular}`,
}));

// Unidades de la tarjeta abierta: un pase (titular + acompañantes que
// confirmaron) en una cápsula, o alguien solo. Si el titular no está en la
// lista (no confirmó), su acompañante va solo. Orden: el de la lista (más
// reciente primero) por el primero de cada unidad que aparece.
export type Unidad = { id: string; miembros: Asistente[]; etiqueta: string };
export const unidadesDe = (lista: Asistente[]): Unidad[] => {
  const porId = new Map(lista.map((a) => [a.id, a]));
  const grupos = new Map<string, Asistente[]>();
  for (const a of lista) {
    const raiz = a.titular && porId.has(a.titular) ? a.titular : a.id;
    if (!grupos.has(raiz)) grupos.set(raiz, []);
    grupos.get(raiz)!.push(a);
  }
  return [...grupos.entries()].map(([id, ms]) => {
    const titular = porId.get(id)!;
    const miembros = [titular, ...ms.filter((m) => m.id !== id)];
    return { id, miembros, etiqueta: miembros.length > 1 ? `${titular.nombre} +${miembros.length - 1}` : titular.nombre };
  });
};

export const LISTA_EJEMPLO: ListaAsistentes = { total: ASISTENTES_EJEMPLO.length, asistentes: ASISTENTES_EJEMPLO, ejemplo: true };

export const cargarAsistentes = async (sideEventId: number | string): Promise<ListaAsistentes | null> => {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_IATTEND_API_URL}/side-events/${sideEventId}/asistentes`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.ok) return null;
    return { total: Number(data.total) || 0, asistentes: Array.isArray(data.asistentes) ? data.asistentes : [] };
  } catch {
    return null;
  }
};
