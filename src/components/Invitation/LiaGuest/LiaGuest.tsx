"use client";

import { useEffect, useRef, useState } from "react";
import { InvitationUIBundle } from "@/types/new_invitation";
import styles from "./lia-guest.module.css";

const API_URL = process.env.NEXT_PUBLIC_IATTEND_API_URL;

interface Message {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  // Mensaje de error local: se muestra, pero no se reenvía al modelo.
  error?: boolean;
}

interface LiaGuestProps {
  invitationID: string;
  guestName?: string;
  ui?: InvitationUIBundle | null;
  // Idioma en el que el invitado ve la invitación: pista para que Lia responda igual.
  lang?: string | null;
  // Primer mensaje fijo de Lia (ya traducido), p. ej. "¡Hola, Ana! Soy Lia…".
  greeting: string;
  quickQuestionLabel: string;
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

export default function LiaGuest({ invitationID, guestName, ui, lang, greeting, quickQuestionLabel }: LiaGuestProps) {
  const prompts = ui?.liaGuest.prompts ?? [];
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Al cerrar el overlay el componente se desmonta: se corta la petición para
  // no seguir pagando una respuesta que ya nadie va a leer.
  useEffect(() => () => abortRef.current?.abort(), []);

  const setLastAssistant = (message: Message) =>
    setMessages((prev) => {
      const next = [...prev];
      if (next[next.length - 1]?.streaming) next[next.length - 1] = message;
      return next;
    });

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const history = messages
      .filter((m) => !m.streaming && !m.error)
      .map(({ role, content }) => ({ role, content }));
    setMessages((prev) => [
      ...prev,
      { role: "user", content: text.trim() },
      { role: "assistant", content: "", streaming: true },
    ]);
    setLoading(true);

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    let accumulated = "";
    let finished = false;
    let failed = false;

    try {
      const response = await fetch(`${API_URL}/ai/guest-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invitation_id: invitationID,
          message: text.trim(),
          guest_name: guestName,
          lang: lang ?? undefined,
          conversation_history: history,
        }),
        signal: abortRef.current.signal,
      });

      // 4xx/5xx (límite, evento sin Lia, error) llegan como JSON, no como SSE.
      if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      // Un evento SSE puede quedar partido entre dos chunks: se guarda el
      // pedazo incompleto hasta que llegue el resto.
      let buffer = "";

      while (!finished) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const raw of events) {
          const line = raw.trim();
          if (!line.startsWith("data: ")) continue;

          let event: { type?: string; text?: string };
          try {
            event = JSON.parse(line.slice(6));
          } catch {
            continue;
          }

          if (event.type === "text") {
            accumulated += event.text ?? "";
            setLastAssistant({ role: "assistant", content: accumulated, streaming: true });
          } else if (event.type === "done") {
            finished = true;
          } else if (event.type === "error") {
            failed = true;
            finished = true;
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      failed = true;
    } finally {
      setLoading(false);
    }

    // Si la conexión se cortó sin "done" pero ya llegó texto, se conserva.
    if (accumulated.trim() && !failed) {
      setLastAssistant({ role: "assistant", content: accumulated });
    } else {
      setLastAssistant({
        role: "assistant",
        content: ui?.liaGuest.connectionError ?? "Hubo un error al conectarme. Intenta de nuevo.",
        error: true,
      });
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className={styles.root}>
      {/* Messages — column-reverse lo mantiene pegado abajo */}
      <div className={styles.messages}>
        <div className={styles.thread}>
          <div className={`${styles.bubble} ${styles.bubbleLia}`}>
            <span className={styles.bubbleText}>{greeting}</span>
          </div>

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

          {isEmpty && (
            <div className={styles.suggestions}>
              <span className={styles.suggestionsLabel}>{quickQuestionLabel}</span>
              {prompts.map((p) => (
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
          )}
        </div>
      </div>

      {/* Horizontal prompt chips — only once conversation started */}
      {!isEmpty && (
        <div className={styles.promptBar}>
          {prompts.map((p) => (
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
      )}
    </div>
  );
}
