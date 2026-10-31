import { NextRequest, NextResponse } from "next/server";
import { reenviarPase } from "@/helpers/reenviarPase";

export const dynamic = "force-dynamic";

const API_URL =
  process.env.NEXT_PUBLIC_IATTEND_API_URL ??
  "https://i-attend-22z4h.ondigitalocean.app/api";

/**
 * Sirve el .pkpass del invitado como una descarga GET normal.
 *
 * Es una URL simple (sin POST ni blob:) a propósito: iOS solo entrega el pase a
 * Apple Wallet cuando el navegador *navega* a un recurso con el MIME type
 * application/vnd.apple.pkpass. Además, al ser una URL, se puede abrir en Safari
 * desde el navegador embebido de WhatsApp — que no puede presentar la hoja de Wallet.
 *
 * El pase lo arma el backend con los datos de Supabase
 * (GET /api/wallet/pase/invitacion/:invitación/:invitado): número de serie
 * fijo, avisos y direcciones en el reverso; Wallet lo vuelve a pedir allá
 * cuando cambia (iattend--backend, services/wallet/datosPase.js).
 */
export async function GET(req: NextRequest) {
  const invitationId = req.nextUrl.searchParams.get("invitation");
  const guestId = req.nextUrl.searchParams.get("guest");

  if (!invitationId || !guestId) {
    return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
  }

  return reenviarPase(`${API_URL}/wallet/pase/invitacion/${encodeURIComponent(invitationId)}/${encodeURIComponent(guestId)}`, "wallet/pass");
}
