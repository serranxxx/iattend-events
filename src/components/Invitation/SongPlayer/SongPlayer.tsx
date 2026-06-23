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
    const audio = new Audio(previewUrl);
    audio.loop = true;
    audio.volume = 0.4;
    audioRef.current = audio;

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
      audio.pause();
      audioRef.current = null;
    };
  }, [previewUrl]);

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
