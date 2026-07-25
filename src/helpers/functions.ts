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

// Convierte un string de fecha que llega de Supabase a un Date válido.
// Safari/iOS no puede parsear "YYYY-MM-DD HH:MM:SS" (con espacio, sin "T"),
// así que lo normalizamos antes de construir el Date. Si además no trae
// zona horaria explícita (Z u offset), asumimos UTC igual que Postgres.
function parseSupabaseDate(raw: string): Date {
  const normalized = raw.trim().replace(" ", "T");
  const hasOffset = /[Zz]$|[+-]\d{2}:?\d{2}$/.test(normalized);
  return new Date(hasOffset ? normalized : `${normalized}Z`);
}

// Formatea fecha + hora de un evento en el huso horario que corresponde
// a su estado (no siempre es el de Ciudad de México). Usa Intl.DateTimeFormat
// directamente en vez del plugin `timezone` de dayjs: ese plugin calcula el
// offset re-parseando el resultado de `toLocaleString` con `new Date(...)`,
// y ese round-trip falla ("Invalid Date") en Safari/iOS.
export function formatEventDateTime(
  isoString: string | null | undefined,
  state?: string | null
): string {
  if (!isoString) return "";

  const date = parseSupabaseDate(isoString);
  if (isNaN(date.getTime())) return "";

  const parts = new Intl.DateTimeFormat("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: getTimezoneForState(state),
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const hour = get("hour") === "24" ? "00" : get("hour");

  return `${get("weekday")}. ${get("day")} de ${get("month")}, ${hour}:${get("minute")}`;
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
