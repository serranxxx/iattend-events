"use client";
import React, { useEffect, useRef, useState } from "react";
import { Button, Tooltip } from "antd";
import { ParticipansType } from "@/types/guests";
import { darker } from "@/helpers/functions";
import { profilesMap } from "@/components/ConfirmCard/profiles";
import styles from "./attendees.module.css";

type AttendeesProps = { participants: ParticipansType[] | null };

const SIZES = [90, 70, 110, 75, 95, 65, 85, 100, 72];

function overlaps(x: number, y: number, r: number, placed: { x: number; y: number; r: number }[]) {
  return placed.some(p => Math.hypot(x - p.x, y - p.y) < r + p.r + 18);
}

export function Attendees({ participants }: AttendeesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const namesContRef = useRef<HTMLDivElement>(null);
  const scrollRafRef = useRef<number | null>(null);
  const cycleIndexRef = useRef<number>(0);
  const participantsRef = useRef<ParticipansType[] | null>(null);

  const [seAll, setSeAll] = useState(false);
  const [closing, setClosing] = useState(false);
  const [visibleParticipants, setVisibleParticipants] = useState<ParticipansType[]>([]);
  const [namesWidth, setNamesWidth] = useState(0);

  const handleToggle = () => {
    if (seAll) {
      setSeAll(false);
      setClosing(false);
      setVisibleParticipants([]);
    } else {
      setSeAll(true);
    }
  };

  // Placement useEffect
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !visibleParticipants.length) return;

    const items = container.querySelectorAll<HTMLElement>('[data-bubble]');
    const lastEl = items[items.length - 1];
    if (!lastEl) return;

    const i = items.length - 1;
    const r = SIZES[i % SIZES.length] / 2;
    const H = container.clientHeight;

    const placed = Array.from(items).slice(0, -1).map(el => ({
      x: parseFloat(el.style.left) + parseFloat(el.style.width) / 2,
      y: parseFloat(el.style.top) + parseFloat(el.style.height) / 2,
      r: parseFloat(el.style.width) / 2,
    }));

    lastEl.style.width = `${r * 2}px`;
    lastEl.style.height = `${r * 2}px`;
    lastEl.style.fontSize = `${r * 1}px`;
    lastEl.style.transition = 'all 0.3s ease';

    let bestX = r, bestY = r, found = false;
    for (let testX = r; testX < 8000; testX += 6) {
      for (let testY = r; testY <= H - r; testY += 6) {
        if (!overlaps(testX, testY, r, placed)) {
          bestX = testX + (Math.random() - 0.5) * 10;
          bestY = testY + (Math.random() - 0.5) * 10;
          bestX = Math.max(r + 2, bestX);
          bestY = Math.max(r + 2, Math.min(H - r - 2, bestY));
          found = true;
          break;
        }
      }
      if (found) break;
    }

    lastEl.style.left = `${bestX - r}px`;
    lastEl.style.top = `${bestY - r}px`;

    const neededWidth = bestX + r + 20;
    const currentMin = parseFloat(container.style.minWidth) || 0;
    if (neededWidth > currentMin) container.style.minWidth = `${neededWidth}px`;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        lastEl.style.opacity = '1';
        lastEl.style.transform = 'scale(1)';
      });
    });
  }, [visibleParticipants]);

  // Stagger useEffect
  useEffect(() => {
    if (!seAll || !participants?.length) return;
    setVisibleParticipants([]);
    participants.forEach((p, i) => {
      setTimeout(() => setVisibleParticipants(prev => [...prev, p]), i * 80);
    });
  }, [seAll]);

  // Autoscroll useEffect
  useEffect(() => {
    if (!seAll) {
      if (scrollRafRef.current) {
        cancelAnimationFrame(scrollRafRef.current);
        scrollRafRef.current = null;
      }
      return;
    }

    cycleIndexRef.current = 0;
    let lastAppendScroll = 0;
    const SPEED = 0;
    const REFILL_THRESHOLD = 300;
    const REFILL_MIN_ADVANCE = 70;

    const tick = () => {
      const container = containerRef.current;
      if (container) {
        container.scrollLeft += SPEED;
        const distFromEnd = container.scrollWidth - container.clientWidth - container.scrollLeft;
        const pts = participantsRef.current;
        if (distFromEnd < REFILL_THRESHOLD && container.scrollLeft - lastAppendScroll > REFILL_MIN_ADVANCE && pts?.length) {
          const nextP = pts[cycleIndexRef.current % pts.length];
          cycleIndexRef.current++;
          lastAppendScroll = container.scrollLeft;
          setVisibleParticipants(prev => [...prev, nextP]);
        }
      }
      scrollRafRef.current = requestAnimationFrame(tick);
    };

    scrollRafRef.current = requestAnimationFrame(tick);
    return () => { if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current); };
  }, [seAll]);

  // Sync participantsRef
  useEffect(() => {
    participantsRef.current = participants;
  }, [participants]);

  // Measure names container width
  useEffect(() => {
    const el = namesContRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setNamesWidth(el.clientWidth));
    ro.observe(el);
    setNamesWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      className={styles.col_cont}
      style={{
        gap: '12px',
        padding: seAll ? '0px 0px 16px 0px' : '16px',
        boxSizing: 'border-box',
      }}
    >
      <div className={styles.participants_row} style={{ padding: seAll ? '16px' : '0px' }}>
        <span>
          {(participants?.length ?? 0) > 0
            ? `${participants?.length} Asistentes`
            : '¡Se el primero en confirmar!'}
        </span>
        {(participants?.length ?? 0) > 0 && (
          <Button className={styles.participants_toggle} type="text" onClick={handleToggle}>
            {seAll || closing ? 'Cerrar' : 'Ver todo'}
          </Button>
        )}
      </div>

      {!seAll ? (
        <>
          <div className={styles.paticipants_cont}>
            {participants?.slice(0, 8).map((p, index) => (
              <Tooltip key={index} title={p.anonymous ? 'Anónimo' : p.name} color={profilesMap[p.profile].background}>
                <div className={styles.participant_item} style={{ background: profilesMap[p.profile].gradient }}>
                  {p.anonymous ? '🥷' : p.emoji}
                </div>
              </Tooltip>
            ))}
          </div>

          <div ref={namesContRef} className={styles.paticipants_cont} style={{ gap: '6px', marginTop:'-6px' }}>
            {(() => {
              const MAX_CHARS = namesWidth > 0 ? Math.floor(namesWidth /6) : 40;
              let total = 0;
              const visible: ParticipansType[] = [];
              for (const p of (participants ?? [])) {
                if (p.anonymous || p.name === 'Anónimo') continue;
                if (total + p.name.length > MAX_CHARS) break;
                visible.push(p);
                total += p.name.length + 2;
              }
              return (
                <>
                  {visible.map((p, index) => (
                    <span style={{ fontSize: '12px', opacity: '0.5' }} key={index}>
                      {p.name}{index < visible.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                  {(participants?.filter(p => !p.anonymous && p.name !== 'Anónimo').length ?? 0) > visible.length && (
                    <span style={{ fontSize: '12px', opacity: '0.5' }}>...</span>
                  )}
                </>
              );
            })()}
          </div>
        </>
      ) : (
        <div ref={containerRef} className={`${styles.paticipants_cont_open} scroll-invitation`}>
          {visibleParticipants.map((p, index) => {
            const size = SIZES[index % SIZES.length];
            const fz = Math.max(11, Math.ceil(899 / size));
            const firstName = p.anonymous ? 'Anónimo' : p.name.split(' ')[0];
            const displayName = firstName.length > 100 ? `${firstName.slice(0, 99)}…` : firstName;
            return (
              <Tooltip key={index} title={p.anonymous ? 'Anónimo' : p.name} color={profilesMap[p.profile].background}>
                <div data-bubble className={styles.participant_item_open} style={{ background: profilesMap[p.profile].background }}>
                  <span>{p.anonymous ? '🥷' : p.emoji}</span>
                  {p.name !== 'Anónimos' && (
                    <svg
                      style={{ position: 'absolute', top: '-45%', left: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}
                      viewBox="0 0 100 100"
                    >
                      <defs>
                        <path id={`arc-${index}`} d="M 12,120 A 60,90 0 0,0 82,126" fill="none" />
                      </defs>
                      <text fontSize={fz} fill={darker(profilesMap[p.profile].dark, 0.8) ?? "#FFF"} textAnchor="middle" opacity="1" fontFamily="Poppins, sans-serif" fontWeight="600" letterSpacing="4">
                        <textPath href={`#arc-${index}`} startOffset="50%">{displayName}</textPath>
                      </text>
                    </svg>
                  )}
                </div>
              </Tooltip>
            );
          })}
        </div>
      )}
    </div>
  );
}
