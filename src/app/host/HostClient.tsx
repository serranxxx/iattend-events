"use client";
import Invitation from "@/components/Invitation/Invitation/Invitation";
import uiES from "@/data/ui/invitation_ui_es";
import { InvitationType, InvitationUIBundle, NewInvitation } from "@/types/new_invitation";
import { Texture } from "@/lib/textures/cache";
import { useCallback, useEffect, useRef, useState } from "react";



// 👇 Lista de orígenes permitidos
const ALLOWED_ORIGINS = [
  "http://localhost:3001",
  "http://localhost:3000",
  "https://www.iattend.mx",
  "https://www.iattend.site",
];

type Props = {
  textures: Texture[];
};

export default function HostClient({ textures }: Props) {
  const [invitation, setInvitation] = useState<NewInvitation | null>(null);
  const [textureOverride, setTextureOverride] = useState<Texture | null>(null);
  const [hostOrigin, setHostOrigin] = useState<string | null>(null);
  const [scrollToSection, setScrollToSection] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Handshake inicial
  useEffect(() => {
    ALLOWED_ORIGINS.forEach((origin) => {
      window.parent?.postMessage({ type: "REMOTE_READY" }, origin);
    });
  }, []);

  // Escuchar mensajes del host
  useEffect(() => {
    function onMessage(ev: MessageEvent) {
      if (!ALLOWED_ORIGINS.includes(ev.origin)) return;
      const { type, payload } = ev.data || {};
      if (!hostOrigin) setHostOrigin(ev.origin);
      if (type === "HOST_PROPS" && payload?.invitationConfig) {
        setInvitation(payload.invitationConfig as NewInvitation);
        setTextureOverride((payload.textureOverride as Texture) ?? null);
      }
      if (type === "HOST_SCROLL_TO" && payload?.section) {
        setScrollToSection(payload.section as string);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [hostOrigin]);

  // Reportar al host la sección visible mientras el invitado navega
  const handleSectionChange = useCallback((section: string) => {
    if (!hostOrigin) return;
    window.parent?.postMessage({ type: "REMOTE_SCROLL_SECTION", payload: { section } }, hostOrigin);
  }, [hostOrigin]);

  // Reportar altura al host
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const height = el.getBoundingClientRect().height;
      if (hostOrigin) {
        window.parent?.postMessage({ type: "REMOTE_HEIGHT", payload: { height } }, hostOrigin);
      } else {
        ALLOWED_ORIGINS.forEach((origin) => {
          window.parent?.postMessage({ type: "REMOTE_HEIGHT", payload: { height } }, origin);
        });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [hostOrigin]);

  return invitation ? (
    <div ref={rootRef} style={{ width: '100%'}} className="scroll-invitation">
      <Invitation
        height="100vh"
        dev={true}
        invitation={invitation}
        loader={false}
        type={"open" as InvitationType}
        mongoID={null}
        ui={uiES as InvitationUIBundle}
        scrollToSection={scrollToSection}
        onSectionChange={handleSectionChange}
        textures={textures}
        textureOverride={textureOverride}
      />
    </div>
  ) : null;
}
