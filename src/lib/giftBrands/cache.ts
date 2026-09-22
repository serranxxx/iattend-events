import "server-only";
import { createClient } from "@/lib/supabase/server";

export type GiftBrand = {
  id: string;
  kind: "store" | "bank";
  /** Nombre canónico: el string que quedó guardado en cards[].brand / cards[].bank */
  name: string;
  /** name normalizado; clave de matcheo primaria */
  slug: string;
  /** otras formas normalizadas que también resuelven a esta marca */
  aliases: string[];
  logoUrl: string | null;
  background: string | null;
  textColor: string | null;
};

/**
 * Catálogo de marcas de mesa de regalos compartido con iattend-vite
 * (tabla `gift_brands` en Supabase). Mismo patrón que getTextures.
 *
 * Reemplaza el ALIAS_TO_KEY + BRAND_META que vivían hardcodeados en
 * classifyGiftCard.ts, y los gradientes por marca de wallet.module.css.
 * El alta de marcas nuevas es /admin → Laboratorio → Regalos en iattend-vite.
 */
export async function getGiftBrands(): Promise<GiftBrand[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("gift_brands")
    .select("id, kind, name, slug, aliases, logo_url, background, text_color")
    .order("kind")
    .order("sort_order");

  if (error) {
    console.error("Error al obtener gift_brands:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    kind: row.kind as GiftBrand["kind"],
    name: row.name,
    slug: row.slug,
    aliases: row.aliases ?? [],
    logoUrl: row.logo_url ?? null,
    background: row.background ?? null,
    textColor: row.text_color ?? null,
  }));
}
