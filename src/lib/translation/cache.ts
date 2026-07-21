// /lib/translation/cache.ts
import "server-only";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { translateInvitationObject } from "./deepl";
import type { SourceLanguageCode } from "deepl-node";
import type { NewInvitation } from "@/types/new_invitation";

export function hashInvitation(invitation: unknown) {
  return crypto
    .createHash("sha1")
    .update(JSON.stringify(invitation))
    .digest("hex");
}

type GetTranslatedParams = {
  invitationId: string;
  invitation: NewInvitation;
  lang: string;
  sourceLang?: string;
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
  const translated = await translateInvitationObject(invitation as unknown as Record<string, unknown>, lang, sourceLang as SourceLanguageCode | undefined) as unknown as NewInvitation;

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