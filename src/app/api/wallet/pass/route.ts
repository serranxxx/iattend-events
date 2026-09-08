import { NextRequest, NextResponse } from "next/server";
import { getPublicServerClient } from "@/lib/supabase/public-server";
import { NewInvitation } from "@/types/new_invitation";

export const dynamic = "force-dynamic";

const API_URL =
  process.env.NEXT_PUBLIC_IATTEND_API_URL ??
  "https://i-attend-22z4h.ondigitalocean.app/api";

const toCoverImageUrl = (src: unknown): string | null => {
  if (typeof src === "string") return src.trim() || null;
  if (Array.isArray(src)) return src.find((s) => typeof s === "string" && s.trim()) ?? null;
  return null;
};

/**
 * Sirve el .pkpass del invitado como una descarga GET normal.
 *
 * Es una URL simple (sin POST ni blob:) a propósito: iOS solo entrega el pase a
 * Apple Wallet cuando el navegador *navega* a un recurso con el MIME type
 * application/vnd.apple.pkpass. Además, al ser una URL, se puede abrir en Safari
 * desde el navegador embebido de WhatsApp — que no puede presentar la hoja de Wallet.
 */
export async function GET(req: NextRequest) {
  const invitationId = req.nextUrl.searchParams.get("invitation");
  const guestId = req.nextUrl.searchParams.get("guest");

  if (!invitationId || !guestId) {
    return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
  }

  const supabase = getPublicServerClient();

  const [{ data: invitationRow }, { data: guest }] = await Promise.all([
    supabase.from("invitations").select("data").eq("id", invitationId).maybeSingle(),
    supabase
      .from("guests")
      .select("id, name, table, invitation_id")
      .eq("id", guestId)
      .eq("invitation_id", invitationId)
      .maybeSingle(),
  ]);

  if (!invitationRow?.data || !guest) {
    return NextResponse.json({ error: "Invitación o invitado no encontrado" }, { status: 404 });
  }

  const invitation = invitationRow.data as NewInvitation;

  let tableNumber: number | null = null;
  if (guest.table) {
    const { data: table } = await supabase
      .from("tables")
      .select("number")
      .eq("id", guest.table)
      .maybeSingle();
    tableNumber = table?.number ?? null;
  }

  try {
    const res = await fetch(`${API_URL}/wallet/pass`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        guestId: guest.id,
        guestName: guest.name ?? "Invitado",
        eventName: invitation.cover.title.text.value,
        eventDate: invitation.cover.date.value,
        eventTime: invitation.itinerary.object[0]?.time ?? "",
        tableNumber,
        coverImageUrl: toCoverImageUrl(invitation.cover.image.prod),
        primaryColor: invitation.generals?.colors?.primary ?? "#FFFFFF",
        accentColor: invitation.generals?.colors?.accent ?? "#FFFFFF",
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("[wallet/pass] backend respondió", res.status);
      return NextResponse.json({ error: "No se pudo generar el pase" }, { status: 502 });
    }

    const pass = await res.arrayBuffer();

    return new NextResponse(pass, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.pkpass",
        "Content-Disposition": 'attachment; filename="i-attend-pass.pkpass"',
        "Content-Length": String(pass.byteLength),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[wallet/pass] error al generar el pase:", err);
    return NextResponse.json({ error: "No se pudo generar el pase" }, { status: 500 });
  }
}
