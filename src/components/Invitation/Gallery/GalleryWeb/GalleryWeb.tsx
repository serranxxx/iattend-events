"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { InvitationUIBundle } from "@/types/new_invitation";
import { lighter } from "@/helpers/functions";
import { fmt } from "../../InvitationDock/copy";
import { getWebCopy } from "../../layout/copy";
import web from "../../layout/web-section.module.css";
import styles from "./gallery-web.module.css";

type GalleryWebProps = {
  images: string[];
  ui?: InvitationUIBundle | null;
  textColor: string;
  placeholder: string;
  title: React.ReactNode;
};

const MAX_IMAGES = 10;
const HEIGHT = 560;
const GAP = 16;
// Patrón que se repite: columnas altas (1 foto) y pares (2 fotos apiladas).
const PATTERN: ["tall" | "pair", number][] = [
  ["tall", 380], ["pair", 300], ["tall", 280], ["pair", 360], ["tall", 420], ["pair", 260],
];

const buildColumns = (images: string[]) => {
  const columns: { width: number; items: string[] }[] = [];
  let i = 0;
  let p = 0;
  while (i < images.length) {
    const [kind, width] = PATTERN[p % PATTERN.length];
    // Un par al que solo le queda una foto se vuelve columna alta.
    const take = kind === "pair" && i < images.length - 1 ? 2 : 1;
    columns.push({ width, items: images.slice(i, i + take) });
    i += take;
    p++;
  }
  return columns;
};

/** Galería en web: masonry horizontal de scroll libre, hasta 10 fotos. */
export default function GalleryWeb({ images, ui, textColor, placeholder, title }: GalleryWebProps) {
  const copy = getWebCopy(ui);
  const shown = images.filter(Boolean).slice(0, MAX_IMAGES);
  const columns = buildColumns(shown);
  const muted = lighter(textColor, 0.4) ?? textColor;

  const scrollerRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ x: number; left: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState({ left: 0, ratio: 1 });

  const measure = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || !el.scrollWidth) return;
    const max = el.scrollWidth - el.clientWidth;
    setProgress({ left: max > 0 ? el.scrollLeft / max : 0, ratio: Math.min(1, el.clientWidth / el.scrollWidth) });
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure, shown.length]);

  // Solo el mouse arrastra a mano; trackpad y touch usan el scroll nativo.
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || !scrollerRef.current) return;
    dragStart.current = { x: e.clientX, left: scrollerRef.current.scrollLeft };
    setDragging(true);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStart.current || !scrollerRef.current) return;
    scrollerRef.current.scrollLeft = dragStart.current.left - (e.clientX - dragStart.current.x);
  };
  const onPointerUp = () => {
    if (!dragStart.current) return;
    dragStart.current = null;
    setDragging(false);
  };

  return (
    <div className={styles.wrapper}>
      <div className={`${web.header_row} ${styles.header}`}>
        <span />
        {title}
        <span className={styles.count} style={{ color: muted }}>{fmt(copy.photos, { n: shown.length })}</span>
      </div>

      {shown.length > 0 && (
        <>
          <div
            ref={scrollerRef}
            className={`${styles.scroller} ${dragging ? styles.dragging : ""}`}
            onScroll={measure}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          >
            {columns.map((column, c) => (
              <div key={c} className={styles.column} style={{ flex: `0 0 ${column.width}px` }}>
                {column.items.map((src, k) => (
                  <div
                    key={k}
                    className={styles.photo}
                    style={{ height: column.items.length === 2 ? (HEIGHT - GAP) / 2 : HEIGHT, background: placeholder }}
                  >
                    <Image fill sizes={`${column.width}px`} alt="" src={src} draggable={false} style={{ objectFit: "cover" }} />
                  </div>
                ))}
              </div>
            ))}
          </div>

          {progress.ratio < 1 && <div className={styles.progress_row}>
            <div className={styles.track} style={{ background: `${textColor}1a` }}>
              <div
                className={styles.thumb}
                style={{
                  background: textColor,
                  width: `${progress.ratio * 100}%`,
                  left: `${progress.left * (1 - progress.ratio) * 100}%`,
                }}
              />
            </div>
            <span className={styles.hint} style={{ color: muted }}>{copy.dragHint}</span>
          </div>}
        </>
      )}
    </div>
  );
}
