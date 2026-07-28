"use client";

import { useEffect, useRef, useState } from "react";
import { Pause } from "lucide-react";
import styles from "./song-player.module.css";

type Song = {
  id: string;
  name: string;
  artist: string;
  albumArt?: string;
};

type SongPlayerProps = {
  song: Song;
  secondary?: string;
  dev?: boolean;
  accent: string;
};

// Módulo-scope, no estado de React: un cambio de idioma hace que page.tsx
// (server component) vuelva a renderizar todo el árbol de <Invitation>, lo
// que remonta SongPlayer. Si el <audio> viviera solo en un ref de este
// componente, cada remount lo recreaba desde cero y la canción se
// reiniciaba/cortaba. Al vivir en el módulo, sobrevive al remount.
//
// El cleanup no pausa de inmediato: agenda una pausa diferida. Si el
// remount pasa antes de que se cumpla, se cancela y la música sigue sin
// cortes. `notifyLanguageChanging()` (llamado por LanguageToggle justo antes
// de navegar) extiende esa espera lo suficiente para cubrir el roundtrip
// real al servidor (Supabase + caché de traducción), que puede tardar mucho
// más que un remount normal de React.
let sharedAudio: HTMLAudioElement | null = null;
let sharedAudioSongId: string | null = null;
let pendingStopTimeout: ReturnType<typeof setTimeout> | null = null;
let languageChangeInFlight = false;

export function notifyLanguageChanging() {
  languageChangeInFlight = true;
}

export default function SongPlayer({ song, accent = "#000000", dev = false }: SongPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/song-preview?track=${encodeURIComponent(song.name)}&artist=${encodeURIComponent(song.artist)}`)
      .then(r => r.json())
      .then(data => setPreviewUrl(data.previewUrl ?? null))
      .catch(() => {});
  }, [song.id]);

  useEffect(() => {
    if (!previewUrl) return;

    if (pendingStopTimeout) {
      clearTimeout(pendingStopTimeout);
      pendingStopTimeout = null;
    }

    // Misma canción ya sonando (remount por cambio de idioma) — reusar en
    // vez de crear un <audio> nuevo y cortar la reproducción.
    if (sharedAudio && sharedAudioSongId === song.id) {
      audioRef.current = sharedAudio;
      setPlaying(!sharedAudio.paused);
      return;
    }

    sharedAudio?.pause();
    const audio = new Audio(previewUrl);
    audio.loop = true;
    audio.volume = 0.4;
    audioRef.current = audio;
    sharedAudio = audio;
    sharedAudioSongId = song.id;

    if (!dev) {
      audio.play()
        .then(() => setPlaying(true))
        .catch(() => {
          const onFirstTouch = () => {
            audio.play().then(() => setPlaying(true)).catch(() => {});
          };
          document.addEventListener('touchstart', onFirstTouch, { once: true });
          document.addEventListener('click', onFirstTouch, { once: true });
        });
    }

    return () => {
      const grace = languageChangeInFlight ? 8000 : 300;
      languageChangeInFlight = false;
      pendingStopTimeout = setTimeout(() => {
        if (sharedAudioSongId === song.id) {
          sharedAudio?.pause();
          sharedAudio = null;
          sharedAudioSongId = null;
        }
      }, grace);
    };
  }, [previewUrl, song.id, dev]);

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(p => !p);
  };

  return (
    <div className={`${styles.player} ${!playing ? styles.playerCollapsed : ''}`}>

      {song.albumArt && (
        <img
          src={song.albumArt}
          alt=""
          onClick={toggleAudio}
          className={`${styles.disc} ${playing ? styles.discSpinning : ''}`}
        />
      )}

      <div className={`${styles.info} ${!playing ? styles.infoHidden : ''}`}>
        <span className={styles.title} style={{ color: accent }}>{song.name}</span>
        <span className={styles.artist} style={{ color: accent }}>{song.artist}</span>
      </div>

      {previewUrl && (
        <button
          className={`${styles.toggleBtn} ${!playing ? styles.toggleBtnHidden : ''}`}
          onClick={toggleAudio}
          style={{ color: accent }}
        >
          <Pause size={18} fill={accent} strokeWidth={0} />
        </button>
      )}

    </div>
  );
}
