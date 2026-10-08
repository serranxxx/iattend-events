import uiES from "@/data/ui/invitation_ui_es";
import { InvitationUIBundle, WebCopy } from "@/types/new_invitation";

// Igual que getDockCopy: el bundle traducido de Supabase puede no traer
// todavía la sección `web`; lo que falte se completa con el español base.
export function getWebCopy(ui: InvitationUIBundle | null | undefined): WebCopy {
  return { ...(uiES.web as WebCopy), ...(ui?.web ?? {}) };
}
