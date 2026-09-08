"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./reactions.module.css";

const HEART = "❤️";
const EMOJIS = [HEART, "✨", "😍"];
const TICKER_FADE_MS = 320;

type ReactionsProps = {
  // null en el preview del editor (host): anima pero no persiste
  saveTheDateId: string | null;
  // avisa al contenedor si hay mensajes guardados (para reservar espacio al ticker)
  onMessagesChange?: (hasMessages: boolean) => void;
};

type Floater = {
  id: number;
  emoji: string;
  right: number;    // % desde la derecha
  size: number;     // px
  duration: number; // s
  drift: number;    // px de deriva horizontal
};

type StoredMessage = {
  id: string | number;
  message: string;
  created_at: string;
};

export default function Reactions({ saveTheDateId, onMessagesChange }: ReactionsProps) {
  const supabase = useMemo(() => createClient(), []);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [messages, setMessages] = useState<StoredMessage[]>([]); // más reciente primero
  const [msgIndex, setMsgIndex] = useState(0);
  const [tickerShown, setTickerShown] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [sheetClosing, setSheetClosing] = useState(false);
  const idRef = useRef(0);
  const ownIdsRef = useRef<Set<string>>(new Set());

  const closeSheet = () => {
    if (sheetClosing) return;
    setSheetClosing(true);
    setTimeout(() => {
      setHistoryOpen(false);
      setSheetClosing(false);
    }, 280);
  };

  const hasText = message.trim().length > 0;

  const spawn = (emoji: string, count: number) => {
    const batch: Floater[] = Array.from({ length: count }, () => ({
      id: ++idRef.current,
      emoji,
      right: 4 + Math.random() * 26,
      size: 22 + Math.random() * 22,
      duration: 2.6 + Math.random() * 1.8,
      drift: -30 + Math.random() * 70,
    }));
    setFloaters((f) => [...f, ...batch]);
    setTimeout(() => {
      setFloaters((f) => f.filter((x) => !batch.some((b) => b.id === x.id)));
    }, 5000);
  };

  // Al abrir: carga reacciones. Si ya hay corazones de alguien más, suben
  // solitos (como IG); los mensajes alimentan el ticker.
  useEffect(() => {
    if (!saveTheDateId) return;
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    (async () => {
      const { data } = await supabase
        .from("save_the_date_reactions")
        .select("id, emoji, message, created_at")
        .eq("save_the_date_id", saveTheDateId)
        .order("created_at", { ascending: false })
        .limit(100);
      if (cancelled || !data) return;
      const msgs = data.filter((r) => r.message) as StoredMessage[];
      setMessages(msgs);
      data
        .filter((r) => r.emoji)
        .slice(0, 12)
        .forEach((row, i) => {
          timers.push(setTimeout(() => spawn(row.emoji as string, 1), 800 + i * 380));
        });
    })();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [saveTheDateId, supabase]);

  useEffect(() => {
    onMessagesChange?.(messages.length > 0);
  }, [messages.length, onMessagesChange]);

  // Realtime: las reacciones y mensajes de otros entran en vivo.
  useEffect(() => {
    if (!saveTheDateId) return;
    const channel = supabase
      .channel(`std_reactions_${saveTheDateId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "save_the_date_reactions",
          filter: `save_the_date_id=eq.${saveTheDateId}`,
        },
        (payload) => {
          const row = payload.new as { id: string; emoji: string | null; message: string | null; created_at: string };
          // lo que mandé yo ya se animó de forma optimista
          if (ownIdsRef.current.has(String(row.id))) return;

          if (row.emoji) spawn(row.emoji, 3);

          if (row.message) {
            const msg = row.message;
            setMessages((prev) => {
              if (prev.some((m) => String(m.id) === String(row.id))) return prev;
              // si ya está como optimista (sin id real), solo se le pone el id
              const i = prev.findIndex((m) => String(m.id).startsWith("local-") && m.message === msg);
              if (i > -1) {
                const next = [...prev];
                next[i] = { id: row.id, message: msg, created_at: row.created_at };
                return next;
              }
              return [{ id: row.id, message: msg, created_at: row.created_at }, ...prev];
            });
            setMsgIndex(0);
            setTickerShown(true);
          }
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.warn("[save-the-date] realtime:", status);
        }
      });

    return () => { supabase.removeChannel(channel); };
  }, [saveTheDateId, supabase]);

  // Ticker: un mensaje a la vez. Rotación en dos fases: fade-out → cambio → fade-in
  useEffect(() => {
    if (messages.length <= 1 || historyOpen) return;
    let swap: ReturnType<typeof setTimeout> | undefined;
    const id = setInterval(() => {
      setTickerShown(false);
      swap = setTimeout(() => {
        setMsgIndex((i) => (i + 1) % messages.length);
        setTickerShown(true);
      }, TICKER_FADE_MS);
    }, 5000);
    return () => { clearInterval(id); if (swap) clearTimeout(swap); };
  }, [messages.length, historyOpen]);

  const react = (emoji: string) => {
    spawn(emoji, 7);
    if (!saveTheDateId) return; // preview del editor
    supabase
      .from("save_the_date_reactions")
      .insert({ save_the_date_id: saveTheDateId, emoji })
      .select("id")
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) return console.error("[reaction]", error);
        if (data?.id) ownIdsRef.current.add(String(data.id));
      });
  };

  const send = () => {
    const text = message.trim();
    if (!text) return;
    setMessage("");
    setSent(true);
    setTimeout(() => setSent(false), 2500);
    spawn(HEART, 5);
    // optimista: aparece de inmediato en el ticker
    setMessages((prev) => [{ id: `local-${Date.now()}`, message: text, created_at: new Date().toISOString() }, ...prev]);
    setMsgIndex(0);
    setTickerShown(true);
    if (!saveTheDateId) return;
    supabase
      .from("save_the_date_reactions")
      .insert({ save_the_date_id: saveTheDateId, message: text })
      .select("id, created_at")
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) return console.error("[reaction]", error);
        if (!data?.id) return;
        ownIdsRef.current.add(String(data.id));
        // el optimista pasa a tener el id real (así el eco no lo duplica)
        setMessages((prev) => prev.map((m) =>
          String(m.id).startsWith("local-") && m.message === text
            ? { id: data.id, message: text, created_at: data.created_at }
            : m
        ));
      });
  };

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  const current = messages.length > 0 ? messages[msgIndex % messages.length] : null;

  return (
    <>
      {/* Corazones flotando desde bottom-right */}
      <div className={styles.floatLayer} aria-hidden>
        {floaters.map((f) => (
          <span
            key={f.id}
            className={styles.floater}
            style={{
              right: `${f.right}%`,
              fontSize: `${f.size}px`,
              animationDuration: `${f.duration}s`,
              "--drift": `${f.drift}px`,
            } as React.CSSProperties}
          >
            {f.emoji}
          </span>
        ))}
      </div>

      {/* Ticker de mensajes (uno a la vez), estilo caption de historia.
          Si hay mensajes guardados, siempre visible (el sheet lo cubre al abrirse). */}
      {current && (
        <div className={styles.tickerWrap}>
          <button
            className={`${styles.msgTicker} ${tickerShown ? "" : styles.tickerHidden}`}
            onClick={() => setHistoryOpen(true)}
          >
            <span className={styles.msgAvatar}>💌</span>
            <span className={styles.msgText}>{current.message}</span>
          </button>
        </div>
      )}

      {/* Barra inferior: mensaje (flex 1) + corazón/enviar con crossfade */}
      <div className={styles.bar}>
        <input
          className={styles.input}
          value={message}
          maxLength={200}
          placeholder={sent ? "¡Enviado! 💌" : "Envía un mensaje..."}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(); }}
        />
        <div className={`${styles.actionSlot} ${hasText ? styles.actionSlotWide : ""}`}>
          <div className={`${styles.slotItem} ${styles.emojiRow} ${!hasText ? styles.slotItemActive : ""}`}>
            {EMOJIS.map((e) => (
              <button
                key={e}
                className={styles.emojiBtn}
                onClick={() => react(e)}
                tabIndex={hasText ? -1 : 0}
                aria-label={`Reaccionar ${e}`}
                aria-hidden={hasText}
              >
                {e}
              </button>
            ))}
          </div>
          <button
            className={`${styles.slotItem} ${styles.sendBtn} ${hasText ? styles.slotItemActive : ""}`}
            onClick={send}
            tabIndex={hasText ? 0 : -1}
            aria-hidden={!hasText}
          >
            Enviar
          </button>
        </div>
      </div>

      {/* Historial de mensajes (bottom sheet, anónimo) */}
      {historyOpen && (
        <div
          className={`${styles.sheetBackdrop} ${sheetClosing ? styles.backdropClosing : ""}`}
          onClick={closeSheet}
        >
          {/* El desenfoque va inline: el pipeline de CSS de Next descarta
              `backdrop-filter` en los módulos de este repo. */}
          <div
            className={`${styles.sheet} ${sheetClosing ? styles.sheetClosing : ""}`}
            style={{ backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.sheetHandle} />
            <div className={styles.sheetTitle}>Mensajes</div>
            <div className={styles.sheetList}>
              {messages.map((m) => (
                <div key={String(m.id)} className={styles.sheetRow}>
                  <span className={styles.msgAvatar}>💌</span>
                  <div className={styles.sheetRowBody}>
                    <span className={styles.sheetRowText}>{m.message}</span>
                    <span className={styles.sheetRowMeta}>{fmtTime(m.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
