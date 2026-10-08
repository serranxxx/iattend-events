"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { Camera, QrCode, Sparkles, SquarePen, Ticket as TicketIcon, X } from "lucide-react";
import { InvitationType, InvitationUIBundle, NewInvitation } from "@/types/new_invitation";
import { GuestSubabasePayload } from "@/types/guests";
import { createClient } from "@/lib/supabase/client";
import { darker, generateSimpleId } from "@/helpers/functions";
import { PhotoWall } from "@/components/PhotoWall/PhotoWall";
import CameraView from "../CameraView/CameraView";
import LiaGuest from "../LiaGuest/LiaGuest";
import { DockFormClosed, DockFormOpen } from "./DockForm";
import { DockSuccess } from "./DockSuccess";
import { DockDeclined, DockTour } from "./DockTour";
import { DockPasses } from "./DockPasses";
import { fmt, getDockCopy } from "./copy";
import { DockPerson, DockPhase, DockTool, isGoingState } from "./types";
import styles from "./invitation-dock.module.css";

// Tiempo del fade de salida antes de cambiar de estado.
const SWAP_MS = 170;

// Vidrio esmerilado (liquid glass). En línea y no en el CSS Module porque el
// compilador de CSS descartaba backdrop-filter junto con su prefijo -webkit-.
const FROST: React.CSSProperties = {
  backdropFilter: "blur(28px) saturate(200%)",
  WebkitBackdropFilter: "blur(28px) saturate(200%)",
};

type InvitationDockProps = {
  invitation: NewInvitation;
  invitationID?: string;
  ui: InvitationUIBundle;
  lang?: string | null;
  type: InvitationType;
  dev: boolean;
  guestInfo: GuestSubabasePayload | null;
  // Todos los acompañantes del invitado (cualquier estado).
  companions: GuestSubabasePayload[];
  refreshGuest: () => Promise<void>;
  // Invitación abierta: el invitado recién se registró con este código.
  onGuestCreated: (_password: string) => Promise<void> | void;
  hidden?: boolean;
  scrolledDown?: boolean;
  // Layout web: el dock vive dentro del panel de la portada (position
  // absolute) y se mide contra ese panel en vez de contra el viewport.
  container?: { w: number; h: number } | null;
};

const newGuest = (invitationID: string): GuestSubabasePayload => ({
  invitation_id: invitationID,
  password: generateSimpleId(),
  phone_number: "",
  name: "",
  tier: "A",
  tag: "",
  table: null,
  state: "creado",
  last_action: "creado",
  notes: "",
  meal: null,
  companion_id: null,
  ticket: true,
  has_companion: false,
  last_action_by: "guest",
  created_at: new Date().toISOString(),
  last_update_date: new Date().toISOString(),
  side: null,
  type: null,
  invitation_sent_at: null,
  reminder_count: 0,
  last_reminder_at: null,
  special_needs: null,
});

/**
 * Plan Pro: un único elemento flotante que se expande en su lugar en cada
 * paso — botón CONFIRMAR → formulario → gracias + calendario → recorrido →
 * barra de herramientas → paneles de Pases, Fotos (Photo Wall) y Lia.
 */
export default function InvitationDock({
  invitation, invitationID, ui, lang, type, dev, guestInfo, companions,
  refreshGuest, onGuestCreated, hidden = false, scrolledDown = false, container = null,
}: InvitationDockProps) {
  const supabase = createClient();
  const t = getDockCopy(ui);

  const primary = invitation.generals?.colors.primary ?? "#FFFFFF";
  const secondary = invitation.generals?.colors.secondary ?? "#FFFFFF";
  const accent = invitation.generals?.colors.accent ?? "#000000";
  const actions = invitation.generals?.colors.actions ?? "#FFFFFF";
  const serif = invitation.generals?.fonts.body?.typeFace ?? "serif";

  const allGuests = guestInfo ? [guestInfo, ...companions] : [];
  const ticketGuests = allGuests.filter((g) => isGoingState(g.state));
  const isOpenMode = type === "open" && !guestInfo;

  // Si nadie asiste (o aún no responde) se vuelve al botón inicial CONFIRMAR.
  const restingPhase = (): DockPhase =>
    allGuests.some((g) => isGoingState(g.state)) ? "bar" : "pill";

  const [phase, setPhase] = useState<DockPhase>("pill");
  const [tool, setTool] = useState<DockTool | null>(null);
  const [fade, setFade] = useState(1);
  const [edit, setEdit] = useState(false);
  const [people, setPeople] = useState<DockPerson[]>([]);
  const [openRows, setOpenRows] = useState<string[]>(["", ""]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState({ firstName: "", goingCount: 0, fromEdit: false });
  const [toast, setToast] = useState<string | null>(null);
  const [cardH, setCardH] = useState(420);
  const [viewport, setViewport] = useState({ w: 390, h: 844 });
  const [liaMounted, setLiaMounted] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const swapTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const resizeObserver = useRef<ResizeObserver | null>(null);

  // Estado de reposo según lo que diga Supabase, sin pisar una tarjeta abierta.
  const statesKey = allGuests.map((g) => `${g.id}:${g.state}`).join(",");
  useEffect(() => {
    setPhase((prev) => (prev === "pill" || prev === "bar" ? restingPhase() : prev));
  }, [statesKey]);

  useLayoutEffect(() => {
    const update = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => () => {
    clearTimeout(swapTimer.current);
    clearTimeout(toastTimer.current);
    resizeObserver.current?.disconnect();
  }, []);

  // Fade de salida → cambio de estado → fade de entrada.
  const go = (next: DockPhase, apply?: () => void) => {
    clearTimeout(swapTimer.current);
    setFade(0);
    swapTimer.current = setTimeout(() => {
      apply?.();
      setPhase(next);
      setFade(1);
    }, SWAP_MS);
  };

  const flash = (message: string) => {
    clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  };

  const fireConfetti = () => {
    confetti({
      particleCount: 160,
      spread: 80,
      angle: 90,
      origin: { x: 0.5, y: 0.9 },
      colors: [accent, actions, "#FFFFFF"],
      zIndex: 1100,
    });
  };

  const cardRef = (el: HTMLDivElement | null) => {
    if (!resizeObserver.current) {
      resizeObserver.current = new ResizeObserver((entries) => {
        const target = entries[0]?.target as HTMLElement | undefined;
        if (target) setCardH(Math.ceil(target.offsetHeight) + 2); // + borde
      });
    }
    resizeObserver.current.disconnect();
    if (el) resizeObserver.current.observe(el);
  };

  // ── Navegación ──

  const openForm = (isEdit: boolean, everyoneGoing = !isEdit) => {
    if (dev) return;
    go("form", () => {
      setTool(null);
      setEdit(isEdit);
      setOpenRows(["", ""]);
      setPeople(allGuests.map((g, i) => ({
        guest: g,
        name: g.name ?? "",
        going: everyoneGoing ? true : isGoingState(g.state),
        editable: i > 0 && !g.name?.trim(),
      })));
    });
  };

  const openTool = (next: DockTool) => {
    if (next === "lia") setLiaMounted(true);
    if (phase === "tool") {
      if (next === tool) return;
      clearTimeout(swapTimer.current);
      setFade(0);
      swapTimer.current = setTimeout(() => { setTool(next); setFade(1); }, SWAP_MS);
      return;
    }
    go("tool", () => setTool(next));
  };

  const toBar = () => {
    go("bar", () => { setTool(null); setEdit(false); });
  };

  const close = () => {
    if (phase === "tool" || phase === "success" || phase === "tour") return toBar();
    if (phase === "declined") return go("pill", () => setEdit(false));
    if (phase === "form") return go(edit ? "bar" : restingPhase(), () => setEdit(false));
  };

  // Después de confirmar siempre se muestra el recorrido de herramientas;
  // al guardar desde "Editar" ya las conoce y se va directo a la barra.
  const afterSuccess = () => (success.fromEdit ? toBar() : go("tour"));

  const isCard = phase === "form" || phase === "success" || phase === "tour" || phase === "declined";
  const isPanel = phase === "tool";
  const isPhotos = isPanel && tool === "photos";
  const isCompact = phase === "pill" || phase === "bar";

  useEffect(() => {
    if (!isCard && !isPanel) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // ── Supabase ──

  const missing = people.filter((p) => p.editable && p.going && !p.name.trim()).length;
  const goingCount = isOpenMode
    ? openRows.filter((r, i) => i === 0 || r.trim()).length
    : people.filter((p) => p.going).length;

  const declineAll = async () => {
    if (saving || !guestInfo) return;
    setSaving(true);
    const now = new Date().toISOString();
    const { error } = await supabase.from("guests").upsert(
      allGuests.map((g) => ({
        id: g.id,
        name: g.name,
        state: "rechazado",
        last_action: "rechazado",
        last_update_date: now,
        last_action_by: "guest" as const,
      })),
      { onConflict: "id" },
    );
    setSaving(false);
    if (error) {
      console.error("❌ Error al rechazar la invitación:", error);
      flash(t.toastError);
      return;
    }
    void refreshGuest();
    go("declined", () => setEdit(false));
  };

  const submitClosed = async () => {
    if (missing > 0) {
      flash(missing === 1 ? t.toastMissingOne : fmt(t.toastMissingMany, { n: missing }));
      return;
    }
    if (goingCount === 0) return declineAll();

    setSaving(true);
    const now = new Date().toISOString();
    const updates = people.map((p) => {
      // "asistente" (ya registró su entrada) no se degrada a "confirmado".
      const state = p.going ? (p.guest.state === "asistente" ? "asistente" : "confirmado") : "rechazado";
      return {
        id: p.guest.id,
        name: p.editable ? p.name.trim() || null : p.guest.name,
        state,
        last_action: state,
        last_update_date: now,
        last_action_by: "guest" as const,
      };
    });
    const { error } = await supabase.from("guests").upsert(updates, { onConflict: "id" });
    setSaving(false);
    if (error) {
      console.error("❌ Error al confirmar:", error);
      flash(t.toastError);
      return;
    }
    void refreshGuest();

    // También al editar: la pantalla de gracias es donde vive "Guárdalo en tu
    // calendario", y un invitado que ya había confirmado no tenía otra forma
    // de llegar a ella. El recorrido se omite en ese caso (ver afterSuccess).
    const wasEdit = edit;
    setSuccess({ firstName: (people[0]?.name ?? "").split(" ")[0], goingCount, fromEdit: wasEdit });
    go("success", () => setEdit(false));
    if (wasEdit) flash(t.toastUpdated);
    else setTimeout(fireConfetti, 250);
  };

  const submitOpen = async () => {
    if (!invitationID) return;
    const names = openRows.map((r) => r.trim());
    if (!names[0]) {
      flash(t.toastName);
      return;
    }
    const companionNames = names.slice(1).filter(Boolean);

    setSaving(true);
    const { data: inserted, error } = await supabase
      .from("guests")
      .insert([{ ...newGuest(invitationID), name: names[0], state: "confirmado", has_companion: companionNames.length > 0 }])
      .select();
    const main = inserted?.[0];
    if (error || !main?.id) {
      setSaving(false);
      console.error("❌ Error insertando al invitado:", error);
      flash(t.toastError);
      return;
    }
    localStorage.setItem(main.invitation_id, main.password);

    if (companionNames.length > 0) {
      const { error: companionsError } = await supabase.from("guests").insert(
        companionNames.map((name) => ({ ...newGuest(invitationID), name, companion_id: main.id, state: "confirmado" })),
      );
      if (companionsError) console.error("❌ Error insertando acompañantes:", companionsError);
    }
    setSaving(false);

    await onGuestCreated(main.password);
    setSuccess({ firstName: names[0].split(" ")[0], goingCount: 1 + companionNames.length, fromEdit: false });
    go("success");
    setTimeout(fireConfetti, 250);
  };

  const onSubmit = () => {
    if (saving) return;
    return isOpenMode ? submitOpen() : submitClosed();
  };

  // ── Medidas del morph ──

  const anchored = Boolean(container);
  const area = container ?? viewport;
  const cardW = Math.min(anchored ? 400 : 366, area.w - 24);
  const maxH = area.h - 40;
  const bottom = anchored ? 24 : 20;
  const dims = isPanel
    ? { w: cardW, h: Math.min(tool === "passes" ? 590 : 700, maxH), r: 36, bottom }
    : isCard
      ? { w: cardW, h: Math.min(cardH, maxH), r: 32, bottom }
      : phase === "bar"
        ? { w: Math.min(354, area.w - 24), h: 68, r: 99, bottom }
        : { w: 214, h: 56, r: 99, bottom };

  const morphClass = [
    styles.morph,
    anchored ? styles.anchored : "",
    isCompact ? styles.morph_glass : isPhotos ? styles.morph_dark : styles.morph_card,
    isCompact && scrolledDown ? styles.morph_small : "",
    showCamera || (isCompact && hidden) ? styles.morph_hidden : "",
  ].join(" ");

  const cssVars = {
    "--primary": primary,
    "--accent": accent,
    "--actions": actions,
    "--ink": darker(accent, 0.63) ?? accent,
    "--serif": `'${serif}', serif`,
  } as React.CSSProperties;

  const eyebrow = phase === "form"
    ? (edit ? t.eyebrowEdit : t.eyebrowConfirm)
    : phase === "tour" ? t.eyebrowTour : phase === "declined" ? t.eyebrowDeclined : t.eyebrowConfirmed;

  const ctaLabel = edit
    ? t.ctaSave
    : goingCount === 0 ? t.ctaSend : goingCount === 1 ? t.ctaConfirmOne : fmt(t.ctaConfirmMany, { n: goingCount });

  const firstName = (guestInfo?.name ?? "").split(" ")[0];
  const tabs: { key: DockTool | "edit"; label: string; icon: React.ReactNode }[] = [
    { key: "passes", label: t.tabPasses, icon: <QrCode size={20} /> },
    { key: "photos", label: t.tabPhotos, icon: <Camera size={20} /> },
    { key: "lia", label: t.tabLia, icon: <Sparkles size={20} /> },
    { key: "edit", label: t.tabEdit, icon: <SquarePen size={20} /> },
  ];
  const onTab = (key: DockTool | "edit") => (key === "edit" ? openForm(true) : openTool(key));
  const shareCompanions = companions.map((c) => ({ name: c.name ?? "", password: c.password }));

  return (
    <>
      <div
        className={`${styles.scrim} ${anchored ? styles.anchored : ""} ${isCard || isPanel ? styles.scrim_visible : ""}`}
        onClick={close}
        aria-hidden
      />

      <div
        className={morphClass}
        style={{ ...cssVars, ...FROST, width: dims.w, height: dims.h, borderRadius: dims.r, bottom: dims.bottom }}
        role={isCard || isPanel ? "dialog" : undefined}
        aria-modal={isCard || isPanel ? true : undefined}
      >
        {phase === "pill" && (
          <button
            type="button"
            onClick={() => openForm(false)}
            className={`${styles.compact_btn} ${guestInfo ? "" : styles.compact_centered}`}
            style={{ opacity: fade }}
          >
            {guestInfo && (
              <span className={styles.pass_chip}>
                <TicketIcon size={18} />
                {allGuests.length}
              </span>
            )}
            <span className={styles.pill_label}>{t.confirm}</span>
          </button>
        )}

        {phase === "bar" && (
          <div className={`${styles.layer} ${styles.bar}`} style={{ opacity: fade }}>
            {tabs.map((tab, i) => (
              <span key={tab.key} style={{ display: "contents" }}>
                {i > 0 && <span className={styles.bar_divider} />}
                <button type="button" onClick={() => onTab(tab.key)} className={styles.bar_btn} aria-label={tab.label}>
                  {tab.icon}
                  <span className={styles.bar_label}>{tab.label}</span>
                  {tab.key === "passes" && ticketGuests.length > 0 && (
                    <span className={styles.bar_badge}>{ticketGuests.length}</span>
                  )}
                </button>
              </span>
            ))}
          </div>
        )}

        {isCard && (
          // key: cada paso empieza con el scroll arriba.
          <div key={phase} className={styles.card_scroll}>
            <div ref={cardRef} className={styles.card_content} style={{ width: cardW - 2, opacity: fade }}>
              <div className={styles.card_header}>
                <span className={styles.eyebrow}>{eyebrow}</span>
                <button type="button" onClick={close} aria-label={t.close} className={styles.close_btn}>
                  <X size={18} />
                </button>
              </div>

              {phase === "form" && (
                <>
                  {isOpenMode ? (
                    <DockFormOpen
                      t={t}
                      rows={openRows}
                      onChange={(index, value) => setOpenRows((rows) => rows.map((r, j) => (j === index ? value : r)))}
                      onAdd={() => setOpenRows((rows) => [...rows, ""])}
                      onRemove={(index) => setOpenRows((rows) => rows.filter((_, j) => j !== index))}
                    />
                  ) : (
                    <DockFormClosed
                      t={t}
                      people={people}
                      onToggle={(index) => setPeople((ps) => ps.map((p, j) => (j === index ? { ...p, going: !p.going } : p)))}
                      onRename={(index, name) => setPeople((ps) => ps.map((p, j) => (j === index ? { ...p, name } : p)))}
                    />
                  )}

                  <div className={`${styles.stack} ${styles.center}`} style={{ gap: 10 }}>
                    {missing > 0 && (
                      <span className={styles.missing_note}>
                        {missing === 1 ? t.missingOne : fmt(t.missingMany, { n: missing })}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={onSubmit}
                      aria-disabled={missing > 0}
                      className={`${styles.cta} ${missing > 0 || saving ? styles.cta_blocked : ""}`}
                    >
                      {ctaLabel}
                    </button>
                    {!isOpenMode && (
                      <button type="button" onClick={declineAll} className={styles.link_btn}>{t.declineAll}</button>
                    )}
                  </div>
                </>
              )}

              {phase === "success" && (
                <DockSuccess
                  t={t}
                  invitation={invitation}
                  lang={lang}
                  firstName={success.firstName}
                  goingCount={success.goingCount}
                  onContinue={afterSuccess}
                />
              )}

              {phase === "tour" && (
                <DockTour t={t} goingCount={ticketGuests.length || success.goingCount} onDone={toBar} />
              )}

              {phase === "declined" && (
                <DockDeclined t={t} onChangeAnswer={() => openForm(false, true)} />
              )}
            </div>
          </div>
        )}

        {(isPanel || liaMounted) && (
          <div
            className={`${styles.layer} ${styles.panel}`}
            style={{ display: isPanel ? "flex" : "none", opacity: fade }}
          >
            {/* El Photo Wall trae su propio encabezado (portada, regresar, cámara). */}
            {!isPhotos && <div className={styles.panel_header}>
              <span className={styles.panel_icon}>
                {tool === "lia" ? <Sparkles size={20} /> : <QrCode size={20} />}
              </span>
              <span className={styles.stack} style={{ gap: 1, flex: 1, minWidth: 0 }}>
                <span className={styles.panel_title}>{tool === "lia" ? t.liaTitle : t.passesTitle}</span>
                <span className={styles.panel_sub}>
                  {tool === "lia"
                    ? t.liaSub
                    : ticketGuests.length === 1 ? t.passesSubOne : fmt(t.passesSubMany, { n: ticketGuests.length })}
                </span>
              </span>
              <button type="button" onClick={toBar} aria-label={t.close} className={styles.close_btn}>
                <X size={18} />
              </button>
            </div>}

            <div className={styles.panel_body}>
              {isPanel && tool === "passes" && (
                <DockPasses
                  t={t}
                  ui={ui}
                  invitation={invitation}
                  invitationID={invitationID}
                  guests={ticketGuests}
                  colors={{ primary, secondary, accent }}
                />
              )}
              {isPhotos && invitationID && (
                <PhotoWall
                  embedded
                  eventId={invitationID}
                  invitation={invitation}
                  shareCompanions={shareCompanions}
                  onClose={toBar}
                  onOpenCamera={() => {
                    setTool(null);
                    setPhase("bar");
                    setShowCamera(true);
                  }}
                />
              )}
              {liaMounted && invitationID && (
                // Se queda montado al cambiar de pestaña para no perder la conversación.
                <div className={styles.panel_body} style={{ display: tool === "lia" ? "flex" : "none" }}>
                  <LiaGuest
                    invitationID={invitationID}
                    guestName={guestInfo?.name ?? undefined}
                    ui={ui}
                    lang={lang}
                    greeting={firstName ? fmt(t.liaHello, { name: firstName }) : t.liaHelloAnon}
                    quickQuestionLabel={t.quickQuestion}
                  />
                </div>
              )}
            </div>

            <div className={`${styles.tabs} ${isPhotos ? styles.tabs_dark : ""}`}>
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => onTab(tab.key)}
                  className={`${styles.tab} ${isPanel && tool === tab.key ? styles.tab_active : ""}`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {showCamera && guestInfo && invitationID && (
        <CameraView
          invitation={invitation}
          invitationID={invitationID}
          guestInfo={guestInfo}
          ui={ui}
          onClose={() => setShowCamera(false)}
          onOpenPhotoWall={() => { setShowCamera(false); openTool("photos"); }}
          shareCompanions={shareCompanions}
        />
      )}

      {toast && <div className={styles.toast} role="status">{toast}</div>}
    </>
  );
}
