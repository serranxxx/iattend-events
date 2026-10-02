"use client";

import { CalendarX, Camera, QrCode, Sparkles, SquarePen } from "lucide-react";
import { DockCopy } from "@/types/new_invitation";
import { fmt } from "./copy";
import styles from "./invitation-dock.module.css";

type DockTourProps = {
  t: DockCopy;
  goingCount: number;
  onDone: () => void;
};

export function DockTour({ t, goingCount, onDone }: DockTourProps) {
  const items = [
    { icon: <QrCode size={20} />, title: t.tabPasses, text: goingCount === 1 ? t.tourPassesOne : fmt(t.tourPassesMany, { n: goingCount }) },
    { icon: <Camera size={20} />, title: t.tabPhotos, text: t.tourPhotos },
    { icon: <Sparkles size={20} />, title: t.tabLia, text: t.tourLia },
    { icon: <SquarePen size={20} />, title: t.tabEdit, text: t.tourEdit },
  ];

  return (
    <div className={styles.stack} style={{ gap: 18 }}>
      <div className={styles.stack} style={{ gap: 6 }}>
        <span className={styles.title} style={{ fontSize: 26, lineHeight: 1.15 }}>{t.tourTitle}</span>
        <span className={styles.body_text}>{t.tourSub}</span>
      </div>

      <div className={styles.stack} style={{ gap: 14 }}>
        {items.map((item) => (
          <div key={item.title} className={styles.tour_row}>
            <span className={styles.tour_icon}>{item.icon}</span>
            <div className={styles.stack} style={{ gap: 2 }}>
              <span className={styles.tour_title}>{item.title}</span>
              <span className={styles.tour_text}>{item.text}</span>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.tour_note}>{t.tourNote}</div>
      <button type="button" onClick={onDone} className={styles.cta}>{t.gotIt}</button>
    </div>
  );
}

type DockDeclinedProps = {
  t: DockCopy;
  onChangeAnswer: () => void;
};

export function DockDeclined({ t, onChangeAnswer }: DockDeclinedProps) {
  return (
    <div className={`${styles.stack} ${styles.center}`} style={{ gap: 18 }}>
      <div className={`${styles.round_icon} ${styles.round_icon_soft}`}>
        <CalendarX size={28} />
      </div>
      <div className={styles.stack} style={{ gap: 8 }}>
        <span className={styles.title} style={{ fontSize: 26, lineHeight: 1.15 }}>{t.declinedTitle}</span>
        <span className={styles.body_text}>{t.declinedSub}</span>
      </div>
      <button type="button" onClick={onChangeAnswer} className={`${styles.cta} ${styles.cta_outline}`}>{t.changeAnswer}</button>
    </div>
  );
}
