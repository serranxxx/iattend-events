import "server-only";
import { NextResponse } from "next/server";
import { getTranslatedCopy } from "@/lib/translation/copy-cache";

// Copy de UI (botones, labels, contador) para el preview de /host — llamado
// same-origin desde HostClient.tsx (client component), que no puede importar
// getTranslatedCopy directo porque es server-only.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get("lang");

  if (!lang) {
    return NextResponse.json({ error: "lang es requerido" }, { status: 400 });
  }

  try {
    const ui = await getTranslatedCopy("invitation_ui_v1", lang, "es");
    return NextResponse.json({ ui });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
