"use client";

import { useEffect, useRef, useState } from "react";

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
};

export default function SongPlayer({ song, secondary = "#000000", dev = false }: SongPlayerProps) {
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
          // iOS blocks autoplay until user gesture — start on first touch
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
    <div
      style={{
        position: 'fixed',
        top: '12px',
        left: '12px',
        zIndex: 999,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: `${secondary}80`,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: '99px',
        padding: '6px 6px',
        paddingRight: '8px',
        border: '1px solid rgba(255,255,255,0.15)',
        maxWidth: '280px',
      }}
    >
      {song.albumArt && (
        <img
          src={song.albumArt}
          alt=""
          style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
        />
      )}
      <div style={{ overflow: 'hidden', flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4, fontFamily: 'Poppins' }}>
        <div style={{ color: '#fff', fontSize: '12px', lineHeight: 1, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {song.name}
        </div>
        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '10px', lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {song.artist}
        </div>
      </div>
      {previewUrl && (
        <button
          onClick={toggleAudio}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', display: 'flex', alignItems: 'center', flexShrink: 0 }}
        >
          {playing ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>
          )}
        </button>
      )}
    </div>
  );
}
