import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Mismos orígenes que ya confía /host (src/app/host/HostClient.tsx) para el
// iframe de preview — reutilizamos la lista para las API routes de traducción
// que ahora llama iattend-vite directo desde el navegador del organizador.
const ALLOWED_ORIGINS = [
  "http://localhost:3001",
  "http://localhost:3000",
  "http://localhost:3050", // puerto usado por el launch.json de iattend-vite en este entorno de preview
  "https://www.iattend.mx",
  "https://www.iattend.site",
];

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "";
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : "";

  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": allowOrigin,
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  const response = NextResponse.next();
  if (allowOrigin) {
    response.headers.set("Access-Control-Allow-Origin", allowOrigin);
    response.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }
  return response;
}

export const config = {
  matcher: ["/api/translation/:path*"],
};
