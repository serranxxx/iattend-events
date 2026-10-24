export function generateSimpleId() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const chars = letters + numbers;

  let result = "";

  // Obtener 3 caracteres aleatorios para la primera parte
  for (let i = 0; i < 3; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  result += "-";

  // Obtener 3 caracteres aleatorios para la segunda parte
  for (let i = 0; i < 3; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

export function generateImagesName(length = 10) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

export function darker(hex: string | null, factor: number) {
  if (!hex) {
    return;
  }
  // Validar el formato del código hexadecimal
  if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex)) {
    console.error("Formato hexadecimal no válido");
    return null;
  }

  // Extraer los componentes de color
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);

  // Aplicar el factor para oscurecer el color
  r = Math.max(0, Math.floor(r * factor));
  g = Math.max(0, Math.floor(g * factor));
  b = Math.max(0, Math.floor(b * factor));

  // Convertir los componentes de nuevo a hexadecimal y devolver el nuevo código
  return `#${(r < 16 ? "0" : "") + r.toString(16)}${(g < 16 ? "0" : "") + g.toString(16)}${(b < 16 ? "0" : "") + b.toString(16)}`;
}

export function lighter(hex: string | null, factor: number) {
  if (!hex) {
    return;
  }
  // Validar el formato del código hexadecimal
  if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex)) {
    console.error("Formato hexadecimal no válido");
    return null;
  }

  // Extraer los componentes de color
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);

  // Aplicar el factor para aclarar el color
  r = Math.min(255, Math.floor(r + (255 - r) * factor));
  g = Math.min(255, Math.floor(g + (255 - g) * factor));
  b = Math.min(255, Math.floor(b + (255 - b) * factor));

  // Convertir los componentes de nuevo a hexadecimal y devolver el nuevo código
  return `#${(r < 16 ? "0" : "") + r.toString(16)}${(g < 16 ? "0" : "") + g.toString(16)}${(b < 16 ? "0" : "") + b.toString(16)}`;
}

// Estados cuyo huso horario real difiere del de Ciudad de México.
// Baja California sigue el horario de verano de EU (America/Tijuana),
// por lo que su diferencia con Ciudad de México varía entre 1 y 2 horas
// según la época del año.
const STATE_TIMEZONES: Record<string, string> = {
  "baja california": "America/Tijuana",
  "baja california sur": "America/Mazatlan",
  "sonora": "America/Hermosillo",
  "sinaloa": "America/Mazatlan",
  "quintana roo": "America/Cancun",
};

function normalizeStateKey(state: string): string {
  return state
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function getTimezoneForState(state?: string | null): string {
  if (!state) return "America/Mexico_City";
  return STATE_TIMEZONES[normalizeStateKey(state)] ?? "America/Mexico_City";
}

// Un valor de fecha/hora "absoluto" (instante UTC real) trae Z u offset
// explícito, ej. "2026-09-19T20:00:00.000Z". Formato legado: lo guardó
// iattend-vite convirtiendo la hora de pared del organizador con LA ZONA
// HORARIA DE SU NAVEGADOR en ese momento, no la del venue — por eso hay
// que reconvertirlo con la zona horaria correcta al mostrarlo.
export function isAbsoluteInstant(raw: string): boolean {
  return /[Zz]$|[+-]\d{2}:?\d{2}$/.test(raw.trim());
}

// Da nombre de día de la semana y de mes para una fecha (Y, M, D) sin
// depender de ninguna zona horaria: se ancla en UTC solo para poder usar
// Intl, nunca para convertir un instante real.
function getWeekdayAndMonth(y: number, m: number, d: number) {
  const anchor = new Date(Date.UTC(y, m - 1, d));
  return {
    weekday: new Intl.DateTimeFormat("es-MX", { weekday: "short", timeZone: "UTC" }).format(anchor),
    month: new Intl.DateTimeFormat("es-MX", { month: "long", timeZone: "UTC" }).format(anchor),
  };
}

// Formatea un instante UTC real (formato legado) en la zona horaria que le
// corresponde. Usa Intl.DateTimeFormat directo en vez del plugin `timezone`
// de dayjs: ese plugin calcula el offset re-parseando el resultado de
// `toLocaleString` con `new Date(...)`, y ese round-trip falla
// ("Invalid Date") en Safari/iOS.
function formatAbsoluteInstant(raw: string, timeZone: string): string {
  const normalized = raw.trim().replace(" ", "T");
  const date = new Date(/[Zz]$|[+-]\d{2}:?\d{2}$/.test(normalized) ? normalized : `${normalized}Z`);
  if (isNaN(date.getTime())) return "";

  const parts = new Intl.DateTimeFormat("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const hour = get("hour") === "24" ? "00" : get("hour");

  return `${get("weekday")}. ${get("day")} de ${get("month")}, ${hour}:${get("minute")}`;
}

// Formatea una hora de pared "absoluta" (formato nuevo): el string
// "YYYY-MM-DD HH:mm[:ss]" tal como lo escribió el organizador, sin ninguna
// zona horaria adjunta. No se convierte nunca — se muestra tal cual, por
// eso no hay bug de timezone posible en este camino.
function formatWallClock(raw: string): string {
  const match = raw.trim().match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  if (!match) return "";

  const [, yStr, mStr, dStr, hh, mm] = match;
  const { weekday, month } = getWeekdayAndMonth(Number(yStr), Number(mStr), Number(dStr));

  return `${weekday}. ${Number(dStr)} de ${month}, ${hh}:${mm}`;
}

// Formatea fecha + hora de un evento (side event / pop event) para mostrarla
// al invitado. Soporta dos formatos, para convivir con datos ya guardados
// mientras se migran:
//  - Nuevo (hora de pared absoluta): se muestra tal cual, sin conversión.
//  - Legado (instante UTC): se reconvierte con `timezone` (si ya se guardó
//    explícito) o, si no, adivinando por el estado de la dirección.
export function formatEventDateTime(
  raw: string | null | undefined,
  opts?: { state?: string | null; timezone?: string | null }
): string {
  if (!raw) return "";

  if (isAbsoluteInstant(raw)) {
    return formatAbsoluteInstant(raw, opts?.timezone || getTimezoneForState(opts?.state));
  }

  return formatWallClock(raw);
}

// Fechas de un side event: la lista de un Flash con varias fechas
// (`body.dates`) o la única (`body.hour`). Contraparte de `fechasDelEvento`
// en iattend-vite (src/helpers/assets/eventDateTime.js).
export function fechasDelEvento(body: { hour?: string | null; dates?: string[] | null } | null | undefined): string[] {
  const lista = Array.isArray(body?.dates) ? body!.dates!.filter(Boolean) : [];
  if (lista.length) return lista;
  return body?.hour ? [body.hour] : [];
}

// Contraparte de `lineasDeFechas` en iattend-vite (src/helpers/assets/eventDateTime.js).
// Renglones de fecha de un evento: si varias fechas comparten mes y hora, se
// juntan en uno ("26 y 27 de noviembre, 18:00"; con tres, "14, 15 y 16 de
// …"). Si cambian el mes o la hora, cada una va en su renglón con su día de la
// semana, como una sola fecha.
export function lineasDeFechas(
  body: { hour?: string | null; dates?: string[] | null } | null | undefined,
  opts?: { state?: string | null; timezone?: string | null }
): string[] {
  const fechas = fechasDelEvento(body);
  const partes = fechas.map((raw) => raw.trim().match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/));
  if (fechas.length < 2 || fechas.some(isAbsoluteInstant) || partes.some((p) => !p)) {
    return fechas.map((raw) => formatEventDateTime(raw, opts)).filter(Boolean);
  }

  // Se agrupan las fechas seguidas del mismo mes.
  const grupos: { clave: string; items: { p: RegExpMatchArray; raw: string }[] }[] = [];
  (partes as RegExpMatchArray[]).forEach((p, i) => {
    const clave = `${p[1]}-${p[2]}`;
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.clave === clave) ultimo.items.push({ p, raw: fechas[i] });
    else grupos.push({ clave, items: [{ p, raw: fechas[i] }] });
  });

  return grupos.flatMap(({ items }) => {
    if (items.length === 1) return [formatWallClock(items[0].raw)];
    const [, y, m] = items[0].p;
    const { month } = getWeekdayAndMonth(Number(y), Number(m), Number(items[0].p[3]));
    const dias = items.map(({ p }) => Number(p[3]));
    const lista = `${dias.slice(0, -1).join(", ")} y ${dias[dias.length - 1]} de ${month}`;
    const horas = items.map(({ p }) => `${p[4]}:${p[5]}`);
    // Misma hora: un renglón. Horas distintas: los días juntos y abajo cada
    // hora con su día de la semana ("jue 18:00 · vie 10:00 · sáb 08:00").
    if (horas.every((h) => h === horas[0])) return [`${lista}, ${horas[0]}`];
    const semana = items.map(({ p }) => getWeekdayAndMonth(Number(p[1]), Number(p[2]), Number(p[3])).weekday.replace(".", ""));
    // Si un día de la semana se repite (el 20 y el 27 son viernes), va también
    // el número para saber cuál es cuál.
    const repetido = new Set(semana).size < semana.length;
    const conDia = items.map(({ p }, i) => `${semana[i]}${repetido ? ` ${Number(p[3])}` : ""} ${horas[i]}`);
    return [lista, conDia.join(" · ")];
  });
}

// Mini itinerario de un Flash, en el orden en que el organizador lo acomodó. Con varias fechas se
// agrupa por día ("jue. 26 de noviembre"); con una, un solo grupo sin título
// (con su día).
// Los momentos sin nombre no se muestran. Contraparte de `itinerarioPorDia`
// en iattend-vite (src/helpers/assets/eventDateTime.js).
type Momento = { id: string; name: string; time: string | null; icon: number | string | null; date?: string | null; place?: string | null };
export function itinerarioPorDia(
  body: { hour?: string | null; dates?: string[] | null; itinerary?: Momento[] | null } | null | undefined
): { dia: string | null; titulo: string | null; momentos: Momento[] }[] {
  const momentos = (Array.isArray(body?.itinerary) ? body!.itinerary! : []).filter((m) => String(m?.name ?? "").trim());
  if (!momentos.length) return [];
  const dias = [...new Set(fechasDelEvento(body).map((f) => String(f).slice(0, 10)))];
  if (dias.length < 2) return [{ dia: dias[0] ?? null, titulo: null, momentos }];

  return dias
    .map((dia) => {
      const [y, m, d] = dia.split("-").map(Number);
      const { weekday, month } = getWeekdayAndMonth(y, m, d);
      return {
        dia,
        titulo: `${weekday}. ${d} de ${month}`,
        // Un momento sin día (o de un día que ya no está) va en el primero.
        momentos: momentos.filter((x) => (x.date && dias.includes(x.date) ? x.date : dias[0]) === dia),
      };
    })
    .filter((g) => g.momentos.length);
}

// Extrae solo la fecha (YYYY-MM-DD, en la zona del venue) de la fecha/hora de
// un evento, para poder buscar ese día dentro del forecast del clima. Sigue
// la misma convención de dos formatos que `formatEventDateTime`.
export function getEventDateOnly(
  raw: string | null | undefined,
  opts?: { state?: string | null; timezone?: string | null }
): string | null {
  if (!raw) return null;

  if (isAbsoluteInstant(raw)) {
    const normalized = raw.trim().replace(" ", "T");
    const date = new Date(/[Zz]$|[+-]\d{2}:?\d{2}$/.test(normalized) ? normalized : `${normalized}Z`);
    if (isNaN(date.getTime())) return null;

    const timeZone = opts?.timezone || getTimezoneForState(opts?.state);
    const parts = new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone,
    }).formatToParts(date);
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
    return `${get("year")}-${get("month")}-${get("day")}`;
  }

  const match = raw.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : null;
}

export function buttonsColorText(hex: string) {
  // Convert hex to RGB
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);

  // Calculate the luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Determine if the color is light or dark
  const isLight = luminance > 0.5;

  // Adjust color brightness
  const adjustment = 150; // You can increase this value for more contrast
  if (isLight) {
    // Make the color much darker
    r = Math.max(0, r - adjustment);
    g = Math.max(0, g - adjustment);
    b = Math.max(0, b - adjustment);
  } else {
    // Make the color much lighter
    r = Math.min(255, r + adjustment);
    g = Math.min(255, g + adjustment);
    b = Math.min(255, b + adjustment);
  }

  // Convert RGB back to hex
  const newHex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;

  return newHex;
}


// Sombra de los textos de la portada de un side event (título, fecha y
// lugar), de 0 (sin sombra) a 100. `undefined` = la sombra de siempre.
// Misma fórmula que iattend-vite/src/helpers/assets/functions.js.
export const sombraDeTexto = (n?: number | null): string | undefined => {
  if (n === undefined || n === null) return undefined;
  if (n <= 0) return "none";
  const k = n / 100;
  return `0 1px ${(2 + 4 * k).toFixed(1)}px rgba(0, 0, 0, ${(0.25 + 0.45 * k).toFixed(2)}), 0 0 ${Math.round(12 + 20 * k)}px rgba(0, 0, 0, ${(0.2 + 0.5 * k).toFixed(2)})`;
};

// Velo del fondo de un side event: el color del tema (#rrggbb) con la opacidad
// de `veil` (0–100). Sin velo, undefined. Misma regla que
// iattend-vite/src/helpers/assets/functions.js.
export const colorDeVelo = (color?: string | null, veil?: number | null): string | undefined => {
  if (!veil || veil <= 0 || !/^#[0-9a-f]{6}$/i.test(color ?? "")) return undefined;
  const alfa = Math.round((Math.min(100, veil) / 100) * 255).toString(16).padStart(2, "0");
  return `${color}${alfa}`;
};
