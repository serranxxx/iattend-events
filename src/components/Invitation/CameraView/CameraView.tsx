"use client";

import { InvitationUIBundle, NewInvitation } from "@/types/new_invitation";
import { GuestSubabasePayload } from "@/types/guests";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { X, Camera, CameraOff, ImagePlus, Check, Trash2, SwitchCamera, Share, ChevronLeft, LayoutGrid, Users, ChevronDown } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { createClient } from "@/lib/supabase/client";
import styles from "./camera-view.module.css";

const API_URL = process.env.NEXT_PUBLIC_IATTEND_API_URL;
const MAX_PHOTOS = 10;

interface ShareCompanion {
  name: string;
  password: string;
}

interface CameraViewProps {
  invitation: NewInvitation;
  invitationID: string;
  guestInfo: GuestSubabasePayload;
  ui?: InvitationUIBundle | null;
  onClose: () => void;
  onOpenPhotoWall?: () => void;
  shareCompanions?: ShareCompanion[];
}

export default function CameraView({ invitation, invitationID, guestInfo, ui, onClose, onOpenPhotoWall, shareCompanions }: CameraViewProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const [permissionDenied, setPermissionDenied] = useState(false);
  const [photoCount, setPhotoCount] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState(false);
  const [streamStarted, setStreamStarted] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [zoomLevel, setZoomLevel] = useState(1);
  const lastPinchDist = useRef<number | null>(null);

  // Share companion state
  const [shareState, setShareState] = useState<'closed' | 'list' | 'qr'>('closed');
  const [selectedCompanion, setSelectedCompanion] = useState<ShareCompanion | null>(null);

  // Preview state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [previewTakenAt, setPreviewTakenAt] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  const eventDate = new Date(invitation.cover.date.value);
  eventDate.setHours(0, 0, 0, 0);
  const tomorrow = new Date(eventDate);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(23, 59, 59, 999);
  const today = new Date();

  const isAvailable = today >= eventDate && today <= tomorrow;
  const isTooEarly = today < eventDate;
  const hasName = Boolean(guestInfo.name && guestInfo.name.trim() !== "");
  const maxPhotos = photoCount >= MAX_PHOTOS;

  const checkPhotoCount = async (): Promise<number> => {
    if (!hasName) return 0;
    const { count } = await supabase
      .from("event_photos")
      .select("*", { count: "exact", head: true })
      .eq("event_id", invitationID)
      .eq("guest_name", guestInfo.name!);
    const c = count ?? 0;
    setPhotoCount(c);
    return c;
  };

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const startCamera = async (mode: 'environment' | 'user' = 'environment') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // streamStarted is set via onCanPlay on the <video> element
      }
    } catch {
      setPermissionDenied(true);
    }
  };

  const switchCamera = async () => {
    stopStream();
    setStreamStarted(false);
    setZoomLevel(1);
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newMode);
    await startCamera(newMode);
  };

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (isAvailable && hasName) {
      startCamera('environment');
      checkPhotoCount();
    }
    return () => stopStream();
  }, []);

  // Clean up preview object URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Safari (desktop y iOS) no puede codificar WebP vía canvas.toBlob — solo lo decodifica.
  // Ahí el blob sale null o corrupto y falla el flujo de subida. jpeg sí es universal.
  const compressImage = (sourceUrl: string, originalBlob: Blob): Promise<Blob> =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 1920;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => resolve(blob ?? originalBlob),
          "image/jpeg",
          0.90,
        );
      };
      // Si el navegador no puede decodificar el archivo (formato raro), sube el original sin comprimir.
      img.onerror = () => resolve(originalBlob);
      img.src = sourceUrl;
    });

  const uploadPhoto = async (imageBlob: Blob, takenAt: Date) => {
    const form = new FormData();
    form.append("image", imageBlob, "photo.jpg");
    form.append("event_id", invitationID);
    form.append("guest_name", guestInfo.name!);
    form.append("taken_at", takenAt.toISOString());

    const res = await fetch(`${API_URL}/photos/upload`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) throw new Error("Error al subir la foto");
    return res.json();
  };

  const showPreview = (blob: Blob, takenAt: Date) => {
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    setPreviewBlob(blob);
    setPreviewTakenAt(takenAt);
  };

  const handleDiscard = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewBlob(null);
    setPreviewTakenAt(null);
  };

  const handleConfirmUpload = async () => {
    if (!previewUrl || !previewBlob || !previewTakenAt) return;
    setUploading(true);
    setUploadError(false);
    try {
      const compressed = await compressImage(previewUrl, previewBlob);
      await uploadPhoto(compressed, previewTakenAt);
      setPhotoCount((c) => c + 1);
      handleDiscard();
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 1200);
    } catch (err) {
      console.error(err);
      setUploadError(true);
    } finally {
      setUploading(false);
    }
  };

  const handleCapture = async () => {
    if (!videoRef.current || !hasName || uploading) return;
    const takenAt = new Date();

    const currentCount = await checkPhotoCount();
    if (currentCount >= MAX_PHOTOS) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d")!;

    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(videoRef.current, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) return;
      showPreview(blob, takenAt);
    }, "image/jpeg");
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !hasName || uploading) return;
    const takenAt = new Date();

    const currentCount = await checkPhotoCount();
    if (currentCount >= MAX_PHOTOS) return;

    showPreview(file, takenAt);
    e.target.value = "";
  };

  // --- Error screens ---

  if (!mounted) return null;

  if (!hasName) {
    return createPortal(
      <div className={styles.fullscreen}>
        <div className={styles.message}>
          <CameraOff size={48} color="#fff" />
          <p>{ui?.camera.noName ?? "No podemos identificar tu nombre. Contacta al organizador del evento."}</p>
        </div>
      </div>,
      document.body
    );
  }

  if (!isAvailable) {
    return createPortal(
      <div className={styles.fullscreen}>
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={24} />
        </button>
        <div className={styles.message}>
          <Camera size={48} color="#fff" />
          <p>
            {isTooEarly
              ? (ui?.camera.tooEarly ?? "La cámara estará disponible el día del evento")
              : (ui?.camera.unavailable ?? "El Photo Wall ya no está disponible")}
          </p>
        </div>
      </div>,
      document.body
    );
  }

  const remaining = MAX_PHOTOS - photoCount;
  const RADIUS = 20;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  return createPortal(
    <div className={styles.fullscreen}>

      {/* --- Preview overlay --- */}
      {previewUrl && (
        <div className={styles.previewOverlay}>
          <img src={previewUrl} className={styles.previewImg} alt="Preview" />

          {uploading && (
            <div className={styles.uploadOverlay}>
              <div className={styles.spinner} />
            </div>
          )}

          {uploadError && (
            <p className={styles.uploadErrorMsg}>Error al subir. Intenta de nuevo.</p>
          )}

          <div className={styles.previewBar}>
            <button
              className={styles.discardBtn}
              onClick={handleDiscard}
              disabled={uploading}
              aria-label={ui?.camera.discard ?? "Descartar"}
            >
              <Trash2 size={24} />
              <span>{ui?.camera.discard ?? "Descartar"}</span>
            </button>

            <button
              className={styles.confirmBtn}
              onClick={handleConfirmUpload}
              disabled={uploading}
              aria-label={ui?.camera.sendToWall ?? "Enviar al Wall"}
            >
              <Check size={24} />
              <span>{ui?.camera.sendToWall ?? "Enviar al Wall"}</span>
            </button>
          </div>
        </div>
      )}

      {uploadSuccess && <div className={styles.successFlash} />}

      {/* --- Top bar --- */}
      <div className={styles.topBar}>
        <button className={styles.iconCircleBtn} onClick={onClose} aria-label="Cerrar">
          <X size={22} />
        </button>

        <div className={styles.circularCounter}>
          <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true">
            <circle cx="24" cy="24" r={RADIUS} className={styles.counterTrack} />
            <circle
              cx="24" cy="24" r={RADIUS}
              className={styles.counterProgress}
              style={{
                strokeDasharray: CIRCUMFERENCE,
                strokeDashoffset: CIRCUMFERENCE * (photoCount / MAX_PHOTOS),
                stroke: remaining === 0 ? '#ff4d4d' : '#fff',
              }}
            />
          </svg>
          <span className={remaining === 0 ? styles.counterNumRed : styles.counterNum}>
            {remaining}
          </span>
        </div>

        <button
          className={styles.iconCircleBtn}
          onClick={() => onOpenPhotoWall ? onOpenPhotoWall() : router.push(`/event/${invitationID}/photowall?title=${encodeURIComponent(invitation.cover?.title?.text?.value ?? '')}`)}
          aria-label={ui?.camera.viewPhotoWall ?? "Ver Photo Wall"}
        >
          <LayoutGrid size={22} />
        </button>
      </div>

      {/* --- Camera container --- */}
      <div
        className={styles.cameraContainer}
        onTouchStart={(e) => {
          if (e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            lastPinchDist.current = Math.sqrt(dx * dx + dy * dy);
          }
        }}
        onTouchMove={(e) => {
          if (e.touches.length !== 2 || lastPinchDist.current === null) return;
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          setZoomLevel(z => Math.max(1, Math.min(4, z * dist / lastPinchDist.current!)));
          lastPinchDist.current = dist;
        }}
        onTouchEnd={() => { lastPinchDist.current = null; }}
      >
        {permissionDenied ? (
          <div className={styles.message}>
            <CameraOff size={48} color="#fff" />
            <p>{ui?.camera.permissionDenied ?? "Permiso de cámara denegado. Habilítalo en la configuración de tu dispositivo."}</p>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={styles.video}
            onPlaying={() => setStreamStarted(true)}
            style={{
              opacity: streamStarted ? 1 : 0,
              // Arranca ligeramente más cerca y se asienta a su tamaño real —
              // así el arranque de la cámara (autofoco/exposición) se siente
              // como una transición intencional en vez de un salto de tamaño.
              transition: 'opacity 0.5s ease, transform 0.5s ease',
              transform: `${facingMode === 'user' ? 'scaleX(-1) ' : ''}scale(${zoomLevel * (streamStarted ? 1 : 1.08)})`,
              transformOrigin: 'center',
            }}
          />
        )}

        {maxPhotos && (
          <div className={styles.maxPhotosMsg}>
            {(ui?.camera.maxPhotosReached ?? "Ya subiste el máximo de {max} fotos").replace("{max}", String(MAX_PHOTOS))}
          </div>
        )}
      </div>

      {/* --- Bottom controls --- */}
      <div className={styles.bottomBar}>
        <input
          id="gallery-file-input"
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFileSelect}
        />

        <label
          htmlFor={(!uploading && !maxPhotos) ? "gallery-file-input" : undefined}
          className={`${styles.iconBtn} ${(uploading || maxPhotos) ? styles.iconBtnDisabled : ''}`}
          aria-label={ui?.camera.uploadFromGallery ?? "Subir desde galería"}
        >
          <ImagePlus size={26} />
        </label>

        <button
          className={styles.shutterBtn}
          onClick={handleCapture}
          disabled={uploading || maxPhotos || !streamStarted || permissionDenied}
          aria-label={ui?.camera.takePhoto ?? "Tomar foto"}
        />

        <button
          className={styles.iconBtn}
          onClick={switchCamera}
          aria-label={ui?.camera.switchCamera ?? "Cambiar cámara"}
        >
          <SwitchCamera size={24} />
        </button>
      </div>

      {/* --- Share companion pill --- */}
      {shareCompanions && shareCompanions.length > 0 && (
        <div className={styles.shareRow}>
          <button
            className={styles.shareCompanionPill}
            onClick={() => {
              if (shareCompanions.length === 1) {
                setSelectedCompanion(shareCompanions[0]);
                setShareState('qr');
              } else {
                setShareState('list');
              }
            }}
          >
            <span className={styles.pillAvatar}>
              <Users size={14} />
            </span>
            <span>Acompañantes</span>
            <ChevronDown size={16} />
          </button>
        </div>
      )}

      {/* --- Share companion sheet --- */}
      {shareState !== 'closed' && (
        <div className={styles.shareOverlay} onClick={() => setShareState('closed')}>
          <div className={styles.shareSheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.sheetHandle} />

            {shareState === 'list' && (
              <>
                <div className={styles.sheetHeader}>
                  <Share size={16} style={{ color: '#fff', flexShrink: 0 }} />
                  <span className={styles.sheetTitle}>Compartir con acompañante</span>
                  <button className={styles.sheetClose} onClick={() => setShareState('closed')}>
                    <X size={18} />
                  </button>
                </div>
                <ul className={styles.companionList}>
                  {shareCompanions!.map((c) => (
                    <li
                      key={c.password}
                      className={styles.companionItem}
                      onClick={() => { setSelectedCompanion(c); setShareState('qr'); }}
                    >
                      <span className={styles.companionAvatar}>{c.name[0]?.toUpperCase()}</span>
                      <span className={styles.companionName}>{c.name || 'Acompañante'}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {shareState === 'qr' && selectedCompanion && (
              <>
                <div className={styles.sheetHeader}>
                  {shareCompanions && shareCompanions.length > 1 && (
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
                  <QRCodeSVG
                    value={
                      invitation.generals?.event?.label && invitation.generals?.event?.name
                        ? `${window.location.origin}/${invitation.generals.event.label}/${invitation.generals.event.name}?password=${selectedCompanion.password}`
                        : `${window.location.origin}?password=${selectedCompanion.password}`
                    }
                    size={220}
                  />
                  <p className={styles.qrHint}>
                    Tu acompañante escanea este código para acceder a la invitación y subir sus fotos
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
