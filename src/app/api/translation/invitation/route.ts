import "server-only";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { translateInvitationObject } from "@/lib/translation/deepl";

function hashJSON(value: unknown) {
  return crypto.createHash("sha1").update(JSON.stringify(value ?? null)).digest("hex");
}

// Secciones de nivel raíz que sí tiene sentido mandar a traducir. "generals"
// queda afuera a propósito: deepl.ts ya lo bloquea por completo (colores,
// fuentes, texturas, el propio arreglo de idiomas) y no vale la pena ni
// contarlo como "sección traducible".
const NON_TRANSLATABLE_ROOT_KEYS = new Set(["generals"]);

// El primer idioma extra (además del español base) es gratis. Del segundo en
// adelante se descuentan créditos de invitations.credits — el mismo pool que
// ya usa Lia — vía la RPC consume_language_credits (atómica, falla si no
// alcanza). Retraducir un idioma que ya se pagó no vuelve a cobrar.
const FREE_LANGUAGES = 1;
const LANGUAGE_CREDIT_COST = 100;

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (!token) {
    return NextResponse.json({ error: "Falta token de autenticación" }, { status: 401 });
  }

  let body: { invitationId?: string; lang?: string; sections?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const { invitationId, lang, sections } = body;
  if (!invitationId || !lang) {
    return NextResponse.json({ error: "invitationId y lang son requeridos" }, { status: 400 });
  }

  // Cliente "scoped" al usuario que llama (su JWT de Supabase Auth, el mismo
  // que ya usa iattend-vite para todo lo demás). Al mandarlo como Authorization,
  // el SELECT de abajo respeta RLS de "invitations" tal cual — reutilizamos esa
  // policy existente como control de ownership en vez de reimplementarlo aquí.
  const scopedClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { data: userData, error: userError } = await scopedClient.auth.getUser(token);
  if (userError || !userData?.user) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  const { data: invitationRow, error: invitationError } = await scopedClient
    .from("invitations")
    .select("data")
    .eq("id", invitationId)
    .maybeSingle();

  if (invitationError || !invitationRow?.data) {
    return NextResponse.json({ error: "Invitación no encontrada o sin permiso" }, { status: 403 });
  }

  const fullInvitation = invitationRow.data as Record<string, unknown>;
  const requestedSections =
    Array.isArray(sections) && sections.length > 0
      ? sections
      : Object.keys(fullInvitation).filter((key) => !NON_TRANSLATABLE_ROOT_KEYS.has(key));

  // A partir de aquí ya confirmamos ownership arriba (con el cliente scoped al
  // usuario). Esta escritura sí necesita bypass de RLS porque invitation_translations
  // hoy no tiene policy de escritura para el organizador (solo lectura pública).
  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: existingRows } = await serviceClient
    .from("invitation_translations")
    .select("lang, content, section_hashes")
    .eq("invitation_id", invitationId);

  const existingRow = existingRows?.find((row) => row.lang === lang);
  const isNewLanguage = !existingRow;
  const alreadyPaidLanguages = existingRows?.length ?? 0;

  // Cobrar solo al agregar un idioma nuevo (no al retraducir uno que ya se
  // pagó), y solo a partir del segundo idioma extra.
  if (isNewLanguage && alreadyPaidLanguages >= FREE_LANGUAGES) {
    const { error: creditError } = await serviceClient.rpc("consume_language_credits", {
      p_invitation_id: invitationId,
      p_amount: LANGUAGE_CREDIT_COST,
    });

    if (creditError) {
      return NextResponse.json(
        {
          error: "NO_CREDITS",
          message: `Cada idioma adicional cuesta ${LANGUAGE_CREDIT_COST} créditos y no tienes suficientes disponibles.`,
        },
        { status: 402 }
      );
    }
  }

  const translatedSections: Record<string, unknown> = {};
  const sectionHashes: Record<string, string> = {};

  for (const key of requestedSections) {
    const sourceValue = fullInvitation[key];
    if (sourceValue === undefined || NON_TRANSLATABLE_ROOT_KEYS.has(key)) continue;

    const result = await translateInvitationObject(
      { [key]: sourceValue } as Record<string, unknown>,
      lang,
      "es"
    );
    translatedSections[key] = result[key];
    sectionHashes[key] = hashJSON(sourceValue);
  }

  // "generals" nunca se traduce, pero sí tiene que estar presente en el
  // contenido traducido (colores, fuentes, texturas) o cualquier componente
  // que renderice esta invitación crashea leyendo generals.* — se refleja
  // siempre desde la fuente en español, nunca desde una copia vieja.
  const mergedContent = {
    ...(existingRow?.content ?? {}),
    ...translatedSections,
    generals: fullInvitation.generals,
  };
  const mergedHashes = { ...(existingRow?.section_hashes ?? {}), ...sectionHashes };

  const { error: upsertError } = await serviceClient.from("invitation_translations").upsert(
    {
      invitation_id: invitationId,
      lang,
      source_hash: hashJSON(fullInvitation),
      content: mergedContent,
      section_hashes: mergedHashes,
    },
    { onConflict: "invitation_id,lang" }
  );

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({ content: mergedContent, section_hashes: mergedHashes });
}
