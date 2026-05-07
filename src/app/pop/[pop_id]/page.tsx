import { notFound } from "next/navigation";
import { getPublicServerClient } from "@/lib/supabase/public-server";
import { PopEvent } from "@/types/side_event";
import PopEvents from "@/components/Pop/PopEvent";



export const dynamic = "force-dynamic";

// --------------------
// Types
// --------------------
type RouteParams = {
    pop_id: string;
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
// export async function generateMetadata({ params }: { params: Promise<RouteParams> }): Promise<Metadata> {
//   const { pop_id } = await params;

//   const supabase = await createClient();

//   const sideID = decodeURIComponent(pop_id);

//   const { data } = await supabase.from("pop_events").select("*").eq("id", sideID).maybeSingle();

//   if (!data) {
//     return {
//       title: "I attend",
//       description: "Plan with ease",
//     };
//   }

//   const sideEvent = data as SideEvent;
//   const title = sideEvent.name;
//   const url_image = sideEvent.url_image;
//   //   const description = inv.greeting?.title ?? "Invitación digital";

//   return {
//     title,
//     // description,
//     openGraph: {
//       title,
//       //   description,
//       images: (url_image ?? sideEvent.body.image)
//         ? [
//           {
//             url: url_image ?? sideEvent.body.image,
//             width: 1200,
//             height: 630,
//             alt: title,
//           },
//         ]
//         : undefined,
//     },
//     twitter: {
//       card: "summary_large_image",
//       title,
//       images: url_image ? [url_image] : undefined,
//     },
//     icons: {
//       icon: [
//         { url: "/icon.png", type: "image/png" },
//         { url: "/icon.svg", type: "image/svg+xml" },
//       ],
//       apple: "/apple-icon.png",
//     },
//   };
// }

// --------------------
// Página
// --------------------
export default async function InvitationDynamicPage({ params, searchParams }: PageProps) {
  const { pop_id } = await params;
  const resolvedSearchParams = await searchParams;

  const supabase = await getPublicServerClient();

  const popID = decodeURIComponent(pop_id);
  console.log('popID', popID)

  const { data, error } = await supabase.from("pop_events").select("*").eq("id", popID).maybeSingle();


  if (error) {
    console.error("[Supabase error]", error);
    notFound();
  }

  if (!data) {
    console.log('no data')
    notFound();
    
  }

  console.log('data: ', data)

  const popEvent = data as PopEvent;
  const password = typeof resolvedSearchParams?.password === "string" ? resolvedSearchParams.password : undefined;

  return <PopEvents info={popEvent} password={password} />;
}
