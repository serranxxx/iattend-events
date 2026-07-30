"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, Heart, Share, X } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { QRCodeSVG } from "qrcode.react";
import { NewInvitation } from "@/types/new_invitation";
import styles from "./photo-wall.module.css";

const API_URL = process.env.NEXT_PUBLIC_IATTEND_API_URL;
const INITIAL_FRACTION = 0.42;

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
  onOpenCamera?: () => void;
  companionShareUrl?: string;
  invitation?: NewInvitation | null;
}

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("es-MX", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

export function PhotoWall({ eventId, eventTitle, onClose, onOpenCamera, companionShareUrl, invitation }: PhotoWallProps) {
  const router = useRouter();
  const [photos, setPhotos] = useState<EventPhoto[]>([]);
  const [likesMap, setLikesMap] = useState<Record<string, string[]>>({});
  const [heartBurst, setHeartBurst] = useState<string | null>(null);
  const [likersSheet, setLikersSheet] = useState<{ photoId: string; names: string[] } | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [coverIdx, setCoverIdx] = useState(0);
  const [sheetFraction, setSheetFraction] = useState(INITIAL_FRACTION);

  const guestNameRef = useRef("");
  const lastTapRef = useRef<{ id: string; time: number } | null>(null);
  const dragging = useRef<{ startY: number; startFraction: number } | null>(null);
  const sheetFractionRef = useRef(INITIAL_FRACTION);
  const sheetRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const setFraction = (f: number) => {
    sheetFractionRef.current = f;
    setSheetFraction(f);
  };

  // Cover images from invitation
  const coverImages: string[] = useMemo(() => {
    const raw = invitation?.cover?.image?.prod;
    if (!raw) return [];
    if (Array.isArray(raw)) return (raw as string[]).filter(Boolean);
    return [raw as string];
  }, [invitation]);

  const titleText = invitation?.cover?.title?.text?.value ?? eventTitle ?? "";
  const titleFace = invitation?.cover?.title?.text?.typeFace;
  const titleWeight = invitation?.cover?.title?.text?.weight;
  const primaryColor = invitation?.generals?.colors?.primary ?? "#0a0a0a";

  const photoCount = photos.length;
  const participantCount = useMemo(
    () => new Set(photos.map((p) => p.guest_name)).size,
    [photos]
  );

  // Carousel auto-advance
  useEffect(() => {
    if (coverImages.length <= 1) return;
    const t = setInterval(() => setCoverIdx((i) => (i + 1) % coverImages.length), 3000);
    return () => clearInterval(t);
  }, [coverImages.length]);

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

  // Drag — window listeners so move/up always fire regardless of DOM structure
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      const dy = e.clientY - dragging.current.startY;
      const newFrac = dragging.current.startFraction + dy / window.innerHeight;
      setFraction(Math.max(0, Math.min(INITIAL_FRACTION, newFrac)));
    };

    const onEnd = () => {
      if (!dragging.current) return;
      const snap = sheetFractionRef.current < INITIAL_FRACTION / 2 ? 0 : INITIAL_FRACTION;
      dragging.current = null;
      setFraction(snap);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onEnd);
    window.addEventListener("pointercancel", onEnd);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("pointercancel", onEnd);
    };
  }, []);

  const handleDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragging.current = { startY: e.clientY, startFraction: sheetFractionRef.current };
  };

  return (
    <div className={styles.container}>

      {/* Cover image background */}
      {coverImages.length > 0 && (
        <div className={styles.coverBg}>
          {coverImages.map((src, i) => (
            <div
              key={src}
              className={`${styles.coverImg} ${i === coverIdx ? styles.coverImgActive : ""}`}
            >
              <Image src={src} alt="" fill sizes="100vw" style={{ objectFit: "cover" }} unoptimized />
            </div>
          ))}
          {coverImages.length > 1 && (
            <div className={styles.carouselDots}>
              {coverImages.map((_, i) => (
                <span key={i} className={`${styles.dot} ${i === coverIdx ? styles.dotActive : ""}`} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Top bar */}
      <div className={styles.topBar}>
        <button
          className={styles.navBtn}
          onClick={() => (onClose ? onClose() : router.back())}
          aria-label="Regresar"
        >
          <ArrowLeft size={14} />
        </button>
        {onOpenCamera && (
          <button className={styles.navBtn} onClick={onOpenCamera} aria-label="Abrir cámara">
            <Camera size={14} />
          </button>
        )}
      </div>

      {/* Draggable sheet */}
      <div
        ref={sheetRef}
        className={styles.sheet}
        style={{
          top: `${(sheetFraction * 100).toFixed(2)}dvh`,
          borderRadius: `${Math.round((sheetFraction / INITIAL_FRACTION) * 64)}px ${Math.round((sheetFraction / INITIAL_FRACTION) * 64)}px 0 0`,
          transition: dragging.current ? "none" : "all 0.3s ease",
        }}
      >
        {/* Drag handle */}
        <div
          className={styles.handleArea}
          onPointerDown={handleDragStart}
        >
          <div className={styles.handleBar} />
        </div>

        {/* Scrollable content */}
        <div className={styles.sheetContent}>
          {titleText && (
            <h1
              className={styles.eventTitle}
              style={{
                fontFamily: titleFace ?? undefined,
                fontWeight: titleWeight ?? 700,
                color: primaryColor,
                textAlign: "center",
              }}
            >
              {titleText}
            </h1>
          )}

          <div className={styles.statsRow}>
            <div className={styles.stat}>
              <span className={styles.statNum} style={{ color: primaryColor, fontFamily: titleFace ?? undefined, }}>{photoCount.toLocaleString("es-MX")}</span>
              <span className={styles.statLabel} style={{ color: primaryColor,  }}>Fotos</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statNum} style={{ color: primaryColor, fontFamily: titleFace ?? undefined, }}>{participantCount.toLocaleString("es-MX")}</span>
              <span className={styles.statLabel} style={{ color: primaryColor,  }}>Participantes</span>
            </div>
          </div>

          <div className={styles.separator} />

          {photos.length === 0 ? (
            <div className={styles.empty}>
              <p>Las fotos aparecerán aquí en tiempo real</p>
            </div>
          ) : (
            <div className={styles.grid}>
              {photos.map((photo) => {
                const likers = likesMap[photo.id] ?? [];
                const liked = likers.includes(guestNameRef.current);
                const count = likers.length;

                return (
                  <div key={photo.id} style={{backgroundColor: `${primaryColor}40`}} className={styles.card} onClick={() => handleCardTap(photo.id)}>
                    <Image
                      src={photo.public_url}
                      alt={photo.guest_name}
                      width={0}
                      height={0}
                      sizes="50vw"
                      className={styles.img}
                      style={{ width: "100%", height: "auto" }}
                      unoptimized
                    />
                    {heartBurst === photo.id && <div className={styles.heartBurst}>❤</div>}
                    <div className={styles.info}>
                      <div className={styles.infoTop}>
                        <span className={styles.name} style={{color: primaryColor}}>{photo.guest_name}</span>
                        <span className={styles.time} style={{color: primaryColor}}>{formatTime(photo.taken_at ?? photo.uploaded_at)}</span>
                      </div>
                      <div className={styles.likeRow}>
                        <button
                          className={`${styles.likeBtn} ${liked ? styles.likeBtnActive : ""}`}
                          onClick={(e) => { e.stopPropagation(); toggleLike(photo.id); }}
                          aria-label="Like"
                        >
                          <Heart size={13} fill={liked ? "currentColor" : "none"} color={primaryColor} />
                        </button>
                        {count > 0 && (
                          <button className={styles.likeCount} onClick={(e) => openLikersSheet(photo.id, e)}>
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
        </div>
      </div>

      {/* QR acompañante bottom sheet */}
      {qrOpen && companionShareUrl && (
        <div className={styles.sheetOverlay} onClick={() => setQrOpen(false)}>
          <div className={styles.bottomSheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.sheetHandle} />
            <div className={styles.sheetHeader}>
              <Share size={16} className={styles.sheetHeart} />
              <span className={styles.sheetTitle}>Compartir con acompañante</span>
              <button className={styles.sheetClose} onClick={() => setQrOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className={styles.qrContainer}>
              <QRCodeSVG value={companionShareUrl} size={220} />
              <p className={styles.qrHint}>Tu acompañante escanea este código para acceder a la invitación y subir sus fotos</p>
            </div>
          </div>
        </div>
      )}

      {/* Likers bottom sheet */}
      {likersSheet && (
        <div className={styles.sheetOverlay} onClick={() => setLikersSheet(null)}>
          <div className={styles.bottomSheet} onClick={(e) => e.stopPropagation()}>
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
