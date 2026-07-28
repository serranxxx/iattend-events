"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Languages } from "lucide-react";
import { notifyLanguageChanging } from "../SongPlayer/SongPlayer";
import styles from "./language-toggle.module.css";

type LanguageToggleProps = {
  languages?: string[] | null;
  currentLang?: string | null;
};

// Solo la parte antes del guion, en mayúsculas (en-US -> EN, pt-BR -> PT).
// No hace falta un nombre completo aquí, el espacio es chico.
function shortLabel(code: string) {
  return code.split("-")[0].toUpperCase();
}

export default function LanguageToggle({ languages, currentLang }: LanguageToggleProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  if (!languages || languages.length === 0) return null;

  const goTo = (lang: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (lang) params.set("lang", lang);
    else params.delete("lang");
    setOpen(false);
    notifyLanguageChanging();
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className={styles.wrapper} ref={wrapperRef} translate="no">
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((v) => !v)}
        aria-label="Idioma"
      >
        <Languages size={18} />
      </button>

      {open && (
        <div className={styles.menu}>
          <button
            type="button"
            className={`${styles.option} ${!currentLang ? styles.optionActive : ""}`}
            onClick={() => goTo(null)}
          >
            ES
          </button>
          {languages.map((code) => (
            <button
              key={code}
              type="button"
              className={`${styles.option} ${currentLang === code ? styles.optionActive : ""}`}
              onClick={() => goTo(code)}
            >
              {shortLabel(code)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
