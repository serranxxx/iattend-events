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

type FontOverride = { family: string; google_axis?: string | null };

export default function HostClient({ textures }: Props) {
  const [invitation, setInvitation] = useState<NewInvitation | null>(null);
  const [textureOverride, setTextureOverride] = useState<Texture | null>(null);
  const [fontOverride, setFontOverride] = useState<FontOverride | null>(null);
  const [hostOrigin, setHostOrigin] = useState<string | null>(null);
  const [scrollToSection, setScrollToSection] = useState<string | null>(null);
  const [lang, setLang] = useState<string | null>(null);
  const [ui, setUi] = useState<InvitationUIBundle>(uiES as InvitationUIBundle);
  const rootRef = useRef<HTMLDivElement>(null);

  // Copy de UI (botones, contador) según el idioma que se esté previsualizando
  // en el builder — sin esto el preview siempre mostraba español fijo.
  useEffect(() => {
    if (!lang) {
      setUi(uiES as InvitationUIBundle);
      return;
    }
    let cancelled = false;
    fetch(`/api/translation/ui-copy?lang=${encodeURIComponent(lang)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data?.ui) setUi(data.ui as InvitationUIBundle);
      })
      .catch(() => {
        if (!cancelled) setUi(uiES as InvitationUIBundle);
      });
    return () => { cancelled = true; };
  }, [lang]);

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
        setFontOverride((payload.fontOverride as FontOverride) ?? null);
        setLang((payload.lang as string) ?? null);
      }
      if (type === "HOST_SCROLL_TO" && payload?.section) {
        setScrollToSection(payload.section as string);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [hostOrigin]);

  // Font en prueba desde el Laboratorio de Fonts (iattend-vite): aún no está
  // en la tabla `fonts`, así que GoogleFontsLoader no la carga — se inyecta
  // un <link> aparte solo mientras dure el override.
  useEffect(() => {
    const LINK_ID = "font-override-dynamic";
    if (!fontOverride?.family) {
      document.getElementById(LINK_ID)?.remove();
      return;
    }
    const href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontOverride.family)}${fontOverride.google_axis ? ":" + fontOverride.google_axis : ""}&display=swap`;
    let link = document.getElementById(LINK_ID) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = LINK_ID;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    if (link.getAttribute("href") !== href) link.href = href;
  }, [fontOverride]);

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
        ui={ui}
        lang={lang}
        scrollToSection={scrollToSection}
        onSectionChange={handleSectionChange}
        textures={textures}
        textureOverride={textureOverride}
      />
    </div>
  ) : null;
}
