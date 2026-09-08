"use client";

import { useEffect, useState } from "react";

/**
 * Página temporal de diagnóstico para saber qué expone cada navegador.
 *
 * Existe para averiguar cómo distinguir el navegador embebido de WhatsApp/Meta
 * de Safari real, ya que su user agent es idéntico. Borrar cuando el pase de
 * Apple Wallet quede resuelto.
 */

// Marcador para confirmar qué build está desplegado.
const BUILD = "diag-1";

const safe = (fn: () => unknown) => {
  try {
    return String(fn());
  } catch (err) {
    return `error: ${String(err)}`;
  }
};

export default function BrowserDebugPage() {
  const [rows, setRows] = useState<[string, string][]>([]);

  useEffect(() => {
    const w = window as unknown as Record<string, unknown>;

    const knownGlobals = new Set(Object.getOwnPropertyNames(Object.getPrototypeOf(window)));
    const injected = Object.getOwnPropertyNames(window)
      .filter((k) => !knownGlobals.has(k))
      .filter((k) => /fb|meta|whats|wa_|iab|bridge|webkit|native|__/i.test(k));

    setRows([
      ["build", BUILD],
      ["userAgent", navigator.userAgent],
      ["ApplePaySession in window", safe(() => "ApplePaySession" in window)],
      ["ApplePaySession.canMakePayments()", safe(() => (w.ApplePaySession as { canMakePayments: () => boolean })?.canMakePayments())],
      ["PaymentRequest in window", safe(() => "PaymentRequest" in window)],
      ["webkit.messageHandlers", safe(() => Object.keys(((w.webkit as { messageHandlers?: object })?.messageHandlers ?? {})).join(", ") || "(vacío o ausente)")],
      ["webkit in window", safe(() => "webkit" in window)],
      ["navigator.standalone", safe(() => (navigator as unknown as { standalone?: boolean }).standalone)],
      ["navigator.maxTouchPoints", safe(() => navigator.maxTouchPoints)],
      ["navigator.vendor", safe(() => navigator.vendor)],
      ["globales inyectadas", injected.join(", ") || "(ninguna)"],
      ["window.name", safe(() => window.name || "(vacío)")],
      ["referrer", safe(() => document.referrer || "(vacío)")],
    ]);
  }, []);

  return (
    <main style={{ padding: 16, fontFamily: "monospace", fontSize: 13, lineHeight: 1.5 }}>
      <h1 style={{ fontSize: 16, marginBottom: 12 }}>Diagnóstico de navegador</h1>
      {rows.map(([k, v]) => (
        <div key={k} style={{ marginBottom: 10, wordBreak: "break-all" }}>
          <div style={{ opacity: 0.55 }}>{k}</div>
          <div style={{ fontWeight: 600 }}>{v}</div>
        </div>
      ))}
    </main>
  );
}
