import dayjs from "dayjs";

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

export function formatDate(dateString: string) {
  if (!dateString) return "";

  // Nos quedamos solo con YYYY-MM-DD
  const ymd = dateString.slice(0, 10); // "2026-04-04"
  const [y, m, d] = ymd.split("-").map(Number);

  // Creamos fecha en UTC (no se mueve por timezone del usuario)
  const utcDate = new Date(Date.UTC(y, m - 1, d));

  return utcDate.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC", // clave
  });
}

export function getMexicoHour(utcString: string): string {
  const date = new Date(utcString);

  // Usa la hora "local" del objeto Date (sin aplicar TZ manual)
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  return `${hours}:${minutes}`;
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
