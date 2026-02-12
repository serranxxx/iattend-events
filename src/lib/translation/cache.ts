// /lib/translation/cache.ts
import "server-only";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { translateInvitationObject } from "./deepl";

export function hashInvitation(invitation: any) {
  return crypto
    .createHash("sha1")
    .update(JSON.stringify(invitation))
    .digest("hex");
}

type GetTranslatedParams = {
  invitationId: string;    // mongoID u otro id único
  invitation: any;         // JSON original
  lang: string;            // 'nl', 'en', ...
  sourceLang?: string;     // opcional: 'es'
};

export async function getTranslatedInvitationFromCache({
  invitationId,
  invitation,
  lang,
  sourceLang,
}: GetTranslatedParams) {
  const supabase = await createClient();
  const source_hash = hashInvitation(invitation);

  // 1) Busca cache
  const { data: row, error } = await supabase
    .from("invitation_translations")
    .select("content, source_hash")
    .eq("invitation_id", invitationId)
    .eq("lang", lang)
    .maybeSingle();

    if (!error && row && row.content) {
      return row.content; 
    }

  // 2) Traduce
  const translated = await translateInvitationObject(invitation, lang, sourceLang as any);

  // 3) Upsert
  await supabase.from("invitation_translations").upsert(
    {
      invitation_id: invitationId,
      lang,
      source_hash,
      content: translated,
    },
    { onConflict: "invitation_id,lang" }
  );

  return translated;
}