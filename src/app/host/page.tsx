"use client";
import Invitation from "@/components/Invitation/Invitation/Invitation";
import uiES from "@/data/ui/invitation_ui_es";
import { InvitationType, InvitationUIBundle, NewInvitation } from "@/types/new_invitation";
import { useEffect, useRef, useState } from "react";



// 👇 Lista de orígenes permitidos
const ALLOWED_ORIGINS = [
  "http://localhost:3001",
  "http://localhost:3000",
  "https://www.iattend.mx",
];

export default function Page() {
  const [invitation, setInvitation] = useState<NewInvitation | null>(null);
  const [hostOrigin, setHostOrigin] = useState<string | null>(null);
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
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
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
        
      />
    </div>
  ) : null;
}