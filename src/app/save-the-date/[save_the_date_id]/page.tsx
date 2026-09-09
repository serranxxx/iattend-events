import { notFound } from "next/navigation";
import type { Metadata, Viewport } from "next";
import { getPublicServerClient } from "@/lib/supabase/public-server";
import { CoverSection } from "@/types/new_invitation";
import SaveTheDate from "@/components/SaveTheDate/SaveTheDate";

export const dynamic = "force-dynamic";

// La barra de estado de Safari toma este color (si no, sale gris/blanca)
export const viewport: Viewport = {
  themeColor: "#0c171b",
};

// --------------------
// Types
// --------------------
type RouteParams = {
  save_the_date_id: string;
};

type PageProps = {
  params: Promise<RouteParams>;
};

type SaveTheDateRow = {
  id: string;
  invitation_id: string;
  cover: Partial<CoverSection> | null;
  event_date: string | null;
  active: boolean;
};

async function fetchSaveTheDate(rawId: string) {
  const supabase = getPublicServerClient();
  const id = decodeURIComponent(rawId);
  const { data, error } = await supabase
    .from("save_the_dates")
    .select("id, invitation_id, cover, event_date, active")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("[Supabase error]", error);
    return null;
  }
  return (data as SaveTheDateRow | null) ?? null;
}

const isVideo = (url: string) => /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url);

/**
 * Imagen para la vista previa del link (WhatsApp, OG, Twitter).
 *
 * Cuando la portada es un video no hay nada que enseñar: el editor pide una
 * "imagen para el link" y se guarda en `cover.image.poster`. Si no hay poster
 * se usa la primera imagen del carrusel, nunca el video.
 */
function linkImage(cover: Partial<CoverSection> | null): string | undefined {
  const image = cover?.image as (Partial<CoverSection>["image"] & { poster?: string | null }) | undefined;
  const poster = image?.poster;
  if (typeof poster === "string" && poster.trim()) return poster;

  const prod = image?.prod;
  if (typeof prod === "string" && prod.trim() && !isVideo(prod)) return prod;
  if (Array.isArray(prod)) return prod.find((s) => typeof s === "string" && !!s.trim() && !isVideo(s));
  return undefined;
}

// --------------------
// Metadata dinámica
// --------------------
export async function generateMetadata({ params }: { params: Promise<RouteParams> }): Promise<Metadata> {
  const { save_the_date_id } = await params;
  const row = await fetchSaveTheDate(save_the_date_id);

  if (!row || !row.active) {
    return {
      title: "I attend",
      description: "Plan with ease",
    };
  }

  const title = row.cover?.title?.text?.value?.trim() || "Save the date";
  const url_image = linkImage(row.cover);

  return {
    title,
    description: "Save the date",
    openGraph: {
      title,
      images: url_image
        ? [{ url: url_image, width: 1200, height: 630, alt: title }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      images: url_image ? [url_image] : undefined,
    },
    icons: {
      icon: [
        { url: "/icon.png", type: "image/png" },
        { url: "/icon.svg", type: "image/svg+xml" },
      ],
      apple: "/apple-icon.png",
    },
  };
}

// --------------------
// Página
// --------------------
export default async function SaveTheDatePage({ params }: PageProps) {
  const { save_the_date_id } = await params;
  const row = await fetchSaveTheDate(save_the_date_id);

  if (!row || !row.active) {
    notFound();
  }

  return <SaveTheDate cover={row.cover} eventDate={row.event_date} saveTheDateId={row.id} />;
}
