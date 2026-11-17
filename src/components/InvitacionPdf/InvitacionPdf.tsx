"use client";

/*
  Invitación en PDF (`data.formato === 'pdf'`): en lugar de los módulos de
  I attend, las páginas del PDF del organizador una debajo de otra (imágenes
  que preparó el editor de vite al subirlo) y encima los mismos botones de una
  invitación normal: InvitationControlBar → SlideOverlay → Confirm. Colores y
  textura son los del panel Diseño (`generals.colors`, `generals.texture`).

  Se usa en tres lugares:
  - la página del invitado (`[invitation_label]/[invitation_name]/page.tsx`):
    acceso de siempre (abierta, `?password=` o código con el PDF desenfocado);
  - el lienzo del editor (`/host` con `editMode`): tocar el PDF lo elige
    (REMOTE_SELECT_SECTION "pdf") y el editor enseña su barra;
  - "Ver en vivo" (`/host`, `dev`): botones inertes y "Confirmado" con el
    invitado de ejemplo.

  Scroll del documento (no un contenedor propio): en el celular Safari esconde
  sus barras al bajar y el pellizco para acercar funciona normal.
*/

import { useEffect, useRef, useState } from "react";
import { Input, message } from "antd";
import { FileUp, Lock, X } from "lucide-react";
import Confirm from "@/components/Invitation/Confirm/Confirm";
import InvitationControlBar from "@/components/Invitation/InvitationControlBar/InvitationControlBar";
import InvitationDock from "@/components/Invitation/InvitationDock/InvitationDock";
import { INVITADO_EJEMPLO } from "@/components/Invitation/Invitation/Invitation";
import { TextureOverlay } from "@/components/Invitation/Invitation/TexturesOverlay";
import { SectionLayer } from "@/components/Invitation/SectionLayer/SectionLayer";
import SlideOverlay from "@/components/SlideOverlay/SlideOverlay";
import SongPlayer from "@/components/Invitation/SongPlayer/SongPlayer";
import { createClient } from "@/lib/supabase/client";
import type { Texture } from "@/lib/textures/cache";
import { coloresDe, datosPdf } from "@/helpers/pdfInvitacion";
import type { GuestSubabasePayload } from "@/types/guests";
import type { InvitationType, InvitationUIBundle, NewInvitation } from "@/types/new_invitation";
import styles from "./invitacion-pdf.module.css";

type Props = {
  invitation: NewInvitation;
  invitationID: string;
  ui: InvitationUIBundle;
  type: InvitationType;
  plan: string;
  phone_number: string | null;
  password?: string;
  lang?: string | null;
  textures?: Texture[];
  textureOverride?: Texture | null;
  // Vista previa del editor (/host): sin acceso, botones inertes.
  dev?: boolean;
  editMode?: boolean;
  selectedSection?: string | null;
  onSelectSection?: (_section: string, _field?: string) => void;
  // Elementos sueltos sobre el PDF (decorations.pdf): la capa los cambia.
  onFieldChange?: (_path: string, _value: unknown) => void;
  vistaConfirmada?: boolean;
  // Editor → Dibujar ("pincel" | "seleccion"): sin elegir el PDF; la zona
  // sigue marcada para anclar los trazos y, con la selección, sus trazos se editan.
  dibujando?: string | null;
};

export default function InvitacionPdf({
  invitation, invitationID, ui, type, plan, phone_number, password, lang = null,
  textures = [], textureOverride = null,
  dev = false, editMode: editModeProp = false, selectedSection = null, onSelectSection, onFieldChange, vistaConfirmada = false, dibujando = null,
}: Props) {
  const editMode = editModeProp && !dibujando;
  const supabase = createClient();
  const [messageApi, contextHolder] = message.useMessage();

  const abierta = dev || (type as string) === "open";
  const [validated, setValidated] = useState(abierta);
  const [guestInfo, setGuestInfo] = useState<GuestSubabasePayload | null>(null);
  // Acompañantes del titular: los usa el dock Pro (pases de todos).
  const [companions, setCompanions] = useState<GuestSubabasePayload[]>([]);
  const [guestCode, setGuestCode] = useState("");
  const [open, setOpen] = useState(false);
  const [saludo, setSaludo] = useState(false);
  const [bajando, setBajando] = useState(false);
  const documentoRef = useRef<HTMLElement>(null);

  const pro = plan === "pro";
  const pdf = datosPdf(invitation);
  const pages = pdf.pages ?? [];
  const elementos = invitation?.decorations?.pdf ?? [];
  const cancion = invitation?.cover?.song as React.ComponentProps<typeof SongPlayer>["song"] | null | undefined;
  const colores = coloresDe(invitation);

  const textureId = invitation.generals?.texture ?? textures[0]?.id;
  const tex = textureOverride ?? textures.find((t) => t.id === textureId);
  const showTexture = Boolean(textureOverride) || invitation.generals?.texture != null;

  const cargarAcompanantes = async (titular: GuestSubabasePayload) => {
    if (!titular?.has_companion) {
      setCompanions([]);
      return;
    }
    const { data } = await supabase.from("guests").select("*").eq("companion_id", titular.id);
    setCompanions(data ?? []);
  };

  // Mismo login que Invitation.tsx: el código del invitado es `guests.password`.
  const entrar = async (code: string, { silencioso = false } = {}) => {
    const limpio = code.trim();
    if (!limpio || dev) return;
    const { data, error } = await supabase.from("guests").select("*").eq("password", limpio).maybeSingle();
    if (error) {
      console.log(error, "not found");
      return;
    }
    if (!data || String(data.invitation_id) !== invitationID) {
      if (!silencioso) messageApi.error("Código incorrecto");
      return;
    }
    setGuestInfo(data);
    await cargarAcompanantes(data);
    setValidated(true);
    setSaludo(true);
    localStorage.setItem(`guest_${invitationID}`, data.name ?? "");
  };

  const refreshGuest = async () => {
    if (!guestInfo?.id) return;
    const { data, error } = await supabase.from("guests").select("*").eq("id", guestInfo.id).maybeSingle();
    if (error || !data) {
      messageApi.error("Código incorrecto");
      return;
    }
    setGuestInfo(data);
    await cargarAcompanantes(data);
  };

  useEffect(() => {
    if (!abierta && password) entrar(password);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // "Ver en vivo" → Confirmado: el invitado de ejemplo (no toca datos reales).
  useEffect(() => {
    if (dev) setGuestInfo(vistaConfirmada ? INVITADO_EJEMPLO : null);
  }, [dev, vistaConfirmada]);

  // Invitación abierta: al cerrar la confirmación, el registro público dejó el
  // código del invitado nuevo en localStorage (Confirm) → ya es "él".
  useEffect(() => {
    if (dev || open || !abierta || guestInfo) return;
    const guardado = localStorage.getItem(invitationID);
    if (guardado) entrar(guardado, { silencioso: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!saludo) return;
    const t = setTimeout(() => setSaludo(false), 3200);
    return () => clearTimeout(t);
  }, [saludo]);

  // Al bajar, el botón se encoge un poco (como en la invitación normal).
  useEffect(() => {
    let ultimo = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - ultimo) < 8) return;
      setBajando(y > ultimo && y > 80);
      ultimo = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Fondo del documento y color de las barras del navegador = color del tema.
  useEffect(() => {
    const prev = document.body.style.background;
    document.body.style.background = colores.primary;
    let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
    const creada = !meta;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.appendChild(meta);
    }
    const prevMeta = meta.content;
    meta.content = colores.primary;
    return () => {
      document.body.style.background = prev;
      if (creada) meta?.remove();
      else if (meta) meta.content = prevMeta;
    };
  }, [colores.primary]);

  const elegir = editMode && onSelectSection ? () => onSelectSection("pdf") : undefined;

  return (
    <div className={styles.pagina} style={{ background: colores.primary }}>
      {contextHolder}

      <main className={styles.documento} data-bloqueada={!validated || undefined} aria-hidden={!validated || undefined}>
        {/* Zona del PDF: las páginas y, encima, sus elementos sueltos
            (decorations.pdf) en % de esta caja: quedan fijos sobre el PDF en
            cualquier pantalla. En el editor es la zona "pdf" (soltar
            elementos, elegir el PDF). */}
        <div
          ref={documentoRef as React.RefObject<HTMLDivElement>}
          className={styles.hojas}
          data-edit-zone={editMode || dibujando ? "pdf" : undefined}
          data-module-zone="pdf"
          data-editable={elegir ? true : undefined}
          data-elegido={(editMode && selectedSection === "pdf") || undefined}
          onClick={elegir}
        >
          {(editMode || elementos.length > 0) && (
            <SectionLayer
              section="pdf"
              items={elementos}
              editMode={editMode || dibujando === "seleccion"}
              accent={colores.accent}
              titleFont={invitation?.generals?.fonts?.titles?.typeFace ?? invitation?.generals?.fonts?.body?.typeFace}
              bodyFont={invitation?.generals?.fonts?.body?.typeFace}
              palette={[colores.primary, colores.secondary, colores.accent, colores.actions, "#FFFFFF", "#000000"]}
              onChange={(list) => onFieldChange?.("decorations.pdf", list)}
            />
          )}
          {pages.length ? (
            pages.map((p, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={p.url}
                src={p.url}
                width={p.w}
                height={p.h}
                alt={i === 0 ? invitation?.cover?.title?.text?.value ?? "Invitación" : ""}
                loading={i < 2 ? "eager" : "lazy"}
                decoding="async"
                draggable={false}
                className={styles.pag}
              />
            ))
          ) : (
            <div className={styles.vacio} style={{ color: colores.accent }}>
              {editMode ? (
                <span className={styles.vacioCaja} style={{ borderColor: `${colores.accent}55` }}>
                  <FileUp size={28} />
                  <b>Sube tu invitación en PDF</b>
                  <span>Tócala y súbela desde la barra de arriba</span>
                </span>
              ) : (
                "Esta invitación todavía no tiene su PDF."
              )}
            </div>
          )}
          {showTexture && tex && (
            <TextureOverlay
              containerRef={documentoRef as unknown as React.RefObject<HTMLElement>}
              coverHeightPx={0}
              texture={{ image: tex.image, opacity: tex.opacity, blend: tex.blend, filter: tex.filter }}
              tileW={1024}
              tileH={1024}
              zIndex={2}
            />
          )}
        </div>
      </main>

      {!validated && (
        <div className={styles.bloqueo}>
          <div className={styles.candado}>
            <Lock size={30} color="#FFF" />
          </div>
          <span className={styles.bloqueoTitulo}>{ui?.locked?.title}</span>
          <span className={styles.bloqueoTexto}>{ui?.locked?.p2}</span>
          <form
            className={styles.bloqueoForm}
            onSubmit={(e) => {
              e.preventDefault();
              entrar(guestCode);
            }}
          >
            <Input
              value={guestCode}
              size="large"
              onChange={(e) => setGuestCode(e.target.value)}
              placeholder={ui?.locked?.placeholder}
              className={styles.bloqueoInput}
              autoCapitalize="characters"
            />
            <button type="submit" className={styles.bloqueoBoton}>
              {ui?.locked?.access}
            </button>
          </form>
        </div>
      )}

      {/* Canción (cover.song, el chip "Canción" del editor): igual que en la
          invitación normal, flotando arriba a la izquierda. Editando no: ahí
          va el chip del editor. */}
      {validated && cancion && !editMode && (
        <SongPlayer song={cancion} accent={colores.accent} secondary={colores.secondary} dev={dev} />
      )}

      <div className={styles.saludo} data-visible={saludo || undefined}>
        <span>{ui?.confirm?.hello}</span>&nbsp;
        <b translate="no" className="notranslate">
          {guestInfo?.name}
        </b>
      </div>

      {/* Plan Pro: el mismo dock que la invitación normal (confirmación,
          pases, Lia, Photo Wall). Los demás planes: la barra de confirmar. */}
      {validated && pro && (
        <div style={editMode ? { pointerEvents: "none" } : undefined}>
          <InvitationDock
            invitation={invitation}
            invitationID={invitationID}
            ui={ui}
            lang={lang}
            type={type}
            dev={dev}
            guestInfo={guestInfo}
            companions={companions}
            refreshGuest={refreshGuest}
            onGuestCreated={(code) => entrar(code, { silencioso: true })}
            scrolledDown={bajando}
          />
        </div>
      )}

      {validated && !pro && (
        // Editando, los botones solo se miran (como en la invitación normal).
        <div style={editMode ? { pointerEvents: "none" } : undefined}>
          <InvitationControlBar
            // Confirmado → "Editar respuesta" (como Lite) en cualquier plan;
            // paperless sigue confirmando por WhatsApp.
            plan={plan === "paperless" ? "paperless" : "lite"}
            dev={dev}
            guestInfo={guestInfo}
            ui={ui}
            actions={colores.actions}
            primary={colores.primary}
            // Ya confirmado: texto y fondo como el botón de confirmar (sobre el
            // PDF no se sabe qué color hay detrás).
            accent={colores.primary}
            pillBackground={`${colores.actions}b3`}
            phone_number={phone_number}
            scrolledDown={bajando}
            onOpenConfirm={() => setOpen(true)}
          />
        </div>
      )}

      <SlideOverlay open={open}>
        <div className={styles.hoja} style={{ backgroundColor: colores.primary }}>
          <div className={styles.hojaCabeza}>
            <span style={{ fontSize: 20, color: colores.accent }}>{ui?.confirm?.drawerTitle}</span>
            <button
              onClick={() => setOpen(false)}
              aria-label={ui?.liaGuest?.close ?? "Cerrar"}
              className={styles.cerrar}
              style={{ color: colores.accent }}
            >
              <X size={24} />
            </button>
          </div>
          <div className={styles.hojaCuerpo}>
            {(guestInfo || abierta) && (
              <Confirm
                key={guestInfo?.state ?? "abierta"}
                invitationID={invitationID}
                ui={ui}
                invitation={invitation}
                guestInfo={guestInfo}
                refreshGuest={refreshGuest}
              />
            )}
          </div>
        </div>
      </SlideOverlay>
    </div>
  );
}
