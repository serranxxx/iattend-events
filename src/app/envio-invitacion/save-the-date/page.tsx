import type { Metadata } from "next";
import EnvioInvitacion from "../EnvioInvitacion";

const TITLE = "¿Cuándo enviar tu save the date? | I attend";
const DESCRIPTION =
  "Responde 4 preguntas rápidas y descubre cuándo enviar tu save the date, tu invitación formal y cuándo cerrar confirmaciones.";

// Esta variante se embebe en el editor del Save the Date (iattend-vite): no
// tiene que competir en buscadores con /envio-invitacion, que es la pública.
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  robots: { index: false, follow: true },
};

export default function EnvioSaveTheDatePage() {
  return <EnvioInvitacion variant="save-the-date" />;
}
