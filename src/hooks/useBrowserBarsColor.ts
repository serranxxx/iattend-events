"use client";

import { RefObject, useEffect, useState } from "react";

// Safari (iOS) no dibuja la página detrás de la hora ni de su barra de abajo:
// esas dos franjas las pinta con el color de fondo de la página (html/body).
// Para que la portada se sienta de pantalla completa, mientras está a la vista
// el fondo toma el color dominante de la portada; al bajar, el de la
// invitación.

const isVideo = (url: string) => /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url);

const SAMPLE = 24; // lado del lienzo de muestreo
const EDGE = 4; // filas de arriba y de abajo que se promedian
const FALLBACK = "#111111"; // si la imagen no se deja leer (CORS)

const toHex = (n: number) => Math.round(n).toString(16).padStart(2, "0");

// Color de las orillas de arriba y de abajo (las que quedan junto a las
// franjas de Safari). Mediana por canal, no promedio: así unos cuantos puntos
// brillantes (luces, fuegos artificiales) no aclaran el color.
const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
};

const edgeColor = (source: CanvasImageSource): string | null => {
  const canvas = document.createElement("canvas");
  canvas.width = SAMPLE;
  canvas.height = SAMPLE;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0, SAMPLE, SAMPLE);
  try {
    const top = ctx.getImageData(0, 0, SAMPLE, EDGE).data;
    const bottom = ctx.getImageData(0, SAMPLE - EDGE, SAMPLE, EDGE).data;
    const r: number[] = [], g: number[] = [], b: number[] = [];
    for (const data of [top, bottom]) {
      for (let i = 0; i < data.length; i += 4) {
        r.push(data[i]);
        g.push(data[i + 1]);
        b.push(data[i + 2]);
      }
    }
    return `#${toHex(median(r))}${toHex(median(g))}${toHex(median(b))}`;
  } catch {
    return null; // lienzo "manchado": la imagen no permite leerse
  }
};

const sampleMedia = (url: string): Promise<string | null> =>
  new Promise((resolve) => {
    if (isVideo(url)) {
      const video = document.createElement("video");
      video.crossOrigin = "anonymous";
      video.muted = true;
      video.playsInline = true;
      video.preload = "auto";
      video.onloadeddata = () => { video.currentTime = Math.min(0.1, video.duration || 0); };
      video.onseeked = () => resolve(edgeColor(video));
      video.onerror = () => resolve(null);
      video.src = url;
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(edgeColor(img));
    img.onerror = () => resolve(null);
    img.src = url;
  });

type Options = {
  enabled: boolean;
  coverUrl: string | null;
  pageColor: string;
  coverRef: RefObject<HTMLElement | null>;
  scrollRef: RefObject<HTMLElement | null>;
};

export function useBrowserBarsColor({ enabled, coverUrl, pageColor, coverRef, scrollRef }: Options) {
  const [coverColor, setCoverColor] = useState<string | null>(null);
  const [coverInView, setCoverInView] = useState(true);

  useEffect(() => {
    if (!enabled || !coverUrl) { setCoverColor(null); return; }
    let alive = true;
    sampleMedia(coverUrl).then((color) => { if (alive) setCoverColor(color ?? FALLBACK); });
    return () => { alive = false; };
  }, [enabled, coverUrl]);

  // La portada cuenta como "a la vista" mientras se vea al menos la mitad.
  useEffect(() => {
    const cover = coverRef.current;
    if (!enabled || !cover) return;
    const observer = new IntersectionObserver(
      ([entry]) => setCoverInView(entry.intersectionRatio >= 0.5),
      { root: scrollRef.current, threshold: [0, 0.5, 1] }
    );
    observer.observe(cover);
    return () => observer.disconnect();
  }, [enabled, coverRef, scrollRef]);

  useEffect(() => {
    if (!enabled) return;
    const html = document.documentElement;
    const body = document.body;
    const prev = { html: html.style.backgroundColor, body: body.style.backgroundColor };
    const color = coverInView && coverColor ? coverColor : pageColor;
    html.style.backgroundColor = color;
    body.style.backgroundColor = color;
    return () => {
      html.style.backgroundColor = prev.html;
      body.style.backgroundColor = prev.body;
    };
  }, [enabled, coverInView, coverColor, pageColor]);
}
