"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import styles from "./hero.module.css";

type BgItem = { type: string; media: string };
type HeroProps = { background?: BgItem[] };

const SLIDE_DURATION = 5000;

export function Hero({ background }: HeroProps) {
  const items = background ?? [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const advance = () => {
    if (items.length <= 1) return;
    setCurrentIndex(prev => (prev + 1) % items.length);
  };

  useEffect(() => {
    if (items.length <= 1) return;
    timerRef.current = setTimeout(advance, SLIDE_DURATION);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [currentIndex, items.length]);

  return (
    <div className={styles.hero}>
      {items.map((item, i) => (
        <div
          key={i}
          className={styles.hero_layer}
          style={{ opacity: i === currentIndex ? 1 : 0 }}
        >
          {item.type === "video" ? (
            <video
              className={styles.hero_bg}
              src={item.media}
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <Image
              className={styles.hero_bg}
              fill
              src={item.media}
              alt=""
              style={{ objectFit: "cover" }}
            />
          )}
        </div>
      ))}
      <div className={styles.shadow} />
    </div>
  );
}
