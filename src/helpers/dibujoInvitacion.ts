/*
  Herramienta Dibujar en la invitación (editor de iattend-vite, como en un
  Pop): el editor toma el puntero sobre la pieza y manda el trazo terminado
  (HOST_DIBUJO_TRAZO, puntos en px de este documento); aquí se convierte en
  un elemento `kind: "dibujo"` de la sección donde empezó
  (`decorations.<sección>`), con las mismas cuentas que SideCanvas.jsx
  (`terminarTrazo`) usa en un Pop:
  · la caja de la sección mide 390 unidades de ancho (las de la pieza);
  · x / y / w en % de esa caja, puntos en unidades de su propia caja vbW × vbH;
  · el borrador no es capa: agrega `erase` a cada trazo que toca.
  Se pinta con SideEvent/Dibujo.tsx (SectionLayer).
*/

import type { LayerItem } from "@/types/new_invitation";

type PincelInfo = { k: number; borra?: boolean; brillo?: boolean; maxA?: number };
// Mismos pinceles que iattend-vite (modules/Editor/dibujoData.js).
const PINCEL: Record<string, PincelInfo> = {
  pluma: { k: 1 },
  marcador: { k: 1.8 },
  resaltador: { k: 3, maxA: 0.45 },
  lapiz: { k: 0.55 },
  neon: { k: 1.3, brillo: true },
  borrador: { k: 2, borra: true },
};

export type Pincel = { brush: string; color: string; size: number; opacity: number };
type Punto = [number, number];
type Caja = { left: number; top: number; width: number; height: number };

const ANCHO_UNIDADES = 390;
const r1 = (n: number) => Math.round(n * 10) / 10;
const r2 = (n: number) => Math.round(n * 100) / 100;

// Ramer-Douglas-Peucker (igual que dibujoData.js).
export const simplificar = (pts: Punto[], tol = 0.6): Punto[] => {
  if (pts.length < 3) return pts;
  const dist = (p: Punto, a: Punto, b: Punto) => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l2 = dx * dx + dy * dy;
    if (!l2) return Math.hypot(p[0] - a[0], p[1] - a[1]);
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2));
    return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
  };
  const rdp = (ini: number, fin: number): Punto[] => {
    let max = 0;
    let idx = -1;
    for (let i = ini + 1; i < fin; i++) {
      const d = dist(pts[i], pts[ini], pts[fin]);
      if (d > max) { max = d; idx = i; }
    }
    if (max <= tol || idx < 0) return [pts[ini], pts[fin]];
    return [...rdp(ini, idx).slice(0, -1), ...rdp(idx, fin)];
  };
  return rdp(0, pts.length - 1);
};

const unidades = (caja: Caja) => ({ ancho: ANCHO_UNIDADES, alto: ANCHO_UNIDADES * (caja.height / caja.width) });
const aUnidades = (pts: Punto[], caja: Caja): Punto[] => {
  const u = unidades(caja);
  return pts.map(([x, y]) => [((x - caja.left) / caja.width) * u.ancho, ((y - caja.top) / caja.height) * u.alto]);
};

export const esBorrador = (pincel: Pincel) => Boolean(PINCEL[pincel.brush]?.borra);

const nuevoId = () => `d${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** El trazo nuevo (pts en px del documento) dentro de la caja de su sección. */
export const trazoNuevo = (pts: Punto[], caja: Caja, pincel: Pincel): LayerItem => {
  const p = PINCEL[pincel.brush] ?? PINCEL.pluma;
  const u = unidades(caja);
  const ancho = pincel.size * p.k;
  const puntos = simplificar(aUnidades(pts, caja), 0.6);
  const pad = ancho / 2 + (p.brillo ? pincel.size * 3 : 2);
  const xs = puntos.map((q) => q[0]);
  const ys = puntos.map((q) => q[1]);
  const x0 = Math.min(...xs) - pad;
  const y0 = Math.min(...ys) - pad;
  const vbW = Math.max(1, Math.max(...xs) - Math.min(...xs) + pad * 2);
  const vbH = Math.max(1, Math.max(...ys) - Math.min(...ys) + pad * 2);
  return {
    id: nuevoId(),
    kind: "dibujo",
    brush: pincel.brush,
    color: pincel.color,
    size: pincel.size,
    points: puntos.map(([x, y]) => [r1(x - x0), r1(y - y0)]),
    vbW: r1(vbW),
    vbH: r1(vbH),
    x: r2(((x0 + vbW / 2) / u.ancho) * 100),
    y: r2(((y0 + vbH / 2) / u.alto) * 100),
    w: r2((vbW / u.ancho) * 100),
    rot: 0,
    opacity: Math.min(pincel.opacity / 100, p.maxA ?? 1),
  } as LayerItem;
};

/**
 * Borrador sobre los trazos de una sección: a cada uno que toca le agrega lo
 * borrado (en las unidades de su caja). null si no tocó ninguno.
 */
export const borrarEnSeccion = (items: LayerItem[], pts: Punto[], caja: Caja, pincel: Pincel): LayerItem[] | null => {
  const p = PINCEL[pincel.brush] ?? PINCEL.borrador;
  const u = unidades(caja);
  const enCaja = aUnidades(pts, caja);
  const ancho = pincel.size * p.k;
  let toco = false;
  const nueva = items.map((o) => {
    if (o.kind !== "dibujo" || o.hidden || !o.vbW || !o.vbH) return o;
    const k = ((o.w / 100) * u.ancho) / o.vbW;
    const cx = (o.x / 100) * u.ancho;
    const cy = (o.y / 100) * u.alto;
    const rad = (-(o.rot ?? 0) * Math.PI) / 180;
    const vbW = o.vbW;
    const vbH = o.vbH;
    const local: Punto[] = enCaja.map(([px, py]) => {
      const dx = px - cx;
      const dy = py - cy;
      return [(dx * Math.cos(rad) - dy * Math.sin(rad)) / k + vbW / 2, (dx * Math.sin(rad) + dy * Math.cos(rad)) / k + vbH / 2];
    });
    const m = ancho / k / 2;
    if (!local.some(([x, y]) => x > -m && x < vbW + m && y > -m && y < vbH + m)) return o;
    toco = true;
    return {
      ...o,
      erase: [...(o.erase ?? []), { points: simplificar(local, 0.6 / k).map(([x, y]) => [r1(x), r1(y)] as Punto), size: r1(ancho / k) }],
    };
  });
  return toco ? nueva : null;
};
