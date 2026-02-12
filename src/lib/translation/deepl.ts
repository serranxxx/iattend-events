// /lib/translation/deepl.ts
import "server-only";
import * as deepl from "deepl-node";

const apiKey = process.env.DEEPL_API_KEY!;
const translator = new deepl.Translator(apiKey);

/* ============ REGLAS ============ */

// Subárboles completos que NO se traducen
const BLOCKED_SUBTREES = new Set<string>([
  "generals",                       // todo generals
  "cover.title.position",           // position del cover
  "quote.text",                     // bloqueamos y re-abrimos selectivo abajo
  "gifts.cards",                    // los objetos de cards no se tocan
]);

// Rutas exactas que NO se traducen
const DONT_TRANSLATE_PATHS = new Set<string>([
  "quote.text.align",
  "quote.text.justify",
  // people: nombres propios NO traducir
  "people.personas[*].description",
  // destinations: type NO traducir
  "destinations.cards[*].type",
]);

// En address: SOLO traducir estos tres campos
const ADDRESS_ALLOW_ONLY = new Set(["street", "city", "country"]);

// Claves (último segmento) que NO se traducen nunca
const DONT_TRANSLATE_KEYS = new Set([
  "url","prod","dev","image","brand","bank","zip","state","city","country",
  "street","number","neighborhood","code","id","slug","typeFace",
]);

// Patrones que NO se traducen
const DONT_TRANSLATE_REGEX: RegExp[] = [
  /^(https?:\/\/|www\.)/i,                  // URLs
  /^[\w.+-]+@[\w.-]+\.[a-z]{2,}$/i,         // emails
  /^#[0-9a-f]{3,8}$/i,                      // color hex
  /^[0-9\s:+-]+$/i,                         // solo números/hora
];

// Helper: path -> string legible con comodines [*]
function pathToString(path: (string|number)[]): string {
  return path
    .map(p => typeof p === "number" ? `[*]` : String(p))
    .join(".");
}
function startsWithAny(pathStr: string, prefixes: Set<string>): boolean {
  for (const p of prefixes) {
    if (pathStr === p || pathStr.startsWith(p + ".")) return true;
  }
  return false;
}

// ¿Este path está bloqueado por subárbol?
function isBlockedSubtree(pathStr: string): boolean {
  // Permitir selectivos dentro de quote.text (abrimos manualmente)
  if (pathStr.startsWith("quote.text.")) {
    // permitimos SOLO "font.value" dentro de quote.text
    // (tu ejemplo traduce la cita; si quieres otra cosa, ajusta)
    if (pathStr === "quote.text.font.value") return false;
    return true; // todo lo demás dentro de quote.text bloqueado
  }
  return startsWithAny(pathStr, BLOCKED_SUBTREES);
}

/* ============ RECOLECTOR ============ */

type WalkedItem = { path: (string | number)[]; value: string };

function shouldTranslateString(value: string, keyPath: string[], fullPath: string): boolean {
  const v = value.trim();
  if (v.length < 2) return false;

  // Subárboles bloqueados
  if (isBlockedSubtree(fullPath)) return false;

  // Rutas exactas bloqueadas (con [*] soportado)
  if (DONT_TRANSLATE_PATHS.has(fullPath)) return false;

  // Heurística general por patrón
  if (DONT_TRANSLATE_REGEX.some(rx => rx.test(v))) return false;

  // Claves técnicas (último segmento)
  const lastKey = keyPath[keyPath.length - 1]?.toLowerCase() || "";
  if (DONT_TRANSLATE_KEYS.has(lastKey)) return false;

  // Reglas especiales por sección:

  // people.personas[*].description -> NO traducir
  if (fullPath.endsWith(".personas.[*].description")) return false;

  // gifts.cards[*].* -> NO traducir nada
  if (fullPath.startsWith("gifts.cards.[*].")) return false;

  // destinations.cards[*].type -> NO traducir
  if (fullPath.endsWith(".cards.[*].type")) return false;

  // address: solo street, city, country
  if (fullPath.endsWith(".address.url")) return false;
  if (fullPath.includes(".address.")) {
    // si estamos dentro de address.* y es string, solo permitir estas keys
    if (!ADDRESS_ALLOW_ONLY.has(lastKey)) return false;
  }

  return true;
}

export function collectTranslatableStrings(obj: any, path: (string|number)[] = [], out: WalkedItem[] = []) {
  if (obj == null) return out;

  if (typeof obj === "string") {
    const keyPath = path.map(String);
    const fullPath = pathToString(path);
    if (shouldTranslateString(obj, keyPath, fullPath)) {
      out.push({ path, value: obj });
    }
    return out;
  }

  if (Array.isArray(obj)) {
    obj.forEach((item, i) => collectTranslatableStrings(item, [...path, i], out));
    return out;
  }

  if (typeof obj === "object") {
    Object.entries(obj).forEach(([k, v]) => collectTranslatableStrings(v, [...path, k], out));
  }
  return out;
}

/* ============ TRADUCCIÓN ============ */

export async function translateStringsBatch(
  values: string[],
  targetLang: string,
  sourceLang?: deepl.SourceLanguageCode
) {
  if (values.length === 0) return [];
  const result = await translator.translateText(
    values,
    (sourceLang ?? null) as deepl.SourceLanguageCode | null,
    targetLang as deepl.TargetLanguageCode
  ) as deepl.TextResult | deepl.TextResult[];
  return Array.isArray(result) ? result.map(r => r.text) : [result.text];
}

export async function translateInvitationObject<T extends Record<string, any>>(
  invitation: T,
  targetLang: string,
  sourceLang?: deepl.SourceLanguageCode
): Promise<T> {
  const items = collectTranslatableStrings(invitation);
  if (items.length === 0) return invitation;

  const translated = await translateStringsBatch(
    items.map(i => i.value),
    targetLang,
    sourceLang
  );

  const clone: any = structuredClone(invitation);
  items.forEach((item, idx) => {
    let ref = clone;
    const steps = [...item.path];
    const last = steps.pop()!;
    for (const s of steps) ref = ref[s as any];
    ref[last as any] = translated[idx];
  });

  return clone as T;
}