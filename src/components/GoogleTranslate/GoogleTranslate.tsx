"use client";

import { useEffect, useRef } from "react";

interface GoogleTranslateProps {
  id?: string | null; // id opcional
}

export default function GoogleTranslate({ id }: GoogleTranslateProps) {
  const containerId = id ?? "google_translate_element";
  const loaded = useRef(false);

  // Utilidad: setear cookie googtrans para /es/nl
  const setGoogTransCookie = (from = "es", to = "nl") => {
    const expire = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
    const value = `/` + from + `/` + to;

    // cookie para el path actual
    document.cookie = `googtrans=${value}; expires=${expire}; path=/`;

    // cookie para el dominio (si aplica)
    const host = window.location.hostname;
    // En localhost no se puede setear dominio; en prod sí:
    if (host.includes(".")) {
      document.cookie = `googtrans=${value}; expires=${expire}; path=/; domain=.${host}`;
    }
  };

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    // 1) Callback global requerido por Google
    (window as any).googleTranslateElementInit = () => {
      new (window as any).google.translate.TranslateElement(
        {
          pageLanguage: "es",
          includedLanguages: "nl,en,es,fr,it,de,pt",
          layout: (window as any).google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false,
        },
        containerId
      );

      // 2) Si el id coincide, intentamos forzar holandés
      if (containerId === "68ffdb9cd673a17f84312991") {
        // A) Primer intento: usar el select (si existe)
        const start = Date.now();
        const timer = setInterval(() => {
          const select = document.querySelector(".goog-te-combo") as HTMLSelectElement | null;
          if (select) {
            select.value = "nl";
            select.dispatchEvent(new Event("change"));
            clearInterval(timer);
          } else if (Date.now() - start > 2500) {
            clearInterval(timer);

            // B) Respaldo: setear cookie y recargar una sola vez
            if (!sessionStorage.getItem("gt_nl_applied")) {
              setGoogTransCookie("es", "nl");
              sessionStorage.setItem("gt_nl_applied", "1");
              window.location.reload();
            }
          }
        }, 150);
      }
    };

    // 3) Inyectar script (o reutilizarlo)
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src*="translate_a/element.js"]'
    );
    if (!existing) {
      const script = document.createElement("script");
      script.src =
        "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    } else {
      // Si ya estaba, llamamos el callback cuando esté listo
      if ((window as any).google?.translate) {
        (window as any).googleTranslateElementInit();
      } else {
        existing.addEventListener("load", () =>
          (window as any).googleTranslateElementInit()
        );
      }
    }
  }, [containerId]);

  return <div id={containerId} className="gt-widget" />;
}