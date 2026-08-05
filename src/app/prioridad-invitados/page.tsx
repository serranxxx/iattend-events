import type { Metadata } from "next";
import PrioridadInvitados from "./PrioridadInvitados";

const TITLE = "Conoce la prioridad del invitado | I attend";
const DESCRIPTION =
  "3 preguntas rápidas, sin adivinar: descubre qué tan prioritario es un invitado para tu lista.";
const IMAGE_URL = "https://jblcqcxckefmydvtrxbi.supabase.co/storage/v1/object/public/landing/7.jpg";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "prioridad de invitados",
    "lista de invitados boda",
    "a quién invitar a mi boda",
    "planeación de bodas",
    "I attend",
  ],
  authors: [{ name: "I attend" }],
  creator: "I attend",
  metadataBase: new URL("https://iattend.site"),
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://iattend.site/prioridad-invitados",
    siteName: "I attend",
    images: [
      {
        url: IMAGE_URL,
        width: 1920,
        height: 1079,
        alt: "I attend – Conoce la prioridad del invitado",
      },
    ],
    locale: "es_MX",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [IMAGE_URL],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrioridadInvitadosPage() {
  return <PrioridadInvitados />;
}
