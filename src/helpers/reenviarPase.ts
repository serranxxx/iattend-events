import { NextResponse } from "next/server";

// Pide el .pkpass al backend y lo devuelve con el MIME de Wallet (lo usan
// /api/wallet/pass y /api/wallet/side-pass).
export async function reenviarPase(url: string, etiqueta: string) {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (res.status === 404) {
      return NextResponse.json({ error: "Evento o invitado no encontrado" }, { status: 404 });
    }
    if (!res.ok) {
      console.error(`[${etiqueta}] backend respondió`, res.status);
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
    console.error(`[${etiqueta}] error al generar el pase:`, err);
    return NextResponse.json({ error: "No se pudo generar el pase" }, { status: 500 });
  }
}
