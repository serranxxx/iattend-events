import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Recordatorios de WhatsApp cuya plantilla en Meta trae el botón como
  // https://www.iattend.events/wedding/{{1}}: el {{1}} ya incluye la etiqueta
  // (wedding/<name>?password=…) y el link quedaba /wedding/wedding/<name>.
  // Los mensajes ya enviados no se pueden corregir, así que se redirige aquí
  // (Next conserva el ?password=).
  async redirects() {
    return [
      {
        source: "/wedding/:label(wedding|xv|bap|kids|event|party)/:name",
        destination: "/:label/:name",
        permanent: false,
      },
    ];
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: [
      "firebasestorage.googleapis.com",
      "picsum.photos",
      "jblcqcxckefmydvtrxbi.supabase.co",
    ],
  },
};

export default nextConfig;
