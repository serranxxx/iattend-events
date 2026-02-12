import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getPublicServerClient } from "@/lib/supabase/public-server";
import { SideEvent } from "@/types/side_event";
import SideEvents from "@/components/SideEvent/SideEvent";

export const dynamic = "force-dynamic";

// --------------------
// Types
// --------------------
type RouteParams = {
  side_event_id: string;
};

type SearchParams = {
  password?: string;
};

type PageProps = {
  params: Promise<RouteParams>;
  searchParams?: Promise<SearchParams>;
};



// --------------------
// Metadata dinámica
// --------------------
export async function generateMetadata({ params }: { params: Promise<RouteParams> }): Promise<Metadata> {
  const { side_event_id } = await params;

  const supabase = await createClient();

  const sideID = decodeURIComponent(side_event_id);

  console.log("side id: ", sideID);

  const { data } = await supabase.from("side_events").select("*").eq("id", sideID).maybeSingle();

  if (!data) {
    return {
      title: "I attend",
      description: "Plan with ease",
    };
  }

  const sideEvent = data as SideEvent;

  const title = sideEvent.name;
  //   const description = inv.greeting?.title ?? "Invitación digital";

  return {
    title,
    // description,
    openGraph: {
      title,
      //   description,
      images: sideEvent.body.image
        ? [
            {
              url: sideEvent.body.image,
              width: 1200,
              height: 630,
              alt: title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      images: sideEvent.body.image ? [sideEvent.body.image] : undefined,
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
export default async function InvitationDynamicPage({ params, searchParams }: PageProps) {
  const { side_event_id } = await params;
  const resolvedSearchParams = await searchParams;

  const supabase = await getPublicServerClient();

  const sideID = decodeURIComponent(side_event_id);

  const { data, error } = await supabase.from("side_events").select("*").eq("id", sideID).maybeSingle();

  console.log("data: ", data);

  if (error) {
    console.error("[Supabase error]", error);
    notFound();
  }

  if (!data) {
    notFound();
  }

  const sideEvent = data as SideEvent;
  const password = typeof resolvedSearchParams?.password === "string" ? resolvedSearchParams.password : undefined;

  console.log(password);

  return <SideEvents info={sideEvent} password={password}/>;
}
