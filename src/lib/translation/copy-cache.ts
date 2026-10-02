import "server-only";
import { createClient } from "@/lib/supabase/server";
import { translateInvitationObject } from "./deepl"; // ya la tienes, y sirve igual
import crypto from "crypto";

// Contexto para DeepL al traducir el copy fijo de la UI: sin él, textos cortos
// como "pase" o "PASE {i} DE {n}" se traducían como el verbo ("to pass").
// Va dentro del hash: si cambia, se vuelven a traducir todos los idiomas.
const COPY_CONTEXT =
  "Textos de la interfaz de una invitación digital (boda o evento) que ve el invitado. " +
  "\"Pase\" / \"pases\" significa el pase o boleto de entrada con código QR de cada invitado, no el verbo pasar. " +
  "Lia es el nombre de una asistente virtual. Conservar intactos los marcadores entre llaves como {name}, {n}, {i}, {total} y {time}.";

/** Calcula un hash del JSON original */
function hashJSON(obj: unknown) {
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

  // Mismo idioma que el original: se sirve tal cual. Pasarlo por DeepL
  // (español → español) alteraba textos, p. ej. "pase" → "pass".
  if (lang.toLowerCase().split("-")[0] === sourceLang.toLowerCase().split("-")[0]) {
    return source;
  }

  const sourceHash = hashJSON({ source, context: COPY_CONTEXT });

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
  const translated = await translateInvitationObject(source, lang, undefined, COPY_CONTEXT);

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