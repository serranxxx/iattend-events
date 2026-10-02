"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Dispositivos donde existe Apple Wallet: iPhone, iPad y Mac (en Mac, Safari
 * agrega el pase y se sincroniza al iPhone). Desde iPadOS 13 el iPad se
 * anuncia como "Macintosh", así que no basta con buscar "iPad" en el user agent.
 * En Android / Windows no hay Wallet y el botón se oculta.
 */
export const supportsAppleWallet = () =>
  typeof navigator !== "undefined" &&
  /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent);

/**
 * No hay forma confiable de distinguir el navegador embebido de WhatsApp de
 * Safari real: su user agent también incluye el token "Safari/", y en iOS 18
 * un WKWebView puede exponer `ApplePaySession` igual que Safari. Ambas pruebas
 * se intentaron y fallaron.
 *
 * Por eso el pase no se descarga directo: se ofrecen las dos rutas y el
 * invitado elige. Solo Safari puede presentar la hoja de Apple Wallet; en un
 * webview embebido el .pkpass se muestra como texto crudo.
 *
 * TEMPORAL: se imprime el user agent en la hoja para capturar el del
 * navegador de WhatsApp y poder volver a automatizar la decisión.
 */
export const browserDiagnostics = () => {
  if (typeof navigator === "undefined") return "";
  return `${navigator.userAgent} | ApplePay:${"ApplePaySession" in window} | webkit:${"webkit" in window}`;
};

const safariUrl = (url: string) =>
  url.replace(/^http(s?):\/\//, "x-safari-http$1://");

/**
 * Lógica de "Agregar a Apple Wallet" compartida entre el pase suelto
 * (`Ticket`) y el carrusel de pases del dock. `passUrl` distinto de null
 * significa que hay que mostrar la hoja de respaldo (`WalletHelpSheet`).
 */
export function useWalletPass(invitationId?: string) {
  const [addingToWallet, setAddingToWallet] = useState(false);
  const [passUrl, setPassUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const timers = useRef<number[]>([]);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const buildPassUrl = (guestId: number | string) => {
    const url = new URL("/api/wallet/pass", window.location.origin);
    url.searchParams.set("invitation", String(invitationId));
    url.searchParams.set("guest", String(guestId));
    return url.toString();
  };

  /**
   * Salta directo a Safari con el esquema `x-safari-https://`, que es el único
   * navegador que puede presentar la hoja de Apple Wallet. Se hace sin
   * preguntar nada: si la invitación ya estaba en Safari el esquema lo maneja
   * Safari mismo y el pase se agrega igual.
   *
   * `x-safari-https://` no es API pública, así que puede estar bloqueado. Si
   * a los 1.8 s la página sigue al frente, es que el salto no ocurrió y se
   * abre la hoja de respaldo con las instrucciones manuales.
   */
  const addToWallet = (guestId: number | string | null | undefined) => {
    if (addingToWallet || !invitationId || guestId == null) return;

    const url = buildPassUrl(guestId);
    let left = false;
    const markLeft = () => { left = true; };
    const onVisibility = () => { if (document.hidden) left = true; };

    window.addEventListener("pagehide", markLeft);
    window.addEventListener("blur", markLeft);
    document.addEventListener("visibilitychange", onVisibility);

    setAddingToWallet(true);
    window.location.href = safariUrl(url);

    later(() => {
      window.removeEventListener("pagehide", markLeft);
      window.removeEventListener("blur", markLeft);
      document.removeEventListener("visibilitychange", onVisibility);
      setAddingToWallet(false);
      if (!left) setPassUrl(url);
    }, 1800);
  };

  /**
   * Safari entrega el pase a Apple Wallet cuando *navega* a un recurso con
   * MIME type application/vnd.apple.pkpass — no con un blob + <a download>.
   */
  const downloadPass = () => {
    if (!passUrl) return;
    setAddingToWallet(true);
    window.location.href = passUrl;
    later(() => setAddingToWallet(false), 3000);
  };

  /**
   * Salta a Safari con el esquema `x-safari-https://`. Se dispara con un tap
   * del invitado porque los webviews solo permiten abrir otra app a partir de
   * un gesto del usuario. Si Safari ya es el navegador activo, el esquema lo
   * maneja Safari mismo y también termina abriendo la hoja de Wallet.
   */
  const openPassInSafari = () => {
    if (!passUrl) return;
    window.location.href = safariUrl(passUrl);
  };

  const copyPassUrl = async () => {
    if (!passUrl) return;
    try {
      await navigator.clipboard.writeText(passUrl);
      setCopied(true);
      later(() => setCopied(false), 2000);
    } catch (err) {
      console.error("No se pudo copiar la liga del pase:", err);
    }
  };

  return {
    addingToWallet,
    passUrl,
    copied,
    addToWallet,
    downloadPass,
    openPassInSafari,
    copyPassUrl,
    closeHelp: () => setPassUrl(null),
  };
}

export type WalletPass = ReturnType<typeof useWalletPass>;
