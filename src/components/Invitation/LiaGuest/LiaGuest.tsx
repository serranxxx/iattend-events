"use client";

import { useEffect, useRef, useState } from "react";
import { X, Sparkles } from "lucide-react";
import styles from "./lia-guest.module.css";

const API_URL = process.env.NEXT_PUBLIC_IATTEND_API_URL;

const PROMPTS = [
  "¿A qué hora y dónde empieza la ceremonia?",
  "¿Dónde es la recepción y cómo llego?",
  "¿Cuál es el itinerario del día?",
  "¿Cuál es el dresscode?",
  "¿Hay mesa de regalos?",
  "¿Hay avisos importantes que deba saber?",
  "¿Hay lugares recomendados para hospedarse?",
  "¿Cuándo es el evento?",
];

interface Message {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

interface LiaGuestProps {
  invitationID: string;
  guestName?: string;
  accentColor?: string;
  onClose: () => void;
}

// ── Markdown renderer ─────────────────────────────────────────

function parseInline(str: string): React.ReactNode[] {
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\)|https?:\/\/[^\s]+)/g;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(str)) !== null) {
    if (match.index > lastIndex) nodes.push(str.slice(lastIndex, match.index));
    const m = match[0];
    if (m.startsWith("**") && m.endsWith("**")) {
      nodes.push(<strong key={key++}>{m.slice(2, -2)}</strong>);
    } else if (m.startsWith("*") && m.endsWith("*")) {
      nodes.push(<em key={key++}>{m.slice(1, -1)}</em>);
    } else if (m.startsWith("[")) {
      const lm = m.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (lm) nodes.push(<a key={key++} href={lm[2]} target="_blank" rel="noreferrer" className={styles.link}>{lm[1]}</a>);
      else nodes.push(m);
    } else {
      nodes.push(<a key={key++} href={m} target="_blank" rel="noreferrer" className={styles.link}>{m}</a>);
    }
    lastIndex = match.index + m.length;
  }
  if (lastIndex < str.length) nodes.push(str.slice(lastIndex));
  return nodes;
}

function renderMarkdown(text: string): React.ReactNode {
  return text.split("\n").map((line, i, arr) => (
    <span key={i}>
      {parseInline(line)}
      {i < arr.length - 1 && <br />}
    </span>
  ));
}

// ─────────────────────────────────────────────────────────────

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const full = clean.length === 3
    ? clean.split("").map((c) => c + c).join("")
    : clean;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function LiaGuest({ invitationID, guestName, accentColor, onClose }: LiaGuestProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const history = messages.filter((m) => !m.streaming);
    setMessages((prev) => [
      ...prev,
      { role: "user", content: text.trim() },
      { role: "assistant", content: "", streaming: true },
    ]);
    setLoading(true);

    abortRef.current = new AbortController();

    try {
      const response = await fetch(`${API_URL}/ai/guest-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invitation_id: invitationID,
          message: text.trim(),
          guest_name: guestName,
          conversation_history: history,
        }),
        signal: abortRef.current.signal,
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const lines = decoder.decode(value, { stream: true }).split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === "text") {
              accumulated += event.text;
              setMessages((prev) => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last?.streaming) next[next.length - 1] = { ...last, content: accumulated };
                return next;
              });
            } else if (event.type === "done") {
              setMessages((prev) => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last?.streaming) next[next.length - 1] = { role: "assistant", content: accumulated };
                return next;
              });
            } else if (event.type === "error") {
              throw new Error(event.error);
            }
          } catch {
            // skip malformed line
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last?.streaming)
          next[next.length - 1] = { role: "assistant", content: "Hubo un error al conectarme. Intenta de nuevo." };
        return next;
      });
    } finally {
      setLoading(false);
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div
      className={styles.overlay}
      style={accentColor ? { background: hexToRgba(accentColor, 0.8) } : undefined}
    >
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <Sparkles size={18} className={styles.headerIcon} />
          <span>Lia</span>
        </div>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className={styles.messages}>
        {isEmpty && (
          <div className={styles.emptyState}>
            <div className={styles.liaAvatar}>
              <Sparkles size={24} />
            </div>
            <p className={styles.emptyText}>
              Hola{guestName ? `, ${guestName}` : ""}! Soy Lia. Puedo ayudarte a resolver tus dudas.
            </p>
            <div className={styles.suggestions}>
              {PROMPTS.map((p) => (
                <button
                  key={p}
                  className={styles.suggestionChip}
                  onClick={() => sendMessage(p)}
                  disabled={loading}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`${styles.bubble} ${msg.role === "user" ? styles.bubbleUser : styles.bubbleLia}`}
          >
            {msg.role === "assistant" && msg.streaming && !msg.content ? (
              <span className={styles.typing}>
                <span /><span /><span />
              </span>
            ) : msg.role === "assistant" ? (
              <span className={styles.bubbleText}>{renderMarkdown(msg.content)}</span>
            ) : (
              <span className={styles.bubbleText}>{msg.content}</span>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Horizontal prompt chips — only once conversation started */}
      {!isEmpty && <div className={styles.promptBar}>
        <div className={styles.promptTrack}>
          {PROMPTS.map((p) => (
            <button
              key={p}
              className={styles.promptChip}
              onClick={() => sendMessage(p)}
              disabled={loading}
            >
              {p}
            </button>
          ))}
        </div>
      </div>}

    </div>
  );
}
