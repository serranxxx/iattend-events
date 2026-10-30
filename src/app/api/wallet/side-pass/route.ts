import { NextRequest, NextResponse } from "next/server";
import { getPublicServerClient } from "@/lib/supabase/public-server";
import { qrPaseSide } from "@/helpers/paseSide";
import type { SideEventBody } from "@/types/side_event";

export const dynamic = "force-dynamic";

const API_URL =
  process.env.NEXT_PUBLIC_IATTEND_API_URL ??
  "https://i-attend-22z4h.ondigitalocean.app/api";

const ESTADOS_CON_PASE = ["confirmado", "asistente"];

/**
 * .pkpass del pase de un side event / Flash (el que abre "Ver mi pase").
 * Gemela de /api/wallet/pass (invitaciones): misma descarga GET por la misma
 * razón (iOS solo entrega el pase a Wallet al *navegar* a la URL), pero lee
 * `side_events_guests` y `side_events.body`. El QR lleva "side:<id>", igual
 * que el de PaseFlash, y en lugar de la mesa van las personas del pase y el
 * folio del formulario (o el código del invitado si no hay folio).
 */
export async function GET(req: NextRequest) {
  const eventId = req.nextUrl.searchParams.get("event");
  const guestId = req.nextUrl.searchParams.get("guest");

  if (!eventId || !guestId) {
    return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
  }

  const supabase = getPublicServerClient();

  const [{ data: evento }, { data: guest }] = await Promise.all([
    supabase.from("side_events").select("id, name, body, url_image").eq("id", eventId).maybeSingle(),
    supabase
      .from("side_events_guests")
      .select("id, name, state, password, side_events_id")
      .eq("id", guestId)
      .eq("side_events_id", eventId)
      .maybeSingle(),
  ]);

  if (!evento?.body || !guest || !ESTADOS_CON_PASE.includes(guest.state)) {
    return NextResponse.json({ error: "Evento o invitado no encontrado" }, { status: 404 });
  }

  const body = evento.body as SideEventBody;
  // Hora de pared "YYYY-MM-DD HH:mm:00" (sin huso, ver helpers/functions.ts).
  const hora = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})/.exec(String(body.hour ?? ""));
  if (!hora) {
    return NextResponse.json({ error: "El evento no tiene fecha" }, { status: 422 });
  }

  const { data: acompanantes } = await supabase
    .from("side_events_guests")
    .select("id")
    .eq("companion_id", guest.id)
    .in("state", ESTADOS_CON_PASE);
  const personas = 1 + (acompanantes?.length ?? 0);

  // Folio del titular, del mismo endpoint que lee la página (useEstadoRegistro).
  let folio: string | null = null;
  if (body.form?.enabled && guest.password) {
    try {
      const res = await fetch(`${API_URL}/side-events/${evento.id}/registro`, {
        headers: { "x-codigo-invitado": guest.password },
        cache: "no-store",
      });
      const data = await res.json();
      if (res.ok && data.ok) folio = data.miembros?.[0]?.folio ?? null;
    } catch (err) {
      console.warn("[wallet/side-pass] sin folio:", err);
    }
  }

  const clave = folio || guest.password;

  try {
    const res = await fetch(`${API_URL}/wallet/pass`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        // El backend usa guestId como contenido del QR: va con el prefijo.
        guestId: qrPaseSide(guest.id),
        guestName: guest.name ?? "Invitado",
        eventName: evento.name ?? "Evento",
        eventDate: `${hora[1]}T${hora[2]}:00`,
        eventTime: hora[2],
        coverImageUrl: body.image || evento.url_image || null,
        primaryColor: body.color ?? "#2A2730",
        accentColor: "#FFFFFF",
        auxFields: [
          { label: "Personas", value: personas },
          ...(clave ? [{ label: folio ? "Folio" : "Código", value: clave }] : []),
        ],
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("[wallet/side-pass] backend respondió", res.status);
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
    console.error("[wallet/side-pass] error al generar el pase:", err);
    return NextResponse.json({ error: "No se pudo generar el pase" }, { status: 500 });
  }
}
