import "server-only";
import { CSSProperties } from "react";
import { createClient } from "@/lib/supabase/server";

export type Texture = {
  id: number;
  image: string;
  opacity: number;
  blend: CSSProperties["mixBlendMode"];
  filter: CSSProperties["filter"];
};

/**
 * Catálogo de texturas compartido con iattend-vite (tabla `textures` en Supabase).
 * No ligado a una invitación específica -- mismo patrón que getTranslatedCopy.
 */
export async function getTextures(opts?: { includeInactive?: boolean }): Promise<Texture[]> {
  const supabase = await createClient();

  let query = supabase
    .from("textures")
    .select("id, image_url, opacity, blend, filter")
    .order("sort_order");

  if (!opts?.includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error al obtener texturas:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    image: row.image_url,
    opacity: row.opacity,
    blend: row.blend as CSSProperties["mixBlendMode"],
    filter: row.filter ?? undefined,
  }));
}
