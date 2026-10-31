import { NextRequest, NextResponse } from "next/server";
import { reenviarPase } from "@/helpers/reenviarPase";

export const dynamic = "force-dynamic";

const API_URL =
  process.env.NEXT_PUBLIC_IATTEND_API_URL ??
  "https://i-attend-22z4h.ondigitalocean.app/api";

/**
 * .pkpass del pase de un side event / Flash (el que abre "Ver mi pase").
 * Gemela de /api/wallet/pass (invitaciones): misma descarga GET por la misma
 * razón (iOS solo entrega el pase a Wallet al *navegar* a la URL). Lo arma
 * el backend (GET /api/wallet/pase/side/:evento/:invitado): el QR lleva
 * "side:<id>" como el de PaseFlash, solo con invitados confirmados, y en
 * lugar de la mesa van las personas del pase y el folio del formulario (o
 * el código del invitado si no hay folio).
 */
export async function GET(req: NextRequest) {
  const eventId = req.nextUrl.searchParams.get("event");
  const guestId = req.nextUrl.searchParams.get("guest");

  if (!eventId || !guestId) {
    return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
  }

  return reenviarPase(`${API_URL}/wallet/pase/side/${encodeURIComponent(eventId)}/${encodeURIComponent(guestId)}`, "wallet/side-pass");
}
