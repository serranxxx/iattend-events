"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, Heart, Share, X, Play, ChevronLeft } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { QRCodeSVG } from "qrcode.react";
import { NewInvitation } from "@/types/new_invitation";
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

interface ShareCompanion {
  name: string;
  password: string;
}

interface PhotoWallProps {
  eventId: string;
  eventTitle?: string;
  onClose?: () => void;
  onOpenCamera?: () => void;
  shareCompanions?: ShareCompanion[];
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

export function PhotoWall({ eventId, eventTitle, onClose, onOpenCamera, shareCompanions, invitation }: PhotoWallProps) {
  const router = useRouter();
  const [photos, setPhotos] = useState<EventPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [likesMap, setLikesMap] = useState<Record<string, string[]>>({});
  const [heartBurst, setHeartBurst] = useState<string | null>(null);
  const [likersSheet, setLikersSheet] = useState<{ photoId: string; names: string[] } | null>(null);
  const [coverIdx, setCoverIdx] = useState(0);

  // Full-screen photo modal
  const [selectedPhoto, setSelectedPhoto] = useState<EventPhoto | null>(null);

  // Stories mode
  const [storiesIdx, setStoriesIdx] = useState<number | null>(null);
  const [storiesProgress, setStoriesProgress] = useState(0);
  const storiesHoldRef = useRef(false);
  const storiesHoldTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const storiesWasHoldingRef = useRef(false);

  // Share companion sheet
  const [shareState, setShareState] = useState<'closed' | 'list' | 'qr'>('closed');
  const [selectedCompanion, setSelectedCompanion] = useState<ShareCompanion | null>(null);

  const guestNameRef = useRef("");
  const lastTapRef = useRef<{ id: string; time: number } | null>(null);
  const singleTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabase = createClient();

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

  // Event date / status
  const eventDate = useMemo(() => {
    const dateStr = invitation?.cover?.date?.value;
    if (!dateStr) return null;
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [invitation]);

  const eventTomorrow = useMemo(() => {
    if (!eventDate) return null;
    const t = new Date(eventDate);
    t.setDate(t.getDate() + 1);
    t.setHours(23, 59, 59, 999);
    return t;
  }, [eventDate]);

  const eventStatus = useMemo<'upcoming' | 'active' | 'past'>(() => {
    if (!eventDate) return 'active';
    const now = new Date();
    if (now < eventDate) return 'upcoming';
    if (eventTomorrow && now <= eventTomorrow) return 'active';
    return 'past';
  }, [eventDate, eventTomorrow]);

  const daysUntil = useMemo(() => {
    if (eventStatus !== 'upcoming' || !eventDate) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return Math.ceil((eventDate.getTime() - now.getTime()) / 86400000);
  }, [eventStatus, eventDate]);

  const statusLabel = useMemo(() => {
    if (eventStatus === 'upcoming') {
      if (daysUntil === 1) return 'Inicia mañana';
      if (daysUntil !== null && daysUntil > 1) return `Inicia en ${daysUntil} días`;
      return 'Inicia pronto';
    }
    if (eventStatus === 'active') return 'En vivo · es hora de capturar';
    return 'Finalizado · siempre disponible';
  }, [eventStatus, daysUntil]);

  // Carousel auto-advance
  useEffect(() => {
    if (coverImages.length <= 1) return;
    const t = setInterval(() => setCoverIdx((i) => (i + 1) % coverImages.length), 3000);
    return () => clearInterval(t);
  }, [coverImages.length]);

  useEffect(() => {
    guestNameRef.current = localStorage.getItem(`guest_${eventId}`) ?? "";
  }, [eventId]);

  // Force black body background (Safari margin fix)
  useEffect(() => {
    const prevBg = document.body.style.backgroundColor;
    document.body.style.backgroundColor = "#000";
    return () => {
      document.body.style.backgroundColor = prevBg;
    };
  }, []);

  // Cleanup single-tap timer on unmount
  useEffect(() => {
    return () => {
      if (singleTapTimerRef.current) clearTimeout(singleTapTimerRef.current);
    };
  }, []);

  // Photos + likes + Supabase realtime
  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const res = await fetch(`${API_URL}/photos/${eventId}`);
        if (!res.ok) return;
        const data: EventPhoto[] = await res.json();
        setPhotos(data);
      } catch (err) {
        console.error("Error al cargar fotos:", err);
      } finally {
        setLoading(false);
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

  // Stories auto-advance timer
  useEffect(() => {
    if (storiesIdx === null) return;
    setStoriesProgress(0);

    let elapsed = 0;
    const DURATION = 15000;
    const TICK = 100;

    const interval = setInterval(() => {
      if (storiesHoldRef.current) return;
      elapsed += TICK;
      const p = Math.min(100, (elapsed / DURATION) * 100);
      setStoriesProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setStoriesIdx((prev) => {
          if (prev === null || prev >= photos.length - 1) return null;
          return prev + 1;
        });
      }
    }, TICK);

    return () => clearInterval(interval);
  }, [storiesIdx, photos.length]);

  // Card tap: single tap (360ms delay) → modal, double tap → like
  const handleCardTap = (photo: EventPhoto) => {
    const now = Date.now();
    if (lastTapRef.current?.id === photo.id && now - lastTapRef.current.time < 350) {
      lastTapRef.current = null;
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
      toggleLike(photo.id);
    } else {
      lastTapRef.current = { id: photo.id, time: now };
      if (singleTapTimerRef.current) clearTimeout(singleTapTimerRef.current);
      singleTapTimerRef.current = setTimeout(() => {
        setSelectedPhoto(photo);
        singleTapTimerRef.current = null;
      }, 360);
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
      const res = await fetch(`${API_URL}/photos/${photoId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guest_name: guestName }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
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

  const _openLikersSheet = (photoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const names = likesMap[photoId] ?? [];
    setLikersSheet({ photoId, names });
  };

  const companionUrl = (password: string) => {
    if (typeof window === 'undefined') return '';
    if (invitation?.generals?.event?.label && invitation?.generals?.event?.name) {
      return `${window.location.origin}/${invitation.generals.event.label}/${invitation.generals.event.name}?password=${password}`;
    }
    return `${window.location.origin}?password=${password}`;
  };

  const openShare = () => {
    if (!shareCompanions || shareCompanions.length === 0) return;
    if (shareCompanions.length === 1) {
      setSelectedCompanion(shareCompanions[0]);
      setShareState('qr');
    } else {
      setShareState('list');
    }
  };

  // Stories pointer handlers: hold (200ms+) pauses, quick tap navigates
  const onStoriesPointerDown = () => {
    storiesWasHoldingRef.current = false;
    storiesHoldTimerRef.current = setTimeout(() => {
      storiesHoldRef.current = true;
      storiesWasHoldingRef.current = true;
    }, 200);
  };

  const onStoriesPointerUp = () => {
    if (storiesHoldTimerRef.current) {
      clearTimeout(storiesHoldTimerRef.current);
      storiesHoldTimerRef.current = null;
    }
    storiesHoldRef.current = false;
  };

  const onStoriesPointerLeave = () => {
    if (storiesHoldTimerRef.current) {
      clearTimeout(storiesHoldTimerRef.current);
      storiesHoldTimerRef.current = null;
    }
    storiesHoldRef.current = false;
    storiesWasHoldingRef.current = false;
  };

  return (
    <div className={styles.container}>

      {/* Cover image fixed background */}
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

      {/* Floating top bar — absolutely positioned over the scroll */}
      <div className={styles.topBar}>
        <button
          className={styles.navBtn}
          onClick={() => (onClose ? onClose() : router.back())}
          aria-label="Regresar"
        >
          <ArrowLeft size={14} />
        </button>
        <div className={styles.topBarActions}>
          {photos.length > 0 && (
            <button
              className={styles.navBtn}
              onClick={() => setStoriesIdx(0)}
              aria-label="Ver historias"
            >
              <Play size={14} />
            </button>
          )}
          {shareCompanions && shareCompanions.length > 0 && (
            <button className={styles.navBtn} onClick={openShare} aria-label="Compartir">
              <Share size={14} />
            </button>
          )}
          {onOpenCamera && (
            <button className={styles.navBtn} onClick={onOpenCamera} aria-label="Abrir cámara">
              <Camera size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Full-screen scroll — extends all the way to the top */}
      <div className={styles.scrollArea}>
        {/* Spacer so cover image shows initially */}
        <div className={styles.scrollSpacer} />

        {/* Content card with glass background */}
        <div className={styles.contentCard}>
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

          <p className={styles.statusLabel} style={{ color: `${primaryColor}99` }}>
            {statusLabel}
          </p>

          <div className={styles.statsRow}>
            <div className={styles.stat}>
              <span className={styles.statNum} style={{ color: primaryColor, fontFamily: titleFace ?? undefined }}>{photoCount.toLocaleString("es-MX")}</span>
              <span className={styles.statLabel} style={{ color: primaryColor }}>Fotos</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statNum} style={{ color: primaryColor, fontFamily: titleFace ?? undefined }}>{participantCount.toLocaleString("es-MX")}</span>
              <span className={styles.statLabel} style={{ color: primaryColor }}>Participantes</span>
            </div>
          </div>

          <div className={styles.separator} />

          {loading ? (
            <div className={styles.grid}>
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className={`${styles.card} ${styles.skeleton}`} />
              ))}
            </div>
          ) : photos.length === 0 ? (
            <div className={styles.empty}>
              <p>
                {eventStatus === 'upcoming'
                  ? 'Las fotos se verán aquí cuando inicie el evento'
                  : 'Aún no hay fotos por aquí'}
              </p>
            </div>
          ) : (
            <div className={styles.grid}>
              {photos.map((photo) => {
                const likers = likesMap[photo.id] ?? [];
                const _liked = likers.includes(guestNameRef.current);
                const _count = likers.length;

                return (
                  <div
                    key={photo.id}
                    style={{ backgroundColor: `${primaryColor}40` }}
                    className={styles.card}
                    onClick={() => handleCardTap(photo)}
                  >
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
                        <span className={styles.name} style={{ color: primaryColor }}>{photo.guest_name}</span>
                        <span className={styles.time} style={{ color: primaryColor }}>{formatTime(photo.taken_at ?? photo.uploaded_at)}</span>
                      </div>
                      {/* likes hidden temporarily */}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Full-screen photo modal */}
      {selectedPhoto && (
        <div className={styles.photoModal} onClick={() => setSelectedPhoto(null)}>
          <div className={styles.photoModalInner} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.photoModalClose}
              onClick={() => setSelectedPhoto(null)}
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedPhoto.public_url}
              alt={selectedPhoto.guest_name}
              className={styles.photoModalImg}
            />
            <div className={styles.photoModalInfo}>
              <span className={styles.photoModalName}>{selectedPhoto.guest_name}</span>
              <span className={styles.photoModalTime}>{formatTime(selectedPhoto.taken_at ?? selectedPhoto.uploaded_at)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Stories mode */}
      {storiesIdx !== null && photos[storiesIdx] && (
        <div className={styles.stories}>
          {/* Header overlay — progress bars + guest name + close */}
          <div className={styles.storiesHeader}>
            <div className={styles.storiesProgress}>
              {photos.map((_, i) => (
                <div key={i} className={styles.storiesProgressBar}>
                  <div
                    className={styles.storiesProgressFill}
                    style={{
                      width: i < storiesIdx ? '100%' : i === storiesIdx ? `${storiesProgress}%` : '0%',
                    }}
                  />
                </div>
              ))}
            </div>
            <div className={styles.storiesTopBar}>
              <span className={styles.storiesGuestName}>{photos[storiesIdx].guest_name}</span>
              <button
                className={styles.storiesClose}
                onClick={() => setStoriesIdx(null)}
                aria-label="Cerrar"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Full-screen image + tap zones */}
          <div className={styles.storiesImgWrap}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photos[storiesIdx].public_url}
              alt={photos[storiesIdx].guest_name}
              className={styles.storiesImg}
            />

            {/* Tap zones (hold = pause, tap = navigate) */}
            <div className={styles.storiesTapZones}>
              <div
                className={styles.storiesTapLeft}
                onPointerDown={onStoriesPointerDown}
                onPointerUp={onStoriesPointerUp}
                onPointerLeave={onStoriesPointerLeave}
                onClick={() => {
                  if (storiesWasHoldingRef.current) { storiesWasHoldingRef.current = false; return; }
                  if (storiesIdx > 0) setStoriesIdx(storiesIdx - 1);
                }}
              />
              <div
                className={styles.storiesTapRight}
                onPointerDown={onStoriesPointerDown}
                onPointerUp={onStoriesPointerUp}
                onPointerLeave={onStoriesPointerLeave}
                onClick={() => {
                  if (storiesWasHoldingRef.current) { storiesWasHoldingRef.current = false; return; }
                  if (storiesIdx < photos.length - 1) {
                    setStoriesIdx(storiesIdx + 1);
                  } else {
                    setStoriesIdx(null);
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Share companion bottom sheet */}
      {shareState !== 'closed' && shareCompanions && (
        <div className={styles.sheetOverlay} onClick={() => setShareState('closed')}>
          <div className={styles.bottomSheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.sheetHandle} />

            {shareState === 'list' && (
              <>
                <div className={styles.sheetHeader}>
                  <Share size={16} className={styles.sheetHeart} />
                  <span className={styles.sheetTitle}>Compartir con acompañante</span>
                  <button className={styles.sheetClose} onClick={() => setShareState('closed')}>
                    <X size={18} />
                  </button>
                </div>
                <ul className={styles.sheetList}>
                  {shareCompanions.map((c) => (
                    <li
                      key={c.password}
                      className={styles.sheetItem}
                      style={{ cursor: 'pointer' }}
                      onClick={() => { setSelectedCompanion(c); setShareState('qr'); }}
                    >
                      <span className={styles.sheetAvatar}>{c.name[0]?.toUpperCase()}</span>
                      <span className={styles.sheetName}>{c.name || 'Acompañante'}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {shareState === 'qr' && selectedCompanion && (
              <>
                <div className={styles.sheetHeader}>
                  {shareCompanions.length > 1 && (
                    <button className={styles.sheetBack} onClick={() => setShareState('list')}>
                      <ChevronLeft size={18} />
                    </button>
                  )}
                  <span className={styles.sheetTitle}>{selectedCompanion.name || 'Acompañante'}</span>
                  <button className={styles.sheetClose} onClick={() => setShareState('closed')}>
                    <X size={18} />
                  </button>
                </div>
                <div className={styles.qrContainer}>
                  <QRCodeSVG value={companionUrl(selectedCompanion.password)} size={220} />
                  <p className={styles.qrHint}>
                    Tu acompañante escanea este código para acceder a la invitación y subir sus fotos
                  </p>
                </div>
              </>
            )}
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
