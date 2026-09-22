import type { GiftBrand } from "@/lib/giftBrands/cache";

export type GiftCard = {
  kind: "store" | "bank";
  brand?: string | null;
  bank?: string | null;
};

export type ResolvedGiftBrand = {
  /** la marca del catálogo, o null si el string guardado no resuelve a ninguna */
  brand: GiftBrand | null;
  /** clave normalizada del string guardado; sirve como key estable de render */
  key: string;
  logoUrl: string | null;
  background: string | null;
  textColor: string | null;
};

/**
 * Espejo de public.gift_brand_key() en SQL y de normalizarClave() en
 * iattend-vite (controllers/adminGiftBrands.js y GiftBrandLabPage.jsx).
 * Si cambia uno, cambian los tres.
 */
export const normalizeBrandKey = (s?: string | null) =>
  (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Resuelve la tarjeta contra el catálogo `gift_brands`.
 *
 * Una tarjeta guarda el NOMBRE de la marca como texto libre (cards[].brand para
 * tiendas, cards[].bank para bancos), no un id: el matcheo es por slug o por
 * alias, ambos normalizados. Si no resuelve, la tarjeta se pinta sin logo ni
 * fondo de marca — en /admin → Laboratorio → Regalos aparecen justamente esos
 * valores para darlos de alta como alias.
 */
export function resolveGiftBrand(card: GiftCard, brands: GiftBrand[]): ResolvedGiftBrand {
  const key = normalizeBrandKey(card.kind === "store" ? card.brand : card.bank);

  const brand =
    brands.find((b) => b.kind === card.kind && (b.slug === key || b.aliases.includes(key))) ??
    // Fallback por si una tarjeta vieja guardó la marca en el campo del otro
    // tipo (p. ej. un banco escrito en `brand`).
    brands.find((b) => b.slug === key || b.aliases.includes(key)) ??
    null;

  return {
    brand,
    key: key || "sin-marca",
    logoUrl: brand?.logoUrl ?? null,
    background: brand?.background ?? null,
    textColor: brand?.textColor ?? null,
  };
}
