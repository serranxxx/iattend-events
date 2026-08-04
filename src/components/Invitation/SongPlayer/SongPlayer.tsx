"use client";

import { useEffect, useRef, useState } from "react";
import { Music, Pause, VolumeX } from "lucide-react";
import styles from "./song-player.module.css";

type Song = {
  id: string;
  source?: "spotify" | "upload";
  name: string;
  artist: string;
  albumArt?: string;
  previewUrl?: string | null;
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
    // Archivo propio: la URL subida ya es el audio a reproducir, no hay
    // nada que resolver contra iTunes (no tenemos track/artist reales).
    if (song.source === "upload") {
      setPreviewUrl(song.previewUrl ?? null);
      return;
    }

    fetch(`/api/song-preview?track=${encodeURIComponent(song.name)}&artist=${encodeURIComponent(song.artist)}`)
      .then(r => r.json())
      .then(data => setPreviewUrl(data.previewUrl ?? null))
      .catch(() => {});
  }, [song.id, song.source, song.previewUrl, song.name, song.artist]);

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

  // Archivo subido manualmente: no hay metadata real (título/artista/álbum)
  // que mostrar, así que en vez del pill con disco + info se muestra un botón
  // redondo "liquid glass" (mismo estilo que LanguageToggle) que alterna
  // play/pause y su propio ícono. Las canciones importadas de Spotify —
  // incluidas las guardadas antes de que existiera `source`— conservan el
  // pill original con disco, título y artista.
  const isUpload = song.source === "upload";

  if (isUpload) {
    if (!previewUrl) return null;

    return (
      <button
        type="button"
        onClick={toggleAudio}
        className={styles.uploadTrigger}
        aria-label={playing ? "Pausar música" : "Reproducir música"}
      >
        {playing ? <Music size={18} /> : <VolumeX size={18} />}
      </button>
    );
  }

  return (
    <div className={`${styles.player} ${!playing ? styles.playerCollapsed : ''}`}>

      {song.albumArt && (
        <img
          src={song.albumArt}
          alt=""
          onClick={toggleAudio}
          className={`${styles.discArt} ${playing ? styles.discSpinning : ''}`}
        />
      )}

      <div className={`${styles.info} ${!playing ? styles.infoHidden : ''}`}>
        <span className={styles.title} style={{ color: accent }}>{song.name}</span>
        {song.artist && (
          <span className={styles.artist} style={{ color: accent }}>{song.artist}</span>
        )}
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
