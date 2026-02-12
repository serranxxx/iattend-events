// ❌ ya no importes imágenes desde src
// import amazon from "../../../../assets/banks/AMAZON.png";
// ...

export type GiftCard = {
  kind: "store" | "bank";
  brand?: string | null;
  bank?: string | null;
};

export type BrandKey =
  | "amazon"
  | "banamex"
  | "banorte"
  | "bbva"
  | "hsbc"
  | "liverpool"
  | "nu"
  | "palacio"
  | "santander"
  | "scotiabank"
  | "crelan"
  | "sears";

type BrandMeta = {
  className: BrandKey | "default";
  imagePath?: string; // 👉 ruta pública
};

const normalize = (s?: string) =>
  (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();

const ALIAS_TO_KEY: Record<string, BrandKey> = {
  liverpool: "liverpool",
  "el puerto de liverpool": "liverpool",
  "palacio de hierro": "palacio",
  "el palacio de hierro": "palacio",
  amazon: "amazon",
  crelan: "crelan",
  sears: "sears",
  bbva: "bbva",
  banamex: "banamex",
  citibanamex: "banamex",
  banorte: "banorte",
  santander: "santander",
  hsbc: "hsbc",
  scotiabank: "scotiabank",
  nu: "nu",
  nubank: "nu",
  "nu bank": "nu",
  "banco nu": "nu",
};

// 👇 mapea a rutas públicas
const BRAND_META: Record<BrandKey, BrandMeta> = {
  amazon: { className: "amazon", imagePath: "/assets/banks/AMAZON.png" },
  crelan: { className: "crelan", imagePath: "/assets/banks/crelan.png" },
  banamex: { className: "banamex", imagePath: "/assets/banks/BANAMEX.png" },
  banorte: { className: "banorte", imagePath: "/assets/banks/BANORTE.png" },
  bbva: { className: "bbva", imagePath: "/assets/banks/BBVA.png" },
  hsbc: { className: "hsbc", imagePath: "/assets/banks/HSBC.png" },
  liverpool: { className: "liverpool", imagePath: "/assets/banks/LIVERPOOL.png" },
  nu: { className: "nu", imagePath: "/assets/banks/NU.png" },
  palacio: { className: "palacio", imagePath: "/assets/banks/PALACIO.png" },
  santander: { className: "santander", imagePath: "/assets/banks/SANTANDER.png" },
  scotiabank: { className: "scotiabank", imagePath: "/assets/banks/SCOTIABANK.png" },
  sears: { className: "sears", imagePath: "/assets/banks/SEARS.png" },
};

export function classifyGiftCard(card: GiftCard): {
  key?: BrandKey;
  className: string;
  imageUrl: string | null; // listo para <img> o next/image
} {
  const raw = card.kind === "store" ? card.brand ?? "" : card.bank ?? "";
  const key = ALIAS_TO_KEY[normalize(raw)];
  if (!key) return { className: "default", imageUrl: null };

  const meta = BRAND_META[key];
  return { key, className: meta.className, imageUrl: meta.imagePath ?? null };
}
