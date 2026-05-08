import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPublicServerClient } from "@/lib/supabase/public-server";
import { PopEvent } from "@/types/side_event";
import PopEvents from "@/components/Pop/PopEvent";

export const dynamic = "force-dynamic";

type RouteParams = { quick_event_id: string };
type SearchParams = { password?: string };
type PageProps = {
  params: Promise<RouteParams>;
  searchParams?: Promise<SearchParams>;
};

// --------------------
// Metadata dinámica
// --------------------
export async function generateMetadata({ params }: { params: Promise<RouteParams> }): Promise<Metadata> {
  const { quick_event_id } = await params;
  const supabase = await getPublicServerClient();
  const { data } = await supabase
    .from("pop_events")
    .select("*")
    .eq("id", decodeURIComponent(quick_event_id))
    .maybeSingle();

  if (!data) return { title: "I attend" };

  const event = data as PopEvent;
  const title = event.body?.content?.title?.value ?? "I attend";
  const image = event.body?.theme?.background?.[0]?.media ?? null;

  return {
    title,
    openGraph: {
      title,
      images: image
        ? [{ url: image, width: 1200, height: 630, alt: title }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      images: image ? [image] : undefined,
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
export default async function PopEventPage({ params, searchParams }: PageProps) {
  const { quick_event_id } = await params;
  const resolvedSearchParams = await searchParams;

  const supabase = await getPublicServerClient();
  const { data, error } = await supabase
    .from("pop_events")
    .select("*")
    .eq("id", decodeURIComponent(quick_event_id))
    .maybeSingle();

  if (error) { console.error("[Supabase error]", error); notFound(); }
  if (!data) notFound();

  const event = data as PopEvent;
  const password = typeof resolvedSearchParams?.password === "string"
    ? resolvedSearchParams.password
    : undefined;

  return <PopEvents info={event} password={password} />;
}
