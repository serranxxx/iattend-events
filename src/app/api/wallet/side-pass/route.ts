import { NextRequest, NextResponse } from "next/server";
import { reenviarPase } from "@/helpers/reenviarPase";

export const dynamic = "force-dynamic";

const API_URL =
  process.env.NEXT_PUBLIC_IATTEND_API_URL ??
  "https://i-attend-22z4h.ondigitalocean.app/api";

/**
 * .pkpass del pase de un side event / Pop (el que abre "Ver mi pase").
 * Gemela de /api/wallet/pass (invitaciones): misma descarga GET por la misma
 * razón (iOS solo entrega el pase a Wallet al *navegar* a la URL). Lo arma
 * el backend (GET /api/wallet/pase/side/:evento/:invitado): el QR lleva
 * "side:<id>" como el de PasePop, solo con invitados confirmados, y en
 * lugar de la mesa van las personas del pase y el folio del formulario (o
 * el código del invitado si no hay folio).
 */
export async function GET(req: NextRequest) {
  const eventId = req.nextUrl.searchParams.get("event");
  const guestId = req.nextUrl.searchParams.get("guest");
  // Código del invitado: el backend lo pide junto al código público del evento.
  const codigo = req.nextUrl.searchParams.get("codigo");

  if (!eventId || !guestId) {
    return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
  }

  return reenviarPase(`${API_URL}/wallet/pase/side/${encodeURIComponent(eventId)}/${encodeURIComponent(guestId)}`, "wallet/side-pass", codigo ? { "x-codigo-invitado": codigo } : undefined);
}
