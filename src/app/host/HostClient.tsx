"use client";
import Invitation from "@/components/Invitation/Invitation/Invitation";
import uiES from "@/data/ui/invitation_ui_es";
import { InvitationType, InvitationUIBundle, LayerItem, NewInvitation } from "@/types/new_invitation";
import { Texture } from "@/lib/textures/cache";
import type { GiftBrand } from "@/lib/giftBrands/cache";
import { useCallback, useEffect, useRef, useState } from "react";



// 👇 Lista de orígenes permitidos
const ALLOWED_ORIGINS = [
  "http://localhost:3001",
  "http://localhost:3000",
  "https://www.iattend.mx",
  "https://www.iattend.site",
  "https://beta.iattend.site", // preview de iattend-vite (rama del editor nuevo)
];

type Props = {
  textures: Texture[];
  giftBrands: GiftBrand[];
};

type FontOverride = { family: string; google_axis?: string | null };

// ── Elementos sueltos arrastrados desde el editor (Elementos / Stickers) ──
// El editor manda el punto en px de este documento; aquí se busca la zona
// (`data-edit-zone`) que queda debajo y se pasa a % de su caja.
const zoneAt = (x: number, y: number) =>
  (document.elementFromPoint(x, y) as HTMLElement | null)?.closest<HTMLElement>("[data-edit-zone]") ?? null;

const zoneByName = (section: string | null | undefined) =>
  section ? document.querySelector<HTMLElement>(`[data-edit-zone="${section}"]`) : null;

const inView = (el: HTMLElement | null) => {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return r.bottom > 40 && r.top < window.innerHeight - 40;
};

const markDropTarget = (zoneEl: HTMLElement | null) => {
  document.querySelectorAll("[data-drop-target]").forEach((el) => {
    if (el !== zoneEl) el.removeAttribute("data-drop-target");
  });
  zoneEl?.setAttribute("data-drop-target", "true");
};

const clampPct = (v: number) => Math.min(100, Math.max(0, v));

// Guías al traer un elemento desde el editor: si el punto pasa cerca del
// centro de la sección (horizontal o vertical) se pinta la línea y al soltar
// se pega ahí. Mismo color que las guías de SectionLayer.
const SNAP_PX = 8;
// Caja de la capa de la sección (en la portada, una pantalla).
const layerBox = (zoneEl: HTMLElement) => (zoneEl.querySelector<HTMLElement>("[data-layer]") ?? zoneEl);

const snapToCenter = (zoneEl: HTMLElement, x: number, y: number) => {
  const r = layerBox(zoneEl).getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  return { x: Math.abs(x - cx) <= SNAP_PX ? cx : x, y: Math.abs(y - cy) <= SNAP_PX ? cy : y, onX: Math.abs(x - cx) <= SNAP_PX, onY: Math.abs(y - cy) <= SNAP_PX };
};
const GUIDE_ID = "iattend-drop-guides";
const showDropGuides = (zoneEl: HTMLElement | null, onX = false, onY = false) => {
  document.getElementById(GUIDE_ID)?.remove();
  if (!zoneEl || (!onX && !onY)) return;
  const box = document.createElement("div");
  box.id = GUIDE_ID;
  box.style.cssText = "position:absolute;inset:0;pointer-events:none;z-index:110";
  const line = (css: string) => {
    const el = document.createElement("span");
    el.style.cssText = `position:absolute;background:#F0509B;${css}`;
    box.appendChild(el);
  };
  if (onX) line("top:0;bottom:0;left:50%;width:1px;margin-left:-0.5px");
  if (onY) line("left:0;right:0;top:50%;height:1px;margin-top:-0.5px");
  layerBox(zoneEl).appendChild(box);
};

export default function HostClient({ textures, giftBrands }: Props) {
  const [invitation, setInvitation] = useState<NewInvitation | null>(null);
  const [textureOverride, setTextureOverride] = useState<Texture | null>(null);
  const [fontOverride, setFontOverride] = useState<FontOverride[] | null>(null);
  const [hostOrigin, setHostOrigin] = useState<string | null>(null);
  const [scrollToSection, setScrollToSection] = useState<string | null>(null);
  // Cuenta cada pedido de scroll: el builder puede pedir la misma sección otra
  // vez (el invitado se movió entre medio) y con solo el nombre no cambiaría
  // el estado y la invitación no se movería.
  const [scrollKey, setScrollKey] = useState(0);
  const [lang, setLang] = useState<string | null>(null);
  // Modo edición del editor de iattend-vite (ver Invitation.tsx).
  const [editMode, setEditMode] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  // El editor de escritorio muestra su barra de texto al elegir un texto: sin
  // las "T" de la pieza (textBar).
  const [textBar, setTextBar] = useState(false);
  const [ui, setUi] = useState<InvitationUIBundle>(uiES as InvitationUIBundle);
  const rootRef = useRef<HTMLDivElement>(null);
  // Para colocar elementos sin re-suscribir el listener de mensajes.
  const invitationRef = useRef<NewInvitation | null>(null);
  const selectedSectionRef = useRef<string | null>(null);
  const visibleSectionRef = useRef<string | null>(null);
  useEffect(() => { invitationRef.current = invitation; }, [invitation]);
  useEffect(() => { selectedSectionRef.current = selectedSection; }, [selectedSection]);

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
        setFontOverride((payload.fontOverride as FontOverride[]) ?? null);
        setLang((payload.lang as string) ?? null);
        setEditMode(Boolean(payload.editMode));
        setSelectedSection((payload.selectedSection as string) ?? null);
        setTextBar(Boolean(payload.textBar));
      }
      // El organizador tocó el tablero del editor, fuera de la pieza: los
      // bloques elegidos (título, fecha…) se sueltan.
      if (type === "HOST_DESELECT") {
        window.dispatchEvent(new Event("iattend-edit-deselect"));
      }
      // Arrastrando un elemento desde el editor: resaltar la zona de abajo.
      if (type === "HOST_LAYER_HOVER") {
        const zoneEl = payload ? zoneAt(payload.x, payload.y) : null;
        markDropTarget(zoneEl);
        const s = zoneEl ? snapToCenter(zoneEl, payload.x, payload.y) : null;
        showDropGuides(zoneEl, s?.onX, s?.onY);
      }
      // Soltarlo (punto) o agregarlo con un clic (sin punto: sección elegida o
      // la que se ve, al centro de lo visible).
      if ((type === "HOST_LAYER_DROP" || type === "HOST_LAYER_ADD") && payload?.item) {
        markDropTarget(null);
        showDropGuides(null);
        let zoneEl: HTMLElement | null = null;
        if (type === "HOST_LAYER_DROP") zoneEl = zoneAt(payload.x, payload.y);
        else {
          const sel = selectedSectionRef.current === "generals" ? null : selectedSectionRef.current;
          zoneEl = [payload.section, sel, visibleSectionRef.current, "cover"]
            .map((name) => zoneByName(name))
            .find((el) => inView(el)) ?? zoneByName("cover");
        }
        const section = zoneEl?.dataset.editZone;
        if (!zoneEl || !section) return;
        // Se mide contra la capa de la sección (en la portada es una pantalla,
        // no toda la zona): es la misma caja que usa SectionLayer.
        const r = layerBox(zoneEl).getBoundingClientRect();
        let x = 50;
        let y: number;
        if (type === "HOST_LAYER_DROP") {
          const s = snapToCenter(zoneEl, payload.x, payload.y);
          x = ((s.x - r.left) / r.width) * 100;
          y = ((s.y - r.top) / r.height) * 100;
        } else {
          const top = Math.max(r.top, 0);
          const bottom = Math.min(r.bottom, window.innerHeight);
          y = (((top + bottom) / 2 - r.top) / r.height) * 100;
        }
        const item: LayerItem = {
          ...(payload.item as LayerItem),
          id: `l${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
          x: clampPct(x),
          y: clampPct(y),
        };
        const list = [...(invitationRef.current?.decorations?.[section] ?? []), item];
        // Se pinta ya; el editor guarda y regresa HOST_PROPS con lo mismo.
        setInvitation((prev) => (prev ? { ...prev, decorations: { ...(prev.decorations ?? {}), [section]: list } } : prev));
        window.parent?.postMessage({ type: "REMOTE_FIELD_CHANGE", payload: { path: `decorations.${section}`, value: list } }, ev.origin);
        window.parent?.postMessage({ type: "REMOTE_SELECT_SECTION", payload: { section, field: null } }, ev.origin);
        requestAnimationFrame(() => window.dispatchEvent(new CustomEvent("iattend-layer-select", { detail: { section, id: item.id } })));
      }
      // Capas del editor: elegir un elemento suelto desde el panel.
      if (type === "HOST_LAYER_SELECT" && payload?.section && payload?.id) {
        window.dispatchEvent(new CustomEvent("iattend-layer-select", { detail: { section: payload.section, id: payload.id, scroll: true } }));
      }
      if (type === "HOST_SCROLL_TO" && payload?.section) {
        setScrollToSection(payload.section as string);
        setScrollKey((k) => k + 1);
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
    const list = (fontOverride ?? []).filter((f) => f?.family);
    if (!list.length) {
      document.getElementById(LINK_ID)?.remove();
      return;
    }
    const href = `https://fonts.googleapis.com/css2?${list
      .map((f) => `family=${encodeURIComponent(f.family)}${f.google_axis ? ":" + f.google_axis : ""}`)
      .join("&")}&display=swap`;
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
    visibleSectionRef.current = section;
    if (!hostOrigin) return;
    window.parent?.postMessage({ type: "REMOTE_SCROLL_SECTION", payload: { section } }, hostOrigin);
  }, [hostOrigin]);

  // Modo edición: el organizador tocó un módulo / escribió sobre la pieza.
  const handleSelectSection = useCallback((section: string, field?: string) => {
    if (!hostOrigin) return;
    window.parent?.postMessage({ type: "REMOTE_SELECT_SECTION", payload: { section, field: field ?? null } }, hostOrigin);
  }, [hostOrigin]);

  const handleFieldTool = useCallback((field: string, rect: { x: number; y: number; w: number; h: number }, section?: string) => {
    if (!hostOrigin) return;
    window.parent?.postMessage({ type: "REMOTE_FIELD_TOOL", payload: { field, rect, section: section ?? "cover" } }, hostOrigin);
  }, [hostOrigin]);

  // Modo edición: cualquier toque en la pieza le avisa al editor, que cierra
  // sus popovers (imagen, dirección, tipografía…) como si se tocara fuera.
  useEffect(() => {
    if (!editMode || !hostOrigin) return;
    const onDown = () => window.parent?.postMessage({ type: "REMOTE_POINTER_DOWN" }, hostOrigin);
    document.addEventListener("pointerdown", onDown, true);
    return () => document.removeEventListener("pointerdown", onDown, true);
  }, [editMode, hostOrigin]);

  // Elemento suelto elegido (SectionLayer): el editor muestra su barra de
  // propiedades (color, borde, esquinas, voltear, transparencia) y los cambia
  // directo en invitation.decorations. Un "nada elegido" de otra sección no
  // borra la elección vigente.
  useEffect(() => {
    if (!editMode || !hostOrigin) return;
    let current: { section: string; id: string } | null = null;
    const onSelection = (e: Event) => {
      const d = (e as CustomEvent).detail as { section: string; id: string | null };
      if (d.id) current = { section: d.section, id: d.id };
      else if (current?.section === d.section) current = null;
      else return;
      window.parent?.postMessage({ type: "REMOTE_LAYER_SELECT", payload: current }, hostOrigin);
    };
    window.addEventListener("iattend-layer-selection", onSelection);
    return () => window.removeEventListener("iattend-layer-selection", onSelection);
  }, [editMode, hostOrigin]);

  // Texto de un bloque elegido (EditableText): el editor abre su barra de
  // texto. Se suelta al tocar fuera de un texto o con el tablero del editor.
  useEffect(() => {
    if (!editMode || !hostOrigin) return;
    let current: string | null = null;
    const post = (payload: { path: string; kind: string } | null) => {
      current = payload?.path ?? null;
      window.parent?.postMessage({ type: "REMOTE_TEXT_FIELD", payload }, hostOrigin);
    };
    const onField = (e: Event) => post((e as CustomEvent).detail);
    const onDown = (e: PointerEvent) => {
      if (!current) return;
      if ((e.target as HTMLElement | null)?.closest?.("[data-edit-field]")) return;
      post(null);
    };
    const onDeselect = () => { if (current) post(null); };
    window.addEventListener("iattend-text-field", onField);
    document.addEventListener("pointerdown", onDown, true);
    window.addEventListener("iattend-edit-deselect", onDeselect);
    return () => {
      window.removeEventListener("iattend-text-field", onField);
      document.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("iattend-edit-deselect", onDeselect);
    };
  }, [editMode, hostOrigin]);

  // Pegar una imagen (⌘V) con el foco en la pieza: el archivo se le pasa al
  // editor, que lo sube y lo regresa como sticker (HOST_LAYER_ADD).
  useEffect(() => {
    if (!editMode || !hostOrigin) return;
    const onPaste = (e: ClipboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.isContentEditable || t?.tagName === "INPUT" || t?.tagName === "TEXTAREA") return;
      const file = Array.from(e.clipboardData?.files ?? []).find((f) => f.type.startsWith("image/"));
      if (!file) return;
      e.preventDefault();
      const sel = selectedSectionRef.current === "generals" ? null : selectedSectionRef.current;
      const section = [sel, visibleSectionRef.current].find((name) => inView(zoneByName(name))) ?? null;
      window.parent?.postMessage({ type: "REMOTE_PASTE_IMAGE", payload: { file, section } }, hostOrigin);
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [editMode, hostOrigin]);

  // ⌘C / ⌘X / ⌘V de los elementos sueltos con el foco en la pieza: el editor
  // lleva el portapapeles (iattend-vite useElementClipboard) y pega en el
  // módulo elegido. Escribiendo un texto, se respeta el del navegador.
  useEffect(() => {
    if (!editMode || !hostOrigin) return;
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t?.isContentEditable || t?.tagName === "INPUT" || t?.tagName === "TEXTAREA") return;
      const action = ({ c: "copy", x: "cut", v: "paste" } as Record<string, string>)[e.key.toLowerCase()];
      if (!action) return;
      window.parent?.postMessage({ type: "REMOTE_ELEMENT_KEY", payload: { action } }, hostOrigin);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [editMode, hostOrigin]);

  // Texto con el foco (escribiendo): el editor recibe dónde quedó dentro de
  // la pieza para subirla si el teclado de pantalla (iPad) lo tapa. null al
  // soltar el foco.
  useEffect(() => {
    if (!editMode || !hostOrigin) return;
    const editable = (t: EventTarget | null) => {
      const el = t as HTMLElement | null;
      return el && (el.isContentEditable || el.tagName === "INPUT" || el.tagName === "TEXTAREA") ? el : null;
    };
    const post = (el: HTMLElement | null) => {
      const r = el?.getBoundingClientRect();
      const rect = r ? { x: r.left, y: r.top, w: r.width, h: r.height } : null;
      window.parent?.postMessage({ type: "REMOTE_TEXT_FOCUS", payload: { rect } }, hostOrigin);
    };
    const onIn = (e: FocusEvent) => { const el = editable(e.target); if (el) post(el); };
    const onOut = (e: FocusEvent) => { if (editable(e.target) && !editable(e.relatedTarget)) post(null); };
    // Al escribir el texto puede crecer (otro renglón): se vuelve a avisar.
    const onInput = (e: Event) => { const el = editable(e.target); if (el) post(el); };
    document.addEventListener("focusin", onIn);
    document.addEventListener("focusout", onOut);
    document.addEventListener("input", onInput);
    return () => {
      document.removeEventListener("focusin", onIn);
      document.removeEventListener("focusout", onOut);
      document.removeEventListener("input", onInput);
    };
  }, [editMode, hostOrigin]);

  const handleClearField = useCallback(() => {
    if (!hostOrigin) return;
    window.parent?.postMessage({ type: "REMOTE_CLEAR_FIELD" }, hostOrigin);
  }, [hostOrigin]);

  const handleFieldChange = useCallback((path: string, value: unknown) => {
    if (!hostOrigin) return;
    window.parent?.postMessage({ type: "REMOTE_FIELD_CHANGE", payload: { path, value } }, hostOrigin);
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
        scrollKey={scrollKey}
        onSectionChange={handleSectionChange}
        textures={textures}
        giftBrands={giftBrands}
        textureOverride={textureOverride}
        editMode={editMode}
        textBar={textBar}
        selectedSection={selectedSection}
        onSelectSection={handleSelectSection}
        onFieldChange={handleFieldChange}
        onFieldTool={handleFieldTool}
        onClearField={handleClearField}
      />
    </div>
  ) : null;
}
