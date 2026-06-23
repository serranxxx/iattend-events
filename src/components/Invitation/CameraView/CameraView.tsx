"use client";

import { NewInvitation } from "@/types/new_invitation";
import { GuestSubabasePayload } from "@/types/guests";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { X, Camera, CameraOff, ImagePlus, Images, Check, Trash2, SwitchCamera } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import styles from "./camera-view.module.css";

const API_URL = process.env.NEXT_PUBLIC_IATTEND_API_URL;
const MAX_PHOTOS = 10;
const RADIUS = 20;

interface CameraViewProps {
  invitation: NewInvitation;
  invitationID: string;
  guestInfo: GuestSubabasePayload;
  onClose: () => void;
  onOpenPhotoWall?: () => void;
}

export default function CameraView({ invitation, invitationID, guestInfo, onClose, onOpenPhotoWall }: CameraViewProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const [permissionDenied, setPermissionDenied] = useState(false);
  const [photoCount, setPhotoCount] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [streamStarted, setStreamStarted] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  // Preview state
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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
        setStreamStarted(true);
      }
    } catch {
      setPermissionDenied(true);
    }
  };

  const switchCamera = async () => {
    stopStream();
    setStreamStarted(false);
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

  const compressImage = async (file: File | Blob): Promise<Blob> => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.src = url;
    await new Promise((res) => (img.onload = res));
    URL.revokeObjectURL(url);

    const MAX = 1200;
    const scale = Math.min(1, MAX / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);

    return new Promise((res) =>
      canvas.toBlob((blob) => res(blob!), "image/webp", 0.82)
    );
  };

  const uploadPhoto = async (imageBlob: Blob, takenAt: Date) => {
    const form = new FormData();
    form.append("image", imageBlob, "photo.webp");
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
    setPreviewBlob(blob);
    setPreviewUrl(url);
    setPreviewTakenAt(takenAt);
  };

  const handleDiscard = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewBlob(null);
    setPreviewUrl(null);
    setPreviewTakenAt(null);
  };

  const handleConfirmUpload = async () => {
    if (!previewBlob || !previewTakenAt) return;
    setUploading(true);
    try {
      const compressed = await compressImage(previewBlob);
      await uploadPhoto(compressed, previewTakenAt);
      setPhotoCount((c) => c + 1);
      handleDiscard();
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 1200);
    } catch (err) {
      console.error(err);
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
          <p>No podemos identificar tu nombre. Contacta al organizador del evento.</p>
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
              ? "La cámara estará disponible el día del evento"
              : "El Photo Wall ya no está disponible"}
          </p>
        </div>
      </div>,
      document.body
    );
  }

  const remaining = MAX_PHOTOS - photoCount;
  const circumference = 2 * Math.PI * RADIUS;
  const offset = circumference - (remaining / MAX_PHOTOS) * circumference;

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

          <div className={styles.previewBar}>
            <button
              className={styles.discardBtn}
              onClick={handleDiscard}
              disabled={uploading}
              aria-label="Descartar"
            >
              <Trash2 size={24} />
              <span>Descartar</span>
            </button>

            <button
              className={styles.confirmBtn}
              onClick={handleConfirmUpload}
              disabled={uploading}
              aria-label="Enviar al Wall"
            >
              <Check size={24} />
              <span>Enviar al Wall</span>
            </button>
          </div>
        </div>
      )}

      {/* --- Camera view --- */}
      <div className={styles.topBar}>
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={24} />
        </button>

        <div className={styles.counterWrapper}>
          <svg width="56" height="56" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="4" />
            <circle
              cx="28" cy="28" r={RADIUS}
              fill="none"
              stroke={remaining === 0 ? "#ff4d4d" : "#fff"}
              strokeWidth="4"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform="rotate(-90 28 28)"
              style={{ transition: "stroke-dashoffset 0.4s ease" }}
            />
            <text
              x="28" y="33"
              textAnchor="middle"
              fill={remaining === 0 ? "#ff4d4d" : "#fff"}
              fontSize="15"
              fontWeight="700"
            >
              {remaining}
            </text>
          </svg>
          <span className={styles.counterLabel}>
            {remaining === 1 ? "shot restante" : "shots restantes"}
          </span>
        </div>

        <button
          className={styles.closeBtn}
          onClick={switchCamera}
          aria-label="Cambiar cámara"
        >
          <SwitchCamera size={22} />
        </button>
      </div>

      {permissionDenied ? (
        <div className={styles.message}>
          <CameraOff size={48} color="#fff" />
          <p>Permiso de cámara denegado. Habilítalo en la configuración de tu dispositivo.</p>
        </div>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`${styles.video} ${facingMode === 'user' ? styles.videoMirrored : ''}`}
        />
      )}

      {uploadSuccess && <div className={styles.successFlash} />}

      {maxPhotos && (
        <div className={styles.maxPhotosMsg}>Ya subiste el máximo de {MAX_PHOTOS} fotos</div>
      )}

      <div className={styles.bottomBar}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFileSelect}
        />

        <button
          className={styles.iconBtn}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || maxPhotos}
          aria-label="Subir desde galería"
        >
          <ImagePlus size={28} />
        </button>

        <button
          className={styles.shutterBtn}
          onClick={handleCapture}
          disabled={uploading || maxPhotos || !streamStarted || permissionDenied}
          aria-label="Tomar foto"
        />

        <button
          className={styles.iconBtn}
          onClick={() => onOpenPhotoWall ? onOpenPhotoWall() : router.push(`/event/${invitationID}/photowall?title=${encodeURIComponent(invitation.cover?.title?.text?.value ?? '')}`)}
          aria-label="Ver Photo Wall"
        >
          <Images size={28} />
        </button>
      </div>
    </div>,
    document.body
  );
}
