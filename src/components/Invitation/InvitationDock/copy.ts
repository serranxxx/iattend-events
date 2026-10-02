import uiES from "@/data/ui/invitation_ui_es";
import { DockCopy, InvitationUIBundle } from "@/types/new_invitation";

// El bundle traducido viene de Supabase (`copy_bundles`) y puede no traer
// todavía la sección `dock`: lo que falte se completa con el español base.
export function getDockCopy(ui: InvitationUIBundle | null | undefined): DockCopy {
  return { ...(uiES.dock as DockCopy), ...(ui?.dock ?? {}) };
}

// Reemplaza {llave} por su valor: fmt("Hola, {name}", { name: "Ana" }).
export function fmt(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (match, key) => (key in vars ? String(vars[key]) : match));
}
