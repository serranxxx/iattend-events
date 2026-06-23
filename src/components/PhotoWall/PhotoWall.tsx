"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Heart, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import styles from "./photo-wall.module.css";

const API_URL = process.env.NEXT_PUBLIC_IATTEND_API_URL;

interface EventPhoto {
  id: string;
  event_id: string;
  guest_name: string;
  taken_at: string;
  public_url: string;
  uploaded_at: string;
}

interface PhotoLike {
  photo_id: string;
  guest_name: string;
}

interface PhotoWallProps {
  eventId: string;
  eventTitle?: string;
  onClose?: () => void;
}

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("es-MX", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

export function PhotoWall({ eventId, eventTitle, onClose }: PhotoWallProps) {
  const router = useRouter();
  const [photos, setPhotos] = useState<EventPhoto[]>([]);
  const [likesMap, setLikesMap] = useState<Record<string, string[]>>({});
  const [heartBurst, setHeartBurst] = useState<string | null>(null);
  const [likersSheet, setLikersSheet] = useState<{ photoId: string; names: string[] } | null>(null);
  const guestNameRef = useRef("");
  const lastTapRef = useRef<{ id: string; time: number } | null>(null);
  const supabase = createClient();

  useEffect(() => {
    guestNameRef.current = localStorage.getItem(`guest_${eventId}`) ?? "";
  }, [eventId]);

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const res = await fetch(`${API_URL}/photos/${eventId}`);
        if (!res.ok) return;
        const data: EventPhoto[] = await res.json();
        setPhotos(data);
      } catch (err) {
        console.error("Error al cargar fotos:", err);
      }
    };

    const fetchLikes = async () => {
      try {
        const res = await fetch(`${API_URL}/photos/likes/event/${eventId}`);
        if (!res.ok) return;
        const data: PhotoLike[] = await res.json();
        const map: Record<string, string[]> = {};
        for (const like of data) {
          if (!map[like.photo_id]) map[like.photo_id] = [];
          map[like.photo_id].push(like.guest_name);
        }
        setLikesMap(map);
      } catch (err) {
        console.error("Error al cargar likes:", err);
      }
    };

    fetchPhotos();
    fetchLikes();

    const channel = supabase
      .channel(`event_photos_${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "event_photos",
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          setPhotos((prev) => [payload.new as EventPhoto, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  const handleCardTap = (photoId: string) => {
    const now = Date.now();
    if (lastTapRef.current?.id === photoId && now - lastTapRef.current.time < 350) {
      lastTapRef.current = null;
      toggleLike(photoId);
    } else {
      lastTapRef.current = { id: photoId, time: now };
    }
  };

  const toggleLike = async (photoId: string) => {
    const guestName = guestNameRef.current;
    if (!guestName) return;

    const currentLikers = likesMap[photoId] ?? [];
    const alreadyLiked = currentLikers.includes(guestName);

    // Optimistic update
    setLikesMap((prev) => {
      const next = { ...prev };
      if (alreadyLiked) {
        next[photoId] = (next[photoId] ?? []).filter((n) => n !== guestName);
      } else {
        next[photoId] = [...(next[photoId] ?? []), guestName];
        setHeartBurst(photoId);
        setTimeout(() => setHeartBurst(null), 700);
      }
      return next;
    });

    try {
      await fetch(`${API_URL}/photos/${photoId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guest_name: guestName }),
      });
    } catch (err) {
      console.error("Error al dar like:", err);
      // Roll back on error
      setLikesMap((prev) => {
        const next = { ...prev };
        if (alreadyLiked) {
          next[photoId] = [...(next[photoId] ?? []), guestName];
        } else {
          next[photoId] = (next[photoId] ?? []).filter((n) => n !== guestName);
        }
        return next;
      });
    }
  };

  const openLikersSheet = (photoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const names = likesMap[photoId] ?? [];
    setLikersSheet({ photoId, names });
  };

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => onClose ? onClose() : router.back()} aria-label="Regresar">
          <ArrowLeft size={22} />
        </button>
        {eventTitle && <span className={styles.topBarTitle}>{eventTitle}</span>}
      </div>

      {photos.length === 0 ? (
        <div className={styles.empty}>
          <p>Las fotos aparecerán aquí en tiempo real</p>
        </div>
      ) : (
        <div className={styles.masonry}>
          {photos.map((photo) => {
            const likers = likesMap[photo.id] ?? [];
            const liked = likers.includes(guestNameRef.current);
            const count = likers.length;

            return (
              <div key={photo.id} className={styles.card} onClick={() => handleCardTap(photo.id)}>
                <img
                  src={photo.public_url}
                  alt={photo.guest_name}
                  className={styles.img}
                  loading="lazy"
                />
                {heartBurst === photo.id && (
                  <div className={styles.heartBurst}>❤</div>
                )}
                <div className={styles.info}>
                  <div className={styles.infoTop}>
                    <span className={styles.name}>{photo.guest_name}</span>
                    <span className={styles.time}>{formatTime(photo.taken_at ?? photo.uploaded_at)}</span>
                  </div>
                  <div className={styles.likeRow}>
                    <button
                      className={`${styles.likeBtn} ${liked ? styles.likeBtnActive : ""}`}
                      onClick={(e) => { e.stopPropagation(); toggleLike(photo.id); }}
                      aria-label="Like"
                    >
                      <Heart size={13} fill={liked ? "currentColor" : "none"} />
                    </button>
                    {count > 0 && (
                      <button
                        className={styles.likeCount}
                        onClick={(e) => openLikersSheet(photo.id, e)}
                      >
                        {count}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Likers bottom sheet */}
      {likersSheet && (
        <div className={styles.sheetOverlay} onClick={() => setLikersSheet(null)}>
          <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.sheetHandle} />
            <div className={styles.sheetHeader}>
              <Heart size={16} fill="currentColor" className={styles.sheetHeart} />
              <span className={styles.sheetTitle}>
                {likersSheet.names.length} {likersSheet.names.length === 1 ? "like" : "likes"}
              </span>
              <button className={styles.sheetClose} onClick={() => setLikersSheet(null)}>
                <X size={18} />
              </button>
            </div>
            <ul className={styles.sheetList}>
              {likersSheet.names.map((name) => (
                <li key={name} className={styles.sheetItem}>
                  <span className={styles.sheetAvatar}>{name[0]?.toUpperCase()}</span>
                  <span className={styles.sheetName}>{name}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
