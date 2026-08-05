import type { Metadata } from "next";
import EnvioInvitacion from "./EnvioInvitacion";

const TITLE = "¿Cuándo enviar tu invitación? | I attend";
const DESCRIPTION =
  "Responde 4 preguntas rápidas y descubre cuándo enviar tu save the date, tu invitación formal y cuándo cerrar confirmaciones.";
const IMAGE_URL = "/assets/images/7.jpg";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "cuándo enviar invitaciones de boda",
    "save the date",
    "invitación de boda",
    "planeación de bodas",
    "I attend",
  ],
  authors: [{ name: "I attend" }],
  creator: "I attend",
  metadataBase: new URL("https://iattend.site"),
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://iattend.site/envio-invitacion",
    siteName: "I attend",
    images: [
      {
        url: IMAGE_URL,
        width: 8000,
        height: 4500,
        alt: "I attend – ¿Cuándo enviar tu invitación?",
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

export default function EnvioInvitacionPage() {
  return <EnvioInvitacion />;
}
