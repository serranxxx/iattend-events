import "server-only";
import { createClient } from "@/lib/supabase/server";
import { translateInvitationObject } from "./deepl"; // ya la tienes, y sirve igual
import crypto from "crypto";

/** Calcula un hash del JSON original */
function hashJSON(obj: any) {
  return crypto.createHash("sha1").update(JSON.stringify(obj)).digest("hex");
}

/**
 * Traduce y cachea bundles de UI (no ligados a una invitación).
 */
export async function getTranslatedCopy(
  slug: string,
  lang: string,
  sourceLang = "es"
) {
  const supabase = await createClient();

  // 1️⃣ Buscar el bundle base
  const { data: bundle, error: bundleErr } = await supabase
    .from("copy_bundles")
    .select("id, json")
    .eq("slug", slug)
    .maybeSingle();

  if (bundleErr) throw new Error(`❌ Error al leer bundle ${slug}: ${bundleErr.message}`);
  if (!bundle) throw new Error(`❌ Bundle no encontrado: ${slug}`);

  const source = bundle.json;
  const sourceHash = hashJSON(source);

  // 2️⃣ Buscar traducción cacheada existente
  const { data: existing } = await supabase
    .from("copy_translations")
    .select("json, source_hash")
    .eq("bundle_id", bundle.id)
    .eq("lang", lang)
    .maybeSingle();

  if (existing && existing.source_hash === sourceHash) {
    return existing.json;
  }

  // 3️⃣ Traducir con DeepL (traducción libre, sin filtros)
  console.log(`🌍 Traduciendo UI bundle '${slug}' a ${lang}...`);
  const translated = await translateInvitationObject(source, lang);

  // 4️⃣ Guardar o actualizar en cache
  const { error: upsertErr } = await supabase.from("copy_translations").upsert(
    {
      bundle_id: bundle.id,
      lang,
      source_hash: sourceHash,
      json: translated,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "bundle_id,lang" }
  );

  if (upsertErr) {
    console.error("⚠️ Error guardando traducción UI:", upsertErr.message);
  }

  return translated;
}